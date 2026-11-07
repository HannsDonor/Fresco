import mysql from "mysql2/promise";
import { mysqlConfig } from "./mysql-config.mjs";

const pool = mysql.createPool(mysqlConfig());

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  );
  return rows.length > 0;
}

async function main() {
  const conn = await pool.getConnection();
  try {
    for (const column of ["item_count", "estimated_weight"]) {
      if (await columnExists(conn, "laundry_orders", column)) {
        await conn.query(`ALTER TABLE laundry_orders DROP COLUMN ${column}`);
        console.log(`Dropped laundry_orders.${column} permanently.`);
      } else {
        console.log(`laundry_orders.${column} is already removed. Skipping.`);
      }
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();