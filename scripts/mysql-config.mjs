import { existsSync, readFileSync } from "node:fs";

function getCaCertificate() {
  const value = process.env.DB_SSL_CA?.trim();
  if (!value) return undefined;
  return existsSync(value) ? readFileSync(value, "utf8") : value.replace(/\\n/g, "\n");
}

export function mysqlConfig(database, overrides = {}) {
  const sslEnabled = /^(1|true|yes)$/i.test(process.env.DB_SSL ?? "false");
  const ca = sslEnabled ? getCaCertificate() : undefined;
  return {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME ?? process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: database ?? process.env.DB_DATABASE ?? process.env.DB_NAME ?? "fresco_laundry",
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    connectTimeout: 10_000,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) } } : {}),
    ...overrides,
  };
}
