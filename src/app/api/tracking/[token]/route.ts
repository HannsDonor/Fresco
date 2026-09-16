import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/tracking/[token]">
) {
  const { token } = await ctx.params;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.order_id, o.order_reference, o.tracking_token,
              o.load_type, o.special_instructions,
              DATE_FORMAT(o.pickup_date, '%Y-%m-%d') AS pickup_date,
              DATE_FORMAT(o.pickup_time, '%H:%i') AS pickup_time,
              o.order_status, o.total_amount,
              o.created_at,
              c.name AS customer_name,
              s.name AS service_name, s.starting_price
       FROM laundry_orders o
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN services_offered s ON s.service_id = o.service_id
       WHERE o.tracking_token = ?
       LIMIT 1`,
      [token]
    );

    const order = rows[0];
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const [timelineRows] = await pool.query<RowDataPacket[]>(
      `SELECT status_id, status, note, updated_at
       FROM order_status_history
       WHERE order_id = ?
       ORDER BY updated_at ASC, status_id ASC`,
      [order.order_id]
    );

    return NextResponse.json({
      success: true,
      order: {
        order_reference: order.order_reference,
        tracking_token: order.tracking_token,
        order_status: order.order_status,
        total_amount: order.total_amount,
        created_at: order.created_at,
        service: {
          name: order.service_name,
          starting_price: order.starting_price,
        },
        load_type: order.load_type,
        special_instructions: order.special_instructions,
        pickup_date: order.pickup_date,
        pickup_time: order.pickup_time,
        customer: {
          name: order.customer_name,
        },
        timeline: timelineRows,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch order." },
      { status: 500 }
    );
  }
}