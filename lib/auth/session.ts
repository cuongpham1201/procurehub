import { SignJWT, jwtVerify } from "jose";
import { type ResponseCookies } from "next/dist/server/web/spec-extension/cookies";

export const COOKIE_NAME = "ph_auth";
const EXPIRY = "8h";
const EXPIRY_SECONDS = 8 * 60 * 60;

export interface SessionPayload {
  sub: string;
  kind: "internal" | "supplier";
  role: string;
  name: string;
  email: string | null;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(
  cookies: Pick<ResponseCookies, "set">,
  token: string,
): void {
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRY_SECONDS,
  });
}

export function clearSessionCookie(cookies: Pick<ResponseCookies, "set">): void {
  cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
