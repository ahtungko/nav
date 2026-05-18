# Admin Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/admin` into a scroll-safe command-center workspace that follows the homepage theme family while using a distinctly different operations-focused layout.

**Architecture:** Keep the existing admin data flow and route behavior, but split admin from the public fixed-viewport shell. Add a dedicated admin shell, persist theme preference so direct `/admin` visits keep the chosen theme, rebuild the page into a command header + workspace switcher + table/editor layout, and restyle the route for natural document scrolling with a sticky desktop editor.

**Tech Stack:** React 19, TypeScript, React Router, Zustand, Testing Library, Vitest, CSS variables/theme tokens

---

## File structure

### Create

- `src/components/layout/AdminShell.tsx` — admin-only document-flow shell with shared theme scene, brand bar, and theme toggle
- `src/components/admin/AdminCommandHeader.tsx` — compact command header with metrics, publish status, and primary CTA
- `src/components/admin/AdminStatusBanner.tsx` — reusable success/error banner for header and publish surfaces
- `src/features/theme/useThemeDocument.ts` — shared hook that applies the theme and marks the active route mode on `body`

### Modify

- `src/lib/constants.ts` — add a storage key for theme preference and a body route attribute constant
- `src/features/theme/theme-store.ts` — persist theme preference and expose a testable store creator
- `src/components/layout/AppShell.tsx` — swap inline theme effect for the shared route-aware hook
- `src/routes/admin.tsx` — wrap loading/login/ready states in `AdminShell` and upgrade string messages to typed feedback objects
- `src/app/admin/LoginPage.tsx` — render only the auth card content so `AdminShell` owns the page chrome
- `src/app/admin/AdminPage.tsx` — rebuild the page into the command-center structure
- `src/components/admin/AdminTabs.tsx` — convert buttons into a stronger segmented workspace switcher
- `src/components/admin/CategoriesTable.tsx` — add selected-row state and cleaner actions
- `src/components/admin/WebsitesTable.tsx` — add selected-row state and cleaner actions
- `src/components/admin/CategoryForm.tsx` — convert form into a sticky editor card with create/edit context
- `src/components/admin/WebsiteForm.tsx` — convert form into a sticky editor card with create/edit context
- `src/components/admin/PublishPanel.tsx` — show release-oriented messaging and typed feedback
- `src/styles/globals.css` — route-specific body overflow rules
- `src/styles/admin.css` — full command-center styling, sticky editor layout, responsive stacking, status banners

### Test

- `tests/frontend/theme-store.test.ts` — theme persistence and hydration
- `tests/frontend/admin-page.test.tsx` — command-center layout, theme toggle visibility, selection state, and admin feedback behavior
- `tests/frontend/home-page.test.tsx` — regression coverage for the public shell after route-mode changes
- `tests/frontend/index-route.test.tsx` — regression coverage for public route error shell after route-mode changes

---

### Task 1: Lock the redesign with failing frontend tests

**Files:**
- Modify: `tests/frontend/theme-store.test.ts`
- Modify: `tests/frontend/admin-page.test.tsx`
- Test: `tests/frontend/theme-store.test.ts`, `tests/frontend/admin-page.test.tsx`

- [ ] **Step 1: Add a failing theme persistence test**

Update `tests/frontend/theme-store.test.ts` to cover hydration from `localStorage` and persistence on change:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createThemeStore, resolveTheme } from "../../src/features/theme/theme-store";
import { STORAGE_KEYS } from "../../src/lib/constants";

beforeEach(() => {
  localStorage.clear();
});

describe("resolveTheme", () => {
  it("uses system dark when preference is auto", () => {
    expect(resolveTheme("auto", true)).toBe("night");
  });
});

describe("createThemeStore", () => {
  it("hydrates the saved preference and persists updates", () => {
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify("night"));

    const store = createThemeStore();
    expect(store.getState().preference).toBe("night");

    store.getState().setPreference("day");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.theme)!)).toBe("day");
  });
});
```

- [ ] **Step 2: Replace the admin route test with command-center expectations**

Update `tests/frontend/admin-page.test.tsx` so the first success-path test asserts the new shell, command header, theme toggle, segmented switcher, and sticky editor selection flow:

```tsx
it("shows login first, then renders the command center and selection-aware editors after a successful login", async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url === "/api/admin/categories" && !init?.method) {
      if (
        fetchMock.mock.calls.filter(([called]) => {
          const calledUrl = typeof called === "string" ? called : called instanceof URL ? called.toString() : called.url;
          return calledUrl === "/api/auth/login";
        }).length === 0
      ) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
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
});
```

- [ ] **Step 3: Run the focused frontend tests to confirm they fail**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/theme-store.test.ts tests/frontend/admin-page.test.tsx
```

Expected: FAIL because the theme store does not persist state yet and the admin route does not render the new command-center structure.

- [ ] **Step 4: Commit the failing test baseline**

```bash
git add tests/frontend/theme-store.test.ts tests/frontend/admin-page.test.tsx
git commit -m "test: define admin redesign behavior"
```

### Task 2: Separate admin from the public shell and persist theme state

**Files:**
- Create: `src/features/theme/useThemeDocument.ts`
- Create: `src/components/layout/AdminShell.tsx`
- Modify: `src/lib/constants.ts`
- Modify: `src/features/theme/theme-store.ts`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/styles/globals.css`
- Test: `tests/frontend/theme-store.test.ts`, `tests/frontend/home-page.test.tsx`, `tests/frontend/index-route.test.tsx`

- [ ] **Step 1: Add route-mode and theme storage constants**

Update `src/lib/constants.ts`:

```ts
export const STORAGE_KEYS = {
  pinned: "vyxolabshub:pinned",
  theme: "vyxolabshub:theme",
} as const;

export const THEME_ATTRIBUTE = "data-theme";
export const APP_ROUTE_ATTRIBUTE = "data-route-mode";
```

- [ ] **Step 2: Make the theme store hydrate and persist**

Replace `src/features/theme/theme-store.ts` with:

```ts
import { create } from "zustand";
import { STORAGE_KEYS } from "../../lib/constants";
import { readJsonStorage, writeJsonStorage } from "../../lib/local-storage";

export type ThemePreference = "auto" | "day" | "night";
export type ResolvedTheme = "day" | "night";

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const DEFAULT_THEME_PREFERENCE: ThemePreference = "auto";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "auto" || value === "day" || value === "night";
}

function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;

  const value = readJsonStorage<unknown>(STORAGE_KEYS.theme, DEFAULT_THEME_PREFERENCE);
  return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "day") return "day";
  if (preference === "night") return "night";
  return systemPrefersDark ? "night" : "day";
}

export function createThemeStore(initialPreference: ThemePreference = readStoredThemePreference()) {
  return create<ThemeState>((set) => ({
    preference: initialPreference,
    setPreference: (preference) => {
      if (typeof window !== "undefined") {
        writeJsonStorage(STORAGE_KEYS.theme, preference);
      }

      set({ preference });
    },
  }));
}

export const useThemeStore = createThemeStore();
```

- [ ] **Step 3: Add a shared document-theme hook**

Create `src/features/theme/useThemeDocument.ts`:

```ts
import { useEffect } from "react";
import { APP_ROUTE_ATTRIBUTE } from "../../lib/constants";
import { applyTheme } from "./apply-theme";
import { useThemeStore } from "./theme-store";

type RouteMode = "admin" | "public";

function getColorSchemeMediaQuery() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia("(prefers-color-scheme: dark)");
}

export function useThemeDocument(routeMode: RouteMode) {
  const preference = useThemeStore((state) => state.preference);

  useEffect(() => {
    document.body.setAttribute(APP_ROUTE_ATTRIBUTE, routeMode);

    const mediaQuery = getColorSchemeMediaQuery();
    const updateTheme = () => {
      applyTheme(preference, mediaQuery?.matches ?? false);
    };

    updateTheme();

    if (!mediaQuery) {
      return () => document.body.removeAttribute(APP_ROUTE_ATTRIBUTE);
    }

    const listener = () => updateTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", listener);
      } else {
        mediaQuery.removeListener(listener);
      }

      document.body.removeAttribute(APP_ROUTE_ATTRIBUTE);
    };
  }, [preference, routeMode]);
}
```

- [ ] **Step 4: Create the admin shell and switch the public shell to the shared hook**

Create `src/components/layout/AdminShell.tsx`:

```tsx
import type { ReactNode } from "react";
import { useThemeDocument } from "../../features/theme/useThemeDocument";
import { ThemeToggle } from "../public/ThemeToggle";

type AdminShellProps = {
  children: ReactNode;
  centered?: boolean;
};

export function AdminShell({ children, centered = false }: AdminShellProps) {
  useThemeDocument("admin");

  return (
    <div className="admin-app">
      <div className="admin-app__scene" aria-hidden="true">
        <span className="admin-app__halo admin-app__halo--a" />
        <span className="admin-app__halo admin-app__halo--b" />
        <span className="admin-app__glow admin-app__glow--a" />
        <span className="admin-app__glow admin-app__glow--b" />
      </div>

      <div className={`admin-app__frame${centered ? " is-centered" : ""}`}>
        <header className="admin-topbar">
          <a className="brand-mark" href="/" aria-label="Go to homepage">
            <span className="brand-mark__icon" aria-hidden="true">
              ✿
            </span>
            <span className="brand-mark__text">vyxolabs</span>
          </a>

          <div className="admin-topbar__tools">
            <ThemeToggle />
          </div>
        </header>

        <main className="admin-app__content">{children}</main>
      </div>
    </div>
  );
}
```

Replace the theme effect in `src/components/layout/AppShell.tsx` with:

```tsx
import type { ReactNode } from "react";
import { useThemeDocument } from "../../features/theme/useThemeDocument";
import { Footer } from "./Footer";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
  topBarTools?: ReactNode;
};

export function AppShell({ children, topBarTools }: AppShellProps) {
  useThemeDocument("public");

  return (
    <div className="app-shell">
      <div className="app-shell__scene" aria-hidden="true">
        <span className="app-shell__halo app-shell__halo--a" />
        <span className="app-shell__halo app-shell__halo--b" />
        <span className="app-shell__glow app-shell__glow--a" />
        <span className="app-shell__glow app-shell__glow--b" />
      </div>
      <div className="app-shell__frame">
        <TopBar tools={topBarTools} />
        <main className="app-shell__content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Make body overflow route-specific instead of globally locked**

Update `src/styles/globals.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
}

html {
  font-family:
    Inter,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

body {
  margin: 0;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--app-background);
  color: var(--color-text);
}

body[data-route-mode="public"] {
  overflow: hidden;
}

body[data-route-mode="admin"] {
  overflow-x: hidden;
  overflow-y: auto;
}
```

- [ ] **Step 6: Run regression tests for shell behavior**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/theme-store.test.ts tests/frontend/home-page.test.tsx tests/frontend/index-route.test.tsx
```

Expected: PASS. Theme hydration should now persist, and the public route regressions should keep passing after the new route-mode hook.

- [ ] **Step 7: Commit**

```bash
git add src/lib/constants.ts src/features/theme/theme-store.ts src/features/theme/useThemeDocument.ts src/components/layout/AppShell.tsx src/components/layout/AdminShell.tsx src/styles/globals.css
git commit -m "feat: split admin shell from public shell"
```

### Task 3: Rebuild the admin route into a command-center page

**Files:**
- Create: `src/components/admin/AdminCommandHeader.tsx`
- Create: `src/components/admin/AdminStatusBanner.tsx`
- Modify: `src/routes/admin.tsx`
- Modify: `src/app/admin/LoginPage.tsx`
- Modify: `src/app/admin/AdminPage.tsx`
- Test: `tests/frontend/admin-page.test.tsx`

- [ ] **Step 1: Add reusable admin feedback and command-header components**

Create `src/components/admin/AdminStatusBanner.tsx`:

```tsx
export type AdminFeedback = {
  tone: "error" | "success";
  text: string;
};

type AdminStatusBannerProps = {
  feedback?: AdminFeedback | null;
};

export function AdminStatusBanner({ feedback }: AdminStatusBannerProps) {
  if (!feedback) return null;

  return (
    <p
      className={`admin-status-banner admin-status-banner--${feedback.tone}`}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      {feedback.text}
    </p>
  );
}
```

Create `src/components/admin/AdminCommandHeader.tsx`:

```tsx
type AdminCommandHeaderProps = {
  categoryCount: number;
  websiteCount: number;
  visibleCategoryCount: number;
  visibleWebsiteCount: number;
  lastPublishedAt?: string | null;
  onPublish: () => Promise<void> | void;
};

export function AdminCommandHeader({
  categoryCount,
  websiteCount,
  visibleCategoryCount,
  visibleWebsiteCount,
  lastPublishedAt,
  onPublish,
}: AdminCommandHeaderProps) {
  return (
    <section className="admin-command-header">
      <div className="admin-command-header__copy">
        <p className="admin-command-header__eyebrow">vyxolabs Admin</p>
        <h1>Draft command center</h1>
        <p>Manage draft categories, tune website visibility, and release a new public snapshot when the workspace is ready.</p>
      </div>

      <div className="admin-command-header__release">
        <p className="admin-command-header__release-label">
          {lastPublishedAt ? `Last publish: ${new Date(lastPublishedAt).toLocaleString()}` : "No publish recorded in this session yet."}
        </p>
        <button type="button" className="admin-button admin-button--primary" onClick={() => void onPublish()}>
          Publish now
        </button>
      </div>

      <div className="admin-command-header__metrics" aria-label="Admin summary">
        <article>
          <span>Categories</span>
          <strong>{categoryCount}</strong>
        </article>
        <article>
          <span>Visible categories</span>
          <strong>{visibleCategoryCount}</strong>
        </article>
        <article>
          <span>Websites</span>
          <strong>{websiteCount}</strong>
        </article>
        <article>
          <span>Visible websites</span>
          <strong>{visibleWebsiteCount}</strong>
        </article>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Move admin state to typed feedback objects and wrap every state in `AdminShell`**

Update `src/routes/admin.tsx` so success and error banners have tone-aware data and the route uses `AdminShell` for loading, login, and ready states:

```tsx
import { useCallback, useEffect, useState } from "react";
import { AdminPage } from "../app/admin/AdminPage";
import { LoginPage } from "../app/admin/LoginPage";
import type { AdminFeedback } from "../components/admin/AdminStatusBanner";
import { AdminShell } from "../components/layout/AdminShell";
import type { CategoryFormValues } from "../components/admin/CategoryForm";
import type { WebsiteFormValues } from "../components/admin/WebsiteForm";
import { fetchJson, FetchJsonError } from "../lib/fetcher";
import type { Category } from "../types/category";
import type { Website } from "../types/website";

type PublishResponse = {
  publishedAt: string;
  categoryCount: number;
  websiteCount: number;
};

type ApiErrorPayload = {
  error?: string;
};

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function sortWebsites(websites: Website[], categories: Category[]): Website[] {
  const categoryOrder = new Map(sortCategories(categories).map((category, index) => [category.id, index] as const));

  return [...websites].sort(
    (left, right) =>
      (categoryOrder.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER) -
        (categoryOrder.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER) ||
      left.sortOrder - right.sortOrder ||
      left.title.localeCompare(right.title),
  );
}

function getFriendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchJsonError<ApiErrorPayload>) {
    if (error.status === 401) {
      if (error.data?.error === "invalid_credentials") {
        return "Incorrect password. Please try again.";
      }

      return "Your admin session has expired. Please log in again.";
    }

    if (error.status === 409) {
      switch (error.data?.error) {
        case "category_has_websites":
          return "This category still has websites. Move or remove its websites first.";
        case "duplicate_category":
          return "Another category already uses this slug.";
        case "duplicate_website":
          return "A website with the same unique draft values already exists.";
        default:
          return "This action conflicts with the current draft state.";
      }
    }

    if (error.status === 400) {
      switch (error.data?.error) {
        case "invalid_category":
          return "Select a valid category before saving this website.";
        default:
          return "The form data is invalid. Please review the fields and try again.";
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function AdminRoute() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [status, setStatus] = useState<"loading" | "unauthenticated" | "ready">("loading");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [globalFeedback, setGlobalFeedback] = useState<AdminFeedback | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<AdminFeedback | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const forceRelogin = useCallback((message: string | null) => {
    setCategories([]);
    setWebsites([]);
    setGlobalFeedback(null);
    setPublishFeedback(null);
    setLoginError(message);
    setStatus("unauthenticated");
  }, []);

  const loadAdminData = useCallback(async () => {
    setStatus("loading");
    setGlobalFeedback(null);

    try {
      const nextCategories = await fetchJson<Category[]>("/api/admin/categories");
      const nextWebsites = await fetchJson<Website[]>("/api/admin/websites");
      setCategories(sortCategories(nextCategories));
      setWebsites(sortWebsites(nextWebsites, nextCategories));
      setStatus("ready");
    } catch (error) {
      const message = getFriendlyErrorMessage(error, "Unable to load admin data.");

      if (error instanceof FetchJsonError && error.status === 401) {
        forceRelogin(null);
        return;
      }

      setStatus("ready");
      setGlobalFeedback({ tone: "error", text: message });
    }
  }, [forceRelogin]);

  async function runMutation<T>(options: {
    action: () => Promise<T>;
    fallbackMessage: string;
    successMessage?: string;
    onSuccess?: (value: T) => void;
    rethrow?: boolean;
    setFeedback?: (feedback: AdminFeedback | null) => void;
  }): Promise<T | undefined> {
    try {
      const result = await options.action();
      options.onSuccess?.(result);

      if (options.successMessage) {
        const feedback = { tone: "success" as const, text: options.successMessage };
        if (options.setFeedback) {
          options.setFeedback(feedback);
        } else {
          setGlobalFeedback(feedback);
        }
      }

      return result;
    } catch (error) {
      const message = getFriendlyErrorMessage(error, options.fallbackMessage);

      if (error instanceof FetchJsonError && error.status === 401) {
        forceRelogin(message);
        return undefined;
      }

      if (options.rethrow) {
        throw new Error(message);
      }

      const feedback = { tone: "error" as const, text: message };
      if (options.setFeedback) {
        options.setFeedback(feedback);
      } else {
        setGlobalFeedback(feedback);
      }

      return undefined;
    }
  }

  async function handleLogin(password: string) {
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await fetchJson<void>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      await loadAdminData();
    } catch (error) {
      setLoginError(getFriendlyErrorMessage(error, "Login failed."));
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleCreateCategory(values: CategoryFormValues) {
    await runMutation({
      action: () =>
        fetchJson<Category>("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(values),
        }),
      fallbackMessage: "Unable to save the category.",
      successMessage: `Saved category ${values.name}.`,
      onSuccess: (created) => {
        setCategories((current) => sortCategories([...current, created]));
      },
      rethrow: true,
    });
  }

  async function handleUpdateCategory(categoryId: string, values: CategoryFormValues) {
    await runMutation({
      action: () =>
        fetchJson<Category>(`/api/admin/categories/${categoryId}`, {
          method: "PUT",
          body: JSON.stringify(values),
        }),
      fallbackMessage: "Unable to update the category.",
      successMessage: `Updated category ${values.name}.`,
      onSuccess: (updated) => {
        setCategories((current) => sortCategories(current.map((category) => (category.id === categoryId ? updated : category))));
      },
      rethrow: true,
    });
  }

  async function handleDeleteCategory(category: Category) {
    await runMutation({
      action: () => fetchJson<void>(`/api/admin/categories/${category.id}`, { method: "DELETE" }),
      fallbackMessage: "Unable to delete the category.",
      successMessage: `Deleted category ${category.name}.`,
      onSuccess: () => {
        setCategories((current) => sortCategories(current.filter((item) => item.id !== category.id)));
      },
    });
  }

  async function handleToggleCategoryVisibility(category: Category) {
    await runMutation({
      action: () =>
        fetchJson<Category>(`/api/admin/categories/${category.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: category.name,
            slug: category.slug,
            iconKey: category.iconKey,
            sortOrder: category.sortOrder,
            isVisible: !category.isVisible,
          }),
        }),
      fallbackMessage: "Unable to update the category visibility.",
      successMessage: `Updated category ${category.name}.`,
      onSuccess: (updated) => {
        setCategories((current) => sortCategories(current.map((item) => (item.id === category.id ? updated : item))));
      },
    });
  }

  async function handleCreateWebsite(values: WebsiteFormValues) {
    await runMutation({
      action: () =>
        fetchJson<Website>("/api/admin/websites", {
          method: "POST",
          body: JSON.stringify(values),
        }),
      fallbackMessage: "Unable to save the website.",
      successMessage: `Saved website ${values.title}.`,
      onSuccess: (created) => {
        setWebsites((current) => sortWebsites([...current, created], categories));
      },
      rethrow: true,
    });
  }

  async function handleUpdateWebsite(websiteId: string, values: WebsiteFormValues) {
    await runMutation({
      action: () =>
        fetchJson<Website>(`/api/admin/websites/${websiteId}`, {
          method: "PUT",
          body: JSON.stringify(values),
        }),
      fallbackMessage: "Unable to update the website.",
      successMessage: `Updated website ${values.title}.`,
      onSuccess: (updated) => {
        setWebsites((current) => sortWebsites(current.map((website) => (website.id === websiteId ? updated : website)), categories));
      },
      rethrow: true,
    });
  }

  async function handleDeleteWebsite(website: Website) {
    await runMutation({
      action: () => fetchJson<void>(`/api/admin/websites/${website.id}`, { method: "DELETE" }),
      fallbackMessage: "Unable to delete the website.",
      successMessage: `Deleted website ${website.title}.`,
      onSuccess: () => {
        setWebsites((current) => sortWebsites(current.filter((item) => item.id !== website.id), categories));
      },
    });
  }

  async function handleToggleWebsiteVisibility(website: Website) {
    await runMutation({
      action: () =>
        fetchJson<Website>(`/api/admin/websites/${website.id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: website.title,
            url: website.url,
            categoryId: website.categoryId,
            sortOrder: website.sortOrder,
            isVisible: !website.isVisible,
          }),
        }),
      fallbackMessage: "Unable to update the website visibility.",
      successMessage: `Updated website ${website.title}.`,
      onSuccess: (updated) => {
        setWebsites((current) => sortWebsites(current.map((item) => (item.id === website.id ? updated : item)), categories));
      },
    });
  }

  async function handlePublish() {
    await runMutation({
      action: () => fetchJson<PublishResponse>("/api/admin/publish", { method: "POST" }),
      fallbackMessage: "Unable to publish the current snapshot.",
      successMessage: "The public snapshot has been updated.",
      onSuccess: (result) => {
        setLastPublishedAt(result.publishedAt);
        setPublishFeedback({
          tone: "success",
          text: `Published ${result.categoryCount} categories and ${result.websiteCount} websites.`,
        });
      },
    });
  }

  if (status === "loading") {
    return (
      <AdminShell centered>
        <section className="admin-auth-card">
          <h1>Loading admin workspace...</h1>
          <p>Checking the current admin session.</p>
        </section>
      </AdminShell>
    );
  }

  if (status === "unauthenticated") {
    return (
      <AdminShell centered>
        <LoginPage errorMessage={loginError} isSubmitting={isLoggingIn} onLogin={handleLogin} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <AdminPage
        categories={categories}
        websites={websites}
        globalFeedback={globalFeedback}
        publishFeedback={publishFeedback}
        lastPublishedAt={lastPublishedAt}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onToggleCategoryVisibility={handleToggleCategoryVisibility}
        onCreateWebsite={handleCreateWebsite}
        onUpdateWebsite={handleUpdateWebsite}
        onDeleteWebsite={handleDeleteWebsite}
        onToggleWebsiteVisibility={handleToggleWebsiteVisibility}
        onPublish={handlePublish}
      />
    </AdminShell>
  );
}
```

- [ ] **Step 3: Rebuild `LoginPage` and `AdminPage` around the new shell and command center**

Replace `src/app/admin/LoginPage.tsx` with:

```tsx
import { type FormEvent, useState } from "react";

type LoginPageProps = {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onLogin?: (password: string) => Promise<void> | void;
};

export function LoginPage({ errorMessage, isSubmitting = false, onLogin }: LoginPageProps = {}) {
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin?.(password);
  }

  return (
    <section className="admin-auth-card" aria-labelledby="admin-login-title">
      <p className="admin-auth-card__eyebrow">vyxolabs Admin</p>
      <h1 id="admin-login-title">Admin login</h1>
      <p>Enter the admin password to manage draft categories, websites, and publish snapshots.</p>

      <form className="admin-auth-form" onSubmit={handleSubmit}>
        <label className="admin-field" htmlFor="admin-password">
          <span>Password</span>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

        <button type="submit" className="admin-button admin-button--primary admin-auth-form__submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
}
```

Replace the top-level structure in `src/app/admin/AdminPage.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { AdminCommandHeader } from "../../components/admin/AdminCommandHeader";
import { AdminStatusBanner, type AdminFeedback } from "../../components/admin/AdminStatusBanner";
import { AdminTabs, type AdminTabId } from "../../components/admin/AdminTabs";
import { CategoriesTable } from "../../components/admin/CategoriesTable";
import { CategoryForm, type CategoryFormValues } from "../../components/admin/CategoryForm";
import { PublishPanel } from "../../components/admin/PublishPanel";
import { WebsiteForm, type WebsiteFormValues } from "../../components/admin/WebsiteForm";
import { WebsitesTable } from "../../components/admin/WebsitesTable";
import type { Category } from "../../types/category";
import type { Website } from "../../types/website";

type AdminPageProps = {
  categories: Category[];
  websites: Website[];
  publishFeedback?: AdminFeedback | null;
  lastPublishedAt?: string | null;
  globalFeedback?: AdminFeedback | null;
  onCreateCategory: (values: CategoryFormValues) => Promise<void>;
  onUpdateCategory: (categoryId: string, values: CategoryFormValues) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
  onToggleCategoryVisibility: (category: Category) => Promise<void>;
  onCreateWebsite: (values: WebsiteFormValues) => Promise<void>;
  onUpdateWebsite: (websiteId: string, values: WebsiteFormValues) => Promise<void>;
  onDeleteWebsite: (website: Website) => Promise<void>;
  onToggleWebsiteVisibility: (website: Website) => Promise<void>;
  onPublish: () => Promise<void>;
};

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function sortWebsites(websites: Website[], categories: Category[]): Website[] {
  const categoryOrder = new Map(sortCategories(categories).map((category, index) => [category.id, index] as const));

  return [...websites].sort(
    (left, right) =>
      (categoryOrder.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER) -
        (categoryOrder.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER) ||
      left.sortOrder - right.sortOrder ||
      left.title.localeCompare(right.title),
  );
}

export function AdminPage({
  categories,
  websites,
  publishFeedback,
  lastPublishedAt,
  globalFeedback,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryVisibility,
  onCreateWebsite,
  onUpdateWebsite,
  onDeleteWebsite,
  onToggleWebsiteVisibility,
  onPublish,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [websiteQuery, setWebsiteQuery] = useState("");
  const [websiteCategoryFilter, setWebsiteCategoryFilter] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCategoryId && !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (selectedWebsiteId && !websites.some((website) => website.id === selectedWebsiteId)) {
      setSelectedWebsiteId(null);
    }
  }, [selectedWebsiteId, websites]);

  const sortedCategories = useMemo(() => sortCategories(categories), [categories]);
  const sortedWebsites = useMemo(() => sortWebsites(websites, categories), [categories, websites]);

  const filteredCategories = useMemo(() => {
    const normalized = categoryQuery.trim().toLowerCase();
    if (!normalized) {
      return sortedCategories;
    }

    return sortedCategories.filter((category) => {
      return category.name.toLowerCase().includes(normalized) || category.slug.toLowerCase().includes(normalized);
    });
  }, [categoryQuery, sortedCategories]);

  const filteredWebsites = useMemo(() => {
    const normalized = websiteQuery.trim().toLowerCase();

    return sortedWebsites.filter((website) => {
      const matchesQuery =
        !normalized ||
        website.title.toLowerCase().includes(normalized) ||
        website.url.toLowerCase().includes(normalized);
      const matchesCategory = websiteCategoryFilter === "all" || website.categoryId === websiteCategoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [sortedWebsites, websiteCategoryFilter, websiteQuery]);

  const categoriesById = useMemo(() => {
    return Object.fromEntries(sortedCategories.map((category) => [category.id, category.name]));
  }, [sortedCategories]);

  const selectedCategory = useMemo(
    () => sortedCategories.find((category) => category.id === selectedCategoryId) ?? null,
    [selectedCategoryId, sortedCategories],
  );

  const selectedWebsite = useMemo(
    () => sortedWebsites.find((website) => website.id === selectedWebsiteId) ?? null,
    [selectedWebsiteId, sortedWebsites],
  );

  const visibleCategoryCount = sortedCategories.filter((category) => category.isVisible).length;
  const visibleWebsiteCount = sortedWebsites.filter((website) => website.isVisible).length;

  return (
    <div className="admin-command-center">
      <AdminCommandHeader
        categoryCount={sortedCategories.length}
        websiteCount={sortedWebsites.length}
        visibleCategoryCount={visibleCategoryCount}
        visibleWebsiteCount={visibleWebsiteCount}
        lastPublishedAt={lastPublishedAt}
        onPublish={onPublish}
      />

      <AdminStatusBanner feedback={globalFeedback} />
      <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <section className="admin-overview-grid">
          <article className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h2>Workspace overview</h2>
                <p>Review draft health before moving into category, website, or publish workflows.</p>
              </div>
            </div>

            <div className="admin-metrics">
              <article>
                <span>Total categories</span>
                <strong>{sortedCategories.length}</strong>
              </article>
              <article>
                <span>Visible categories</span>
                <strong>{visibleCategoryCount}</strong>
              </article>
              <article>
                <span>Total websites</span>
                <strong>{sortedWebsites.length}</strong>
              </article>
              <article>
                <span>Visible websites</span>
                <strong>{visibleWebsiteCount}</strong>
              </article>
            </div>
          </article>

          <PublishPanel
            categoryCount={visibleCategoryCount}
            websiteCount={visibleWebsiteCount}
            lastPublishedAt={lastPublishedAt}
            feedback={publishFeedback}
            onPublish={onPublish}
          />
        </section>
      ) : null}

      {activeTab === "categories" ? (
        <section className="admin-workspace-grid">
          <div className="admin-workspace-grid__main">
            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h2>Category workspace</h2>
                  <p>Search draft categories, then edit the selected row in the sticky side panel.</p>
                </div>
              </div>

              <label className="admin-field">
                <span>Search</span>
                <input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Search categories" />
              </label>
            </article>

            <CategoriesTable
              categories={filteredCategories}
              selectedCategoryId={selectedCategoryId}
              onEdit={(category) => setSelectedCategoryId(category.id)}
              onDelete={async (category) => {
                await onDeleteCategory(category);
                if (selectedCategoryId === category.id) setSelectedCategoryId(null);
              }}
              onToggleVisible={onToggleCategoryVisibility}
            />
          </div>

          <div className="admin-workspace-grid__sidebar">
            <CategoryForm
              selectedName={selectedCategory?.name ?? null}
              initialValues={
                selectedCategory
                  ? {
                      name: selectedCategory.name,
                      slug: selectedCategory.slug,
                      iconKey: selectedCategory.iconKey,
                      sortOrder: selectedCategory.sortOrder,
                      isVisible: selectedCategory.isVisible,
                    }
                  : null
              }
              submitLabel={selectedCategory ? "Save category" : "Create category"}
              onSubmit={async (values) => {
                if (selectedCategory) {
                  await onUpdateCategory(selectedCategory.id, values);
                } else {
                  await onCreateCategory(values);
                }
                setSelectedCategoryId(null);
              }}
              onCancel={selectedCategory ? () => setSelectedCategoryId(null) : undefined}
            />
          </div>
        </section>
      ) : null}

      {activeTab === "websites" ? (
        <section className="admin-workspace-grid">
          <div className="admin-workspace-grid__main">
            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h2>Website workspace</h2>
                  <p>Search titles or URLs, narrow by category, then update the selected row in the editor.</p>
                </div>
              </div>

              <div className="admin-filter-grid">
                <label className="admin-field">
                  <span>Search</span>
                  <input value={websiteQuery} onChange={(event) => setWebsiteQuery(event.target.value)} placeholder="Search websites" />
                </label>
                <label className="admin-field">
                  <span>Category</span>
                  <select value={websiteCategoryFilter} onChange={(event) => setWebsiteCategoryFilter(event.target.value)}>
                    <option value="all">All categories</option>
                    {sortedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>

            <WebsitesTable
              websites={filteredWebsites}
              selectedWebsiteId={selectedWebsiteId}
              categoriesById={categoriesById}
              onEdit={(website) => setSelectedWebsiteId(website.id)}
              onDelete={async (website) => {
                await onDeleteWebsite(website);
                if (selectedWebsiteId === website.id) setSelectedWebsiteId(null);
              }}
              onToggleVisible={onToggleWebsiteVisibility}
            />
          </div>

          <div className="admin-workspace-grid__sidebar">
            <WebsiteForm
              categories={sortedCategories}
              selectedTitle={selectedWebsite?.title ?? null}
              initialValues={
                selectedWebsite
                  ? {
                      title: selectedWebsite.title,
                      url: selectedWebsite.url,
                      categoryId: selectedWebsite.categoryId,
                      sortOrder: selectedWebsite.sortOrder,
                      isVisible: selectedWebsite.isVisible,
                    }
                  : null
              }
              submitLabel={selectedWebsite ? "Save website" : "Create website"}
              onSubmit={async (values) => {
                if (selectedWebsite) {
                  await onUpdateWebsite(selectedWebsite.id, values);
                } else {
                  await onCreateWebsite(values);
                }
                setSelectedWebsiteId(null);
              }}
              onCancel={selectedWebsite ? () => setSelectedWebsiteId(null) : undefined}
            />
          </div>
        </section>
      ) : null}

      {activeTab === "publish" ? (
        <PublishPanel
          categoryCount={visibleCategoryCount}
          websiteCount={visibleWebsiteCount}
          lastPublishedAt={lastPublishedAt}
          feedback={publishFeedback}
          onPublish={onPublish}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the admin test file again**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/admin-page.test.tsx
```

Expected: FAIL, but now only for the selection-aware table/form props and styling-oriented markup that still need component updates in the next task.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminCommandHeader.tsx src/components/admin/AdminStatusBanner.tsx src/routes/admin.tsx src/app/admin/LoginPage.tsx src/app/admin/AdminPage.tsx
git commit -m "feat: add admin command center structure"
```

### Task 4: Make tables, editors, tabs, and publish surfaces selection-aware

**Files:**
- Modify: `src/components/admin/AdminTabs.tsx`
- Modify: `src/components/admin/CategoriesTable.tsx`
- Modify: `src/components/admin/WebsitesTable.tsx`
- Modify: `src/components/admin/CategoryForm.tsx`
- Modify: `src/components/admin/WebsiteForm.tsx`
- Modify: `src/components/admin/PublishPanel.tsx`
- Test: `tests/frontend/admin-page.test.tsx`

- [ ] **Step 1: Upgrade the switcher and tables to expose selection state**

Replace `src/components/admin/AdminTabs.tsx` with:

```tsx
export type AdminTabId = "overview" | "categories" | "websites" | "publish";

const tabs: Array<{ id: AdminTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "categories", label: "Categories" },
  { id: "websites", label: "Websites" },
  { id: "publish", label: "Publish" },
];

type AdminTabsProps = {
  activeTab: AdminTabId;
  onChange: (tab: AdminTabId) => void;
};

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="admin-tabs" role="tablist" aria-label="Admin sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={`admin-tabs__button${tab.id === activeTab ? " is-active" : ""}`}
          aria-selected={tab.id === activeTab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

Update `src/components/admin/CategoriesTable.tsx`:

```tsx
import type { Category } from "../../types/category";

type CategoriesTableProps = {
  categories: Category[];
  selectedCategoryId?: string | null;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => Promise<void> | void;
  onToggleVisible: (category: Category) => Promise<void> | void;
};

export function CategoriesTable({ categories, selectedCategoryId, onEdit, onDelete, onToggleVisible }: CategoriesTableProps) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Categories</h3>
          <p>Draft categories are ordered by sort order, then name.</p>
        </div>
        <span className="admin-chip">{categories.length}</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Icon</th>
              <th>Order</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category.id} aria-selected={selectedCategoryId === category.id} className={selectedCategoryId === category.id ? "is-selected" : ""}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.iconKey}</td>
                  <td>{category.sortOrder}</td>
                  <td>{category.isVisible ? "Yes" : "No"}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button type="button" className="admin-button admin-button--small" onClick={() => onEdit(category)}>
                        Edit
                      </button>
                      <button type="button" className="admin-button admin-button--small" onClick={() => onToggleVisible(category)}>
                        {category.isVisible ? "Hide" : "Show"}
                      </button>
                      <button type="button" className="admin-button admin-button--small admin-button--danger" onClick={() => onDelete(category)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  No categories match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

Update `src/components/admin/WebsitesTable.tsx`:

```tsx
import type { Website } from "../../types/website";

type WebsitesTableProps = {
  websites: Website[];
  selectedWebsiteId?: string | null;
  categoriesById: Record<string, string>;
  onEdit: (website: Website) => void;
  onDelete: (website: Website) => Promise<void> | void;
  onToggleVisible: (website: Website) => Promise<void> | void;
};

export function WebsitesTable({
  websites,
  selectedWebsiteId,
  categoriesById,
  onEdit,
  onDelete,
  onToggleVisible,
}: WebsitesTableProps) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Websites</h3>
          <p>Manage titles, categories, sorting, and publish visibility.</p>
        </div>
        <span className="admin-chip">{websites.length}</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>URL</th>
              <th>Order</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {websites.length > 0 ? (
              websites.map((website) => (
                <tr key={website.id} aria-selected={selectedWebsiteId === website.id} className={selectedWebsiteId === website.id ? "is-selected" : ""}>
                  <td>{website.title}</td>
                  <td>{categoriesById[website.categoryId] ?? website.categoryId}</td>
                  <td className="admin-table__url">{website.url}</td>
                  <td>{website.sortOrder}</td>
                  <td>{website.isVisible ? "Yes" : "No"}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button type="button" className="admin-button admin-button--small" onClick={() => onEdit(website)}>
                        Edit
                      </button>
                      <button type="button" className="admin-button admin-button--small" onClick={() => onToggleVisible(website)}>
                        {website.isVisible ? "Hide" : "Show"}
                      </button>
                      <button type="button" className="admin-button admin-button--small admin-button--danger" onClick={() => onDelete(website)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  No websites match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Convert forms and publish panel into editor/release cards**

Update `src/components/admin/CategoryForm.tsx`:

```tsx
import { type FormEvent, useEffect, useState } from "react";

export type CategoryFormValues = {
  name: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  isVisible: boolean;
};

const emptyValues: CategoryFormValues = {
  name: "",
  slug: "",
  iconKey: "",
  sortOrder: 0,
  isVisible: true,
};

type CategoryFormProps = {
  selectedName?: string | null;
  initialValues?: CategoryFormValues | null;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function CategoryForm({ selectedName, initialValues, onSubmit, onCancel, submitLabel = "Save category" }: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues ?? emptyValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialValues ?? emptyValues);
    setErrorMessage(null);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
      if (!initialValues) setValues(emptyValues);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form admin-panel admin-editor-card" onSubmit={handleSubmit}>
      <div className="admin-form__header">
        <div>
          <h3>{selectedName ? `Editing ${selectedName}` : "Create category"}</h3>
          <p>{selectedName ? "Update naming, icon key, ordering, and visibility for the selected category." : "Start a new category in the draft workspace."}</p>
        </div>
      </div>

      <label className="admin-field">
        <span>Name</span>
        <input value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="AI" required />
      </label>

      <label className="admin-field">
        <span>Slug</span>
        <input value={values.slug} onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))} placeholder="ai" required />
      </label>

      <label className="admin-field">
        <span>Icon key</span>
        <input value={values.iconKey} onChange={(event) => setValues((current) => ({ ...current, iconKey: event.target.value }))} placeholder="sparkles" required />
      </label>

      <label className="admin-field">
        <span>Sort order</span>
        <input type="number" value={values.sortOrder} onChange={(event) => setValues((current) => ({ ...current, sortOrder: Number(event.target.value) }))} required />
      </label>

      <label className="admin-checkbox">
        <input type="checkbox" checked={values.isVisible} onChange={(event) => setValues((current) => ({ ...current, isVisible: event.target.checked }))} />
        <span>Visible in the admin draft and publish snapshot</span>
      </label>

      {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

      <div className="admin-form__actions">
        <button type="submit" className="admin-button admin-button--primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="admin-button" onClick={onCancel}>
            Create new
          </button>
        ) : null}
      </div>
    </form>
  );
}
```

Update `src/components/admin/WebsiteForm.tsx`:

```tsx
import { type FormEvent, useEffect, useState } from "react";
import type { Category } from "../../types/category";

export type WebsiteFormValues = {
  title: string;
  url: string;
  categoryId: string;
  sortOrder: number;
  isVisible: boolean;
};

const emptyValues: WebsiteFormValues = {
  title: "",
  url: "https://",
  categoryId: "",
  sortOrder: 0,
  isVisible: true,
};

type WebsiteFormProps = {
  categories: Category[];
  selectedTitle?: string | null;
  initialValues?: WebsiteFormValues | null;
  onSubmit: (values: WebsiteFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function WebsiteForm({
  categories,
  selectedTitle,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save website",
}: WebsiteFormProps) {
  const [values, setValues] = useState<WebsiteFormValues>(initialValues ?? emptyValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(
      initialValues ?? {
        ...emptyValues,
        categoryId: categories[0]?.id ?? "",
      },
    );
    setErrorMessage(null);
  }, [categories, initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
      if (!initialValues) {
        setValues({
          ...emptyValues,
          categoryId: categories[0]?.id ?? "",
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the website.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form admin-panel admin-editor-card" onSubmit={handleSubmit}>
      <div className="admin-form__header">
        <div>
          <h3>{selectedTitle ? `Editing ${selectedTitle}` : "Create website"}</h3>
          <p>{selectedTitle ? "Update the selected website's category, link, ordering, and publish visibility." : "Add a new website to the current draft workspace."}</p>
        </div>
      </div>

      <label className="admin-field">
        <span>Title</span>
        <input value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} placeholder="ChatGPT" required />
      </label>

      <label className="admin-field">
        <span>URL</span>
        <input type="url" value={values.url} onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))} placeholder="https://chatgpt.com" required />
      </label>

      <label className="admin-field">
        <span>Category</span>
        <select value={values.categoryId} onChange={(event) => setValues((current) => ({ ...current, categoryId: event.target.value }))} required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field">
        <span>Sort order</span>
        <input type="number" value={values.sortOrder} onChange={(event) => setValues((current) => ({ ...current, sortOrder: Number(event.target.value) }))} required />
      </label>

      <label className="admin-checkbox">
        <input type="checkbox" checked={values.isVisible} onChange={(event) => setValues((current) => ({ ...current, isVisible: event.target.checked }))} />
        <span>Visible in the published snapshot</span>
      </label>

      {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

      <div className="admin-form__actions">
        <button type="submit" className="admin-button admin-button--primary" disabled={isSubmitting || categories.length === 0}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="admin-button" onClick={onCancel}>
            Create new
          </button>
        ) : null}
      </div>
    </form>
  );
}
```

Update `src/components/admin/PublishPanel.tsx`:

```tsx
import { AdminStatusBanner, type AdminFeedback } from "./AdminStatusBanner";

type PublishPanelProps = {
  categoryCount: number;
  websiteCount: number;
  lastPublishedAt?: string | null;
  feedback?: AdminFeedback | null;
  onPublish: () => Promise<void> | void;
};

export function PublishPanel({ categoryCount, websiteCount, lastPublishedAt, feedback, onPublish }: PublishPanelProps) {
  return (
    <section className="admin-panel admin-panel--publish">
      <div className="admin-panel__header">
        <div>
          <h2>Release draft snapshot</h2>
          <p>Write the currently visible draft rows into the public KV snapshot that powers the homepage.</p>
        </div>
      </div>

      <div className="admin-metrics">
        <article>
          <span>Visible categories</span>
          <strong>{categoryCount}</strong>
        </article>
        <article>
          <span>Visible websites</span>
          <strong>{websiteCount}</strong>
        </article>
      </div>

      <div className="admin-publish__meta">
        <p>{lastPublishedAt ? `Last publish: ${new Date(lastPublishedAt).toLocaleString()}` : "No publish has been triggered yet."}</p>
        <AdminStatusBanner feedback={feedback} />
      </div>

      <button type="button" className="admin-button admin-button--primary" onClick={() => void onPublish()}>
        Publish snapshot
      </button>
    </section>
  );
}
```

- [ ] **Step 3: Run the admin route tests until they pass**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/admin-page.test.tsx
```

Expected: PASS. The route should now satisfy the command-center test expectations, including selected row state and editor headings.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminTabs.tsx src/components/admin/CategoriesTable.tsx src/components/admin/WebsitesTable.tsx src/components/admin/CategoryForm.tsx src/components/admin/WebsiteForm.tsx src/components/admin/PublishPanel.tsx
git commit -m "feat: add selection-aware admin workspace components"
```

### Task 5: Replace admin styling and finish verification

**Files:**
- Modify: `src/styles/admin.css`
- Test: `tests/frontend/theme-store.test.ts`, `tests/frontend/admin-page.test.tsx`, `tests/frontend/home-page.test.tsx`, `tests/frontend/index-route.test.tsx`

- [ ] **Step 1: Rewrite `src/styles/admin.css` for the command-center layout**

Replace `src/styles/admin.css` with a document-flow admin stylesheet that introduces a dedicated shell, compact top bar, command header, status banner, sticky editor, and mobile stacking:

```css
.admin-app {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

.admin-app__scene {
  position: fixed;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  overflow: hidden;
}

.admin-app__halo,
.admin-app__glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(80px);
}

.admin-app__halo--a {
  width: 420px;
  height: 420px;
  top: -100px;
  left: -60px;
  background: radial-gradient(circle, var(--color-scene-glow-a), transparent 70%);
}

.admin-app__halo--b {
  width: 540px;
  height: 540px;
  top: -60px;
  right: -80px;
  background: radial-gradient(circle, var(--color-scene-glow-b), transparent 70%);
}

.admin-app__glow--a {
  inset: auto 0 240px 0;
  height: 240px;
  background:
    radial-gradient(ellipse at 20% 45%, rgba(245, 163, 205, 0.14), transparent 40%),
    radial-gradient(ellipse at 55% 60%, rgba(167, 142, 255, 0.12), transparent 45%);
}

.admin-app__glow--b {
  width: min(960px, 94vw);
  height: 180px;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  background:
    radial-gradient(ellipse at center, rgba(255, 142, 190, 0.14), transparent 56%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 76%);
  filter: blur(18px);
}

.admin-app__frame {
  width: min(calc(100% - 48px), 1360px);
  margin: 0 auto;
  padding: 18px 0 32px;
}

.admin-app__frame.is-centered {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}

.admin-app__content {
  display: grid;
  gap: 20px;
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.admin-topbar__tools {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.admin-auth-card,
.admin-panel,
.admin-command-header,
.admin-status-banner {
  border: 1px solid var(--color-border);
  border-radius: 28px;
  background: color-mix(in srgb, var(--color-surface-panel) 92%, transparent);
  box-shadow: var(--shadow-panel);
  backdrop-filter: var(--blur-strong);
}

.admin-auth-card {
  width: min(480px, 100%);
  place-self: center;
  padding: 32px;
}

.admin-command-center {
  display: grid;
  gap: 20px;
}

.admin-command-header {
  display: grid;
  gap: 20px;
  padding: 28px;
}

.admin-command-header__eyebrow,
.admin-auth-card__eyebrow {
  margin: 0 0 12px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.admin-command-header h1,
.admin-auth-card h1,
.admin-panel h2,
.admin-panel h3 {
  margin: 0;
  color: var(--color-heading);
  font-family: Georgia, "Times New Roman", serif;
}

.admin-command-header p,
.admin-auth-card p,
.admin-panel p {
  color: var(--color-muted);
  line-height: 1.6;
}

.admin-command-header__release {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.admin-command-header__metrics,
.admin-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.admin-command-header__metrics article,
.admin-metrics article {
  padding: 18px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--color-surface-elevated) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
}

.admin-command-header__metrics span,
.admin-metrics span {
  display: block;
  margin-bottom: 8px;
  color: var(--color-muted);
  font-size: 0.92rem;
}

.admin-command-header__metrics strong,
.admin-metrics strong {
  font-size: 1.8rem;
  color: var(--color-heading);
}

.admin-status-banner {
  margin: 0;
  padding: 14px 18px;
}

.admin-status-banner--success {
  border-color: color-mix(in srgb, #87d8ac 34%, var(--color-border));
  color: var(--color-heading);
}

.admin-status-banner--error {
  border-color: rgba(229, 95, 122, 0.45);
  color: #ffcfda;
}

.admin-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 6px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface-panel) 88%, transparent);
  width: fit-content;
  max-width: 100%;
}

.admin-tabs__button,
.admin-button {
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}

.admin-tabs__button {
  padding: 10px 18px;
  font-weight: 600;
}

.admin-tabs__button.is-active,
.admin-tabs__button:hover,
.admin-tabs__button:focus-visible,
.admin-button:hover,
.admin-button:focus-visible {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-accent) 55%, white);
}

.admin-tabs__button.is-active,
.admin-button--primary {
  background: linear-gradient(135deg, rgba(155, 109, 255, 0.88), rgba(110, 95, 255, 0.88));
  color: white;
}

.admin-button {
  padding: 10px 16px;
}

.admin-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.admin-button--small {
  padding: 8px 12px;
  font-size: 0.9rem;
}

.admin-button--danger {
  border-color: rgba(229, 95, 122, 0.45);
  color: #ffe3ea;
  background: rgba(229, 95, 122, 0.18);
}

.admin-panel {
  padding: 24px;
}

.admin-panel__header,
.admin-form__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.admin-chip {
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(155, 109, 255, 0.16);
  color: var(--color-heading);
  font-weight: 700;
}

.admin-field {
  display: grid;
  gap: 8px;
}

.admin-field span {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-heading);
}

.admin-field input,
.admin-field select,
.admin-field textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  background: color-mix(in srgb, var(--color-surface-elevated) 82%, transparent);
  color: var(--color-text);
}

.admin-checkbox {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--color-muted);
}

.admin-form,
.admin-auth-form {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.admin-form__actions,
.admin-table__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.admin-overview-grid,
.admin-workspace-grid {
  display: grid;
  gap: 20px;
}

.admin-workspace-grid__main,
.admin-workspace-grid__sidebar {
  display: grid;
  gap: 20px;
  align-content: start;
}

.admin-editor-card {
  position: sticky;
  top: 18px;
}

.admin-filter-grid {
  display: grid;
  gap: 16px;
}

.admin-table-wrap {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
  vertical-align: top;
}

.admin-table th {
  color: var(--color-muted);
  font-size: 0.88rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.admin-table tbody tr.is-selected {
  background: color-mix(in srgb, var(--color-surface-strong) 82%, transparent);
}

.admin-table__url {
  max-width: 320px;
  overflow-wrap: anywhere;
}

.admin-table__empty,
.admin-feedback {
  margin: 0;
  color: var(--color-muted);
}

.admin-feedback--error {
  color: #ffb0c0;
}

.admin-publish__meta {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

@media (min-width: 1024px) {
  .admin-command-header {
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
    align-items: start;
  }

  .admin-command-header__metrics {
    grid-column: 1 / -1;
  }

  .admin-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .admin-workspace-grid {
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.75fr);
    align-items: start;
  }

  .admin-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .admin-app__frame {
    width: min(calc(100% - 28px), 1360px);
    padding: 14px 0 24px;
  }

  .admin-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-topbar__tools {
    width: 100%;
    justify-content: center;
  }

  .admin-auth-card,
  .admin-panel,
  .admin-command-header,
  .admin-status-banner {
    border-radius: 22px;
    padding: 20px;
  }

  .admin-tabs {
    width: 100%;
    justify-content: center;
  }

  .admin-tabs__button {
    flex: 1 1 140px;
  }

  .admin-editor-card {
    position: static;
  }

  .admin-command-header__release {
    align-items: stretch;
  }
}
```

- [ ] **Step 2: Run the full targeted frontend suite**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/theme-store.test.ts tests/frontend/admin-page.test.tsx tests/frontend/home-page.test.tsx tests/frontend/index-route.test.tsx
```

Expected: PASS. The redesign should satisfy the new admin tests without breaking the public shell.

- [ ] **Step 3: Build the app**

Run:

```bash
npm run build
```

Expected: PASS. Vite should compile the updated admin and public shells without TypeScript or bundling errors.

- [ ] **Step 4: Verify the admin route in the browser**

Run:

```bash
npm run dev
```

Then verify manually in the browser:

- log in at `/admin`
- confirm the page scrolls naturally when the viewport is short
- confirm the category and website editors stay sticky on desktop
- confirm the editor stacks below the table on narrow screens
- confirm the selected row styling updates after clicking **Edit**
- confirm the theme toggle still affects both homepage and admin

- [ ] **Step 5: Commit**

```bash
git add src/styles/admin.css
git commit -m "feat: restyle admin command center"
```

## Plan self-review

### Spec coverage

- Dedicated admin shell instead of public fixed viewport: Task 2
- Same theme family and direct `/admin` theme persistence: Task 2
- Command header + workspace switcher + overview dashboard: Task 3
- Categories/websites desktop layout with left table + sticky right editor: Tasks 3 and 5
- Publish surface redesign: Tasks 3 and 4
- Better feedback surfaces and empty-state structure: Tasks 3 and 4
- Scroll fix and responsive stacking: Tasks 2 and 5

### Placeholder scan

- No unresolved placeholders remain.
- Every task names exact files, concrete commands, and specific assertions.

### Type consistency

- Theme values remain `auto | day | night`.
- Admin feedback objects consistently use `{ tone, text }`.
- Table selection props stay aligned as `selectedCategoryId` and `selectedWebsiteId`.
