// All API calls include cookies automatically (same-origin fetch).
// Actor identity for activity logs is resolved server-side via the JWT session cookie.

type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || body.error) {
    throw new Error(body.error ?? `API request failed with ${response.status}`);
  }
  return body.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<T>(response);
}

export async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: "DELETE" });
  return parseResponse<T>(response);
}
