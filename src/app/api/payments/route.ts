import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.payment_id, p.order_id, p.amount, p.payment_method, p.payment_status, p.payment_date,
              o.tracking_token, c.name AS customer_name
       FROM payments p
       JOIN laundry_orders o ON o.order_id = p.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       ORDER BY p.payment_date DESC`
    );
    return NextResponse.json({ success: true, payments: rows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch payments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { order_id?: number; amount?: number; payment_method?: string; paid?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { order_id, amount, payment_method, paid } = body ?? {};

  if (!order_id || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "Missing required fields: order_id, amount." },
      { status: 400 }
    );
  }

  const method = payment_method === "GCash" ? "GCash" : "Cash";
  const status = paid ? "Paid" : "Pending";

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO payments (order_id, amount, payment_method, payment_status, payment_date) VALUES (?, ?, ?, ?, ?)",
      [order_id, amount, method, status, status === "Paid" ? new Date() : null]
    );
    return NextResponse.json({ success: true, payment_id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to record payment." }, { status: 500 });
  }
}