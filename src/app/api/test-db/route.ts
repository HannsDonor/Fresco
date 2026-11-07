import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed. Check the database environment variables and network access.",
      },
      { status: 500 }
    );
  }
}
