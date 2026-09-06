import { db } from '@kachracash/db';
import { vi } from 'vitest';

export interface MockUser {
  id: string;
  role: 'CITIZEN' | 'COLLECTOR' | 'ADMIN';
  phoneNumber: string;
  fullName: string;
}

export interface MockWallet {
  id: string;
  collectorId: string;
  floatBalance: number;
  lockedAmount: number;
  minThreshold: number;
  status: 'ACTIVE' | 'FROZEN';
}

export interface MockLedgerEntry {
  id: string;
  walletId: string;
  amount: number;
  type: string;
  description: string;
  idempotencyKey: string;
  referenceOrderId?: string;
  createdAt: Date;
}

export interface MockPayout {
  id: string;
  transactionId: string;
  gatewayRef?: string;
  upiVpa: string;
  amount: number;
  status: string;
  idempotencyKey: string;
}

// In-Memory Test State
export const testState = {
  users: new Map<string, MockUser>(),
  wallets: new Map<string, MockWallet>(),
  ledger: new Map<string, MockLedgerEntry>(),
  payouts: new Map<string, MockPayout>(),
};

export async function cleanDatabase() {
  testState.users.clear();
  testState.wallets.clear();
  testState.ledger.clear();
  testState.payouts.clear();
}

export async function createTestUser(role: 'CITIZEN' | 'COLLECTOR' | 'ADMIN'): Promise<MockUser> {
  const id = `user_${role.toLowerCase()}_${Math.random().toString(36).substring(2, 9)}`;
  const user: MockUser = {
    id,
    role,
    phoneNumber: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
    fullName: `Test ${role}`,
  };
  testState.users.set(id, user);
  return user;
}

export async function createTestWallet(collectorId: string, initialBalance: number): Promise<MockWallet> {
  const id = `wallet_${Math.random().toString(36).substring(2, 9)}`;
  const wallet: MockWallet = {
    id,
    collectorId,
    floatBalance: initialBalance,
    lockedAmount: 0,
    minThreshold: 2000.0,
    status: 'ACTIVE',
  };
  testState.wallets.set(id, wallet);
  return wallet;
}

// Intercept or hook into db methods for offline test runs
vi.spyOn(db.collectorWallet, 'findUnique').mockImplementation((async (args: unknown) => {
  const query = args as { where?: { collectorId?: string; id?: string } };
  if (query?.where?.collectorId) {
    for (const w of testState.wallets.values()) {
      if (w.collectorId === query.where.collectorId) {
        return { ...w } as unknown as Awaited<ReturnType<typeof db.collectorWallet.findUnique>>;
      }
    }
  }
  if (query?.where?.id) {
    const w = testState.wallets.get(query.where.id);
    return w ? ({ ...w } as unknown as Awaited<ReturnType<typeof db.collectorWallet.findUnique>>) : null;
  }
  return null;
}) as unknown as typeof db.collectorWallet.findUnique);

vi.spyOn(db.collectorWallet, 'findUniqueOrThrow').mockImplementation((async (args: unknown) => {
  const query = args as Parameters<typeof db.collectorWallet.findUnique>[0];
  const w = await db.collectorWallet.findUnique(query);
  if (!w) throw new Error('Collector wallet not found');
  return w;
}) as unknown as typeof db.collectorWallet.findUniqueOrThrow);

vi.spyOn(db.collectorWallet, 'findFirst').mockImplementation((async () => {
  const first = testState.wallets.values().next().value;
  return first ? ({ ...first } as unknown as Awaited<ReturnType<typeof db.collectorWallet.findFirst>>) : null;
}) as unknown as typeof db.collectorWallet.findFirst);

vi.spyOn(db.collectorWallet, 'update').mockImplementation((async (args: unknown) => {
  const query = args as { where: { id: string }; data: { floatBalance?: number | { decrement?: number } } };
  const id = query.where.id;
  const w = testState.wallets.get(id);
  if (!w) throw new Error('Wallet not found');

  if (query.data.floatBalance !== undefined) {
    if (typeof query.data.floatBalance === 'object' && query.data.floatBalance.decrement !== undefined) {
      w.floatBalance -= Number(query.data.floatBalance.decrement);
    } else {
      w.floatBalance = Number(query.data.floatBalance);
    }
  }
  testState.wallets.set(id, w);
  return { ...w } as unknown as Awaited<ReturnType<typeof db.collectorWallet.update>>;
}) as unknown as typeof db.collectorWallet.update);

vi.spyOn(db.walletLedger, 'create').mockImplementation((async (args: unknown) => {
  const query = args as {
    data: {
      walletId: string;
      amount: number;
      type: string;
      description: string;
      idempotencyKey: string;
      referenceOrderId?: string;
    };
  };
  const entry: MockLedgerEntry = {
    id: `ledger_${Math.random().toString(36).substring(2, 9)}`,
    walletId: query.data.walletId,
    amount: Number(query.data.amount),
    type: query.data.type,
    description: query.data.description,
    idempotencyKey: query.data.idempotencyKey,
    referenceOrderId: query.data.referenceOrderId,
    createdAt: new Date(),
  };
  testState.ledger.set(entry.idempotencyKey, entry);
  return entry as unknown as Awaited<ReturnType<typeof db.walletLedger.create>>;
}) as unknown as typeof db.walletLedger.create);

vi.spyOn(db.walletLedger, 'createMany').mockImplementation((async (args: unknown) => {
  const query = args as {
    data: Array<{
      walletId: string;
      amount: number;
      type: string;
      description: string;
      idempotencyKey: string;
      referenceOrderId?: string;
    }>;
  };
  for (const item of query.data) {
    const entry: MockLedgerEntry = {
      id: `ledger_${Math.random().toString(36).substring(2, 9)}`,
      walletId: item.walletId,
      amount: Number(item.amount),
      type: item.type,
      description: item.description,
      idempotencyKey: item.idempotencyKey,
      referenceOrderId: item.referenceOrderId,
      createdAt: new Date(),
    };
    testState.ledger.set(entry.idempotencyKey, entry);
  }
  return { count: query.data.length };
}) as unknown as typeof db.walletLedger.createMany);

vi.spyOn(db.walletLedger, 'findUnique').mockImplementation((async (args: unknown) => {
  const query = args as { where?: { idempotencyKey?: string } };
  if (query?.where?.idempotencyKey) {
    const entry = testState.ledger.get(query.where.idempotencyKey);
    return entry ? ({ ...entry } as unknown as Awaited<ReturnType<typeof db.walletLedger.findUnique>>) : null;
  }
  return null;
}) as unknown as typeof db.walletLedger.findUnique);

vi.spyOn(db.walletLedger, 'count').mockImplementation((async (args: unknown) => {
  const query = args as { where?: { idempotencyKey?: string } } | undefined;
  if (query?.where?.idempotencyKey) {
    return testState.ledger.has(query.where.idempotencyKey) ? 1 : 0;
  }
  return testState.ledger.size;
}) as unknown as typeof db.walletLedger.count);

vi.spyOn(db.walletLedger, 'aggregate').mockImplementation((async (args: unknown) => {
  const query = args as { where?: { walletId?: string } } | undefined;
  let sum = 0;
  for (const entry of testState.ledger.values()) {
    if (entry.walletId === query?.where?.walletId) {
      sum += entry.amount;
    }
  }
  return { _sum: { amount: sum } } as unknown as Awaited<ReturnType<typeof db.walletLedger.aggregate>>;
}) as unknown as typeof db.walletLedger.aggregate);

vi.spyOn(db.payout, 'findUnique').mockImplementation((async (args: unknown) => {
  const query = args as { where?: { idempotencyKey?: string } };
  if (query?.where?.idempotencyKey) {
    const p = testState.payouts.get(query.where.idempotencyKey);
    return p ? ({ ...p } as unknown as Awaited<ReturnType<typeof db.payout.findUnique>>) : null;
  }
  return null;
}) as unknown as typeof db.payout.findUnique);

vi.spyOn(db.payout, 'update').mockImplementation((async (args: unknown) => {
  const query = args as { where: { id: string }; data: Record<string, unknown> };
  const p = Array.from(testState.payouts.values()).find((x) => x.id === query.where.id);
  if (!p) throw new Error('Payout not found');
  Object.assign(p, query.data);
  return { ...p } as unknown as Awaited<ReturnType<typeof db.payout.update>>;
}) as unknown as typeof db.payout.update);

vi.spyOn(db, '$transaction').mockImplementation((async (cb: unknown) => {
  if (typeof cb === 'function') {
    return await (cb as (prisma: typeof db) => Promise<unknown>)(db);
  }
  return cb;
}) as unknown as typeof db.$transaction);
