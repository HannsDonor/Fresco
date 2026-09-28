import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "gcash");
const PUBLIC_PREFIX = "/images/gcash/";
const MAX_BYTES = 2 * 1024 * 1024;
const GENERATED_FILE_PATTERN = /^qrcode-\d+\.[a-z0-9]+$/i;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

async function readStoredPath(): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT gcash_qr_path FROM shop_information ORDER BY shop_id ASC LIMIT 1"
  );
  const value = rows[0]?.gcash_qr_path;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function removeStoredFile(publicPath: string | null) {
  if (!publicPath || !publicPath.startsWith(PUBLIC_PREFIX)) return;
  const filename = publicPath.slice(PUBLIC_PREFIX.length);
  if (!GENERATED_FILE_PATTERN.test(filename)) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // File already gone — nothing to clean up.
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = form.get("file") as { arrayBuffer?: () => Promise<ArrayBuffer>; size?: number; type?: string } | null;
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No image file was uploaded." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[String(file.type ?? "")];
  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported image type. Use a PNG, JPG, or WEBP file." },
      { status: 400 }
    );
  }

  if (typeof file.size === "number" && file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. The maximum size is 2 MB." },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "The uploaded image is empty." }, { status: 400 });
  }

  const previous = await readStoredPath();
  const filename = `qrcode-${Date.now()}.${extension}`;
  const publicPath = `${PUBLIC_PREFIX}${filename}`;

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
    await pool.execute(
      "UPDATE shop_information SET gcash_qr_path = ? ORDER BY shop_id ASC LIMIT 1",
      [publicPath]
    );
    await removeStoredFile(previous);
  } catch {
    return NextResponse.json(
      { error: "Failed to save the GCash QR code." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, gcash_qr_path: publicPath });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const previous = await readStoredPath();
  try {
    await pool.execute(
      "UPDATE shop_information SET gcash_qr_path = NULL ORDER BY shop_id ASC LIMIT 1"
    );
    await removeStoredFile(previous);
  } catch {
    return NextResponse.json(
      { error: "Failed to remove the GCash QR code." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, gcash_qr_path: null });
}
