import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { SHOP_DAYS, type ShopDay } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

interface HoursDay {
  open?: string | null;
  close?: string | null;
}

interface Payload {
  shop_name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hours?: Partial<Record<ShopDay, HoursDay>>;
}

const SELECT_COLUMNS = SHOP_DAYS.map((day) => `${day}_open, ${day}_close`).join(", ");

function normalizeTime(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  return TIME_PATTERN.test(text) ? text : "INVALID";
}

function buildHours(row: RowDataPacket): Record<ShopDay, { open: string; close: string }> {
  const hours = {} as Record<ShopDay, { open: string; close: string }>;
  for (const day of SHOP_DAYS) {
    const open = row[`${day}_open`];
    const close = row[`${day}_close`];
    hours[day] = {
      open: open ? String(open).slice(0, 5) : "",
      close: close ? String(close).slice(0, 5) : "",
    };
  }
  return hours;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT shop_id, shop_name, phone, email, address, ${SELECT_COLUMNS}
       FROM shop_information
       LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Shop information not found." },
        { status: 404 }
      );
    }

    const row = rows[0];
    return NextResponse.json({
      success: true,
      data: {
        shop_id: row.shop_id,
        shop_name: row.shop_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        hours: buildHours(row),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load shop information." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updates: string[] = [];
  const params: Array<string | null> = [];

  if (body?.shop_name !== undefined) {
    const value = typeof body.shop_name === "string" ? body.shop_name.trim() : "";
    if (!value) {
      return NextResponse.json({ error: "Shop name is required." }, { status: 400 });
    }
    if (value.length > 150) {
      return NextResponse.json(
        { error: "Shop name must be 150 characters or fewer." },
        { status: 400 }
      );
    }
    updates.push("shop_name = ?");
    params.push(value);
  }

  if (body?.phone !== undefined) {
    const value = typeof body.phone === "string" ? body.phone.trim() : null;
    if (value && value.length > 50) {
      return NextResponse.json(
        { error: "Phone must be 50 characters or fewer." },
        { status: 400 }
      );
    }
    updates.push("phone = ?");
    params.push(value || null);
  }

  if (body?.email !== undefined) {
    const value = typeof body.email === "string" ? body.email.trim() : null;
    if (value && value.length > 150) {
      return NextResponse.json(
        { error: "Email must be 150 characters or fewer." },
        { status: 400 }
      );
    }
    updates.push("email = ?");
    params.push(value || null);
  }

  if (body?.address !== undefined) {
    const value = typeof body.address === "string" ? body.address.trim() : null;
    updates.push("address = ?");
    params.push(value || null);
  }

  if (body?.hours !== undefined && body.hours !== null) {
    for (const day of SHOP_DAYS) {
      const pair = body.hours[day];
      if (pair === undefined || pair === null) continue;
      const open = normalizeTime(pair.open);
      const close = normalizeTime(pair.close);
      if (open === "INVALID" || close === "INVALID") {
        return NextResponse.json(
          { error: "Operating hours must use a valid 24-hour time (HH:MM)." },
          { status: 400 }
        );
      }
      updates.push(`${day}_open = ?`);
      params.push(open);
      updates.push(`${day}_close = ?`);
      params.push(close);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT shop_id FROM shop_information ORDER BY shop_id ASC LIMIT 1"
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Shop information not found." },
        { status: 404 }
      );
    }
    const shopId = Number(rows[0].shop_id);

    params.push(String(shopId));
    await pool.execute(
      `UPDATE shop_information SET ${updates.join(", ")} WHERE shop_id = ?`,
      params
    );

    return NextResponse.json({ success: true, shop_id: shopId });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update shop information." },
      { status: 500 }
    );
  }
}