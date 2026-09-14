// Seeds (or updates) a single admin account using bcrypt-hashed password.
// Run: node --env-file-if-exists=.env.local scripts/create-admin.mjs
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const username = process.env.ADMIN_USERNAME ?? "admin";
const password = process.env.ADMIN_PASSWORD ?? "admin123";
const name = process.env.ADMIN_NAME ?? "Fresco Owner";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "fresco_laundry",
});

try {
  const hash = await bcrypt.hash(password, 10);
  await pool.execute(
    "INSERT INTO admins (name, username, password) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)",
    [name, username, hash]
  );
  console.log(`Admin account ready -> username: ${username}`);
} finally {
  await pool.end();
}