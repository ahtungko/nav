import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { IndexRoute, PublicRouteErrorBoundary, publicSnapshotLoader } from "../../src/routes/index";

const snapshot = {
  version: 1 as const,
  publishedAt: "2026-05-18T00:00:00.000Z",
  categories: [{ id: "c1", name: "AI", slug: "ai", iconKey: "ai", sortOrder: 1 }],
  websites: [
    {
      id: "w1",
      title: "ChatGPT",
      url: "https://chatgpt.com",
      categoryId: "c1",
      sortOrder: 1,
      createdAt: "2026-05-18T00:00:00.000Z",
    },
  ],
};

describe("publicSnapshotLoader", () => {
  it("loads and returns the published snapshot from the public API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const loaderArgs = {
      request: new Request("https://example.com/"),
      params: {},
      context: undefined,
      url: new URL("https://example.com/"),
      pattern: "/",
    } as unknown as Parameters<typeof publicSnapshotLoader>[0];

    const result = await publicSnapshotLoader(loaderArgs);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://example.com/api/public/site");
    expect(result).toEqual(snapshot);
  });

  it("renders the route error boundary when the public API returns invalid snapshot data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ version: 2 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const router = createMemoryRouter(
      [
        {
          path: "/",
          loader: publicSnapshotLoader,
          element: <IndexRoute />,
          errorElement: <PublicRouteErrorBoundary />,
        },
      ],
      { initialEntries: ["/"] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Unable to load the public directory")).toBeInTheDocument();
    expect(screen.getByText("Received an invalid published snapshot.")).toBeInTheDocument();
  });
});
