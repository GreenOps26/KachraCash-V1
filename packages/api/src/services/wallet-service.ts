import { db, Prisma } from '@kachracash/db';
import bcrypt from 'bcryptjs';

export function formatINR(val: number | Prisma.Decimal): string {
  const num = typeof val === 'number' ? val : Number(val);
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export interface AssignPickupOptions {
  activeRouteExtension?: boolean;
}

export interface AssignOrderResult {
  status: 'ASSIGNED' | 'REJECTED';
  provisionalBufferApplied: number;
}

/**
 * Validates collector float balance before dispatch assignment.
 * Enforces ₹2,000 minimum threshold, with optional ₹1,000 provisional route buffer.
 */
export async function assignPickupOrder(
  _orderId: string,
  collectorId: string,
  _estimatedValue: number = 0,
  options?: AssignPickupOptions,
): Promise<AssignOrderResult> {
  const wallet = await db.collectorWallet.findUnique({
    where: { collectorId },
  });

  if (!wallet) {
    throw new Error(`Collector wallet not found for collector ${collectorId}`);
  }

  const currentFloat = Number(wallet.floatBalance);
  const buffer = options?.activeRouteExtension ? 1000.0 : 0.0;
  const effectiveFloat = currentFloat + buffer;
  const minThreshold = Number(wallet.minThreshold || 2000.0);

  if (effectiveFloat < minThreshold) {
    throw new Error(
      `INSUFFICIENT_FLOAT_BALANCE: Collector wallet float (₹${formatINR(currentFloat)}) is below minimum threshold of ₹${formatINR(minThreshold)}`,
    );
  }

  return {
    status: 'ASSIGNED',
    provisionalBufferApplied: buffer,
  };
}

export interface DoorstepSettlementInput {
  requestId: string;
  collectorId: string;
  otp: string;
  items: Array<{
    categoryId: string;
    weightKg: number;
    unitRate: number;
    scaleHardwareId: string;
  }>;
  simulateFailure?: boolean;
}

/**
 * Atomic Doorstep Settlement
 * Executes in a single ACID db.$transaction:
 * 1. Verifies OTP
 * 2. Computes scrap subtotal, 8% platform fee, and total collector debit
 * 3. Records verified transaction_items
 * 4. Deducts total debit (Order Value + 8% platform fee) from collector wallet float
 * 5. Appends immutable audit entry to wallet_ledger
 * 6. Dispatches and marks citizen UPI payout as SUCCESS
 * 7. Updates order status to COMPLETED
 * 8. Rolls back cleanly if simulateFailure is true or network drops
 */
export async function completeDoorstepSettlement(input: DoorstepSettlementInput) {
  return await db.$transaction(async (tx) => {
    const existingTx = await tx.transaction.findUnique({
      where: { requestId: input.requestId },
      include: {
        request: {
          include: {
            citizen: true,
          },
        },
      },
    });

    if (!existingTx) {
      throw new Error(`Transaction record not found for request ${input.requestId}`);
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(input.otp, existingTx.otpHash);
    if (!isValidOtp) {
      throw new Error('INVALID_OTP: Doorstep verification OTP is incorrect.');
    }

    // Calculate line items and totals
    let grossScrapValue = 0;
    for (const item of input.items) {
      const lineSubtotal = Math.round(item.weightKg * item.unitRate * 100) / 100;
      grossScrapValue += lineSubtotal;

      await tx.transactionItem.create({
        data: {
          transactionId: existingTx.id,
          categoryId: item.categoryId,
          weightKg: new Prisma.Decimal(item.weightKg),
          unitRate: new Prisma.Decimal(item.unitRate),
          subtotal: new Prisma.Decimal(lineSubtotal),
          scaleHardwareId: item.scaleHardwareId,
        },
      });
    }

    grossScrapValue = Math.round(grossScrapValue * 100) / 100; // e.g. ₹203.00
    const platformFee = Math.round(grossScrapValue * 0.08 * 100) / 100; // e.g. ₹16.24 (8% fee)
    const totalCollectorDebit = Math.round((grossScrapValue + platformFee) * 100) / 100; // e.g. ₹219.24
    const citizenPayout = grossScrapValue; // Full scrap payout to citizen (₹203.00)

    // Check collector float balance
    const wallet = await tx.collectorWallet.findUniqueOrThrow({
      where: { collectorId: input.collectorId },
    });

    if (Number(wallet.floatBalance) < totalCollectorDebit) {
      throw new Error('INSUFFICIENT_FLOAT: Collector wallet balance insufficient for payout.');
    }

    // 1. Debit Collector Wallet Float by totalCollectorDebit (₹219.24)
    await tx.collectorWallet.update({
      where: { id: wallet.id },
      data: { floatBalance: { decrement: totalCollectorDebit } },
    });

    // 2. Append Ledger Entry (Mandatory Immutable Audit Trail)
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(-totalCollectorDebit),
        type: 'DEBIT',
        description: `Doorstep Settlement for Order ${input.requestId} (₹${citizenPayout.toFixed(2)} payout + 8% platform fee of ₹${platformFee.toFixed(2)})`,
        idempotencyKey: `PAYOUT_ORD_${input.requestId}`,
        referenceOrderId: input.requestId,
      },
    });

    // 3. Mark Citizen UPI Disbursement as SUCCESS (Mocking Cashfree/RazorpayX)
    if (input.simulateFailure) {
      throw new Error('NETWORK_TIMEOUT: Payment gateway or network dropped during atomic OTP settlement.');
    }

    const gatewayRef = `CF_PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await tx.payout.upsert({
      where: { transactionId: existingTx.id },
      update: {
        status: 'SUCCESS',
        amount: new Prisma.Decimal(citizenPayout),
        gatewayRef,
      },
      create: {
        transactionId: existingTx.id,
        amount: new Prisma.Decimal(citizenPayout),
        upiVpa: existingTx.request?.citizen?.upiVpa || 'citizen@upi',
        status: 'SUCCESS',
        idempotencyKey: `PAYOUT_HOOK_${input.requestId}`,
        gatewayRef,
      },
    });

    // 4. Update Transaction Record & Completion Timestamp
    await tx.transaction.update({
      where: { id: existingTx.id },
      data: {
        grossAmount: new Prisma.Decimal(grossScrapValue),
        platformFee: new Prisma.Decimal(platformFee),
        netPayout: new Prisma.Decimal(citizenPayout),
        completedAt: new Date(),
      },
    });

    // 5. Update PickupRequest status to COMPLETED
    await tx.pickupRequest.update({
      where: { id: input.requestId },
      data: { status: 'COMPLETED' },
    });

    return {
      grossAmount: grossScrapValue,
      platformFee,
      citizenPayout,
      totalCollectorDebit,
      status: 'COMPLETED',
      payoutStatus: 'SUCCESS',
      gatewayRef,
    };
  });
}

export interface PayoutWebhookPayload {
  transactionId: string;
  gatewayRef: string;
  upiVpa: string;
  amount: number;
  idempotencyKey: string;
}

export interface PayoutWebhookResult {
  status: 'SUCCESS' | 'FAILED';
  isDuplicate?: boolean;
}

/**
 * Idempotent Webhook Handler for Cashfree / RazorpayX Payouts
 */
export async function processPayoutWebhook(
  payload: PayoutWebhookPayload,
): Promise<PayoutWebhookResult> {
  // Check for duplicate payout processing via idempotency key
  const existingLedger = await db.walletLedger.findUnique({
    where: { idempotencyKey: payload.idempotencyKey },
  });

  if (existingLedger) {
    return {
      status: 'SUCCESS',
      isDuplicate: true,
    };
  }

  // Record payout and audit ledger
  await db.$transaction(async (tx) => {
    const wallet = (await tx.collectorWallet.findFirst()) || { id: 'SYSTEM_ESCROW_WALLET' };
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(payload.amount),
        type: 'CREDIT',
        description: `Payout Webhook confirmation: ${payload.gatewayRef}`,
        idempotencyKey: payload.idempotencyKey,
      },
    });

    const existingPayout = await tx.payout.findUnique({
      where: { idempotencyKey: payload.idempotencyKey },
    });

    if (existingPayout) {
      await tx.payout.update({
        where: { id: existingPayout.id },
        data: {
          status: 'SUCCESS',
          gatewayRef: payload.gatewayRef,
        },
      });
    }
  });

  return {
    status: 'SUCCESS',
    isDuplicate: false,
  };
}
