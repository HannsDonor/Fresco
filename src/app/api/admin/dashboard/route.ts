import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["Accepted", "In Progress"];

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ORDER_SELECT = `
SELECT o.order_id, o.order_reference, o.tracking_token, o.service_id,
       o.load_type, o.fulfillment_method, o.requested_payment_method, o.special_instructions,
       DATE_FORMAT(o.pickup_date, '%Y-%m-%d') AS pickup_date,
       DATE_FORMAT(o.pickup_time, '%H:%i') AS pickup_time,
       o.order_status, o.total_amount, o.created_at, o.updated_at,
       c.customer_id, c.name AS customer_name, c.phone AS customer_phone,
       s.name AS service_name,
       (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.order_id = o.order_id) AS total_paid,
       (SELECT p.payment_status FROM payments p WHERE p.order_id = o.order_id ORDER BY p.payment_id DESC LIMIT 1) AS payment_status,
       (SELECT p.payment_method FROM payments p WHERE p.order_id = o.order_id ORDER BY p.payment_id DESC LIMIT 1) AS payment_method
FROM laundry_orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN services_offered s ON s.service_id = o.service_id
`;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const today = todayString();

    const [totalRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM laundry_orders"
    );
    const total = Number(totalRows[0].c);

    const [statusRows] = await pool.query<RowDataPacket[]>(
      "SELECT order_status AS status, COUNT(*) AS c FROM laundry_orders GROUP BY order_status"
    );
    const countByStatus: Record<string, number> = {};
    for (const row of statusRows) {
      countByStatus[row.status] = Number(row.c);
    }

    const dashboardStatuses = ["Pending", "Accepted", "Completed", "Delivered"];
    const statusCounts = dashboardStatuses.map((status) => ({
      status,
      count: countByStatus[status] ?? 0,
    }));

    const pending = countByStatus["Pending"] ?? 0;
    const active = ACTIVE_STATUSES.reduce((sum, s) => sum + (countByStatus[s] ?? 0), 0);
    const readyForPickup =
      (countByStatus["Ready for Pickup"] ?? 0) + (countByStatus["Ready for Delivery"] ?? 0);
    const completed = (countByStatus["Completed"] ?? 0) + (countByStatus["Delivered"] ?? 0);
    const cancelled = countByStatus["Cancelled"] ?? 0;

    const [todayRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM laundry_orders WHERE DATE(created_at) = ?",
      [today]
    );
    const todayOrders = Number(todayRows[0].c);

    const [capacitySettingsRows] = await pool.query<RowDataPacket[]>(
      `SELECT daily_capacity_kg, small_load_kg, medium_load_kg, large_load_kg
       FROM shop_information
       ORDER BY shop_id ASC
       LIMIT 1`
    );
    const capacitySettings = capacitySettingsRows[0];
    if (!capacitySettings) {
      return NextResponse.json(
        { success: false, error: "Shop capacity settings are unavailable." },
        { status: 500 }
      );
    }
    const [capacityRows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(
         CASE o.load_type
           WHEN 'Small' THEN ?
           WHEN 'Medium' THEN ?
           WHEN 'Large' THEN ?
           ELSE 0
         END
       ), 0) AS used_kg
       FROM laundry_orders o
       WHERE o.pickup_date = ?
         AND o.order_status IN ('Accepted', 'In Progress', 'Ready for Pickup', 'Ready for Delivery')`,
      [
        capacitySettings.small_load_kg,
        capacitySettings.medium_load_kg,
        capacitySettings.large_load_kg,
        today,
      ]
    );
    const dailyCapacityKg = Number(capacitySettings.daily_capacity_kg);
    const usedKg = Number(capacityRows[0]?.used_kg ?? 0);

    const [recentRows] = await pool.query<RowDataPacket[]>(
      `${ORDER_SELECT} ORDER BY o.created_at DESC LIMIT 8`
    );

    const [pickupRows] = await pool.query<RowDataPacket[]>(
      `${ORDER_SELECT} WHERE o.pickup_date = ? ORDER BY o.pickup_time ASC`,
      [today]
    );

    return NextResponse.json({
      success: true,
      summary: { total, pending, active, readyForPickup, completed, cancelled, todayOrders },
      capacity: {
        date: today,
        usedKg,
        dailyCapacityKg,
        remainingKg: Math.max(dailyCapacityKg - usedKg, 0),
      },
      statusCounts,
      recentOrders: recentRows,
      todayPickups: pickupRows,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}