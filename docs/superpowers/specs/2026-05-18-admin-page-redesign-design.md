# Admin Page Redesign Design

**Date:** 2026-05-18
**Project:** vyxolabs Hub admin workspace redesign
**Status:** Design approved in conversation, awaiting final user review before implementation planning

## 1. Goal

Redesign the `/admin` experience so it:

- follows the same theme family as the public homepage
- supports the same day / night / auto theme behavior
- feels completely different from the homepage in structure and purpose
- fixes the current non-scrollable admin trap
- improves CRUD usability for categories, websites, and publishing

The new admin should feel like a premium operations workspace rather than a public-facing landing page.

## 2. Current Problems

The current admin page has a few structural issues:

- global page scrolling is locked by shared layout rules
- admin content can overflow the viewport without a usable escape path
- the layout behaves too much like the public fixed-dashboard shell
- overview, forms, and tables do not have a strong operational hierarchy
- the page does not clearly separate editing workflows from publishing workflows

The most urgent bug is the scroll trap. A redesign should solve that at the layout architecture level, not just patch one overflowing section.

## 3. Non-Goals

This redesign does **not** change:

- backend API contracts
- CRUD rules
- auth/session behavior
- publish data flow
- category and website data models

This is a UX and layout redesign of the admin route, not a feature expansion.

## 4. Design Principles

### Shared theme family, different product surface

Admin should reuse the main app's theme system, color language, glass surfaces, glow mood, and typography family. However, it should not mimic the homepage composition. The admin route should feel sharper, denser, and more operational.

### Desktop-first workspace, responsive fallback

The primary editing experience is desktop-oriented:

- left: management surface
- right: sticky editing panel

On smaller screens the layout should collapse into a readable single-column flow instead of preserving cramped side-by-side columns.

### Scrolling must always work

Admin must allow natural vertical scrolling. No section of the admin experience should become unusable because the viewport is shorter than the content.

### Low-risk structural change

Keep current CRUD flows and API usage intact. Improve the presentation, page architecture, and feedback surfaces without introducing unnecessary product scope.

## 5. Layout Architecture

### 5.1 Dedicated admin shell

The admin route should use a dedicated shell instead of relying on the public fixed-viewport layout behavior.

This shell should:

- support the shared theme tokens and scene styling
- include the same theme toggle behavior as the public app
- honor the saved theme preference even when users land directly on `/admin`
- allow normal page scrolling
- use a wider, dashboard-style content frame than the homepage

This separates public browsing layout rules from admin workspace rules.

### 5.2 Command header

Replace the current hero with a tighter admin command header containing:

- admin title and supporting description
- key draft metrics
- publish status summary
- primary publish action

This header should feel more like a workspace command bar than a marketing banner.

### 5.3 Workspace switcher

Keep the existing top-level sections:

- Overview
- Categories
- Websites
- Publish

But redesign the tabs into a more intentional segmented workspace switcher with stronger active-state clarity.

### 5.4 Overview surface

Overview should become a true dashboard summary containing:

- total categories
- visible categories
- total websites
- visible websites
- current publish status
- quick guidance on what to do next

It should not simply repeat the same cards used elsewhere.

### 5.5 Editing workspace

For both **Categories** and **Websites**, use the same two-column desktop structure:

- **Left column:** filters, management table, empty states
- **Right column:** sticky editor panel

The left side is for browsing, scanning, and selecting records. The right side is for create/edit actions.

### 5.6 Publish surface

Publish should become its own focused release panel with:

- visible draft counts
- last published timestamp
- current publish feedback
- clear primary publish action

This separates release actions from day-to-day CRUD work.

## 6. Scrolling and Responsive Behavior

### 6.1 Scroll model

Admin must no longer inherit the global locked-scroll behavior used by the public homepage.

The intended behavior is:

- the admin page scrolls vertically as a normal document
- the sticky editor panel remains pinned within the viewport on desktop
- tables remain inside the normal document flow instead of forcing a full-page fixed-height composition
- horizontal overflow remains supported for wide tables and long URLs

### 6.2 Desktop behavior

On desktop:

- the page scrolls normally
- the right editor panel uses sticky positioning
- the left table area expands naturally with content
- command header and section switcher stay visually compact so content gets more usable space

### 6.3 Tablet and mobile behavior

On narrower screens:

- the layout stacks into a single column
- the editor panel moves below the table/filter surface
- no sticky side panel is required
- forms and actions remain full-width and touch-friendly

This avoids narrow, unusable two-column layouts.

## 7. Component Redesign

### 7.1 Header and summary cards

- Replace the oversized hero feel with a denser command header
- Keep premium surface styling from the main page
- Use cleaner metric cards with stronger operational labels

### 7.2 Tables

Categories and websites should stay as data tables, but be redesigned for easier scanning:

- stronger row rhythm
- clearer action grouping
- better visual separation between metadata and actions
- more legible long URLs
- clearer selected/editing state

### 7.3 Sticky editor panel

The right editor should be a dedicated card with:

- create/edit mode title
- grouped fields
- stronger save/cancel actions
- clear empty state when nothing is selected

This panel is the core interaction surface for CRUD work.

### 7.4 Filters

Keep current filter capabilities, but elevate them into cleaner utility controls:

- category search
- website search
- website category filter

Filters should feel integrated with the workspace rather than like isolated standalone cards.

### 7.5 Feedback surfaces

Global feedback should be more visible and more intentional:

- success states near the workspace header
- action-specific feedback near the relevant panel when useful
- clearer error styling

The UI should feel stable and informative during admin actions.

### 7.6 Empty states

Empty states should look designed, not accidental:

- no categories yet
- no websites in the selected filter
- no selected item in the editor
- no publish yet / no recent publish data

## 8. Interaction Model

### Categories and websites

- Clicking **Edit** selects the record and loads it into the sticky editor
- Create mode shows a blank editor state
- Saving keeps the user inside the same workspace
- Selection state remains visually obvious after save

### Publish

- Publish remains a manual action
- Success updates visible publish metadata and workspace feedback
- Failure keeps the user in context with readable status messaging

### Session and load failures

If auth expires or admin data fails to load, the route should still present readable status surfaces rather than collapsing into awkward layout fragments.

## 9. Visual System

Admin should remain connected to the public homepage through:

- shared theme tokens
- shared day / night / auto mode behavior
- shared material treatment for cards, borders, glow, and blur
- shared typography family

Admin should differentiate itself through:

- denser spacing
- stronger information hierarchy
- more functional composition
- less showcase-style hero treatment

The result should feel like the same brand ecosystem, but a different product surface.

## 10. File Impact

The redesign should primarily affect:

- `src/routes/admin.tsx`
- `src/app/admin/AdminPage.tsx`
- `src/app/admin/LoginPage.tsx`
- `src/components/admin/AdminTabs.tsx`
- `src/components/admin/CategoriesTable.tsx`
- `src/components/admin/CategoryForm.tsx`
- `src/components/admin/WebsitesTable.tsx`
- `src/components/admin/WebsiteForm.tsx`
- `src/components/admin/PublishPanel.tsx`
- `src/styles/admin.css`

Supporting layout/theme work may also touch:

- `src/components/layout/AppShell.tsx`
- `src/components/public/ThemeToggle.tsx`
- `src/styles/globals.css`
- `src/styles/theme.css`

The main public homepage layout should remain structurally unchanged.

## 11. Testing and Acceptance Criteria

The redesign is successful when all of the following are true:

- admin content can always be vertically scrolled when it exceeds the viewport
- desktop categories and websites views show a left management area and sticky right editor
- smaller screens collapse into a readable single-column layout
- wide data still supports horizontal overflow safely
- theme consistency with the main page is preserved
- admin looks clearly different from the homepage
- CRUD flows still work with the existing backend behavior
- publish feedback remains visible and understandable

## 12. Implementation Readiness

This redesign is scoped tightly enough for a single implementation plan.

The work is mostly frontend and styling focused, with one important structural change: admin must stop inheriting the public page's locked-scroll layout assumptions. Once that shell behavior is addressed, the rest of the redesign can be implemented within the existing admin route and component structure.
