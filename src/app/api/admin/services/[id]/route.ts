import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { SERVICE_ICONS } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/services/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const serviceId = Number(id);
  if (!Number.isInteger(serviceId)) {
    return NextResponse.json({ error: "Invalid service id." }, { status: 400 });
  }

  let body: ServicePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updates: string[] = [];
  const params: Array<string | number | null> = [];

  if (body?.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Service name is required." }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Service name must be 100 characters or fewer." },
        { status: 400 }
      );
    }
    updates.push("name = ?");
    params.push(name);
  }

  if (body?.description !== undefined) {
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    updates.push("description = ?");
    params.push(description);
  }

  if (body?.starting_price !== undefined) {
    const price = parsePrice(body.starting_price);
    if (price === null) {
      return NextResponse.json(
        { error: "Starting price must be a valid amount." },
        { status: 400 }
      );
    }
    updates.push("starting_price = ?");
    params.push(price);
  }

  if (body?.icon !== undefined) {
    const icon =
      typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : null;
    if (icon && !SERVICE_ICONS.includes(icon as never)) {
      return NextResponse.json({ error: "Invalid icon." }, { status: 400 });
    }
    updates.push("icon = ?");
    params.push(icon);
  }

  if (body?.is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(body.is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT name FROM services_offered WHERE service_id = ? LIMIT 1",
      [serviceId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Service not found." },
        { status: 404 }
      );
    }

    const nameIndex = updates.indexOf("name = ?");
    if (nameIndex !== -1) {
      const newName = String(params[nameIndex]);
      if (newName.toLowerCase() !== String(existing[0].name).toLowerCase()) {
        const [duplicate] = await pool.query<RowDataPacket[]>(
          "SELECT service_id FROM services_offered WHERE LOWER(name) = LOWER(?) AND service_id <> ? LIMIT 1",
          [newName, serviceId]
        );
        if (duplicate.length > 0) {
          return status409("A service with this name already exists.");
        }
      }
    }

    params.push(serviceId);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE services_offered SET ${updates.join(", ")} WHERE service_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Service not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, service_id: serviceId });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update service." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/services/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const serviceId = Number(id);
  if (!Number.isInteger(serviceId)) {
    return NextResponse.json({ error: "Invalid service id." }, { status: 400 });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM services_offered WHERE service_id = ?",
      [serviceId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Service not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, service_id: serviceId });
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ER_ROW_IS_REFERENCED_2") {
      return status409(
        "This service is used by existing orders and cannot be deleted. Set it to inactive instead."
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete service." },
      { status: 500 }
    );
  }
}