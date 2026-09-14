import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

interface AdminRow extends RowDataPacket {
  admin_id: number;
  name: string;
  username: string;
  password: string;
}

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { username, password } = body ?? {};
  if (!username || !password) {
    return NextResponse.json({ error: "Missing username or password." }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute<AdminRow[]>(
      "SELECT admin_id, name, username, password FROM admins WHERE username = ?",
      [username]
    );

    const admin = rows[0];
    if (!admin) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      admin: { admin_id: admin.admin_id, name: admin.name, username: admin.username },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Login failed." }, { status: 500 });
  }
}