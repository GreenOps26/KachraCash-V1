import { Request, Response } from 'express';
import { WardSuspensionRequestSchema } from '@kachracash/types';
import { toggleWardSuspension } from '../services/dispatch-sla.js';

export async function suspendWardHandler(req: Request, res: Response) {
  try {
    const rawId = req.params['id'];
    const wardId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!wardId) {
      return res.status(400).json({ success: false, error: 'Ward ID is required' });
    }

    const validated = WardSuspensionRequestSchema.parse(req.body);

    const result = await toggleWardSuspension({
      wardId,
      isFloodSuspended: validated.isFloodSuspended,
      reason: validated.reason,
      triggerCustomerRescheduleSms: validated.triggerCustomerRescheduleSms,
    });

    return res.status(200).json({
      success: true,
      message: `Ward ${wardId} monsoon flood suspension updated to ${validated.isFloodSuspended}`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({
      success: false,
      error: message || 'Failed to update ward suspension',
    });
  }
}
