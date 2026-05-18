export class FetchJsonError<TData = unknown> extends Error {
  status: number;
  data: TData | undefined;

  constructor(status: number, data?: TData) {
    super(`Request failed: ${status}`);
    this.name = "FetchJsonError";
    this.status = status;
    this.data = data;
  }
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let data: unknown;

    try {
      data = await response.json();
    } catch {
      data = undefined;
    }

    throw new FetchJsonError(response.status, data);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
