import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";

const databaseName = process.env.DB_NAME;
if (databaseName !== "fresco_laundry_test") {
  throw new Error(
    `Refusing to prepare database "${databaseName ?? "(unset)"}". This script only allows fresco_laundry_test.`
  );
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  multipleStatements: false,
});

try {
  await connection.query(
    "CREATE DATABASE IF NOT EXISTS `fresco_laundry_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
  );
  await connection.changeUser({ database: "fresco_laundry_test" });

  const [tables] = await connection.query("SHOW TABLES");
  if (tables.length === 0) {
    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.resolve(thisDir, "..", "fresco_laundry.sql");
    const dump = await fs.readFile(schemaPath, "utf8");
    const ddl = dump
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.replace(/--[^\r\n]*/g, "").trim())
      .filter((statement) => /^(CREATE TABLE|ALTER TABLE)\b/i.test(statement))
      .map((statement) => {
        if (!/^CREATE TABLE `admins`/i.test(statement)) return statement;
        return statement.replace(
          /\n\) ENGINE=/i,
          ",\n  PRIMARY KEY (`admin_id`),\n  UNIQUE KEY `username` (`username`)\n) ENGINE="
        );
      })
      .filter((statement) => !/^ALTER TABLE `admins`\s+ADD PRIMARY KEY/i.test(statement));

    if (ddl.length < 20) {
      throw new Error("Could not find the expected table schema in fresco_laundry.sql.");
    }
    for (const statement of ddl) await connection.query(statement);
    console.log(`Created ${ddl.filter((statement) => /^CREATE TABLE/i.test(statement)).length} test tables from schema only.`);
  } else if (tables.length !== 9) {
    throw new Error(
      `The test database has ${tables.length} tables; expected either 0 or 9. No tables or records were changed. Review fresco_laundry_test before proceeding.`
    );
  }

  await connection.query(
    `DELETE FROM laundry_orders
     WHERE customer_name LIKE 'Cypress UI %' OR customer_name LIKE 'Cypress Customer %'`
  );
  await connection.query(
    `DELETE FROM customers
     WHERE (name LIKE 'Cypress UI %' OR name LIKE 'Cypress Customer %')
       AND NOT EXISTS (SELECT 1 FROM laundry_orders WHERE laundry_orders.customer_id = customers.customer_id)`
  );
  await connection.query(
    `DELETE FROM services_offered
     WHERE name LIKE 'Cypress Service %'
       AND NOT EXISTS (SELECT 1 FROM laundry_orders WHERE laundry_orders.service_id = services_offered.service_id)`
  );

  const testUsername = "cypress_admin";
  const testPassword = "Cypress_Test_Only_2026!";
  const passwordHash = await bcrypt.hash(testPassword, 10);
  const [testAdmins] = await connection.execute(
    `SELECT admin_id FROM admins
     WHERE username = ? OR name = ? OR username LIKE 'cypress_admin\\_%'
     ORDER BY admin_id ASC LIMIT 1`,
    [testUsername, "Cypress Test Admin"]
  );
  if (testAdmins.length > 0) {
    await connection.execute(
      "UPDATE admins SET name = ?, username = ?, password = ? WHERE admin_id = ?",
      ["Cypress Test Admin", testUsername, passwordHash, testAdmins[0].admin_id]
    );
  } else {
    await connection.execute(
      "INSERT INTO admins (name, username, password) VALUES (?, ?, ?)",
      ["Cypress Test Admin", testUsername, passwordHash]
    );
  }

  const [services] = await connection.execute(
    "SELECT service_id FROM services_offered WHERE name = ? LIMIT 1",
    ["Cypress Test Service"]
  );
  if (services.length === 0) {
    await connection.execute(
      "INSERT INTO services_offered (name, description, starting_price, icon, is_active) VALUES (?, ?, ?, ?, TRUE)",
      ["Cypress Test Service", "Synthetic service for local E2E tests.", 50, "wash"]
    );
  } else {
    await connection.execute(
      `UPDATE services_offered
       SET description = ?, starting_price = 50, icon = 'wash', is_active = TRUE
       WHERE name = ?`,
      ["Synthetic service for local E2E tests.", "Cypress Test Service"]
    );
  }

  const [shopInfo] = await connection.query("SELECT shop_id FROM shop_information LIMIT 1");
  if (shopInfo.length === 0) {
    await connection.execute(
      `INSERT INTO shop_information
         (shop_name, phone, email, address, monday_open, monday_close, tuesday_open, tuesday_close,
          wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close,
          saturday_open, saturday_close, sunday_open, sunday_close)
       VALUES (?, ?, ?, ?, '07:00:00', '19:00:00', '07:00:00', '19:00:00',
               '07:00:00', '19:00:00', '07:00:00', '19:00:00', '07:00:00', '19:00:00',
               '08:00:00', '18:00:00', '09:00:00', '15:00:00')`,
      ["Fresco Cypress Test Shop", "09123456789", "cypress@example.invalid", "1 Test Street"]
    );
  } else {
    await connection.execute(
      `UPDATE shop_information
       SET shop_name = ?, phone = ?, email = ?, address = ?, gcash_number = NULL, gcash_qr_path = NULL,
           monday_open = '07:00:00', monday_close = '19:00:00',
           tuesday_open = '07:00:00', tuesday_close = '19:00:00',
           wednesday_open = '07:00:00', wednesday_close = '19:00:00',
           thursday_open = '07:00:00', thursday_close = '19:00:00',
           friday_open = '07:00:00', friday_close = '19:00:00',
           saturday_open = '08:00:00', saturday_close = '18:00:00',
           sunday_open = '09:00:00', sunday_close = '15:00:00'
       ORDER BY shop_id ASC LIMIT 1`,
      ["Fresco Cypress Test Shop", "09123456789", "cypress@example.invalid", "1 Test Street"]
    );
  }

  console.log("Cypress test database is ready. No production database was accessed.");
} finally {
  await connection.end();
}
