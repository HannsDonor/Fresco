import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT service_id, name, description, starting_price, icon
       FROM services_offered
       WHERE is_active = TRUE
       ORDER BY service_id ASC`
    );
    return NextResponse.json({ success: true, services: rows });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load services. Please try again later." },
      { status: 500 }
    );
  }
}