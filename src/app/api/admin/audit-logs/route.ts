import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? 25);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 25;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.audit_id, a.action, a.table_name, a.order_reference, a.details, a.created_at,
              a.admin_id, ad.name AS admin_name, ad.username AS admin_username
       FROM audit_logs a
       JOIN admins ad ON ad.admin_id = a.admin_id
       ORDER BY a.created_at DESC, a.audit_id DESC
       LIMIT ${limit}`
    );

    return NextResponse.json({ success: true, logs: rows });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load audit history." },
      { status: 500 }
    );
  }
}
