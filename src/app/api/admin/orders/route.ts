import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.order_id, o.order_reference, o.tracking_token, o.service_id,
              o.item_count, o.estimated_weight, o.load_type, o.special_instructions,
              o.pickup_date, o.pickup_time, o.order_status, o.total_amount,
              o.created_at, o.updated_at,
              c.customer_id, c.name AS customer_name, c.phone AS customer_phone,
              s.name AS service_name,
              (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.order_id = o.order_id) AS total_paid
       FROM laundry_orders o
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN services_offered s ON s.service_id = o.service_id
       ORDER BY o.created_at DESC`
    );
    return NextResponse.json({ success: true, orders: rows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch orders." }, { status: 500 });
  }
}