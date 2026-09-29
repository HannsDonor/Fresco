import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "fresco_laundry",
  connectionLimit: 2,
});

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "ALTER TABLE laundry_orders MODIFY COLUMN order_status ENUM('Pending','Accepted','In Progress','Ready for Pickup','Ready for Delivery','Completed','Delivered','Cancelled','Rejected') NOT NULL DEFAULT 'Pending'"
    );
    console.log("order_status enum expanded with Ready for Delivery + Delivered.");

    const [historyRows] = await conn.query(
      `UPDATE order_status_history h
       JOIN laundry_orders o ON o.order_id = h.order_id
       SET h.status = CASE h.status
         WHEN 'Ready for Pickup' THEN 'Ready for Delivery'
         WHEN 'Completed' THEN 'Delivered'
         ELSE h.status
       END
       WHERE o.fulfillment_method = 'Pickup & Deliver'
         AND h.status IN ('Ready for Pickup', 'Completed')`
    );
    console.log(`Rewrote ${historyRows.affectedRows} delivery order status history entries.`);

    const [orderRows] = await conn.query(
      `UPDATE laundry_orders
       SET order_status = CASE order_status
         WHEN 'Ready for Pickup' THEN 'Ready for Delivery'
         WHEN 'Completed' THEN 'Delivered'
         ELSE order_status
       END
       WHERE fulfillment_method = 'Pickup & Deliver'
         AND order_status IN ('Ready for Pickup', 'Completed')`
    );
    console.log(`Rewrote ${orderRows.affectedRows} delivery order statuses.`);

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