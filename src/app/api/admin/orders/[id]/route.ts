import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { LAUNDRY_STATUSES } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]">
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

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.order_id, o.order_reference, o.tracking_token, o.service_id,
              o.item_count, o.estimated_weight, o.load_type, o.special_instructions,
              DATE_FORMAT(o.pickup_date, '%Y-%m-%d') AS pickup_date,
              DATE_FORMAT(o.pickup_time, '%H:%i') AS pickup_time,
              o.order_status, o.total_amount, o.created_at, o.updated_at,
              c.customer_id, c.name AS customer_name, c.phone AS customer_phone,
              c.email AS customer_email, c.address AS customer_address,
              s.name AS service_name, s.description AS service_description,
              s.starting_price AS service_starting_price,
              (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.order_id = o.order_id) AS total_paid,
              (SELECT p.payment_status FROM payments p WHERE p.order_id = o.order_id ORDER BY p.payment_id DESC LIMIT 1) AS payment_status,
              (SELECT p.payment_method FROM payments p WHERE p.order_id = o.order_id ORDER BY p.payment_id DESC LIMIT 1) AS payment_method
       FROM laundry_orders o
       JOIN customers c ON c.customer_id = o.customer_id
       JOIN services_offered s ON s.service_id = o.service_id
       WHERE o.order_id = ?
       LIMIT 1`,
      [orderId]
    );

    const order = rows[0];
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const [payments] = await pool.query<RowDataPacket[]>(
      `SELECT payment_id, order_id, amount, payment_method, payment_status, payment_date
       FROM payments
       WHERE order_id = ?
       ORDER BY payment_id ASC`,
      [orderId]
    );

    const [timeline] = await pool.query<RowDataPacket[]>(
      `SELECT status_id, order_id, status, note, updated_at
       FROM order_status_history
       WHERE order_id = ?
       ORDER BY status_id ASC`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      order: { ...order, payments, timeline },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch order." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

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
      const [currentRows] = await connection.execute<RowDataPacket[]>(
        "SELECT order_status FROM laundry_orders WHERE order_id = ?",
        [orderId]
      );

      const currentRow = currentRows[0];
      if (!currentRow) {
        await connection.rollback();
        return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
      }

      const currentStatus = currentRow.order_status as string;
      const decisionStatuses = new Set(["Accepted", "Rejected"]);

      if (order_status === "Pending") {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: 'Cannot revert an order back to "Pending".' },
          { status: 400 }
        );
      }

      if (currentStatus === "Pending" && !decisionStatuses.has(order_status)) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: "Accept or reject the order before updating its status." },
          { status: 400 }
        );
      }

      if (currentStatus !== "Pending" && decisionStatuses.has(order_status)) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: "This order has already been reviewed." },
          { status: 400 }
        );
      }

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