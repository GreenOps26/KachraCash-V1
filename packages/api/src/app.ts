import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import {
  completeOrderHandler,
  verifyOtpHandler,
  getRateCardHandler,
  createOrderHandler,
  getOrderStatusHandler,
} from './controllers/order-controller.js';
import { topupWalletHandler } from './controllers/wallet-controller.js';
import { suspendWardHandler } from './controllers/admin-controller.js';
import { payoutWebhookHandler } from './controllers/payout-controller.js';
import { matchDispatchHandler } from './controllers/dispatch-controller.js';
import { calculateFloorRate, calculatePayout } from './services/pricing-engine.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'kachracash-api', timestamp: new Date().toISOString() });
  });

  // Rates inquiry (Floor Rate Card API)
  app.get('/api/v1/rates', (_req: Request, res: Response) => {
    const defaultRates = [
      {
        sku: 'PET_RIGID',
        name: 'PET Plastic Bottles & Jars',
        visualTier: 'RIGID_CONTAINERS',
        rate: calculateFloorRate({
          nationalIndexRate: 40.0,
          freightCost: 1.2,
          handlingCost: 1.8,
          aggregatorMargin: 2.0,
          collectorMargin: 0.08,
          volatilityBuffer: 0.05,
        }),
      },
      {
        sku: 'CARDBOARD_OCC',
        name: 'Old Corrugated Cardboard',
        visualTier: 'SOFT_FILMS',
        rate: calculateFloorRate({
          nationalIndexRate: 16.0,
          freightCost: 1.0,
          handlingCost: 1.0,
          aggregatorMargin: 1.0,
          collectorMargin: 0.08,
          volatilityBuffer: 0.04,
        }),
      },
      {
        sku: 'FERROUS_IRON',
        name: 'Iron & Steel Scrap',
        visualTier: 'MIXED_BULKY',
        rate: calculateFloorRate({
          nationalIndexRate: 32.0,
          freightCost: 1.2,
          handlingCost: 2.0,
          aggregatorMargin: 1.5,
          collectorMargin: 0.08,
          volatilityBuffer: 0.05,
        }),
      },
    ];

    res.status(200).json({ success: true, data: defaultRates });
  });

  // Calculate potential payout preview
  app.post('/api/v1/payout/preview', (req: Request, res: Response) => {
    const { weightKg, ratePerKg } = req.body;
    const result = calculatePayout(Number(weightKg) || 0, Number(ratePerKg) || 0);
    res.status(200).json({ success: true, data: result });
  });

  // Consumer & booking routes
  app.get('/api/v1/orders/rate-card', getRateCardHandler);
  app.post('/api/v1/orders/create', createOrderHandler);
  app.get('/api/v1/orders/:id/status', getOrderStatusHandler);

  // Core transaction & operational routes
  app.post('/api/v1/dispatch/match', matchDispatchHandler);
  app.post('/api/v1/orders/complete', completeOrderHandler);
  app.post('/api/v1/orders/verify-otp', verifyOtpHandler);
  app.post('/api/v1/wallets/topup', topupWalletHandler);
  app.post('/api/v1/admin/wards/:id/suspend', suspendWardHandler);
  app.post('/api/v1/payouts/webhook', payoutWebhookHandler);

  return app;
}

export const app = createApp();
