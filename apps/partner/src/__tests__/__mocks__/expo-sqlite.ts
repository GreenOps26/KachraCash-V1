interface DbRow {
  id: string;
  requestId: string;
  collectorId: string;
  otp: string;
  itemsJson: string;
  signature: string;
  timestamp: number;
  syncStatus: string;
  retryCount: number;
  lastError: string | null;
}

const mockStore = new Map<string, DbRow>();

export const openDatabaseAsync = async () => ({
  execAsync: async (_sql: string) => {},
  runAsync: async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO queued_doorstep_transactions') && params) {
      const [id, requestId, collectorId, otp, itemsJson, signature, timestamp, syncStatus, retryCount, lastError] =
        params as [string, string, string, string, string, string, number, string, number, string | null];
      mockStore.set(id, {
        id,
        requestId,
        collectorId,
        otp,
        itemsJson,
        signature,
        timestamp,
        syncStatus,
        retryCount,
        lastError,
      });
    } else if (sql.includes("UPDATE queued_doorstep_transactions SET syncStatus = 'SYNCED'") && params) {
      const [id] = params as [string];
      const item = mockStore.get(id);
      if (item) item.syncStatus = 'SYNCED';
    } else if (sql.includes("UPDATE queued_doorstep_transactions SET syncStatus = 'FAILED'") && params) {
      const [error, id] = params as [string, string];
      const item = mockStore.get(id);
      if (item) {
        item.syncStatus = 'FAILED';
        item.retryCount += 1;
        item.lastError = error;
      }
    }
    return { lastInsertRowId: 1, changes: 1 };
  },
  getAllAsync: async <T>(sql: string): Promise<T[]> => {
    if (sql.includes("WHERE syncStatus = 'PENDING'")) {
      const rows = Array.from(mockStore.values()).filter((r) => r.syncStatus === 'PENDING');
      return rows as unknown as T[];
    }
    return Array.from(mockStore.values()) as unknown as T[];
  },
});
