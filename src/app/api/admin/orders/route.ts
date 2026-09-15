import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { LAUNDRY_STATUSES } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ORDER_SELECT = `
SELECT o.order_id, o.order_reference, o.tracking_token, o.service_id,
       o.item_count, o.estimated_weight, o.load_type, o.special_instructions,
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

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const status = (url.searchParams.get("status") ?? "").trim();
    const date = (url.searchParams.get("date") ?? "all").trim();

    const conditions: string[] = [];
    const params: string[] = [];

    if (q) {
      conditions.push("(o.order_reference LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    if (status && LAUNDRY_STATUSES.includes(status as never)) {
      conditions.push("o.order_status = ?");
      params.push(status);
    }

    if (date === "today") {
      conditions.push("DATE(o.created_at) = ?");
      params.push(todayString());
    } else if (date === "upcoming") {
      conditions.push("o.pickup_date >= ?");
      params.push(todayString());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query<RowDataPacket[]>(
      `${ORDER_SELECT}${where} ORDER BY o.created_at DESC`,
      params
    );
    return NextResponse.json({ success: true, orders: rows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch orders." }, { status: 500 });
  }
}