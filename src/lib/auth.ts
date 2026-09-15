import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fresco_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionPayload {
  admin_id: number;
  name: string;
  username: string;
  exp: number;
}

function secret(): string {
  return process.env.SESSION_SECRET ?? "fresco-local-dev-secret-change-me";
}

function signData(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createSessionToken(admin: {
  admin_id: number;
  name: string;
  username: string;
}): string {
  const payload = toBase64Url(
    JSON.stringify({
      admin_id: admin.admin_id,
      name: admin.name,
      username: admin.username,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    })
  );
  return `${payload}.${signData(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = signData(payload);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length) return null;
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  try {
    const data = JSON.parse(fromBase64Url(payload)) as SessionPayload;
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (!Number.isInteger(data.admin_id) || !data.name || !data.username) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}