import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT customer_id, name, phone, email, address, created_at FROM customers ORDER BY created_at DESC"
    );
    return NextResponse.json({ success: true, customers: rows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch customers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; email?: string; address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, phone, email, address } = body ?? {};
  if (!name || !phone || !email) {
    return NextResponse.json({ error: "Missing required fields: name, phone, email." }, { status: 400 });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
      [name, phone, email, address ?? null]
    );
    return NextResponse.json({ success: true, customer_id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create customer." }, { status: 500 });
  }
}