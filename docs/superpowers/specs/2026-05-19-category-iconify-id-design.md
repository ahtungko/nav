# Category Iconify ID Support Design

**Goal:** Let admins keep using the current built-in category icon picker while optionally entering a custom Iconify icon ID with live preview.

## Scope

This change affects the admin category icon selection flow and the public/admin icon rendering path for category icons.

It does **not** introduce:

- file uploads
- icon asset storage
- backend schema changes
- database migrations
- a full in-app remote icon search experience

The stored value remains a single `iconKey` string.

## Current State

The app currently supports only a fixed built-in icon registry defined in `src/lib/category-icons.tsx`.

Examples of existing stored values:

- `ai`
- `website`
- `design`
- `resources`

The admin category form uses a visual picker for those built-in values and normalizes unknown values back to the default built-in icon.

## Problem

Admins now need to support additional icons beyond the built-in list, but the UI should remain simple and preserve compatibility with existing saved categories.

The desired workflow is:

1. keep the current built-in picker
2. allow pasting an Iconify-style ID such as `tabler:world`
3. preview the resulting icon live
4. store the chosen icon as the same single `iconKey` field already used throughout the app

## Proposed Design

### Hybrid icon selection

Keep the current built-in picker as the default icon selection mechanism.

Add a new optional admin input named something like **Custom Iconify ID** beneath the picker.

Examples shown in helper text:

- `tabler:world`
- `lucide:globe-2`

### Precedence rules

The effective icon value should be resolved in this order:

1. valid custom Iconify ID entered by the admin
2. selected built-in icon key
3. existing fallback icon behavior if rendering still cannot resolve a usable icon

This ensures custom icons override built-in ones only when intentionally supplied and valid.

### Stored value

The app continues storing a single string in `iconKey`.

That string may now be either:

- a built-in key such as `website`
- an Iconify ID such as `tabler:world`

No schema change is needed because both formats are strings.

## Rendering Model

### Built-in icons

Built-in icons should continue rendering with the existing local SVG registry.

### Custom Iconify icons

If `iconKey` matches an Iconify-style ID and is not one of the built-in keys, render it through an Iconify-compatible React renderer.

The renderer should be used in both:

- admin preview UI
- public category cards / category rail

### Fallback behavior

If a custom icon ID is blank, malformed, or cannot be rendered, the admin UI should not silently replace the saved value on its own.

Instead:

- the admin form should show validation feedback for malformed custom IDs
- the live preview should fall back to the selected built-in icon until the custom value becomes valid
- existing public rendering should continue to fall back safely if an unknown value still appears in stored data

## Validation Rules

The category icon value should accept either:

1. a known built-in icon key from the local registry
2. an Iconify-style ID in `prefix:name` format

At minimum, the custom format validator should require:

- non-empty string
- exactly one collection prefix separator `:`
- non-empty prefix
- non-empty icon name

Examples that should validate:

- `tabler:world`
- `lucide:globe-2`
- `mdi:web`

Examples that should fail:

- `tabler`
- `:world`
- `tabler:`
- `hello world`

## Admin UX

The category form should show:

1. built-in icon picker
2. custom Iconify ID input
3. live preview card showing the icon that will actually be used
4. helper text explaining that a valid custom icon overrides the built-in picker

Suggested preview copy:

- selected built-in key
- custom icon ID if present
- short note indicating which source is active

## Edit Behavior

When editing an existing category:

- if `iconKey` is a built-in key, the built-in picker selects that key and the custom field starts empty
- if `iconKey` is an Iconify ID, the custom field is prefilled with that ID and the built-in picker keeps a reasonable default or previous built-in selection for fallback preview purposes

The form must not erase a saved custom icon ID just because it is not in the built-in registry.

## Files Likely Affected

- `src/lib/category-icons.tsx`
- `src/components/admin/CategoryForm.tsx`
- `src/components/public/CategoryCard.tsx`
- `src/components/public/CategoriesRail.tsx`
- `src/styles/admin.css`
- validation shared between frontend and worker if icon constraints are enforced server-side

Potential additional files:

- worker validation if category icon values are currently treated as arbitrary non-blank strings and need stricter shared acceptance rules
- frontend/admin tests for form behavior and rendering precedence

## Acceptance Criteria

This design is successful when:

1. admins can still choose built-in icons visually
2. admins can optionally enter a custom Iconify ID
3. a valid custom Iconify ID overrides the built-in choice
4. built-in saved values continue to render unchanged
5. custom saved values render correctly in admin preview and public category UI
6. malformed custom values show validation feedback instead of silently becoming another saved value
7. the app still stores only one string field, `iconKey`

## Non-Goals

This design does not include:

- browsing Iconify icons inside the app
- downloading or caching icon packs manually
- tagging icons by category
- multiple icon fields per category
- migration of existing built-in keys into Iconify IDs
