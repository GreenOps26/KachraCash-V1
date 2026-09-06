import * as SQLite from 'expo-sqlite';
import { BLEWeightTelemetryPacket } from '@kachracash/types';

export interface QueuedDoorstepItem {
  categoryId: string;
  weightKg: number;
  unitRate: number;
  scaleHardwareId: string;
  telemetryPacket?: BLEWeightTelemetryPacket;
}

export interface QueuedDoorstepTransaction {
  id: string;
  requestId: string;
  collectorId: string;
  otp: string;
  items: QueuedDoorstepItem[];
  signature: string;
  timestamp: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

interface RawDbRow {
  id: string;
  requestId: string;
  collectorId: string;
  otp: string;
  itemsJson: string;
  signature: string;
  timestamp: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError: string | null;
}

class OfflineTransactionQueue {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private inMemoryFallback: Map<string, QueuedDoorstepTransaction> = new Map();

  private async getDb(): Promise<SQLite.SQLiteDatabase | null> {
    if (this.db) return this.db;
    try {
      this.db = await SQLite.openDatabaseAsync('kachracash_offline.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS queued_doorstep_transactions (
          id TEXT PRIMARY KEY,
          requestId TEXT NOT NULL,
          collectorId TEXT NOT NULL,
          otp TEXT NOT NULL,
          itemsJson TEXT NOT NULL,
          signature TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          syncStatus TEXT NOT NULL DEFAULT 'PENDING',
          retryCount INTEGER NOT NULL DEFAULT 0,
          lastError TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_status ON queued_doorstep_transactions (syncStatus);
      `);
      this.isInitialized = true;
      return this.db;
    } catch (err: unknown) {
      console.warn('[OfflineQueue] SQLite native DB unavailable, using memory fallback:', err);
      this.db = null;
      return null;
    }
  }

  async enqueue(item: Omit<QueuedDoorstepTransaction, 'id' | 'syncStatus' | 'retryCount'>): Promise<string> {
    const id = `OFFLINE_TX_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const tx: QueuedDoorstepTransaction = {
      ...item,
      id,
      syncStatus: 'PENDING',
      retryCount: 0,
    };

    const database = await this.getDb();
    if (database) {
      try {
        await database.runAsync(
          `INSERT INTO queued_doorstep_transactions
           (id, requestId, collectorId, otp, itemsJson, signature, timestamp, syncStatus, retryCount, lastError)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            id,
            tx.requestId,
            tx.collectorId,
            tx.otp,
            JSON.stringify(tx.items),
            tx.signature,
            tx.timestamp,
            tx.syncStatus,
            tx.retryCount,
            null,
          ],
        );
        console.log(`[OfflineQueue] Transaction cryptographically signed and queued in SQLite: ${id}`);
        return id;
      } catch (err: unknown) {
        console.warn('[OfflineQueue] Insert into SQLite failed, writing to fallback memory store:', err);
      }
    }

    this.inMemoryFallback.set(id, tx);
    return id;
  }

  async getPendingTransactions(): Promise<QueuedDoorstepTransaction[]> {
    const database = await this.getDb();
    if (database) {
      try {
        const rows = await database.getAllAsync<RawDbRow>(
          `SELECT * FROM queued_doorstep_transactions WHERE syncStatus = 'PENDING' ORDER BY timestamp ASC;`,
        );
        return rows.map((r) => ({
          id: r.id,
          requestId: r.requestId,
          collectorId: r.collectorId,
          otp: r.otp,
          items: JSON.parse(r.itemsJson) as QueuedDoorstepItem[],
          signature: r.signature,
          timestamp: r.timestamp,
          syncStatus: r.syncStatus,
          retryCount: r.retryCount,
          lastError: r.lastError || undefined,
        }));
      } catch (err: unknown) {
        console.warn('[OfflineQueue] Query SQLite failed:', err);
      }
    }

    return Array.from(this.inMemoryFallback.values()).filter((t) => t.syncStatus === 'PENDING');
  }

  async markSynced(id: string): Promise<void> {
    const database = await this.getDb();
    if (database) {
      try {
        await database.runAsync(
          `UPDATE queued_doorstep_transactions SET syncStatus = 'SYNCED' WHERE id = ?;`,
          [id],
        );
        return;
      } catch (err: unknown) {
        console.warn('[OfflineQueue] markSynced SQLite failed:', err);
      }
    }

    const item = this.inMemoryFallback.get(id);
    if (item) {
      item.syncStatus = 'SYNCED';
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    const database = await this.getDb();
    if (database) {
      try {
        await database.runAsync(
          `UPDATE queued_doorstep_transactions SET syncStatus = 'FAILED', retryCount = retryCount + 1, lastError = ? WHERE id = ?;`,
          [error, id],
        );
        return;
      } catch (err: unknown) {
        console.warn('[OfflineQueue] markFailed SQLite failed:', err);
      }
    }

    const item = this.inMemoryFallback.get(id);
    if (item) {
      item.syncStatus = 'FAILED';
      item.retryCount += 1;
      item.lastError = error;
    }
  }

  async countPending(): Promise<number> {
    const pending = await this.getPendingTransactions();
    return pending.length;
  }

  async syncAll(
    syncFn: (tx: QueuedDoorstepTransaction) => Promise<boolean>,
  ): Promise<{ synced: number; failed: number }> {
    const pending = await this.getPendingTransactions();
    let synced = 0;
    let failed = 0;

    for (const tx of pending) {
      try {
        const success = await syncFn(tx);
        if (success) {
          await this.markSynced(tx.id);
          synced += 1;
        } else {
          await this.markFailed(tx.id, 'Server returned unsuccessful sync status');
          failed += 1;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await this.markFailed(tx.id, message);
        failed += 1;
      }
    }

    return { synced, failed };
  }
}

export const offlineQueue = new OfflineTransactionQueue();
