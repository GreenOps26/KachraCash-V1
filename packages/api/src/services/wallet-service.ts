import bcrypt from 'bcryptjs';
import { db, OrderStatus, Prisma, TransactionType } from '@kachracash/db';

export const MIN_FLOAT_THRESHOLD = 2000;
export const PROVISIONAL_FLOAT_EXTENSION = 1000;

export interface AssignPickupOptions {
	activeRouteExtension?: boolean;
}

export interface AssignmentResult {
	status: 'ASSIGNED';
	provisionalBufferApplied: number;
}

export interface PayoutWebhookPayload {
	transactionId: string;
	gatewayRef: string;
	upiVpa: string;
	amount: number;
	idempotencyKey: string;
}

export interface PayoutWebhookResult {
	status: 'SUCCESS';
	isDuplicate?: boolean;
}

export interface BleSettlementItem {
	categoryId: string;
	weightKg: number;
	unitRate: number;
	scaleHardwareId?: string;
}

export interface DoorstepSettlementInput {
	orderId: string;
	collectorId: string;
	otp: string;
	otpHash: string;
	grossAmount: number;
	takeRatePercentage: number;
	bleItems: BleSettlementItem[];
}

export interface DoorstepSettlementResult {
	platformFee: number;
	netPayout: number;
	status: 'COMPLETED';
}

export async function assignPickupOrder(
	orderId: string,
	collectorId: string,
	_proximityMeters = 0,
	options: AssignPickupOptions = {}
): Promise<AssignmentResult> {
	const wallet = await db.collectorWallet.findUnique({ where: { collectorId } });

	if (!wallet) {
		throw new Error('WALLET_NOT_FOUND');
	}

	const floatBalance = Number(wallet.floatBalance);
	const effectiveThreshold = options.activeRouteExtension
		? MIN_FLOAT_THRESHOLD - PROVISIONAL_FLOAT_EXTENSION
		: MIN_FLOAT_THRESHOLD;

	if (floatBalance < effectiveThreshold) {
		const formatted = floatBalance.toLocaleString('en-IN', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		throw new Error(
			`INSUFFICIENT_FLOAT_BALANCE: Collector wallet float (₹${formatted}) is below minimum threshold of ₹2,000.00`
		);
	}

	const request = await db.pickupRequest.findUnique({ where: { id: orderId } });
	if (request) {
		const existing = await db.pickupAssignment.findFirst({
			where: { requestId: orderId, collectorId }
		});

		if (!existing) {
			await db.pickupAssignment.create({
				data: {
					requestId: orderId,
					collectorId,
					proximityMeters: _proximityMeters,
					slaStatus: 'MET'
				}
			});
		}

		await db.pickupRequest.update({
			where: { id: orderId },
			data: { status: OrderStatus.ASSIGNED }
		});
	}

	return {
		status: 'ASSIGNED',
		provisionalBufferApplied: options.activeRouteExtension ? PROVISIONAL_FLOAT_EXTENSION : 0
	};
}

export async function processPayoutWebhook(
	payload: PayoutWebhookPayload
): Promise<PayoutWebhookResult> {
	const existingLedger = await db.walletLedger.findUnique({
		where: { idempotencyKey: payload.idempotencyKey }
	});

	if (existingLedger) {
		return { status: 'SUCCESS', isDuplicate: true };
	}

	let existingPayout = await db.payout.findUnique({
		where: { idempotencyKey: payload.idempotencyKey }
	});

	if (!existingPayout) {
		existingPayout = await db.payout.findUnique({
			where: { transactionId: payload.transactionId }
		});
	}

	if (existingPayout?.status === 'SUCCESS') {
		return { status: 'SUCCESS', isDuplicate: true };
	}

	await db.$transaction(async (tx) => {
		const transaction = await tx.transaction.findUnique({
			where: { id: payload.transactionId }
		});

		if (!transaction) {
			throw new Error('TRANSACTION_NOT_FOUND');
		}

		if (existingPayout) {
			await tx.payout.update({
				where: { id: existingPayout.id },
				data: {
					gatewayRef: payload.gatewayRef,
					status: 'SUCCESS'
				}
			});
		} else {
			await tx.payout.create({
				data: {
					transactionId: payload.transactionId,
					gatewayRef: payload.gatewayRef,
					upiVpa: payload.upiVpa,
					amount: payload.amount,
					status: 'SUCCESS',
					idempotencyKey: payload.idempotencyKey
				}
			});
		}

		const assignment = await tx.pickupAssignment.findFirst({
			where: { requestId: transaction.requestId }
		});

		const settlementLedger = await tx.walletLedger.findUnique({
			where: { idempotencyKey: `SETTLE_${transaction.requestId}` }
		});

		if (assignment && !settlementLedger) {
			const wallet = await tx.collectorWallet.findUnique({
				where: { collectorId: assignment.collectorId }
			});

			if (wallet) {
				await tx.walletLedger.create({
					data: {
						walletId: wallet.id,
						amount: new Prisma.Decimal(-payload.amount),
						type: TransactionType.DEBIT,
						description: 'Payout settlement',
						idempotencyKey: payload.idempotencyKey,
						referenceOrderId: transaction.requestId
					}
				});
			}
		}
	});

	return { status: 'SUCCESS', isDuplicate: false };
}

export async function completeDoorstepSettlement(
	input: DoorstepSettlementInput
): Promise<DoorstepSettlementResult> {
	const request = await db.pickupRequest.findUnique({ where: { id: input.orderId } });

	if (!request) {
		throw new Error('ORDER_NOT_FOUND');
	}

	if (request.status !== OrderStatus.WEIGHING) {
		throw new Error('INVALID_ORDER_STATE');
	}

	const otpValid = await bcrypt.compare(input.otp, input.otpHash);
	if (!otpValid) {
		throw new Error('INVALID_OTP');
	}

	const platformFee = roundMoney(input.grossAmount * input.takeRatePercentage);
	const netPayout = roundMoney(input.grossAmount - platformFee);

	await db.$transaction(async (tx) => {
		const transaction = await tx.transaction.upsert({
			where: { requestId: input.orderId },
			update: {
				grossAmount: input.grossAmount,
				platformFee,
				netPayout,
				completedAt: new Date(),
				otpHash: input.otpHash
			},
			create: {
				requestId: input.orderId,
				otpHash: input.otpHash,
				grossAmount: input.grossAmount,
				platformFee,
				netPayout,
				completedAt: new Date()
			}
		});

		if (input.bleItems.length > 0) {
			await tx.transactionItem.deleteMany({ where: { transactionId: transaction.id } });

			for (const item of input.bleItems) {
				const category = await tx.scrapCategory.findFirst({
					where: {
						OR: [{ id: item.categoryId }, { sku: item.categoryId }]
					}
				});

				if (!category) {
					throw new Error(`CATEGORY_NOT_FOUND: ${item.categoryId}`);
				}

				await tx.transactionItem.create({
					data: {
						transactionId: transaction.id,
						categoryId: category.id,
						weightKg: item.weightKg,
						unitRate: item.unitRate,
						subtotal: roundMoney(item.weightKg * item.unitRate),
						scaleHardwareId: item.scaleHardwareId ?? 'BLE_SIMULATOR'
					}
				});
			}
		}

		await tx.pickupRequest.update({
			where: { id: input.orderId },
			data: { status: OrderStatus.COMPLETED }
		});

		const wallet = await tx.collectorWallet.findUnique({
			where: { collectorId: input.collectorId }
		});

		if (wallet) {
			const newBalance = Number(wallet.floatBalance) - input.grossAmount;
			await tx.collectorWallet.update({
				where: { id: wallet.id },
				data: { floatBalance: newBalance }
			});

			await tx.walletLedger.create({
				data: {
					walletId: wallet.id,
					amount: new Prisma.Decimal(-input.grossAmount),
					type: TransactionType.DEBIT,
					description: `Doorstep settlement ${input.orderId}`,
					idempotencyKey: `SETTLE_${input.orderId}`,
					referenceOrderId: input.orderId
				}
			});
		}
	});

	return { platformFee, netPayout, status: 'COMPLETED' };
}

export interface WalletTopUpInput {
	collectorId: string;
	amount: number;
	paymentGatewayRef: string;
	idempotencyKey: string;
}

export async function topUpCollectorWallet(input: WalletTopUpInput) {
	const existing = await db.walletLedger.findUnique({
		where: { idempotencyKey: input.idempotencyKey }
	});

	if (existing) {
		return { status: 'SUCCESS' as const, isDuplicate: true };
	}

	const wallet = await db.collectorWallet.findUnique({ where: { collectorId: input.collectorId } });
	if (!wallet) {
		throw new Error('WALLET_NOT_FOUND');
	}

	await db.$transaction(async (tx) => {
		await tx.walletLedger.create({
			data: {
				walletId: wallet.id,
				amount: new Prisma.Decimal(input.amount),
				type: TransactionType.CREDIT,
				description: `Top-up via ${input.paymentGatewayRef}`,
				idempotencyKey: input.idempotencyKey
			}
		});

		await tx.collectorWallet.update({
			where: { id: wallet.id },
			data: { floatBalance: Number(wallet.floatBalance) + input.amount }
		});
	});

	return { status: 'SUCCESS' as const, isDuplicate: false };
}

function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}
