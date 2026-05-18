import { useLoaderData, useRouteError, isRouteErrorResponse, type LoaderFunctionArgs } from "react-router-dom";
import { z } from "zod";
import { HomePage } from "../app/public/HomePage";
import { AppShell } from "../components/layout/AppShell";
import { ThemeToggle } from "../components/public/ThemeToggle";
import { publishedSnapshotSchema } from "../types/snapshot";

const PUBLIC_SNAPSHOT_PATH = "/api/public/site";
const genericPublicLoadError = "Unable to load the public snapshot.";
const invalidSnapshotError = "Received an invalid published snapshot.";

export async function publicSnapshotLoader({ request }: LoaderFunctionArgs) {
  const response = await fetch(new URL(PUBLIC_SNAPSHOT_PATH, request.url).toString(), {
    signal: request.signal,
  });

  if (!response.ok) {
    throw new Response(response.status === 503 ? "Published snapshot not available yet." : genericPublicLoadError, {
      status: response.status,
      statusText: response.statusText,
    });
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Response(invalidSnapshotError, { status: 502, statusText: "Bad Gateway" });
  }

  try {
    return publishedSnapshotSchema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Response(invalidSnapshotError, { status: 502, statusText: "Bad Gateway" });
    }

    throw error;
  }
}

export function IndexRoute() {
  const snapshot = useLoaderData<typeof publicSnapshotLoader>();
  return <HomePage snapshot={snapshot} />;
}

export function PublicRouteErrorBoundary() {
  const error = useRouteError();

  let message = genericPublicLoadError;

  if (isRouteErrorResponse(error)) {
    message = typeof error.data === "string" ? error.data : message;
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <AppShell topBarTools={<ThemeToggle />}>
      <section className="status-panel" aria-live="polite">
        <div className="status-panel__inner">
          <h1>Unable to load the public directory</h1>
          <p>{message}</p>
        </div>
      </section>
    </AppShell>
  );
}
