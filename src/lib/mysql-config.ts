import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import type { PoolOptions } from "mysql2";

function getCaCertificate(): string | undefined {
  const value = process.env.DB_SSL_CA?.trim();
  if (!value) return undefined;

  // Vercel environment variables can contain the PEM directly; local setups
  // may instead point DB_SSL_CA at a protected certificate file.
  return existsSync(value) ? readFileSync(value, "utf8") : value.replace(/\\n/g, "\n");
}

export function mysqlConfig(database?: string): PoolOptions {
  const sslEnabled = /^(1|true|yes)$/i.test(process.env.DB_SSL ?? "false");
  const ca = sslEnabled ? getCaCertificate() : undefined;

  return {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME ?? process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: database ?? process.env.DB_DATABASE ?? process.env.DB_NAME ?? "fresco_laundry",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 10_000,
    ...(sslEnabled
      ? { ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) } }
      : {}),
  };
}
