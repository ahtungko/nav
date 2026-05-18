# Admin Auto-Slug and Favicon Override Design

**Date:** 2026-05-18  
**Project:** vyxolabs Hub admin forms  
**Status:** Design approved in conversation, awaiting final user review before implementation planning

## Goal

Improve the admin category and website forms by:

- auto-generating category slugs from the category name
- still allowing manual slug editing
- adding an optional website favicon URL override
- keeping automatic favicon generation as the fallback

## Problem

### Category slug

The current category editor requires manual slug entry every time.

That causes friction because:

- users repeat simple typing work
- users can make formatting mistakes
- the common case is predictable from the category name

### Website favicon

The current website icon flow depends entirely on automatic favicon lookup from the website URL.

That breaks down when:

- a site does not expose `/favicon.ico`
- a service like Gemini does not return a usable favicon
- the user wants to point to a better icon directly

## Scope

This change affects:

- admin category form slug UX
- admin website form favicon input
- website/public favicon rendering behavior
- website validation and stored website shape

It does **not** introduce:

- file uploads
- media storage systems
- AI-generated favicon assets

## Solution

## 1. Category slug behavior

### Auto-generate by default

When the user types a category name, the slug should auto-fill from it.

Expected transformation:

- lowercase
- trim whitespace
- replace spaces and separators with `-`
- remove unsupported characters
- collapse duplicate dashes

### Still editable

The slug remains a normal editable field.

Behavior rule:

- if the user has **not** manually changed the slug, keep auto-updating it from the name
- once the user manually edits the slug, stop overwriting it automatically

### New vs existing category behavior

- **New category:** starts in auto-slug mode
- **Existing category:** preserve the saved slug unless the user edits either field during that session

This prevents unwanted changes to already-established slugs.

## 2. Website favicon override

### Optional favicon URL field

Add an optional `faviconUrl` field to the website form.

Behavior:

- if the field is filled, use it
- if the field is empty, use automatic favicon resolution from the main website URL
- if auto-resolution still fails, use the existing safe fallback icon

### Validation

The optional favicon URL should:

- allow blank / null
- if present, require a valid `http:` or `https:` URL

## 3. Public favicon rendering order

The public website row/icon rendering should use this order:

1. `custom faviconUrl`
2. auto-generated favicon from the website `url`
3. safe fallback icon/data URL

## Data Shape Impact

The website shape should be extended with optional favicon override data.

Frontend/public/admin and worker row/input types should stay aligned on that field.

Likely naming:

- frontend/public/admin: `faviconUrl`
- worker/db layer: `favicon_url`

## File Impact

Likely affected files:

- `src/components/admin/CategoryForm.tsx`
- `src/components/admin/WebsiteForm.tsx`
- `src/components/public/WebsiteRow.tsx`
- `src/lib/favicon.ts`
- `src/types/website.ts`
- `worker/lib/validation.ts`
- `worker/types.ts`
- worker repository / route files for websites
- migration file for website schema if favicon override is persisted in D1

## Acceptance Criteria

This change is successful when:

- new category slugs auto-fill from the category name
- users can still manually edit the slug
- manual slug edits stop future auto-overwrites
- website form includes an optional favicon URL field
- if favicon URL is provided, public site uses it
- if favicon URL is empty, public site falls back to auto favicon behavior
- invalid favicon override URLs are rejected

## Implementation Readiness

This is a focused UX/data-flow enhancement and is ready for implementation planning.

The only structural caution is persistence: if favicon override is stored in D1, the schema, validation, worker types, and frontend types must all be updated consistently.
