# Admin Icon Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin category `iconKey` text field with a built-in visual icon picker while keeping the existing backend/API contract unchanged.

**Architecture:** Add one shared category-icon registry so the admin picker and public category cards both use the same supported icon set. Write failing frontend tests first, then swap the form field for an accessible radiogroup-based picker, update public icon rendering to use the shared registry, and finish with targeted admin styling plus full verification.

**Tech Stack:** React 19, TypeScript, Testing Library, Vitest, CSS

---

## File structure

### Create
- `src/lib/category-icons.tsx` — shared built-in icon catalog and rendering helpers
- `tests/frontend/category-form.test.tsx` — focused icon-picker behavior test

### Modify
- `src/components/admin/CategoryForm.tsx` — replace raw `iconKey` input with visual picker
- `src/components/public/CategoryCard.tsx` — use shared icon catalog instead of local switch
- `src/styles/admin.css` — add icon picker grid, selected states, and live preview styling
- `tests/frontend/admin-page.test.tsx` — verify admin route shows picker instead of raw icon field

---

### Task 1: Lock the icon-picker behavior with failing tests

**Files:**
- Create: `tests/frontend/category-form.test.tsx`
- Modify: `tests/frontend/admin-page.test.tsx`
- Test: `tests/frontend/category-form.test.tsx`, `tests/frontend/admin-page.test.tsx`

- [ ] **Step 1: Add a failing unit test for the picker**

Create `tests/frontend/category-form.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryForm } from "../../src/components/admin/CategoryForm";

describe("CategoryForm icon picker", () => {
  it("renders built-in icon choices and submits the selected icon key", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} />);

    expect(screen.queryByLabelText(/icon key/i)).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /category icon/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /design/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Design" } });
    fireEvent.change(screen.getByLabelText(/slug/i), { target: { value: "design" } });
    fireEvent.change(screen.getByLabelText(/sort order/i), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /save category/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        iconKey: "design",
      }),
    );
  });
});
```

- [ ] **Step 2: Add a failing admin-route assertion**

Update the successful categories-tab section in `tests/frontend/admin-page.test.tsx`:

```tsx
    fireEvent.click(screen.getByRole("tab", { name: /^Categories$/i }));
    expect(await screen.findByRole("heading", { name: /^Create category$/i })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /category icon/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/icon key/i)).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /ai/i })).toBeInTheDocument();
```

- [ ] **Step 3: Run the focused frontend tests to verify RED**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/category-form.test.tsx tests/frontend/admin-page.test.tsx
```

Expected: FAIL because `CategoryForm` still renders a raw text input labeled `Icon key` and no radiogroup exists yet.

- [ ] **Step 4: Commit the failing test baseline**

```bash
git add tests/frontend/category-form.test.tsx tests/frontend/admin-page.test.tsx
git commit -m "test: define admin icon picker behavior"
```

### Task 2: Implement the shared icon catalog and picker UI

**Files:**
- Create: `src/lib/category-icons.tsx`
- Modify: `src/components/admin/CategoryForm.tsx`
- Modify: `src/components/public/CategoryCard.tsx`
- Modify: `src/styles/admin.css`
- Test: `tests/frontend/category-form.test.tsx`, `tests/frontend/admin-page.test.tsx`

- [ ] **Step 1: Add the shared built-in icon registry**

Create `src/lib/category-icons.tsx`:

```tsx
import type { ReactNode } from "react";

export const CATEGORY_ICON_OPTIONS = [
  {
    key: "ai",
    label: "AI",
    className: "category-card__icon--ai",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="12" r="2.5" />
        <circle cx="15" cy="12" r="2.5" />
        <path d="M3.5 12h3M17.5 12h3M9 5.5v2M15 5.5v2M9 16.5v2M15 16.5v2" />
      </svg>
    ),
  },
  {
    key: "website",
    label: "Website",
    className: "category-card__icon--website",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2.5 2.2 3.7 4.9 3.7 8S14.5 17.8 12 20M12 4c-2.5 2.2-3.7 4.9-3.7 8S9.5 17.8 12 20" />
      </svg>
    ),
  },
  {
    key: "design",
    label: "Design",
    className: "category-card__icon--design",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4a8 8 0 1 1 0 16h-1.2a2.4 2.4 0 0 1 0-4.8h1.7A2.5 2.5 0 0 0 15 12.7A2.5 2.5 0 0 0 12.5 10h-.3a2.8 2.8 0 0 1 0-5.6H12Z" />
        <circle cx="8" cy="11" r="1" />
        <circle cx="10.5" cy="7.5" r="1" />
        <circle cx="14.5" cy="7.5" r="1" />
      </svg>
    ),
  },
  {
    key: "resources",
    label: "Resources",
    className: "category-card__icon--resources",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4c4.2 0 7.6 3.4 7.6 7.6S16.2 19.2 12 19.2S4.4 15.8 4.4 11.6S7.8 4 12 4Z" />
        <path d="M12 7.2v4.4l2.8 2.4" />
      </svg>
    ),
  },
  {
    key: "dev",
    label: "Dev Tools",
    className: "category-card__icon--dev",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8l-4 4l4 4M16 8l4 4l-4 4M13.5 5l-3 14" />
      </svg>
    ),
  },
  {
    key: "productivity",
    label: "Productivity",
    className: "category-card__icon--productivity",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l2.6 5.3l5.9.8l-4.2 4.1l1 5.8L12 16.2L6.7 19l1-5.8l-4.2-4.1l5.9-.8L12 3Z" />
      </svg>
    ),
  },
  {
    key: "entertainment",
    label: "Entertainment",
    className: "category-card__icon--entertainment",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8h8a4 4 0 0 1 4 4v3a3 3 0 0 1-3 3h-1.5L13 15.8h-2L8.5 18H7a3 3 0 0 1-3-3v-3a4 4 0 0 1 4-4Z" />
        <path d="M9 12h.01M15 12h.01M10 15l1-1M14 15l-1-1" />
      </svg>
    ),
  },
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_OPTIONS)[number]["key"];
export type CategoryIconOption = (typeof CATEGORY_ICON_OPTIONS)[number];

function getFallbackIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

export function getCategoryIconOption(iconKey: string): CategoryIconOption | null {
  return CATEGORY_ICON_OPTIONS.find((option) => option.key === iconKey) ?? null;
}

export function renderCategoryIcon(iconKey: string): ReactNode {
  return getCategoryIconOption(iconKey)?.renderIcon() ?? getFallbackIcon();
}

export function getCategoryIconClassName(iconKey: string): string {
  return getCategoryIconOption(iconKey)?.className ?? "category-card__icon--fallback";
}
```

- [ ] **Step 2: Replace the form text field with an accessible picker**

Replace the `Icon key` input section in `src/components/admin/CategoryForm.tsx` and normalize the default:

```tsx
import { type FormEvent, useEffect, useState } from "react";
import { CATEGORY_ICON_OPTIONS, getCategoryIconOption, renderCategoryIcon, getCategoryIconClassName } from "../../lib/category-icons";

const DEFAULT_ICON_KEY = CATEGORY_ICON_OPTIONS[0].key;

function resolveIconKey(iconKey?: string | null) {
  return getCategoryIconOption(iconKey ?? "")?.key ?? DEFAULT_ICON_KEY;
}

const emptyValues: CategoryFormValues = {
  name: "",
  slug: "",
  iconKey: DEFAULT_ICON_KEY,
  sortOrder: 0,
  isVisible: true,
};

// inside component
useEffect(() => {
  setValues(
    initialValues
      ? { ...initialValues, iconKey: resolveIconKey(initialValues.iconKey) }
      : emptyValues,
  );
  setErrorMessage(null);
}, [initialValues]);

const selectedIcon = getCategoryIconOption(values.iconKey) ?? CATEGORY_ICON_OPTIONS[0];

<div className="admin-field">
  <span>Category icon</span>

  <div className="admin-icon-preview">
    <span className={`category-card__icon ${getCategoryIconClassName(selectedIcon.key)}`}>
      {renderCategoryIcon(selectedIcon.key)}
    </span>
    <strong>{selectedIcon.label}</strong>
  </div>

  <div className="admin-icon-picker" role="radiogroup" aria-label="Category icon">
    {CATEGORY_ICON_OPTIONS.map((option) => (
      <button
        key={option.key}
        type="button"
        role="radio"
        aria-checked={values.iconKey === option.key}
        className={`admin-icon-picker__option${values.iconKey === option.key ? " is-selected" : ""}`}
        onClick={() => setValues((current) => ({ ...current, iconKey: option.key }))}
      >
        <span className={`category-card__icon ${getCategoryIconClassName(option.key)}`}>
          {renderCategoryIcon(option.key)}
        </span>
        <span>{option.label}</span>
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Make public category cards use the shared catalog**

Replace the local icon switch in `src/components/public/CategoryCard.tsx`:

```tsx
import { getCategoryIconClassName, renderCategoryIcon } from "../../lib/category-icons";

type CategoryCardProps = {
  name: string;
  iconKey: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

function formatCount(count: number) {
  return `${count} items`;
}

export function CategoryCard({ name, iconKey, count, active, onClick }: CategoryCardProps) {
  const iconClassName = `category-card__icon ${getCategoryIconClassName(iconKey)}`;

  return (
    <button type="button" className={`category-card${active ? " is-active" : ""}`} aria-pressed={active} onClick={onClick}>
      <div className="category-card__content">
        <div className="category-card__heading">
          <span className={iconClassName}>{renderCategoryIcon(iconKey)}</span>
          <h3>{name}</h3>
        </div>
        <span className="category-card__meta">{formatCount(count)}</span>
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Add picker styling**

Append to `src/styles/admin.css`:

```css
.admin-icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  background: color-mix(in srgb, var(--color-surface-elevated) 82%, transparent);
}

.admin-icon-preview strong {
  color: var(--color-heading);
  font-size: 0.96rem;
}

.admin-icon-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.admin-icon-picker__option {
  display: grid;
  gap: 10px;
  justify-items: start;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  background: color-mix(in srgb, var(--color-surface-elevated) 72%, transparent);
  color: var(--color-text);
  text-align: left;
}

.admin-icon-picker__option.is-selected {
  border-color: color-mix(in srgb, var(--color-accent) 62%, white);
  background: color-mix(in srgb, var(--color-surface-strong) 78%, transparent);
  box-shadow: 0 12px 28px rgba(155, 109, 255, 0.16);
}
```

- [ ] **Step 5: Run the focused tests to verify GREEN**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts tests/frontend/category-form.test.tsx tests/frontend/admin-page.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run broader verification**

Run:

```bash
npx vitest run --config vitest.frontend.config.ts
npm run build
npm test
```

Expected: all frontend tests pass, build succeeds, and full project tests remain green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/category-icons.tsx src/components/admin/CategoryForm.tsx src/components/public/CategoryCard.tsx src/styles/admin.css tests/frontend/category-form.test.tsx tests/frontend/admin-page.test.tsx
git commit -m "feat: add visual category icon picker"
```

## Plan self-review

### Spec coverage
- Visual built-in picker replaces raw text field: Task 2, Steps 1-2
- Selected icon is obvious in the form: Task 2, Steps 2 and 4
- Same stored `iconKey` format remains: Task 2, Step 2
- Public rendering stays aligned with selected built-ins: Task 2, Step 3

### Placeholder scan
- No placeholder markers remain.
- No unresolved shorthand or deferred implementation instructions remain.

### Type consistency
- Shared icon keys remain stable strings (`ai`, `website`, `design`, `resources`, `dev`, `productivity`, `entertainment`).
- Both admin and public components consume the same shared helper module.
