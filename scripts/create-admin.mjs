// Seeds (or updates) a single admin account using bcrypt-hashed password.
// Run: node --env-file-if-exists=.env.local scripts/create-admin.mjs
import mysql from "mysql2/promise";
import { mysqlConfig } from "./mysql-config.mjs";
import bcrypt from "bcrypt";

const username = process.env.ADMIN_USERNAME ?? "admin";
const password = process.env.ADMIN_PASSWORD ?? "admin123";
const name = process.env.ADMIN_NAME ?? "Fresco Owner";

const pool = mysql.createPool(mysqlConfig());

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