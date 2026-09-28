import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "fresco_laundry",
  connectionLimit: 2,
});

const DEFAULT_QR_PATH = "/images/gcash/qrcode.png";

const COLUMNS = [
  { name: "gcash_number", ddl: "ADD COLUMN gcash_number varchar(50) DEFAULT NULL AFTER address" },
  {
    name: "gcash_qr_path",
    ddl: "ADD COLUMN gcash_qr_path varchar(255) DEFAULT NULL AFTER gcash_number",
  },
];

async function main() {
  const conn = await pool.getConnection();
  try {
    for (const column of COLUMNS) {
      const [rows] = await conn.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_information' AND COLUMN_NAME = ?",
        [column.name]
      );

      if (rows.length > 0) {
        console.log(`shop_information.${column.name} already exists. Skipping.`);
        continue;
      }

      await conn.query(`ALTER TABLE shop_information ${column.ddl}`);
      console.log(`Added shop_information.${column.name} column.`);
    }

    const [shops] = await conn.query(
      "SELECT shop_id FROM shop_information ORDER BY shop_id ASC LIMIT 1"
    );
    if (shops[0]) {
      await conn.query(
        "UPDATE shop_information SET gcash_qr_path = ? WHERE shop_id = ? AND (gcash_qr_path IS NULL OR gcash_qr_path = '')",
        [DEFAULT_QR_PATH, shops[0].shop_id]
      );
      console.log("Seeded gcash_qr_path with the bundled placeholder image.");
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
