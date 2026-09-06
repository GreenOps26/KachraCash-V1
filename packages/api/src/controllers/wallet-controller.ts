import { Request, Response } from 'express';
import { WalletTopupRequestSchema } from '@kachracash/types';
import { db, Prisma } from '@kachracash/db';

export async function topupWalletHandler(req: Request, res: Response) {
  try {
    const validated = WalletTopupRequestSchema.parse(req.body);
    const collectorId = (req as Request & { user?: { collectorId?: string } }).user?.collectorId || req.headers['x-collector-id'];

    if (!collectorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Collector identification required',
      });
    }

    const wallet = await db.collectorWallet.findUnique({
      where: { collectorId: String(collectorId) },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Collector wallet not found',
      });
    }

    await db.$transaction(async (tx) => {
      await tx.collectorWallet.update({
        where: { id: wallet.id },
        data: { floatBalance: { increment: validated.amount } },
      });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(validated.amount),
          type: 'CREDIT',
          description: `Mid-Route Float Topup via ${validated.paymentGatewayRef}`,
          idempotencyKey: validated.idempotencyKey,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Float balance topped up by ₹${validated.amount.toFixed(2)}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({
      success: false,
      error: message || 'Failed to process topup',
    });
  }
}
