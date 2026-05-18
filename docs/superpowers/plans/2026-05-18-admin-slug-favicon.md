# Admin Auto-Slug and Favicon Override Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auto-generated-but-editable category slugs and optional website favicon overrides, while preserving the existing admin/public workflow and automatic favicon fallback behavior.

**Architecture:** Keep category and website editing in the current admin forms, but add a small frontend slug-generation state machine and persist an optional `faviconUrl` through the full stack. The public website row should render favicon sources in this order: custom favicon URL, auto-derived favicon from website URL, then the existing safe fallback data URL.

**Tech Stack:** React 19, TypeScript, Testing Library, Vitest, Cloudflare Worker, D1, Zod, CSS

---

## File structure

### Create
- `migrations/0002_add_website_favicon_url.sql` — D1 schema change for optional custom favicon URLs

### Modify
- `tests/frontend/category-form.test.tsx` — add auto-slug behavior coverage
- `tests/frontend/favicon.test.ts` — add favicon override precedence coverage
- `tests/worker/admin-websites.test.ts` — add favicon URL persistence/validation coverage
- `tests/worker/setup.ts` — load both migrations instead of hardcoding `0001_init.sql`
- `src/components/admin/CategoryForm.tsx` — auto-generate slug until user manually overrides it
- `src/components/admin/WebsiteForm.tsx` — add optional favicon URL field
- `src/components/public/WebsiteRow.tsx` — use favicon override before auto favicon
- `src/lib/favicon.ts` — add helper that prefers override URL and still falls back safely
- `src/types/website.ts` — add optional `faviconUrl`
- `worker/lib/validation.ts` — validate optional favicon URLs as blank-or-http/https
- `worker/types.ts` — add `favicon_url` / `faviconUrl` support in worker row/input types
- `worker/lib/repositories/websites.ts` — read and write `favicon_url`
- `worker/routes/admin-websites.ts` — map favicon URL through API responses and mutations
- `migrations/0001_init.sql` — unchanged; keep original init migration intact

---

### Task 1: Lock the new behavior with failing tests

**Files:**
- Modify: `tests/frontend/category-form.test.tsx`
- Modify: `tests/frontend/favicon.test.ts`
- Modify: `tests/worker/admin-websites.test.ts`
- Test: `tests/frontend/category-form.test.tsx`, `tests/frontend/favicon.test.ts`, `tests/worker/admin-websites.test.ts`

- [ ] **Step 1: Add a failing auto-slug test**

Append this test to `tests/frontend/category-form.test.tsx`:

```tsx
  it("auto-generates the slug from name until the user edits the slug manually", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/^name$/i);
    const slugInput = screen.getByLabelText(/^slug$/i);

    fireEvent.change(nameInput, { target: { value: "AI Tools" } });
    expect(slugInput).toHaveValue("ai-tools");

    fireEvent.change(slugInput, { target: { value: "custom-slug" } });
    fireEvent.change(nameInput, { target: { value: "AI Tools Updated" } });

    expect(slugInput).toHaveValue("custom-slug");
  });
```

- [ ] **Step 2: Add a failing favicon precedence test**

Replace `tests/frontend/favicon.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { getFaviconUrl, getWebsiteFaviconUrl } from "../../src/lib/favicon";

describe("getFaviconUrl", () => {
  it("derives a first-party favicon URL from the website origin", () => {
    expect(getFaviconUrl("https://chatgpt.com/path?q=1")).toBe("https://chatgpt.com/favicon.ico");
  });

  it("returns a resilient fallback for malformed URLs instead of throwing", () => {
    expect(() => getFaviconUrl("notaurl")).not.toThrow();
    expect(getFaviconUrl("notaurl")).toMatch(/^data:image\\/svg\\+xml,/);
  });
});

describe("getWebsiteFaviconUrl", () => {
  it("prefers a custom favicon URL when provided", () => {
    expect(
      getWebsiteFaviconUrl({
        url: "https://gemini.google.com",
        faviconUrl: "https://static.example.com/gemini.png",
      }),
    ).toBe("https://static.example.com/gemini.png");
  });

  it("falls back to the website favicon when no override is present", () => {
    expect(
      getWebsiteFaviconUrl({
        url: "https://chatgpt.com/path?q=1",
        faviconUrl: undefined,
      }),
    ).toBe("https://chatgpt.com/favicon.ico");
  });
});
```

- [ ] **Step 3: Add failing worker coverage for favicon URL persistence and validation**

Append these tests to `tests/worker/admin-websites.test.ts`:

```ts
  it("persists a custom favicon url when creating a website", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        title: "Gemini",
        url: "https://gemini.google.com",
        faviconUrl: "https://static.example.com/gemini.png",
        categoryId: category.id,
        sortOrder: 1,
        isVisible: true,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        faviconUrl: "https://static.example.com/gemini.png",
      }),
    );
  });

  it("rejects unsafe favicon override urls", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        title: "Gemini",
        url: "https://gemini.google.com",
        faviconUrl: "javascript:alert(1)",
        categoryId: category.id,
        sortOrder: 1,
        isVisible: true,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });
```

- [ ] **Step 4: Run the focused RED suite**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/category-form.test.tsx tests/frontend/favicon.test.ts
npx vitest run --config vitest.worker.config.ts tests/worker/admin-websites.test.ts
```

Expected:
- frontend slug and favicon override tests FAIL because the current form and favicon helper do not implement the new behavior
- worker favicon tests FAIL because the worker types, validation, repositories, and route mapping do not yet include `faviconUrl`

- [ ] **Step 5: Commit the failing baseline**

```bash
git add tests/frontend/category-form.test.tsx tests/frontend/favicon.test.ts tests/worker/admin-websites.test.ts
git commit -m "test: define slug and favicon behavior"
```

### Task 2: Persist favicon overrides through the worker and database

**Files:**
- Create: `migrations/0002_add_website_favicon_url.sql`
- Modify: `tests/worker/setup.ts`
- Modify: `worker/types.ts`
- Modify: `worker/lib/validation.ts`
- Modify: `worker/lib/repositories/websites.ts`
- Modify: `worker/routes/admin-websites.ts`
- Modify: `src/types/website.ts`
- Test: `tests/worker/admin-websites.test.ts`

- [ ] **Step 1: Add the migration and teach tests to load it**

Create `migrations/0002_add_website_favicon_url.sql`:

```sql
ALTER TABLE websites ADD COLUMN favicon_url TEXT;
```

Replace `tests/worker/setup.ts` with:

```ts
import initSql from "../../migrations/0001_init.sql?raw";
import faviconSql from "../../migrations/0002_add_website_favicon_url.sql?raw";
import { applyD1Migrations, env, reset } from "cloudflare:test";
import { beforeEach } from "vitest";

function toMigration(name: string, sql: string) {
  return {
    name,
    queries: sql
      .split(/;\\s*(?:\\r?\\n|$)/)
      .map((query) => query.trim())
      .filter(Boolean),
  };
}

const migrations = [
  toMigration("0001_init.sql", initSql),
  toMigration("0002_add_website_favicon_url.sql", faviconSql),
];

beforeEach(async () => {
  await reset();
  await applyD1Migrations(env.DB, migrations);
});
```

- [ ] **Step 2: Extend worker and frontend website shapes**

Update `src/types/website.ts`:

```ts
export type Website = {
  id: string;
  title: string;
  url: string;
  faviconUrl?: string | null;
  categoryId: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Update the `WebsiteRow` and `WebsiteInput` shapes in `worker/types.ts`:

```ts
export type WebsiteRow = {
  id: string;
  title: string;
  url: string;
  favicon_url: string | null;
  category_id: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type WebsiteInput = {
  id: string;
  title: string;
  url: string;
  favicon_url: string | null;
  category_id: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};
```

- [ ] **Step 3: Validate optional favicon URLs**

Update `worker/lib/validation.ts`:

```ts
import { z } from "zod";

const nonBlankString = z.string().trim().min(1);

const safeWebsiteUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Expected an http or https url");

const optionalSafeWebsiteUrlSchema = z
  .string()
  .trim()
  .transform((value) => value === "" ? null : value)
  .nullable()
  .refine((value) => {
    if (value === null) return true;
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Expected an http or https url");

export const websiteInputSchema = z.object({
  title: nonBlankString,
  url: safeWebsiteUrlSchema,
  faviconUrl: optionalSafeWebsiteUrlSchema.optional().default(null),
  categoryId: z.string().min(1),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
});
```

- [ ] **Step 4: Read and write favicon URLs in the repository and route**

Update `worker/lib/repositories/websites.ts` so every select includes `favicon_url`, and create/update statements persist it:

```ts
INSERT INTO websites (id, title, url, favicon_url, category_id, sort_order, is_visible, created_at, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
```

```ts
UPDATE websites
SET title = ?2,
    url = ?3,
    favicon_url = ?4,
    category_id = ?5,
    sort_order = ?6,
    is_visible = ?7,
    updated_at = ?8
WHERE id = ?1
```

Update `worker/routes/admin-websites.ts` so `toWebsite(row)` includes:

```ts
faviconUrl: row.favicon_url,
```

and create/update calls pass:

```ts
favicon_url: parsed.data.faviconUrl,
```

- [ ] **Step 5: Verify worker GREEN**

Run:

```bash
npx vitest run --config vitest.worker.config.ts tests/worker/admin-websites.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add migrations/0002_add_website_favicon_url.sql tests/worker/setup.ts worker/types.ts worker/lib/validation.ts worker/lib/repositories/websites.ts worker/routes/admin-websites.ts src/types/website.ts tests/worker/admin-websites.test.ts
git commit -m "feat: persist favicon overrides"
```

### Task 3: Add auto-slug behavior and favicon override fields to the admin/public UI

**Files:**
- Modify: `src/components/admin/CategoryForm.tsx`
- Modify: `src/components/admin/WebsiteForm.tsx`
- Modify: `src/components/public/WebsiteRow.tsx`
- Modify: `src/lib/favicon.ts`
- Test: `tests/frontend/category-form.test.tsx`, `tests/frontend/favicon.test.ts`

- [ ] **Step 1: Add a small slug helper inside `CategoryForm.tsx`**

Insert this helper near the top of `src/components/admin/CategoryForm.tsx`:

```ts
function slugifyCategoryName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
```

- [ ] **Step 2: Track whether the slug has been manually edited**

Update `CategoryForm` state:

```ts
const [hasManualSlugEdit, setHasManualSlugEdit] = useState(Boolean(initialValues?.slug));

useEffect(() => {
  setValues(createFormValues(initialValues));
  setHasManualSlugEdit(Boolean(initialValues?.slug));
  setErrorMessage(null);
}, [initialValues]);
```

Update the name input to auto-slug when manual override has not happened:

```tsx
onChange={(event) => {
  const nextName = event.target.value;
  setValues((current) => ({
    ...current,
    name: nextName,
    slug: hasManualSlugEdit ? current.slug : slugifyCategoryName(nextName),
  }));
}}
```

Update the slug input to mark manual override:

```tsx
onChange={(event) => {
  setHasManualSlugEdit(true);
  setValues((current) => ({ ...current, slug: event.target.value }));
}}
```

- [ ] **Step 3: Add `faviconUrl` to the website form contract**

Update `WebsiteFormValues` and defaults in `src/components/admin/WebsiteForm.tsx`:

```ts
export type WebsiteFormValues = {
  title: string;
  url: string;
  faviconUrl: string;
  categoryId: string;
  sortOrder: number;
  isVisible: boolean;
};

const emptyValues: WebsiteFormValues = {
  title: "",
  url: "https://",
  faviconUrl: "",
  categoryId: "",
  sortOrder: 0,
  isVisible: true,
};
```

Add a new optional form field after URL:

```tsx
<label className="admin-field">
  <span>Favicon URL (optional)</span>
  <input
    type="url"
    value={values.faviconUrl}
    onChange={(event) => setValues((current) => ({ ...current, faviconUrl: event.target.value }))}
    placeholder="https://static.example.com/icon.png"
  />
</label>
```

- [ ] **Step 4: Prefer favicon overrides in the public row helper**

Replace `src/lib/favicon.ts` with:

```ts
export function getFaviconUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}/favicon.ico`;
  } catch {
    return buildFallbackFaviconDataUrl(url);
  }
}

export function getWebsiteFaviconUrl(input: { url: string; faviconUrl?: string | null }): string {
  const override = input.faviconUrl?.trim();
  if (override) {
    return override;
  }

  return getFaviconUrl(input.url);
}

function buildFallbackFaviconDataUrl(seed: string): string {
  const glyph = seed.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#d97aa6"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#ffffff">${escapeXml(glyph)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
```

Update `src/components/public/WebsiteRow.tsx`:

```tsx
import { getWebsiteFaviconUrl } from "../../lib/favicon";

// ...
<img src={getWebsiteFaviconUrl({ url: website.url, faviconUrl: website.faviconUrl })} alt="" loading="lazy" />
```

- [ ] **Step 5: Verify frontend GREEN**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/category-form.test.tsx tests/frontend/favicon.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/CategoryForm.tsx src/components/admin/WebsiteForm.tsx src/components/public/WebsiteRow.tsx src/lib/favicon.ts tests/frontend/category-form.test.tsx tests/frontend/favicon.test.ts
git commit -m "feat: add auto slug and favicon override ui"
```

### Task 4: Final integration verification

**Files:**
- Verify existing modified files
- Test: full frontend + worker + build

- [ ] **Step 1: Run the focused suites again**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts
npx vitest run --config vitest.worker.config.ts tests/worker/admin-websites.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full project test suite**

Run:

```bash
npm test
```

Expected: PASS with 0 failures.

- [ ] **Step 3: Build the app**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: improve admin slugs and favicons"
```

## Plan self-review

### Spec coverage
- Auto-slug until manual override: Task 3, Steps 1-2
- Slug still editable: Task 3, Step 2
- Optional favicon override field: Task 3, Step 3
- Override > auto favicon > fallback rendering order: Task 3, Step 4
- Favicon validation and persistence: Task 2, Steps 2-4

### Placeholder scan
- No placeholder markers remain.
- No shorthand like “similar to above” remains.

### Type consistency
- Frontend field name stays `faviconUrl`.
- Worker/db field name stays `favicon_url`.
- `Website` / `WebsiteRow` / `WebsiteInput` are aligned on the new optional favicon field.
