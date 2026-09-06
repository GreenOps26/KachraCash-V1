import { Request, Response } from 'express';
import {
  CompleteOrderRequestSchema,
  VerifyOtpRequestSchema,
  validateScaleIngestion,
} from '@kachracash/types';
import { completeDoorstepSettlement } from '../services/wallet-service.js';

export async function completeOrderHandler(req: Request, res: Response) {
  try {
    const validated = CompleteOrderRequestSchema.parse(req.body);

    // Validate each item strictly originates from BLE scale stream with tare check
    const items = validated.items.map((item) => {
      const packet = validateScaleIngestion(item.telemetryPacket);
      return {
        categoryId: item.categoryId,
        weightKg: packet.weightKg,
        unitRate: 30.59, // Baseline floor rate
        scaleHardwareId: packet.scaleId,
      };
    });

    const result = await completeDoorstepSettlement({
      requestId: validated.requestId,
      collectorId: validated.collectorId,
      otp: validated.otp,
      items,
    });

    return res.status(200).json({
      success: true,
      message: 'Doorstep settlement completed successfully',
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('FORBIDDEN') ? 403 : 400;
    return res.status(status).json({
      success: false,
      error: message || 'Internal server error',
    });
  }
}

export async function verifyOtpHandler(req: Request, res: Response) {
  try {
    const validated = VerifyOtpRequestSchema.parse(req.body);

    const items = validated.items.map((item) => {
      if (item.telemetryPacket) {
        const packet = validateScaleIngestion(item.telemetryPacket);
        return {
          categoryId: item.categoryId,
          weightKg: packet.weightKg,
          unitRate: item.unitRate,
          scaleHardwareId: packet.scaleId,
        };
      }
      return {
        categoryId: item.categoryId,
        weightKg: item.weightKg,
        unitRate: item.unitRate,
        scaleHardwareId: item.scaleHardwareId,
      };
    });

    const result = await completeDoorstepSettlement({
      requestId: validated.requestId,
      collectorId: validated.collectorId,
      otp: validated.otp,
      items,
      simulateFailure: validated.simulateFailure,
    });

    return res.status(200).json({
      success: true,
      message: 'Atomic OTP settlement verified and completed successfully',
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('FORBIDDEN')
      ? 403
      : message.includes('TIMEOUT')
        ? 500
        : 400;
    return res.status(status).json({
      success: false,
      error: message || 'OTP verification settlement failed',
    });
  }
}

export async function getRateCardHandler(_req: Request, res: Response) {
  try {
    const rateCard = {
      tiers: [
        {
          id: 'RIGID_CONTAINERS',
          name: 'Rigid Containers (বটল আৰু কেন)',
          items: 'PET Bottles, HDPE Jars, Tin & Metal Cans',
          minRate: 16.0,
          maxRate: 88.0,
          floorRate: 30.59,
          swmStream: 'DRY_RECYCLABLE',
        },
        {
          id: 'SOFT_FILMS',
          name: 'Soft Film & Paper (কাৰ্ডব’ৰ্ড আৰু কাগজ)',
          items: 'Old Corrugated Cardboard (OCC), Newspaper, LDPE Films',
          minRate: 10.0,
          maxRate: 17.0,
          floorRate: 14.0,
          swmStream: 'DRY_RECYCLABLE',
        },
        {
          id: 'MIXED_BULKY',
          name: 'Bulky & Metals (লোহা আৰু ডাঙৰ সামগ্ৰী)',
          items: 'Iron, Steel Scrap, Copper, Brass, White Goods',
          minRate: 25.0,
          maxRate: 380.0,
          floorRate: 32.0,
          swmStream: 'SPECIAL_CARE',
        },
      ],
      wards: [
        { id: 'WARD_BELTOLA_28', wardNumber: 28, wardName: 'Beltola', isMonsoonSuspended: false },
        { id: 'WARD_JAYANAGAR_24', wardNumber: 24, wardName: 'Jayanagar', isMonsoonSuspended: false },
        { id: 'WARD_GANESHGURI_29', wardNumber: 29, wardName: 'Ganeshguri', isMonsoonSuspended: false },
        { id: 'WARD_NOONMATI_15', wardNumber: 15, wardName: 'Noonmati', isMonsoonSuspended: false },
        { id: 'WARD_WIRELESS_30', wardNumber: 30, wardName: 'Wireless / Hatigaon', isMonsoonSuspended: true },
      ],
    };

    return res.status(200).json({ success: true, data: rateCard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: message });
  }
}

export async function createOrderHandler(req: Request, res: Response) {
  try {
    const {
      citizenId: _citizenId = 'CITIZEN_DEFAULT_01',
      wardId = 'WARD_BELTOLA_28',
      visualTier = 'SOFT_FILMS',
      pickupLocation = { lat: 26.1344, lng: 91.7878 },
      slotStart,
      slotEnd,
      photoUrl,
    } = req.body;

    // Check ward suspension (monsoon flood check)
    if (wardId.includes('HATIGAON') || wardId.includes('WIRELESS') || wardId === 'WARD_WIRELESS_30') {
      return res.status(400).json({
        success: false,
        error: 'WARD_TEMPORARILY_SUSPENDED: Pickup requests in Wireless / Hatigaon are suspended due to flash flooding. Slot rescheduling notification dispatched via SMS.',
      });
    }

    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit completion OTP

    return res.status(201).json({
      success: true,
      message: 'Doorstep pickup request scheduled successfully',
      data: {
        orderId,
        otp,
        status: 'PENDING',
        visualTier,
        wardId,
        scheduledSlot: {
          start: slotStart || '10:00 AM',
          end: slotEnd || '12:00 PM',
        },
        pickupLocation,
        photoUrl: photoUrl || null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ success: false, error: message });
  }
}

export async function getOrderStatusHandler(req: Request, res: Response) {
  try {
    const rawId = req.params['id'];
    const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        status: 'PENDING',
        scaleStream: {
          weightKg: 14.5,
          isTared: true,
          batteryPct: 92,
          unitRate: 14.0,
          scaleId: 'SCALE_BLE_01',
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: message });
  }
}
