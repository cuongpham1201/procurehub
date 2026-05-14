type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
};

const INTERNAL_SESSION_KEY = "procurehub_current_internal_user";
const SUPPLIER_SESSION_KEY = "procurehub_current_supplier";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || body.error) {
    throw new Error(body.error ?? `API request failed with ${response.status}`);
  }
  return body.data as T;
}

function getActorHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const internalRaw = localStorage.getItem(INTERNAL_SESSION_KEY);
    if (internalRaw) {
      const internal = JSON.parse(internalRaw) as {
        id?: string;
        fullName?: string;
        name?: string;
        email?: string;
      };
      return {
        "x-actor-type": "internal_user",
        "x-actor-id": internal.id ?? "",
        "x-actor-name": internal.fullName ?? internal.name ?? "",
        "x-actor-email": internal.email ?? "",
      };
    }

    const supplierRaw = localStorage.getItem(SUPPLIER_SESSION_KEY);
    if (supplierRaw) {
      const supplier = JSON.parse(supplierRaw) as {
        id?: string;
        companyName?: string;
        email?: string;
      };
      return {
        "x-actor-type": "supplier",
        "x-actor-id": supplier.id ?? "",
        "x-actor-name": supplier.companyName ?? "",
        "x-actor-email": supplier.email ?? "",
      };
    }
  } catch {
    return {};
  }

  return {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    headers: getActorHeaders(),
  });
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getActorHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<T>(response);
}

export async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getActorHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "DELETE",
    headers: getActorHeaders(),
  });
  return parseResponse<T>(response);
}
