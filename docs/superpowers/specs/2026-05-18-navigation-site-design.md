# Navigation Site Design

**Date:** 2026-05-18
**Project:** vyxolabs Hub navigation site
**Status:** Draft design approved in conversation, awaiting final user review before implementation planning

## 1. Goal

Build vyxolabs Hub into a real deployable project on Cloudflare: a public navigation site with day/night/auto themes plus a password-protected admin area for managing categories, websites, sorting, visibility, and publishing.

The public site should be optimized for high-read traffic, while admin editing should remain simple and low-maintenance for a single owner.

## 2. Product Scope

### In scope for first version

- Public navigation homepage
- Day / night / auto themes
- Single admin password login
- Admin CRUD for categories
- Admin CRUD for websites
- Category and website sorting
- Visibility toggles
- Publish workflow from draft data to public snapshot
- Visitor-local pinned items using localStorage
- Automatic website favicon loading from URL
- Preset icon selection for categories

### Out of scope for first version

- Multi-admin support
- Visitor accounts
- Cross-device pinned sync
- File uploads
- Rich text descriptions
- Public user submissions
- Rollback/version history UI
- Scheduled publish
- Separate preview environment UI

## 3. Platform Architecture

### Cloudflare services

- **Cloudflare Pages**: host frontend app
- **Cloudflare Worker / Pages Functions**: serve API endpoints
- **Cloudflare D1**: store admin draft/source data
- **Cloudflare KV**: store published public snapshot
- **Cloudflare Secrets**: store admin password
- **Browser localStorage**: store visitor pinned items and theme preference

### Why this architecture

This project is a low-write, high-read navigation site. Draft editing belongs in D1, but public reads should not hit D1 directly. Instead, admin publish generates a public snapshot stored in KV so the public app can read a stable published payload.

## 4. Content Model

### Categories table

`categories`

- `id`
- `name`
- `slug`
- `icon_key`
- `sort_order`
- `is_visible`
- `created_at`
- `updated_at`

### Websites table

`websites`

- `id`
- `title`
- `url`
- `category_id`
- `sort_order`
- `is_visible`
- `created_at`
- `updated_at`

### Notes

- `created_at` powers Recently Added
- `updated_at` is for admin tracking only, not recent ordering
- No website description field in v1
- No manually managed `is_recent`
- No public/global pinned field in D1

## 5. Published Snapshot Model

Published data is stored as a single public snapshot in KV.

### KV key

- `public-site:v1`

### Snapshot shape

```json
{
  "version": 1,
  "publishedAt": "2026-05-18T00:00:00.000Z",
  "categories": [
    {
      "id": "cat_xxx",
      "name": "AI",
      "slug": "ai",
      "iconKey": "ai",
      "sortOrder": 1
    }
  ],
  "websites": [
    {
      "id": "site_xxx",
      "title": "ChatGPT",
      "url": "https://chatgpt.com",
      "categoryId": "cat_xxx",
      "sortOrder": 1,
      "createdAt": "2026-05-18T00:00:00.000Z"
    }
  ]
}
```

### Public read rule

The public app reads the published snapshot only. It does not read D1 directly.

## 6. Public UX Rules

### Layout

- Public homepage is a fixed-viewport dashboard
- Page itself should not vertically scroll
- Categories rail horizontally scrolls/drags inside its section
- Pinned and Recently Added scroll inside their own sections when needed
- Day and night themes share identical layout metrics; only theme tokens change

### Themes

- `day`
- `night`
- `auto` = follow system theme

Theme preference is stored in localStorage using a frontend theme store.

### Pinned

Pinned is visitor-local only.

- Stored in localStorage
- Contains website IDs only
- Can be added from Recently Added and future website surfaces
- Does not sync across devices
- Does not write to D1 or KV

### Recently Added

Recently Added is derived automatically.

- Sort by `created_at desc`
- Take the first N public visible websites
- Recommended v1 count: 6 items in compact right-side panel

### Categories

Categories are visible public entry cards.

- Render visible categories only
- Order by `sort_order asc`
- Use preset icon from `icon_key`
- Category UI remains part of the public homepage shell

### Website click behavior

- Open website in new tab
- Pin/unpin locally when pin UI is available
- No internal website details page in v1

### Website icons

- Auto derive favicon from URL
- Fallback to default icon if favicon fails
- No manual website icon upload in v1

### Search

Search runs entirely on published snapshot data in the browser.

- Search title
- Search URL
- Optionally search category name
- No per-keystroke API calls

## 7. Admin UX Rules

Admin entry is `/admin`.

### Admin tabs

- `Overview`
- `Categories`
- `Websites`
- `Publish`

### Admin auth

- Single password stored in Cloudflare Secret
- Successful login creates HTTP-only session cookie
- `/api/admin/*` requires valid admin session
- No admin user table in D1
- No JWT in v1

### Categories management

Admin can:

- Create category
- Edit category
- Delete category
- Reorder category
- Hide/show category
- Choose preset icon

Delete rule:

- A category with attached websites cannot be deleted until those websites are moved or removed

### Websites management

Admin can:

- Create website
- Edit website
- Delete website
- Reorder website
- Hide/show website
- Change website category

Recommended admin filtering in v1:

- Search by title or URL
- Filter by category

### Publish workflow

Draft edits do not affect public site until published.

Publish process:

1. Read visible categories and websites from D1
2. Sort categories by `sort_order asc`
3. Sort websites by `category_id`, then `sort_order asc`
4. Build normalized public snapshot
5. Write snapshot to KV
6. Return `publishedAt`, version, and counts to admin UI

Publish tab should show:

- Last published time
- Current draft counts
- Publish button
- Success/failure status

## 8. Frontend Technical Design

### Stack

- React
- Vite
- React Router
- Zustand
- Native fetch with small fetch wrapper
- CSS variables / theme tokens

### Frontend state

Use Zustand for:

- Theme preference
- Visitor pinned items

Use local React state for:

- Forms
- Tabs
- Modals
- Local editing state

### Theme system

Do not keep separate page implementations for day and night. Instead:

- One shared component/layout tree
- Shared layout metrics
- Different theme tokens and background assets
- `data-theme="day" | "night"`

## 9. Backend Technical Design

### API surface

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/websites`
- `POST /api/admin/websites`
- `PUT /api/admin/websites/:id`
- `DELETE /api/admin/websites/:id`
- `POST /api/admin/publish`
- `GET /api/public/site`

### Validation

- Light validation in frontend forms
- Strict validation in Worker using Zod

### Data access layering

Worker code should separate:

- Route handlers
- Auth helpers
- D1 repositories
- KV helpers
- Snapshot publish builder

## 10. Project Structure

```txt
nav/
  public/
    daymode.png
    darkmode.png

  src/
    app/
      public/
        HomePage.tsx
      admin/
        AdminPage.tsx
        LoginPage.tsx

    components/
      layout/
        AppShell.tsx
        TopBar.tsx
        Footer.tsx
      public/
        CategoriesRail.tsx
        CategoryCard.tsx
        PinnedPanel.tsx
        RecentPanel.tsx
        WebsiteList.tsx
        WebsiteRow.tsx
        ThemeToggle.tsx
        SearchBar.tsx
      admin/
        AdminTabs.tsx
        CategoriesTable.tsx
        CategoryForm.tsx
        WebsitesTable.tsx
        WebsiteForm.tsx
        PublishPanel.tsx

    features/
      theme/
        theme-store.ts
        theme-tokens.ts
        apply-theme.ts
      pinned/
        pinned-store.ts
      search/
        search-websites.ts
      categories/
        category-utils.ts
      websites/
        website-utils.ts
      publish/
        snapshot-types.ts

    lib/
      favicon.ts
      local-storage.ts
      fetcher.ts
      constants.ts

    routes/
      index.tsx
      admin.tsx

    styles/
      globals.css
      theme.css
      public.css
      admin.css

    types/
      category.ts
      website.ts
      snapshot.ts
      auth.ts

    main.tsx

  worker/
    index.ts
    routes/
      auth.ts
      admin-categories.ts
      admin-websites.ts
      admin-publish.ts
      public-site.ts
    lib/
      auth.ts
      d1.ts
      kv.ts
      response.ts
      validation.ts
      snapshot.ts
    types.ts

  migrations/
    0001_init.sql

  package.json
  vite.config.ts
  wrangler.toml
  tsconfig.json
```

## 11. Constraints and Principles

- Day and night themes must share geometry and structure
- Theme differences should stay in colors, images, opacity, borders, and shadows
- Public traffic should avoid direct D1 reads
- Draft and published states must remain separate
- Visitor pinned state must remain local-only in v1
- First version should avoid unnecessary upload systems or account systems

## 12. Future Extensions

Possible later additions:

- Descriptions
- Public/global featured websites
- Preview mode before publish
- Publish history and rollback
- Multi-admin support
- File uploads for custom theme assets
- Cross-device visitor sync if user accounts are ever added

## 13. Open Decisions Already Resolved

Resolved in conversation:

- Platform: Cloudflare, not Vercel
- Stack: React + Vite + Worker API + D1 + KV
- Auth: single admin password in Secret
- Theme: same layout, visual-only day/night/auto
- Auto theme: follow system
- Public pinned: localStorage only
- Category icons: preset list
- Website icons: automatic favicon
- No upload system in v1
- Publish required before public site updates

## 14. Implementation Readiness

This design is scoped for a single implementation plan. It is not split into multiple subsystems because the public site, admin area, and publish workflow are tightly coupled and still small enough for one coordinated project.
