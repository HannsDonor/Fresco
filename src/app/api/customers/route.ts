import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT customer_id, name, phone, address, created_at FROM customers ORDER BY created_at DESC"
    );
    return NextResponse.json({ success: true, customers: rows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch customers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, phone, address } = body ?? {};
  if (!name || !phone) {
    return NextResponse.json({ error: "Missing required fields: name, phone." }, { status: 400 });
  }

  const phoneDigits = phone.replace(/\D/g, "");
  const normalizedPhone = /^63[0-9]{10}$/.test(phoneDigits)
    ? `+63${phoneDigits.slice(2)}`
    : /^09[0-9]{9}$/.test(phoneDigits)
      ? `+63${phoneDigits.slice(1)}`
      : phone.trim();

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)",
      [name, normalizedPhone, address ?? null]
    );
    return NextResponse.json({ success: true, customer_id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create customer." }, { status: 500 });
  }
}