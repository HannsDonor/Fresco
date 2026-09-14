import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { LAUNDRY_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]">
) {
  const { id } = await ctx.params;

  let body: { order_status?: string; note?: string; pickup_date?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  const { order_status, pickup_date } = body ?? {};
  const note =
    typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;

  if (order_status !== undefined && !LAUNDRY_STATUSES.includes(order_status as never)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${LAUNDRY_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (order_status !== undefined) {
      const [updateResult] = await connection.execute<ResultSetHeader>(
        "UPDATE laundry_orders SET order_status = ? WHERE order_id = ?",
        [order_status, orderId]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
      }

      await connection.execute(
        "INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)",
        [orderId, order_status, note]
      );
    }

    if (pickup_date !== undefined) {
      await connection.execute("UPDATE laundry_orders SET pickup_date = ? WHERE order_id = ?", [
        pickup_date || null,
        orderId,
      ]);
    }

    await connection.commit();

    return NextResponse.json({ success: true, order_id: orderId });
  } catch {
    await connection.rollback();
    return NextResponse.json({ success: false, error: "Failed to update order." }, { status: 500 });
  } finally {
    connection.release();
  }
}