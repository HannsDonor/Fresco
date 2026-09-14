import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { LOAD_TYPES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function generateTrackingToken(): string {
  const bytes = randomBytes(6);
  let token = "TRK-";
  for (const byte of bytes) {
    token += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
  }
  return token;
}

export async function POST(request: Request) {
  let body: {
    name?: unknown;
    phone?: unknown;
    email?: unknown;
    address?: unknown;
    service_id?: unknown;
    item_count?: unknown;
    estimated_weight?: unknown;
    load_type?: unknown;
    special_instructions?: unknown;
    pickup_date?: unknown;
    pickup_time?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const instructions =
    typeof body?.special_instructions === "string" ? body.special_instructions.trim() : "";

  if (!name || !phone || !email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { success: false, error: "Please provide your full name, contact number, and a valid email address." },
      { status: 400 }
    );
  }

  const serviceId = Number(body?.service_id);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ success: false, error: "Please select a valid service." }, { status: 400 });
  }

  const itemCount = Number(body?.item_count);
  if (!Number.isInteger(itemCount) || itemCount <= 0) {
    return NextResponse.json(
      { success: false, error: "Number of items must be a whole number greater than 0." },
      { status: 400 }
    );
  }

  const loadType = typeof body?.load_type === "string" ? body.load_type : "";
  if (!(LOAD_TYPES as readonly string[]).includes(loadType)) {
    return NextResponse.json(
      { success: false, error: "Please select a load type: Small, Medium, or Large." },
      { status: 400 }
    );
  }

  const pickupDate = typeof body?.pickup_date === "string" ? body.pickup_date : "";
  const pickupTime = typeof body?.pickup_time === "string" ? body.pickup_time : "";
  if (!DATE_PATTERN.test(pickupDate) || !TIME_PATTERN.test(pickupTime)) {
    return NextResponse.json(
      { success: false, error: "Please provide a valid pickup date and time." },
      { status: 400 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chosenDate = new Date(`${pickupDate}T00:00:00`);
  if (chosenDate < today) {
    return NextResponse.json(
      { success: false, error: "Pickup date cannot be in the past." },
      { status: 400 }
    );
  }

  let estimatedWeight: number | null = null;
  if (
    body?.estimated_weight !== undefined &&
    body?.estimated_weight !== null &&
    body?.estimated_weight !== ""
  ) {
    estimatedWeight = Number(body.estimated_weight);
    if (Number.isNaN(estimatedWeight) || estimatedWeight < 0) {
      return NextResponse.json(
        { success: false, error: "Estimated weight must be a valid number." },
        { status: 400 }
      );
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [serviceRows] = await connection.execute<RowDataPacket[]>(
      `SELECT service_id, name, starting_price
       FROM services_offered
       WHERE service_id = ? AND is_active = TRUE
       LIMIT 1`,
      [serviceId]
    );

    if (!serviceRows[0]) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "The selected service is no longer available." },
        { status: 400 }
      );
    }

    const service = serviceRows[0];
    const totalAmount = Number(service.starting_price);

    const [customerRows] = await connection.execute<RowDataPacket[]>(
      "SELECT customer_id FROM customers WHERE phone = ? LIMIT 1",
      [phone]
    );

    let customerId: number;
    if (customerRows[0]) {
      customerId = customerRows[0].customer_id;
      await connection.execute(
        "UPDATE customers SET name = ?, email = ? WHERE customer_id = ?",
        [name, email, customerId]
      );
      if (address) {
        await connection.execute(
          "UPDATE customers SET address = ? WHERE customer_id = ?",
          [address, customerId]
        );
      }
    } else {
      const [customerResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
        [name, phone, email, address || null]
      );
      customerId = customerResult.insertId;
    }

    const [referenceRows] = await connection.execute<RowDataPacket[]>(
      `SELECT order_reference
       FROM laundry_orders
       WHERE order_reference LIKE 'FRC-%'
       ORDER BY order_reference DESC
       LIMIT 1`
    );

    let sequence = 1;
    if (referenceRows[0]) {
      const match = /^FRC-(\d+)$/.exec(referenceRows[0].order_reference);
      if (match) {
        sequence = Number(match[1]) + 1;
      }
    }
    const orderReference = `FRC-${String(sequence).padStart(4, "0")}`;

    let trackingToken = generateTrackingToken();
    for (let attempt = 0; attempt < 8; attempt++) {
      const [duplicateRows] = await connection.execute<RowDataPacket[]>(
        "SELECT tracking_token FROM laundry_orders WHERE tracking_token = ? LIMIT 1",
        [trackingToken]
      );
      if (duplicateRows.length === 0) break;
      trackingToken = generateTrackingToken();
    }

    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO laundry_orders
        (customer_id, order_reference, tracking_token, service_id, item_count,
         estimated_weight, load_type, special_instructions, pickup_date,
         pickup_time, order_status, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [
        customerId,
        orderReference,
        trackingToken,
        serviceId,
        itemCount,
        estimatedWeight,
        loadType,
        instructions || null,
        pickupDate,
        pickupTime,
        totalAmount,
      ]
    );
    const orderId = orderResult.insertId;

    await connection.execute(
      "INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'Pending', ?)",
      [orderId, "Laundry request submitted by customer."]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        order_id: orderId,
        order_reference: orderReference,
        tracking_token: trackingToken,
        total_amount: totalAmount,
        tracking_url: `/track/${trackingToken}`,
      },
      { status: 201 }
    );
  } catch {
    await connection.rollback();
    return NextResponse.json(
      { success: false, error: "We couldn't submit your request. Please try again." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}