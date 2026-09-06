import { Request, Response } from 'express';
import { PayoutWebhookPayloadSchema } from '@kachracash/types';
import { processPayoutWebhook } from '../services/wallet-service.js';

export async function payoutWebhookHandler(req: Request, res: Response) {
  try {
    const validated = PayoutWebhookPayloadSchema.parse(req.body);
    const result = await processPayoutWebhook(validated);

    return res.status(200).json({
      success: true,
      message: result.isDuplicate
        ? 'Duplicate webhook ignored'
        : 'Payout webhook processed successfully',
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({
      success: false,
      error: message || 'Failed to process payout webhook',
    });
  }
}
