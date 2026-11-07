import mysql from "mysql2/promise";
import { mysqlConfig } from "./mysql-config.mjs";

const pool = mysql.createPool(mysqlConfig());

async function main() {
  const conn = await pool.getConnection();
  try {
    const [columns] = await conn.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'laundry_orders' AND COLUMN_NAME = 'fulfillment_method'"
    );

    if (columns.length > 0) {
      console.log("laundry_orders.fulfillment_method already exists. Nothing to do.");
      return;
    }

    await conn.query(
      "ALTER TABLE laundry_orders ADD COLUMN fulfillment_method enum('Pickup','Pickup & Deliver') NOT NULL DEFAULT 'Pickup' AFTER load_type"
    );
    console.log("Added laundry_orders.fulfillment_method column.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
