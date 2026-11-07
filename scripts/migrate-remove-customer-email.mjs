import mysql from "mysql2/promise";
import { mysqlConfig } from "./mysql-config.mjs";

const pool = mysql.createPool(mysqlConfig());

async function main() {
  const conn = await pool.getConnection();
  try {
    const [columns] = await conn.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'email'"
    );

    if (columns.length === 0) {
      console.log("customers.email is already removed. Nothing to do.");
      return;
    }

    await conn.query("ALTER TABLE customers DROP COLUMN email");
    console.log("Dropped customers.email column permanently.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
