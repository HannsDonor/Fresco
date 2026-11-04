import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "cypress";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

const localEnvPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

async function cleanupTestBooking(orderId: number): Promise<null> {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error("Refusing cleanup because the order ID is invalid.");
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: "fresco_laundry_test",
  });
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute<RowDataPacket[]>(
      "SELECT customer_id, customer_name FROM laundry_orders WHERE order_id = ?",
      [orderId]
    );
    if (
      !orders[0] ||
      !String(orders[0].customer_name ?? "").startsWith("Cypress ")
    ) {
      await connection.rollback();
      return null;
    }

    await connection.execute(
      "DELETE FROM laundry_orders WHERE order_id = ? AND customer_name LIKE 'Cypress %'",
      [orderId]
    );
    await connection.execute(
      `DELETE FROM customers
       WHERE customer_id = ? AND name LIKE 'Cypress %'
         AND NOT EXISTS (SELECT 1 FROM laundry_orders WHERE customer_id = ?)`,
      [orders[0].customer_id, orders[0].customer_id]
    );
    await connection.commit();
    return null;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1280,
  viewportHeight: 900,

  env: {
    adminUsername: "cypress_admin",
    adminPassword: "Cypress_Test_Only_2026!",
  },

  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    defaultCommandTimeout: 10_000,
    setupNodeEvents(on) {
      on("task", { cleanupTestBooking });
    },
  },

  component: {
    specPattern: "cypress/component/**/*.cy.tsx",
    supportFile: "cypress/support/component.ts",
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
