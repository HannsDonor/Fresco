import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { PAYMENT_METHODS } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PAYMENT_STATUSES = ["Pending", "Paid"] as const;

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]/payment">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ success: false, error: "Invalid order id." }, { status: 400 });
  }

  let body: { amount?: number; payment_method?: string; payment_status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { amount, payment_method, payment_status } = body ?? {};

  if (
    amount !== undefined &&
    (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)
  ) {
    return NextResponse.json(
      { success: false, error: "Amount must be a positive number." },
      { status: 400 }
    );
  }

  if (payment_method !== undefined && !PAYMENT_METHODS.includes(payment_method as never)) {
    return NextResponse.json(
      { success: false, error: `Invalid payment method. Allowed: ${PAYMENT_METHODS.join(", ")}.` },
      { status: 400 }
    );
  }

  if (payment_status !== undefined && !PAYMENT_STATUSES.includes(payment_status as never)) {
    return NextResponse.json(
      { success: false, error: `Invalid payment status. Allowed: ${PAYMENT_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  if (amount === undefined && payment_method === undefined && payment_status === undefined) {
    return NextResponse.json(
      { success: false, error: "Nothing to update. Provide amount, payment_method, or payment_status." },
      { status: 400 }
    );
  }

  try {
    const [orderRows] = await pool.query<RowDataPacket[]>(
      "SELECT order_id FROM laundry_orders WHERE order_id = ?",
      [orderId]
    );
    if (orderRows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const [paymentRows] = await pool.query<RowDataPacket[]>(
      "SELECT payment_id, payment_status, payment_date FROM payments WHERE order_id = ? ORDER BY payment_id DESC LIMIT 1",
      [orderId]
    );
    const existing = paymentRows[0] as
      | { payment_id: number; payment_status: string; payment_date: string | null }
      | undefined;

    if (existing) {
      const updates: string[] = [];
      const values: (string | number | Date | null)[] = [];

      if (amount !== undefined) {
        updates.push("amount = ?");
        values.push(amount);
      }
      if (payment_method !== undefined) {
        updates.push("payment_method = ?");
        values.push(payment_method);
      }
      if (payment_status !== undefined) {
        updates.push("payment_status = ?");
        values.push(payment_status);
        const date = payment_status === "Paid" ? new Date() : null;
        updates.push("payment_date = ?");
        values.push(date);
      }

      values.push(existing.payment_id);
      await pool.execute<ResultSetHeader>(
        `UPDATE payments SET ${updates.join(", ")} WHERE payment_id = ?`,
        values
      );
    } else {
      const finalMethod = payment_method ?? "Cash";
      const finalStatus = payment_status ?? "Pending";
      const finalAmount = amount ?? 0;
      const paymentDate = finalStatus === "Paid" ? new Date() : null;

      await pool.execute<ResultSetHeader>(
        "INSERT INTO payments (order_id, amount, payment_method, payment_status, payment_date) VALUES (?, ?, ?, ?, ?)",
        [orderId, finalAmount, finalMethod, finalStatus, paymentDate]
      );
    }

    return NextResponse.json({ success: true, order_id: orderId });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update payment." },
      { status: 500 }
    );
  }
}