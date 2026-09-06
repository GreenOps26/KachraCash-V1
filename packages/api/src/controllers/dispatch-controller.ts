import { Request, Response } from 'express';
import { db } from '@kachracash/db';
import { matchCollectorForPickup, assignCollectorToPickup } from '../services/dispatch-sla.js';

export async function matchDispatchHandler(req: Request, res: Response) {
  try {
    const { requestId, collectorId, maxRadiusMeters = 1500, autoAssign = false } = req.body;

    // Case 1: Match collector for a given pickup request
    if (requestId) {
      const match = await matchCollectorForPickup(requestId, maxRadiusMeters);
      if (!match) {
        return res.status(404).json({
          success: false,
          error: 'No online qualified collectors found within radius.',
        });
      }

      let assignment = null;
      if (autoAssign) {
        assignment = await assignCollectorToPickup(requestId, match.id, match.distanceMeters);
      }

      return res.status(200).json({
        success: true,
        message: autoAssign ? 'Collector matched and assigned successfully' : 'Eligible collector matched',
        data: {
          collector: match,
          assignment,
        },
      });
    }

    // Case 2: Collector looking for nearby pending pickup requests
    if (collectorId) {
      const matchingPickups = await db.$queryRaw<
        Array<{
          id: string;
          visualTier: string;
          wardName: string;
          scheduledSlotStart: Date;
          scheduledSlotEnd: Date;
          distance_meters: number;
        }>
      >`
        SELECT pr.id, pr."visualTier", r."wardName",
               pr."scheduledSlotStart", pr."scheduledSlotEnd",
               ST_DistanceSphere(c.coordinates, pr."pickupLocation") AS distance_meters
        FROM "pickup_requests" pr
        JOIN "regions" r ON pr."regionId" = r.id
        JOIN "collectors" c ON c.id = ${collectorId}
        JOIN "collector_wallets" w ON c.id = w."collectorId"
        WHERE pr.status = 'PENDING'
          AND r."isFloodSuspended" = false
          AND w."floatBalance" >= 2000.00
          AND c.coordinates IS NOT NULL
          AND ST_DistanceSphere(c.coordinates, pr."pickupLocation") <= ${maxRadiusMeters}
        ORDER BY distance_meters ASC
        LIMIT 1;
      `;

      if (!matchingPickups || matchingPickups.length === 0) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No pending pickups within operational radius.',
        });
      }

      const pickup = matchingPickups[0]!;
      return res.status(200).json({
        success: true,
        data: {
          requestId: pickup.id,
          visualTier: pickup.visualTier,
          wardName: pickup.wardName,
          slotStart: pickup.scheduledSlotStart,
          slotEnd: pickup.scheduledSlotEnd,
          distanceMeters: Math.round(pickup.distance_meters),
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Either requestId or collectorId must be provided for dispatch matching.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      error: message || 'Dispatch matching failed',
    });
  }
}
