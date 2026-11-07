import mysql from "mysql2/promise";
import { mysqlConfig } from "@/lib/mysql-config";

declare global {
  var globalPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool(mysqlConfig());
}

const pool =
  global.globalPool ??
  (global.globalPool = createPool());

export default pool;
