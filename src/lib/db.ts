import mysql from "mysql2/promise";

declare global {
  var globalPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "fresco_laundry",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

const pool =
  global.globalPool ??
  (global.globalPool = createPool());

export default pool;