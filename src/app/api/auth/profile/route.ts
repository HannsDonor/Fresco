import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import {
  createSessionToken,
  getSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

interface AdminRow extends RowDataPacket {
  admin_id: number;
  name: string;
  username: string;
  password: string;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    admin: { admin_id: session.admin_id, name: session.name, username: session.username },
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: {
    name?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!name) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Full name must be 100 characters or fewer." }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }
  if (username.length > 50) {
    return NextResponse.json({ error: "Username must be 50 characters or fewer." }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain letters, numbers, and _ . -" },
      { status: 400 }
    );
  }
  if (!currentPassword) {
    return NextResponse.json({ error: "Enter your current password to save changes." }, { status: 400 });
  }
  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }
  }

  try {
    const [rows] = await pool.execute<AdminRow[]>(
      "SELECT admin_id, name, username, password FROM admins WHERE admin_id = ?",
      [session.admin_id]
    );
    const admin = rows[0];
    if (!admin) {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const [takenRows] = await pool.execute<RowDataPacket[]>(
      "SELECT admin_id FROM admins WHERE username = ? AND admin_id <> ?",
      [username, session.admin_id]
    );
    if (takenRows.length > 0) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 400 });
    }

    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.execute<ResultSetHeader>(
        "UPDATE admins SET name = ?, username = ?, password = ? WHERE admin_id = ?",
        [name, username, hash, session.admin_id]
      );
    } else {
      await pool.execute<ResultSetHeader>(
        "UPDATE admins SET name = ?, username = ? WHERE admin_id = ?",
        [name, username, session.admin_id]
      );
    }

    const token = createSessionToken({
      admin_id: session.admin_id,
      name,
      username,
    });
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({
      success: true,
      admin: { admin_id: session.admin_id, name, username },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}