export function ok<T>(data: T) {
  return Response.json({ data, error: null });
}

export function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return Response.json({ data: null, error: message }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return Response.json({ data: null, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return Response.json({ data: null, error: message }, { status: 403 });
}

export function badRequest(message = "Bad Request") {
  return Response.json({ data: null, error: message }, { status: 400 });
}
