export function ok<T>(data: T) {
  return Response.json({ data, error: null });
}

export function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return Response.json({ data: null, error: message }, { status });
}
