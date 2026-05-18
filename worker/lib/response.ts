export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

export function noContent(headers?: HeadersInit): Response {
  return new Response(null, { status: 204, headers });
}
