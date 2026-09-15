import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/payments/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const paymentId = Number(id);

  if (!Number.isInteger(paymentId)) {
    return NextResponse.json({ success: false, error: "Invalid payment id." }, { status: 400 });
  }

  let body: { payment_status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { payment_status } = body ?? {};

  if (
    payment_status === undefined ||
    !(PAYMENT_STATUSES as readonly string[]).includes(payment_status)
  ) {
    return NextResponse.json(
      { success: false, error: `Invalid status. Allowed: ${PAYMENT_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const payment_date = payment_status === "Paid" ? new Date() : null;

  try {
    const [updateResult] = await pool.execute<ResultSetHeader>(
      "UPDATE payments SET payment_status = ?, payment_date = ? WHERE payment_id = ?",
      [payment_status, payment_date, paymentId]
    );

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Payment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, payment_id: paymentId });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update payment." },
      { status: 500 }
    );
  }
}