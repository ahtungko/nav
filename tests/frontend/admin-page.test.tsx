import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminRoute } from "../../src/routes/admin";

afterEach(() => {
  vi.unstubAllGlobals();
});

const categories = [
  {
    id: "cat_zeta",
    name: "Alpha Category",
    slug: "alpha",
    iconKey: "alpha",
    sortOrder: 1,
    isVisible: true,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  },
  {
    id: "cat_alpha",
    name: "Beta Category",
    slug: "beta",
    iconKey: "beta",
    sortOrder: 2,
    isVisible: true,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  },
];

const websites = [
  {
    id: "site_beta",
    title: "Beta Site",
    url: "https://beta.example.com",
    categoryId: "cat_alpha",
    sortOrder: 1,
    isVisible: true,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  },
  {
    id: "site_alpha",
    title: "Alpha Site",
    url: "https://alpha.example.com",
    categoryId: "cat_zeta",
    sortOrder: 1,
    isVisible: true,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  },
];

function renderAdminRoute() {
  const router = createMemoryRouter([{ path: "/admin", element: <AdminRoute /> }], {
    initialEntries: ["/admin"],
  });

  render(<RouterProvider router={router} />);
}

describe("AdminRoute", () => {
  it("shows login first, then renders the command center and selection-aware editors after a successful login", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "/api/admin/categories" && !init?.method) {
        if (fetchMock.mock.calls.filter(([called]) => {
          const calledUrl = typeof called === "string" ? called : called instanceof URL ? called.toString() : called.url;
          return calledUrl === "/api/auth/login";
        }).length === 0) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
        }

        return new Response(JSON.stringify(categories), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (url === "/api/admin/websites" && !init?.method) {
        return new Response(JSON.stringify(websites), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (url === "/api/auth/login" && init?.method === "POST") {
        return new Response(null, { status: 204 });
      }

      throw new Error(`Unexpected fetch: ${String(url)}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderAdminRoute();

    expect(await screen.findByLabelText(/password/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByRole("heading", { name: /draft command center/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /theme mode/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Overview$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Categories$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Websites$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Publish$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /^Categories$/i }));
    expect(await screen.findByRole("heading", { name: /^Create category$/i })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /category icon/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/icon key/i)).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /ai/i })).toBeInTheDocument();

    const categoryEditButtons = await screen.findAllByRole("button", { name: /^Edit$/i });
    fireEvent.click(categoryEditButtons[0]!);

    expect(screen.getByRole("heading", { name: /editing alpha category/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alpha Category")).toBeInTheDocument();
    expect(screen.getByText("Alpha Category").closest("tr")).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: /^Websites$/i }));
    expect(await screen.findByRole("heading", { name: /^Create website$/i })).toBeInTheDocument();

    const websiteEditButtons = await screen.findAllByRole("button", { name: /^Edit$/i });
    fireEvent.click(websiteEditButtons[0]!);

    expect(screen.getByRole("heading", { name: /editing alpha site/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://alpha.example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /^Publish$/i }));
    expect(await screen.findByRole("heading", { name: /release draft snapshot/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows a credential-specific error for a bad password", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "/api/admin/categories" && !init?.method) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      if (url === "/api/auth/login" && init?.method === "POST") {
        return new Response(JSON.stringify({ error: "invalid_credentials" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${String(url)}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderAdminRoute();

    expect(await screen.findByLabelText(/password/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
    expect(screen.queryByText(/session has expired/i)).not.toBeInTheDocument();
  });

  it("shows actionable 409 feedback and returns to login on a 401 mutation failure", async () => {
    let publishCalled = false;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? "GET";

      if (url === "/api/admin/categories" && method === "GET") {
        return new Response(JSON.stringify(categories), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (url === "/api/admin/websites" && method === "GET") {
        return new Response(JSON.stringify(websites), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (url === `/api/admin/categories/${categories[0]!.id}` && method === "DELETE") {
        return new Response(JSON.stringify({ error: "category_has_websites" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        });
      }

      if (url === "/api/admin/publish" && method === "POST") {
        publishCalled = true;
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${String(url)}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderAdminRoute();

    expect(await screen.findByRole("tab", { name: /^Categories$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /^Categories$/i }));
    const deleteButtons = await screen.findAllByRole("button", { name: /^Delete$/i });
    fireEvent.click(deleteButtons[0]!);

    expect(await screen.findByText(/move or remove its websites first/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /^Overview$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /publish snapshot/i }));

    expect(await screen.findByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    expect(publishCalled).toBe(true);
  });
});

