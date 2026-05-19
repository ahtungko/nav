# VyxoLabs Hub

A Cloudflare-hosted navigation site with:

- public homepage
- day / night / auto theme
- local pinned links
- admin login
- category + website CRUD
- publish flow from D1 draft data to KV public snapshot

> Note: `darkmode.html` and `daymode.html` are design reference files kept in the repo root. The actual app is the React + Worker project under `src/` and `worker/`.

---

## Stack

- React + Vite
- React Router
- Zustand
- Zod
- Cloudflare Workers / Pages-compatible build
- Cloudflare D1
- Cloudflare KV
- Vitest

---

## Features

### Public site
- fixed dashboard layout
- `day`, `night`, and `auto` theme
- category rail
- pinned links stored in `localStorage`
- recently added section
- client-side search
- automatic favicon handling with safe fallback

### Admin
- password login
- categories CRUD
- websites CRUD
- sorting / visibility controls
- publish current draft to `public-site:v1`

### Data flow
- **Draft/source data** lives in D1
- **Published public data** lives in KV
- public UI reads the published snapshot, not D1 directly

---

## Project structure

```txt
public/              static assets (daymode.png / darkmode.png)
src/                 React frontend
  app/               page-level UI
  components/        layout/public/admin components
  features/          theme, pinned, search
  lib/               fetcher, favicon, storage helpers
  routes/            route modules
  styles/            CSS
  types/             shared frontend types
worker/              Worker routes + backend helpers
migrations/          D1 SQL migrations
tests/               frontend + worker tests
```

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Apply local D1 migrations

```bash
npx wrangler d1 migrations apply vyxolabs-hub --local
```

### 3. Run tests

```bash
npm run test
```

### 4. Start dev mode

```bash
npm run dev
```

### 5. Production build

```bash
npm run build
```

### 6. Preview build locally

```bash
npm run preview
```

---

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:watch
npm run deploy
```

---

## Cloudflare setup

This repo already expects:

- one D1 database bound as `DB`
- one KV namespace bound as `PUBLIC_SNAPSHOT`
- two secrets named `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`

### Create resources

```bash
npx wrangler d1 create vyxolabs-hub
npx wrangler kv namespace create PUBLIC_SNAPSHOT
```

### Apply remote migrations

```bash
npx wrangler d1 migrations apply vyxolabs-hub --remote
```

### Set admin secrets

`ADMIN_PASSWORD` is the human-entered admin login password.

`ADMIN_SESSION_SECRET` is a long random secret used only for signing admin session cookies.

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

### Deploy

```bash
npm run deploy
```

---

## Important deployment note

The app is **not fully deployable until both `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are set**.

If deploy is blocked, check:

1. Cloudflare auth/account context is valid
2. `wrangler.jsonc` points at the correct D1 / KV resources
3. `ADMIN_PASSWORD` secret exists
4. `ADMIN_SESSION_SECRET` secret exists

---

## Publish flow

1. Log in at `/admin`
2. Create / edit categories and websites
3. Click **Publish**
4. Worker builds a snapshot from visible D1 records
5. Snapshot is written to KV under `public-site:v1`
6. Public homepage reads that snapshot

---

## Theme behavior

- `day`: force day theme
- `night`: force night theme
- `auto`: follow system theme

Pinned links and theme preference are browser-local.

---

## Validation / safety notes

- website URLs are restricted to `http:` / `https:`
- malformed favicon URLs do not crash rendering
- category deletion is blocked if websites still belong to that category
- admin session uses signed, time-bounded cookies with a dedicated signing secret

---

## Current repo status notes

- `darkmode.html` / `daymode.html` remain as visual references only
- the real app entry is `index.html` -> `src/main.tsx`
- if you want multi-environment Cloudflare setup later, add `env` sections to `wrangler.jsonc`

---

## Next possible improvements

- add `typecheck` script
- add staging/prod `wrangler` environments
- add publish history / rollback
- add richer admin feedback states
- add stronger route-level test coverage for unpublished snapshot and network failures
