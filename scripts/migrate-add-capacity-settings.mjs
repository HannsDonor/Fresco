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

async function renameColumnIfNeeded(conn, oldName, newName) {
  const oldExists = await hasColumn(conn, "shop_information", oldName);
  const newExists = await hasColumn(conn, "shop_information", newName);
  if (oldExists && !newExists) {
    const definition = {
      daily_capacity_units: "int NOT NULL DEFAULT 100",
      small_load_units: "int NOT NULL DEFAULT 3",
      medium_load_units: "int NOT NULL DEFAULT 6",
      large_load_units: "int NOT NULL DEFAULT 7",
    }[oldName];
    await conn.query(
      `ALTER TABLE shop_information CHANGE COLUMN ${oldName} ${newName} ${definition}`
    );
    console.log(`Renamed shop_information.${oldName} to ${newName}.`);
  }
}

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await renameColumnIfNeeded(conn, "daily_capacity_units", "daily_capacity_kg");
    await renameColumnIfNeeded(conn, "small_load_units", "small_load_kg");
    await renameColumnIfNeeded(conn, "medium_load_units", "medium_load_kg");
    await renameColumnIfNeeded(conn, "large_load_units", "large_load_kg");

    const columns = [
      ["daily_capacity_kg", "int NOT NULL DEFAULT 100"],
      ["small_load_kg", "int NOT NULL DEFAULT 3"],
      ["medium_load_kg", "int NOT NULL DEFAULT 6"],
      ["large_load_kg", "int NOT NULL DEFAULT 7"],
    ];

    for (const [name, definition] of columns) {
      if (!(await hasColumn(conn, "shop_information", name))) {
        await conn.query(`ALTER TABLE shop_information ADD COLUMN ${name} ${definition}`);
        console.log(`Added shop_information.${name}.`);
      } else {
        console.log(`shop_information.${name} already exists.`);
      }
    }

    await conn.query(
      `UPDATE shop_information
       SET daily_capacity_kg = 100,
           small_load_kg = 3,
           medium_load_kg = 6,
           large_load_kg = 7
       WHERE daily_capacity_kg = 20
         AND small_load_kg = 1
         AND medium_load_kg = 2
         AND large_load_kg = 3`
    );
    console.log("Applied default capacity estimates in kilograms.");

    await conn.commit();
    console.log("Capacity settings migration complete.");
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
