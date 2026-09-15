import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

    if (status && (PAYMENT_STATUSES as readonly string[]).includes(status)) {
      conditions.push("p.payment_status = ?");
      params.push(status);
    }

    if (date === "today") {
      conditions.push("DATE(p.created_at) = ?");
      params.push(todayString());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.payment_id, p.order_id, p.amount, p.payment_method, p.payment_status,
              DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i:%s') AS payment_date,
              p.created_at,
              o.order_reference, c.name AS customer_name
       FROM payments p
       JOIN laundry_orders o ON o.order_id = p.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       ${where}
       ORDER BY p.payment_id DESC`,
      params
    );
    return NextResponse.json({ success: true, payments: rows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch payments." }, { status: 500 });
  }
}