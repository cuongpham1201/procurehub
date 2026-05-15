import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, type SessionPayload } from "./session";

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireInternalUser(): Promise<SessionPayload> {
  const session = await getServerSession();
  if (!session || session.kind !== "internal") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireSupplier(): Promise<SessionPayload> {
  const session = await getServerSession();
  if (!session || session.kind !== "supplier") {
    throw new Error("Unauthorized");
  }
  return session;
}
