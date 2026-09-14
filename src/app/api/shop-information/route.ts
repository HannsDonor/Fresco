import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return minute === "00" ? `${hour} ${period}` : `${hour}:${minute} ${period}`;
}

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT shop_id, shop_name, phone, email, address,
              monday_open, monday_close, tuesday_open, tuesday_close,
              wednesday_open, wednesday_close, thursday_open, thursday_close,
              friday_open, friday_close, saturday_open, saturday_close,
              sunday_open, sunday_close
       FROM shop_information
       LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No shop information available." },
        { status: 404 }
      );
    }

    const row = rows[0];
    const data: Record<string, string | null> = {
      shop_id: row.shop_id,
      shop_name: row.shop_name,
      phone: row.phone,
      email: row.email,
      address: row.address,
    };

    for (const day of DAYS) {
      const open = formatTime(row[`${day}_open`]);
      const close = formatTime(row[`${day}_close`]);
      data[`${day}_hours`] = open && close ? `${open} – ${close}` : null;
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load shop information. Please try again later." },
      { status: 500 }
    );
  }
}