import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { SERVICE_ICONS } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SERVICE_SELECT = `
SELECT s.service_id, s.name, s.description, s.starting_price, s.icon, s.is_active,
       s.created_at, s.updated_at,
       (SELECT COUNT(*) FROM laundry_orders o WHERE o.service_id = s.service_id) AS order_count
FROM services_offered s
`;

interface ServicePayload {
  name?: string;
  description?: string | null;
  starting_price?: number | string;
  icon?: string | null;
  is_active?: boolean;
}

function parsePrice(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0 || price > 999999.99) return null;
  return price;
}

function status409(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 409 });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `${SERVICE_SELECT} ORDER BY s.service_id ASC`
    );
    return NextResponse.json({ success: true, services: rows });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch services." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: ServicePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Service name is required." }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json(
      { error: "Service name must be 100 characters or fewer." },
      { status: 400 }
    );
  }

  const price = parsePrice(body?.starting_price);
  if (price === null) {
    return NextResponse.json(
      { error: "A valid starting price is required." },
      { status: 400 }
    );
  }

  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;
  const icon =
    typeof body?.icon === "string" && body.icon.trim() ? body.icon.trim() : null;
  if (icon && !SERVICE_ICONS.includes(icon as never)) {
    return NextResponse.json({ error: "Invalid icon." }, { status: 400 });
  }
  const isActive = body?.is_active !== false;

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT service_id FROM services_offered WHERE LOWER(name) = LOWER(?) LIMIT 1",
      [name]
    );
    if (existing.length > 0) {
      return status409("A service with this name already exists.");
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO services_offered (name, description, starting_price, icon, is_active) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, icon, isActive ? 1 : 0]
    );

    return NextResponse.json({ success: true, service_id: result.insertId });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to add service." },
      { status: 500 }
    );
  }
}