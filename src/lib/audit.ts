import type { Pool, PoolConnection } from "mysql2/promise";

type DatabaseExecutor = Pool | PoolConnection;

export interface AuditEntry {
  adminId: number;
  action: string;
  tableName: string;
  orderReference?: string | null;
  details?: Record<string, unknown>;
}

export async function writeAuditLog(
  executor: DatabaseExecutor,
  entry: AuditEntry
): Promise<void> {
  await executor.execute(
    `INSERT INTO audit_logs (admin_id, action, table_name, order_reference, details)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.adminId,
      entry.action,
      entry.tableName,
      entry.orderReference ?? null,
      entry.details ? JSON.stringify(entry.details) : null,
    ]
  );
}
