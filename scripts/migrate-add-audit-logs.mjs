import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "fresco_laundry",
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        audit_id INT NOT NULL AUTO_INCREMENT,
        admin_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        order_reference VARCHAR(30) DEFAULT NULL,
        details JSON DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (audit_id),
        KEY idx_audit_logs_created_at (created_at),
        KEY idx_audit_logs_admin_id (admin_id),
        CONSTRAINT fk_audit_logs_admin
          FOREIGN KEY (admin_id) REFERENCES admins (admin_id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    const [columns] = await pool.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs'"
    );
    const names = new Set(columns.map((column) => column.COLUMN_NAME));
    if (names.has("record_id")) {
    await pool.query("ALTER TABLE audit_logs DROP COLUMN record_id");
    }
    if (!names.has("order_reference")) {
    await pool.query("ALTER TABLE audit_logs ADD COLUMN order_reference VARCHAR(30) DEFAULT NULL AFTER table_name");
    }
    console.log("Audit logs table is ready.");
  } catch (error) {
    console.error("Audit logs migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
