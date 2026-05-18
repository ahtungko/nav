# Navigation Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build vyxolabs Hub into a Cloudflare-hosted React navigation site with a password-protected admin area, D1-backed draft editing, KV-backed published snapshots, day/night/auto themes, and visitor-local pinned items.

**Architecture:** Implement a React SPA with Vite and the Cloudflare Vite plugin so static assets and `/api/*` routes deploy together on Cloudflare. Admin edits write draft data to D1, Publish writes a normalized public snapshot to KV, and the public UI reads only the published snapshot while visitor pinned/theme preferences stay in localStorage.

**Tech Stack:** React, Vite, TypeScript, react-router-dom, Zustand, Zod, Cloudflare Workers, D1, KV, Vitest, `@cloudflare/vitest-pool-workers`

---

## File structure

### Root/config
- Create: `.gitignore`
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `wrangler.jsonc`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vitest.config.ts`
- Create: `env.d.ts`

### Assets
- Move: `darkmode.png` -> `public/darkmode.png`
- Move: `daymode.png` -> `public/daymode.png`
- Keep as reference only: `darkmode.html`, `daymode.html`

### Frontend
- Create: `src/main.tsx`
- Create: `src/routes/index.tsx`
- Create: `src/routes/admin.tsx`
- Create: `src/app/public/HomePage.tsx`
- Create: `src/app/admin/AdminPage.tsx`
- Create: `src/app/admin/LoginPage.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/public/CategoriesRail.tsx`
- Create: `src/components/public/CategoryCard.tsx`
- Create: `src/components/public/PinnedPanel.tsx`
- Create: `src/components/public/RecentPanel.tsx`
- Create: `src/components/public/WebsiteRow.tsx`
- Create: `src/components/public/SearchBar.tsx`
- Create: `src/components/public/ThemeToggle.tsx`
- Create: `src/components/admin/AdminTabs.tsx`
- Create: `src/components/admin/CategoriesTable.tsx`
- Create: `src/components/admin/CategoryForm.tsx`
- Create: `src/components/admin/WebsitesTable.tsx`
- Create: `src/components/admin/WebsiteForm.tsx`
- Create: `src/components/admin/PublishPanel.tsx`
- Create: `src/features/theme/theme-store.ts`
- Create: `src/features/theme/theme-tokens.ts`
- Create: `src/features/theme/apply-theme.ts`
- Create: `src/features/pinned/pinned-store.ts`
- Create: `src/features/search/search-websites.ts`
- Create: `src/lib/fetcher.ts`
- Create: `src/lib/favicon.ts`
- Create: `src/lib/local-storage.ts`
- Create: `src/lib/constants.ts`
- Create: `src/types/category.ts`
- Create: `src/types/website.ts`
- Create: `src/types/snapshot.ts`
- Create: `src/types/auth.ts`
- Create: `src/styles/globals.css`
- Create: `src/styles/theme.css`
- Create: `src/styles/public.css`
- Create: `src/styles/admin.css`

### Worker/backend
- Create: `worker/index.ts`
- Create: `worker/types.ts`
- Create: `worker/routes/auth.ts`
- Create: `worker/routes/public-site.ts`
- Create: `worker/routes/admin-categories.ts`
- Create: `worker/routes/admin-websites.ts`
- Create: `worker/routes/admin-publish.ts`
- Create: `worker/lib/auth.ts`
- Create: `worker/lib/d1.ts`
- Create: `worker/lib/kv.ts`
- Create: `worker/lib/response.ts`
- Create: `worker/lib/validation.ts`
- Create: `worker/lib/snapshot.ts`
- Create: `worker/lib/repositories/categories.ts`
- Create: `worker/lib/repositories/websites.ts`

### DB/tests
- Create: `migrations/0001_init.sql`
- Create: `tests/frontend/theme-store.test.ts`
- Create: `tests/frontend/pinned-store.test.ts`
- Create: `tests/frontend/search-websites.test.ts`
- Create: `tests/frontend/home-page.test.tsx`
- Create: `tests/frontend/admin-page.test.tsx`
- Create: `tests/worker/auth.test.ts`
- Create: `tests/worker/public-site.test.ts`
- Create: `tests/worker/admin-categories.test.ts`
- Create: `tests/worker/admin-websites.test.ts`
- Create: `tests/worker/publish.test.ts`
- Create: `tests/worker/publish-endpoint.test.ts`

---

### Task 1: Scaffold the repo, toolchain, and test harness

**Files:**
- Create: `.gitignore`, `package.json`, `vite.config.ts`, `wrangler.jsonc`, `tsconfig*.json`, `vitest.config.ts`, `env.d.ts`
- Move: `public/darkmode.png`, `public/daymode.png`
- Test: `tests/worker/public-site.test.ts`, `tests/frontend/theme-store.test.ts`

- [ ] **Step 1: Initialize git and npm**

Run:
```bash
git init
npm init -y
```
Expected: `.git/` and `package.json` exist.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm i react react-dom react-router-dom zustand zod
npm i -D typescript vite @vitejs/plugin-react wrangler @cloudflare/vite-plugin @cloudflare/workers-types vitest@^4.1.0 @cloudflare/vitest-pool-workers jsdom @types/react @types/react-dom @testing-library/react @testing-library/jest-dom
```
Expected: install completes with no errors.

- [ ] **Step 3: Create base config**

Create `.gitignore`:
```gitignore
node_modules
.wrangler
.dev.vars*
dist
coverage
```

Create `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
});
```

Create `wrangler.jsonc`:
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "vyxolabs-hub",
  "compatibility_date": "2026-05-18",
  "main": "./worker/index.ts",
  "assets": {
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "vyxolabs-hub",
      "database_id": "REPLACE_IN_CLOUDFLARE"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "PUBLIC_SNAPSHOT",
      "id": "REPLACE_IN_CLOUDFLARE"
    }
  ]
}
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
  test: {
    projects: [
      {
        test: {
          name: "frontend",
          include: ["tests/frontend/**/*.test.ts", "tests/frontend/**/*.test.tsx"],
          environment: "jsdom",
        },
      },
      {
        test: {
          name: "worker",
          include: ["tests/worker/**/*.test.ts"],
        },
      },
    ],
  },
});
```

- [ ] **Step 4: Write the first failing tests**

Create `tests/worker/public-site.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";

describe("GET /api/public/site", () => {
  it("returns 503 before any snapshot exists", async () => {
    const response = await SELF.fetch("https://example.com/api/public/site");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "snapshot_not_published" });
  });
});
```

Create `tests/frontend/theme-store.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../src/features/theme/theme-store";

describe("resolveTheme", () => {
  it("uses system dark when preference is auto", () => {
    expect(resolveTheme("auto", true)).toBe("night");
  });
});
```

- [ ] **Step 5: Run tests to verify failure**

Run:
```bash
npm run test -- tests/worker/public-site.test.ts tests/frontend/theme-store.test.ts
```
Expected: FAIL because `worker/index.ts` and `src/features/theme/theme-store.ts` do not exist yet.

- [ ] **Step 6: Move static assets into `public/`**

Run:
```bash
mkdir public
move darkmode.png public\\darkmode.png
move daymode.png public\\daymode.png
```
Expected: images exist in `public/`.

- [ ] **Step 7: Commit**

Run:
```bash
git add .
git commit -m "chore: scaffold cloudflare project"
```

### Task 2: Create schema, shared types, repositories, and snapshot builder

**Files:**
- Create: `migrations/0001_init.sql`
- Create: `src/types/*.ts`
- Create: `worker/types.ts`, `worker/lib/d1.ts`, `worker/lib/repositories/categories.ts`, `worker/lib/repositories/websites.ts`, `worker/lib/snapshot.ts`, `worker/lib/kv.ts`
- Test: `tests/worker/publish.test.ts`

- [ ] **Step 1: Write the failing snapshot builder test**

Create `tests/worker/publish.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildPublishedSnapshot } from "../../worker/lib/snapshot";

describe("buildPublishedSnapshot", () => {
  it("sorts categories and websites into a published payload", () => {
    const snapshot = buildPublishedSnapshot({
      categories: [
        { id: "c2", name: "Website", slug: "website", icon_key: "globe", sort_order: 2, is_visible: 1, created_at: "", updated_at: "" },
        { id: "c1", name: "AI", slug: "ai", icon_key: "ai", sort_order: 1, is_visible: 1, created_at: "", updated_at: "" },
      ],
      websites: [
        { id: "w1", title: "ChatGPT", url: "https://chatgpt.com", category_id: "c1", sort_order: 2, is_visible: 1, created_at: "2026-05-18T00:00:00.000Z", updated_at: "" },
        { id: "w2", title: "Claude", url: "https://claude.ai", category_id: "c1", sort_order: 1, is_visible: 1, created_at: "2026-05-17T00:00:00.000Z", updated_at: "" },
      ],
      publishedAt: "2026-05-18T01:00:00.000Z",
    });

    expect(snapshot.categories.map((item) => item.id)).toEqual(["c1", "c2"]);
    expect(snapshot.websites.map((item) => item.id)).toEqual(["w2", "w1"]);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:
```bash
npm run test -- tests/worker/publish.test.ts
```
Expected: FAIL because `worker/lib/snapshot.ts` does not exist yet.

- [ ] **Step 3: Add D1 migration**

Create `migrations/0001_init.sql`:
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE websites (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

- [ ] **Step 4: Add shared types**

Create `src/types/category.ts`:
```ts
export type Category = {
  id: string;
  name: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Create `src/types/website.ts`:
```ts
export type Website = {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Create `src/types/snapshot.ts`:
```ts
export type PublishedSnapshot = {
  version: 1;
  publishedAt: string;
  categories: Array<{ id: string; name: string; slug: string; iconKey: string; sortOrder: number }>;
  websites: Array<{ id: string; title: string; url: string; categoryId: string; sortOrder: number; createdAt: string }>;
};
```

- [ ] **Step 5: Implement repositories and snapshot builder**

Create `worker/lib/snapshot.ts`:
```ts
import type { PublishedSnapshot } from "../../src/types/snapshot";
import type { CategoryRow, WebsiteRow } from "../types";

export function buildPublishedSnapshot(input: {
  categories: CategoryRow[];
  websites: WebsiteRow[];
  publishedAt: string;
}): PublishedSnapshot {
  return {
    version: 1,
    publishedAt: input.publishedAt,
    categories: input.categories
      .filter((category) => category.is_visible === 1)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        iconKey: category.icon_key,
        sortOrder: category.sort_order,
      })),
    websites: input.websites
      .filter((website) => website.is_visible === 1)
      .sort((a, b) => a.category_id.localeCompare(b.category_id) || a.sort_order - b.sort_order)
      .map((website) => ({
        id: website.id,
        title: website.title,
        url: website.url,
        categoryId: website.category_id,
        sortOrder: website.sort_order,
        createdAt: website.created_at,
      })),
  };
}
```

- [ ] **Step 6: Run test to verify pass**

Run:
```bash
npm run test -- tests/worker/publish.test.ts
```
Expected: PASS.

- [ ] **Step 7: Commit**

Run:
```bash
git add migrations src/types worker/lib worker/types.ts tests/worker/publish.test.ts
git commit -m "feat: add schema and snapshot builder"
```

### Task 3: Implement theme, pinned, search, and favicon utilities

**Files:**
- Create: `src/features/theme/theme-store.ts`, `src/features/theme/theme-tokens.ts`, `src/features/theme/apply-theme.ts`
- Create: `src/features/pinned/pinned-store.ts`
- Create: `src/features/search/search-websites.ts`
- Create: `src/lib/local-storage.ts`, `src/lib/favicon.ts`, `src/lib/constants.ts`
- Test: `tests/frontend/theme-store.test.ts`, `tests/frontend/pinned-store.test.ts`, `tests/frontend/search-websites.test.ts`

- [ ] **Step 1: Write failing pinned and search tests**

Create `tests/frontend/pinned-store.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createPinnedStore } from "../../src/features/pinned/pinned-store";

beforeEach(() => localStorage.clear());

describe("pinned store", () => {
  it("toggles ids and persists to localStorage", () => {
    const store = createPinnedStore();
    store.getState().togglePinned("site_1");
    expect(store.getState().pinnedIds).toEqual(["site_1"]);
    store.getState().togglePinned("site_1");
    expect(store.getState().pinnedIds).toEqual([]);
  });
});
```

Create `tests/frontend/search-websites.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { searchWebsites } from "../../src/features/search/search-websites";

describe("searchWebsites", () => {
  it("matches title and url", () => {
    const items = [
      { id: "1", title: "ChatGPT", url: "https://chatgpt.com" },
      { id: "2", title: "Framer", url: "https://framer.com" },
    ];
    expect(searchWebsites(items, "chat").map((item) => item.id)).toEqual(["1"]);
    expect(searchWebsites(items, "fram").map((item) => item.id)).toEqual(["2"]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
npm run test -- tests/frontend/theme-store.test.ts tests/frontend/pinned-store.test.ts tests/frontend/search-websites.test.ts
```
Expected: FAIL because the feature files do not exist yet.

- [ ] **Step 3: Implement theme store**

Create `src/features/theme/theme-store.ts`:
```ts
import { create } from "zustand";

export type ThemePreference = "auto" | "day" | "night";
export type ResolvedTheme = "day" | "night";

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "day") return "day";
  if (preference === "night") return "night";
  return systemPrefersDark ? "night" : "day";
}

export const useThemeStore = create<{
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}>((set) => ({
  preference: "auto",
  setPreference: (preference) => set({ preference }),
}));
```

- [ ] **Step 4: Implement pinned store**

Create `src/features/pinned/pinned-store.ts`:
```ts
import { createStore } from "zustand/vanilla";

const KEY = "vyxolabshub:pinned";

export function createPinnedStore() {
  return createStore<{
    pinnedIds: string[];
    togglePinned: (id: string) => void;
  }>((set, get) => ({
    pinnedIds: JSON.parse(localStorage.getItem(KEY) ?? "[]"),
    togglePinned: (id) => {
      const next = get().pinnedIds.includes(id)
        ? get().pinnedIds.filter((value) => value !== id)
        : [...get().pinnedIds, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      set({ pinnedIds: next });
    },
  }));
}
```

- [ ] **Step 5: Implement search and favicon helpers**

Create `src/features/search/search-websites.ts`:
```ts
export function searchWebsites<T extends { title: string; url: string }>(items: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => item.title.toLowerCase().includes(normalized) || item.url.toLowerCase().includes(normalized));
}
```

Create `src/lib/favicon.ts`:
```ts
export function getFaviconUrl(url: string): string {
  const hostname = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
}
```

- [ ] **Step 6: Run tests to verify pass**

Run:
```bash
npm run test -- tests/frontend/theme-store.test.ts tests/frontend/pinned-store.test.ts tests/frontend/search-websites.test.ts
```
Expected: PASS.

- [ ] **Step 7: Commit**

Run:
```bash
git add src/features src/lib tests/frontend
git commit -m "feat: add theme pinned and search utilities"
```

### Task 4: Implement Worker auth, public snapshot endpoint, and validation helpers

**Files:**
- Create: `worker/index.ts`, `worker/routes/auth.ts`, `worker/routes/public-site.ts`, `worker/lib/auth.ts`, `worker/lib/response.ts`, `worker/lib/validation.ts`
- Test: `tests/worker/auth.test.ts`, `tests/worker/public-site.test.ts`

- [ ] **Step 1: Write failing auth test**

Create `tests/worker/auth.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";

describe("POST /api/auth/login", () => {
  it("returns 204 and sets a cookie for the correct password", async () => {
    const response = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret" }),
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("vyxolabs_admin_session=");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
npm run test -- tests/worker/auth.test.ts tests/worker/public-site.test.ts
```
Expected: FAIL because `worker/index.ts` does not exist yet.

- [ ] **Step 3: Implement auth and public routes**

Create `worker/lib/auth.ts`:
```ts
export async function verifyPassword(password: string, env: Env): Promise<boolean> {
  return password === env.ADMIN_PASSWORD;
}

export function buildAdminSessionCookie(value: string): string {
  return `vyxolabs_admin_session=${value}; Path=/; HttpOnly; SameSite=Strict; Secure`;
}
```

Create `worker/routes/public-site.ts`:
```ts
export async function handlePublicSiteRequest(env: Env): Promise<Response> {
  const snapshot = await env.PUBLIC_SNAPSHOT.get("public-site:v1", "json");
  if (!snapshot) {
    return Response.json({ error: "snapshot_not_published" }, { status: 503 });
  }
  return Response.json(snapshot, {
    headers: { "cache-control": "public, max-age=300, s-maxage=300" },
  });
}
```

Create `worker/index.ts`:
```ts
import { handleAuthRequest } from "./routes/auth";
import { handlePublicSiteRequest } from "./routes/public-site";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/auth/login") return handleAuthRequest(request, env);
    if (url.pathname === "/api/public/site") return handlePublicSiteRequest(env);
    return new Response("Not found", { status: 404 });
  },
};
```

- [ ] **Step 4: Run tests to verify pass**

Run:
```bash
npm run test -- tests/worker/auth.test.ts tests/worker/public-site.test.ts
```
Expected: PASS after test bindings are configured.

- [ ] **Step 5: Commit**

Run:
```bash
git add worker tests/worker/auth.test.ts tests/worker/public-site.test.ts
git commit -m "feat: add auth and public snapshot routes"
```

### Task 5: Build the public React UI from the current visual designs

**Files:**
- Create: `src/main.tsx`, `src/routes/index.tsx`, `src/app/public/HomePage.tsx`
- Create: `src/components/layout/AppShell.tsx`, `TopBar.tsx`, `Footer.tsx`
- Create: `src/components/public/CategoriesRail.tsx`, `CategoryCard.tsx`, `PinnedPanel.tsx`, `RecentPanel.tsx`, `WebsiteRow.tsx`, `SearchBar.tsx`, `ThemeToggle.tsx`
- Create: `src/styles/globals.css`, `src/styles/theme.css`, `src/styles/public.css`
- Test: `tests/frontend/home-page.test.tsx`

- [ ] **Step 1: Write failing homepage test**

Create `tests/frontend/home-page.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomePage } from "../../src/app/public/HomePage";

describe("HomePage", () => {
  it("renders the main public panels", () => {
    render(
      <HomePage
        snapshot={{
          version: 1,
          publishedAt: "2026-05-18T00:00:00.000Z",
          categories: [{ id: "c1", name: "AI", slug: "ai", iconKey: "ai", sortOrder: 1 }],
          websites: [{ id: "w1", title: "ChatGPT", url: "https://chatgpt.com", categoryId: "c1", sortOrder: 1, createdAt: "2026-05-18T00:00:00.000Z" }],
        }}
      />,
    );
    expect(screen.getByText("Popular Categories")).toBeInTheDocument();
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(screen.getByText("Recently Added")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:
```bash
npm run test -- tests/frontend/home-page.test.tsx
```
Expected: FAIL because the React UI does not exist yet.

- [ ] **Step 3: Implement routes and shell**

Create `src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { IndexRoute } from "./routes/index";
import { AdminRoute } from "./routes/admin";
import "./styles/globals.css";
import "./styles/theme.css";
import "./styles/public.css";
import "./styles/admin.css";

const router = createBrowserRouter([
  { path: "/", element: <IndexRoute /> },
  { path: "/admin", element: <AdminRoute /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
```

- [ ] **Step 4: Implement HomePage and public components**

`HomePage.tsx` should:
- accept `PublishedSnapshot`
- derive recent items from `createdAt desc`
- load pinned IDs from the pinned store
- render fixed viewport layout with categories rail, pinned panel, recent panel, theme toggle, and search bar

Port the shared layout from `darkmode.html` / `daymode.html`, but convert all theme differences into CSS variables only.

- [ ] **Step 5: Implement theme token CSS**

Create `src/styles/theme.css`:
```css
:root[data-theme="night"] {
  --text: #f5f3ff;
  --muted: rgba(242, 240, 255, 0.76);
  --bg-image: url('/darkmode.png');
}

:root[data-theme="day"] {
  --text: #34384a;
  --muted: rgba(74, 80, 99, 0.78);
  --bg-image: url('/daymode.png');
}
```

Do not duplicate layout metrics between themes.

- [ ] **Step 6: Run test to verify pass**

Run:
```bash
npm run test -- tests/frontend/home-page.test.tsx
```
Expected: PASS.

- [ ] **Step 7: Commit**

Run:
```bash
git add src tests/frontend/home-page.test.tsx
git commit -m "feat: build public homepage"
```

### Task 6: Implement admin CRUD APIs and React admin UI

**Files:**
- Create: `worker/routes/admin-categories.ts`, `worker/routes/admin-websites.ts`, `worker/routes/admin-publish.ts`
- Create: `src/app/admin/AdminPage.tsx`, `src/app/admin/LoginPage.tsx`
- Create: `src/components/admin/AdminTabs.tsx`, `CategoriesTable.tsx`, `CategoryForm.tsx`, `WebsitesTable.tsx`, `WebsiteForm.tsx`, `PublishPanel.tsx`
- Create: `src/routes/admin.tsx`, `src/lib/fetcher.ts`, `src/styles/admin.css`
- Test: `tests/worker/admin-categories.test.ts`, `tests/worker/admin-websites.test.ts`, `tests/worker/publish-endpoint.test.ts`, `tests/frontend/admin-page.test.tsx`

- [ ] **Step 1: Write failing worker CRUD tests**

Create `tests/worker/admin-categories.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";

describe("POST /api/admin/categories", () => {
  it("creates a category for an authenticated admin", async () => {
    const response = await SELF.fetch("https://example.com/api/admin/categories", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "vyxolabs_admin_session=valid",
      },
      body: JSON.stringify({ name: "AI", slug: "ai", iconKey: "ai", sortOrder: 1, isVisible: true }),
    });
    expect(response.status).toBe(201);
  });
});
```

Create `tests/worker/admin-websites.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";

describe("POST /api/admin/websites", () => {
  it("creates a website for an authenticated admin", async () => {
    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "vyxolabs_admin_session=valid",
      },
      body: JSON.stringify({ title: "ChatGPT", url: "https://chatgpt.com", categoryId: "cat_ai", sortOrder: 1, isVisible: true }),
    });
    expect(response.status).toBe(201);
  });
});
```

Create `tests/worker/publish-endpoint.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";

describe("POST /api/admin/publish", () => {
  it("writes a snapshot to KV", async () => {
    const response = await SELF.fetch("https://example.com/api/admin/publish", {
      method: "POST",
      headers: { cookie: "vyxolabs_admin_session=valid" },
    });
    expect(response.status).toBe(200);
    expect(await env.PUBLIC_SNAPSHOT.get("public-site:v1", "json")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Write failing admin login render test**

Create `tests/frontend/admin-page.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginPage } from "../../src/app/admin/LoginPage";

describe("LoginPage", () => {
  it("renders the password form", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:
```bash
npm run test -- tests/worker/admin-categories.test.ts tests/worker/admin-websites.test.ts tests/worker/publish-endpoint.test.ts tests/frontend/admin-page.test.tsx
```
Expected: FAIL because admin routes and UI do not exist yet.

- [ ] **Step 4: Implement admin worker routes with Zod validation**

Create `worker/lib/validation.ts`:
```ts
import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  iconKey: z.string().min(1),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
});

export const websiteInputSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  categoryId: z.string().min(1),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
});
```

Implement:
- auth guard for `/api/admin/*`
- categories CRUD
- websites CRUD
- publish route reading visible draft rows and writing `public-site:v1`

- [ ] **Step 5: Implement admin React UI**

Create `src/lib/fetcher.ts`:
```ts
export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
```

Implement `AdminPage` with tabs:
- Overview
- Categories
- Websites
- Publish

Implement category and website forms with create/edit/delete/toggle visible/search/filter flows.

- [ ] **Step 6: Run tests to verify pass**

Run:
```bash
npm run test -- tests/worker/admin-categories.test.ts tests/worker/admin-websites.test.ts tests/worker/publish-endpoint.test.ts tests/frontend/admin-page.test.tsx
```
Expected: PASS.

- [ ] **Step 7: Commit**

Run:
```bash
git add worker src tests/worker tests/frontend/admin-page.test.tsx
git commit -m "feat: add admin crud and publish flow"
```

### Task 7: Final integration, local verification, and Cloudflare setup

**Files:**
- Modify: `package.json`, `wrangler.jsonc`, any remaining integration files
- Test: full suite plus local preview

- [ ] **Step 1: Add scripts**

Update `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Apply local migration**

Run:
```bash
npx wrangler d1 migrations apply vyxolabs-hub --local
```
Expected: local D1 schema exists.

- [ ] **Step 3: Run full tests**

Run:
```bash
npm run test
```
Expected: PASS with 0 failures.

- [ ] **Step 4: Build the app**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Preview locally**

Run:
```bash
npm run preview
```
Expected: `/`, `/admin`, and `/api/public/site` load locally.

- [ ] **Step 6: Create Cloudflare resources**

Run:
```bash
npx wrangler d1 create vyxolabs-hub
npx wrangler kv namespace create PUBLIC_SNAPSHOT
npx wrangler secret put ADMIN_PASSWORD
```
Expected: IDs/secrets are created and copied into `wrangler.jsonc`.

- [ ] **Step 7: Deploy**

Run:
```bash
npm run deploy
```
Expected: deployment succeeds and returns a public Cloudflare URL.

- [ ] **Step 8: Commit**

Run:
```bash
git add .
git commit -m "feat: ship vyxolabs hub project"
```

## Plan self-review

### Spec coverage
- Cloudflare hosting: Tasks 1, 4, 6, 7
- Single admin password auth: Tasks 4 and 6
- Category CRUD: Task 6
- Website CRUD: Task 6
- Sorting/visibility: Tasks 2 and 6
- Publish snapshot flow: Tasks 2 and 6
- Public pinned localStorage: Tasks 3 and 5
- Day/night/auto themes: Tasks 3 and 5
- Auto favicon: Tasks 3 and 5
- Preset category icons: Tasks 2 and 6
- Public reads from snapshot instead of D1: Tasks 2, 4, and 6

### Placeholder scan
- No placeholder markers remain.

### Type consistency
- `iconKey`, `sortOrder`, `categoryId`, `createdAt`, and `updatedAt` are used consistently.
- `DB`, `PUBLIC_SNAPSHOT`, and `ADMIN_PASSWORD` match the planned Cloudflare bindings.
- Theme values remain `day | night | auto` throughout.
