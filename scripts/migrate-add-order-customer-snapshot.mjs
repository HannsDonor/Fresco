import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "fresco_laundry",
  connectionLimit: 2,
});

async function hasColumn(conn, table, column) {
  const [rows] = await conn.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  );
  return rows.length > 0;
}

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (!(await hasColumn(conn, "laundry_orders", "customer_name"))) {
      await conn.query("ALTER TABLE laundry_orders ADD COLUMN customer_name varchar(50) NULL AFTER customer_id");
      console.log("Added laundry_orders.customer_name column.");
    } else {
      console.log("laundry_orders.customer_name already exists.");
    }

    if (!(await hasColumn(conn, "laundry_orders", "delivery_address"))) {
      await conn.query("ALTER TABLE laundry_orders ADD COLUMN delivery_address varchar(255) NULL AFTER customer_name");
      console.log("Added laundry_orders.delivery_address column.");
    } else {
      console.log("laundry_orders.delivery_address already exists.");
    }

    const [backfill] = await conn.query(
      `UPDATE laundry_orders o
       JOIN customers c ON c.customer_id = o.customer_id
       SET o.customer_name = c.name,
           o.delivery_address = c.address
       WHERE o.customer_name IS NULL`
    );
    console.log(`Backfilled ${backfill.affectedRows} existing order(s) from the customer record.`);

    const [normalized] = await conn.query(
      "UPDATE customers SET phone = CONCAT('+63', SUBSTRING(phone, 2)) WHERE phone REGEXP '^09[0-9]{9}$'"
    );
    console.log(`Normalized ${normalized.affectedRows} customer phone number(s) to +63 format.`);

    await conn.commit();

    const [indexes] = await conn.query(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND INDEX_NAME = 'uq_customers_phone'"
    );
    if (indexes.length > 0) {
      await conn.query("ALTER TABLE customers DROP INDEX uq_customers_phone");
      console.log("Dropped unique index customers.phone so repeat bookings are allowed.");
    } else {
      console.log("No unique index on customers.phone to drop.");
    }
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
