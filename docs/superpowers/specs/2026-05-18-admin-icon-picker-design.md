# Admin Category Icon Picker Design

**Date:** 2026-05-18  
**Project:** vyxolabs Hub admin category editor  
**Status:** Design approved in conversation, awaiting final user review before implementation planning

## Goal

Replace the current raw `iconKey` text input in the admin category form with a built-in visual icon picker so admins can select a category icon without guessing key names.

## Problem

The current category editor asks users to type an `iconKey` manually.

That creates several UX problems:

- users do not know which icon keys are valid
- the `sparkles` placeholder implies a value that may not match the actual icon set
- invalid or unexpected values degrade the public category card display
- the workflow is slower than clicking a visible icon

## Scope

This change affects only the **admin category icon selection flow**.

It does **not** introduce:

- AI-generated icons
- file uploads
- backend schema changes
- database migrations

The stored value remains the same `iconKey` string already used by the public homepage renderer.

## Solution

### Built-in icon picker

Replace the free-text `iconKey` field with a visual picker containing the built-in supported icons.

Each option should show:

- the icon preview
- a readable label
- a selected state when active

The user chooses by clicking an icon tile instead of typing.

### Live selection feedback

The category form should show the currently selected icon clearly so the user knows what will appear on the public homepage.

This can be done by:

- highlighting the active tile
- optionally showing a small selected preview block near the picker label

### Stable saved values

Each tile maps to a stable `iconKey` string such as:

- `ai`
- `website`
- `design`
- `dev`
- `productivity`

Submitting the form still sends the same `iconKey` field to the existing API.

## Public Rendering

The public homepage should continue using the existing icon rendering logic based on `iconKey`.

No public behavior change is required beyond ensuring the picker and renderer use the same supported icon list.

## File Impact

Likely affected files:

- `src/components/admin/CategoryForm.tsx`
- `src/components/public/CategoryCard.tsx`
- `src/styles/admin.css`

Potentially useful refactor:

- extract a shared icon registry/helper so admin picker and public category rendering do not duplicate icon definitions

## Acceptance Criteria

The change is successful when:

- admins can choose icons visually without typing raw keys
- only supported icons can be selected
- the selected icon is obvious in the form
- submitted data still uses the existing `iconKey` format
- public category cards still render the chosen icon correctly

## Implementation Readiness

This is a small, focused frontend change and does not need backend redesign.

It is ready for a short implementation plan once the written spec is reviewed.
