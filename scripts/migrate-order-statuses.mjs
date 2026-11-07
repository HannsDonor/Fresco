import mysql from "mysql2/promise";
import { mysqlConfig } from "./mysql-config.mjs";

const pool = mysql.createPool(mysqlConfig());

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "UPDATE laundry_orders SET order_status = 'In Progress' WHERE order_status IN ('Washing','Drying','Folding')"
    );
    console.log(`Merged ${result.affectedRows} orders into 'In Progress'.`);

    await conn.query(
      "ALTER TABLE laundry_orders MODIFY COLUMN order_status ENUM('Pending','Accepted','In Progress','Ready for Pickup','Completed','Cancelled','Rejected') NOT NULL DEFAULT 'Pending'"
    );
    console.log("order_status enum updated to In Progress flow.");

    await conn.commit();
    console.log("Migration complete.");
  } catch (err) {
    await conn.rollback();
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();