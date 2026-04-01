# TogetherHere Activities — Production Parity Comparison Checklist

This checklist compares the current repo implementation (`index.html`, `index.css`, `index.js`) against a production-style Activities experience and organizes missing work into implementation tasks.

> Priority legend: **P0 blocker** (must-have for production-like behavior), **P1 core parity**, **P2 polish**.

## 1) Data layer (API, auth/session, persistence)

### Current state in this repo
- Data is loaded from static seed objects and browser `localStorage` (`th_activities_v1`).
- Join/leave/create actions mutate client-side arrays only.
- No auth, no user identity, no API integration, no server-side validation.

### Missing behavior/UI mapped to concrete tasks

#### P0 blockers
- [ ] **Replace localStorage source-of-truth with backend Activities API integration.**
  - Implement `GET /activities` (list) call on page load and on filter/sort updates.
  - Implement `POST /activities` for creation with server validation errors surfaced in UI.
  - Implement `POST /activities/:id/rsvp` and `DELETE /activities/:id/rsvp` for authenticated RSVP actions.
  - Add request lifecycle states: idle/loading/error/retry for all network calls.

- [ ] **Add authenticated session handling for all mutating actions.**
  - Require logged-in user for create/join/leave/moderation actions.
  - Attach bearer token or secure session cookie to API requests.
  - Handle `401/403` with sign-in redirect or auth modal.
  - Gate CTA visibility/disabled state by auth + role.

- [ ] **Define server persistence model parity.**
  - Align front-end model to backend schema (id, hostId, startsAt, timezone, capacity, status, visibility, createdAt, updatedAt).
  - Persist RSVP state per user on server; remove `userJoined` as local-only flag.
  - Ensure participant count and full-state derive from backend response, not client increments.

#### P1 core parity
- [ ] **Implement paginated querying.**
  - Add `page`, `pageSize`, and total count handling.
  - Support cursor or offset pagination based on production API contract.
  - Preserve filters/sort across page changes.

- [ ] **Add normalized error taxonomy and telemetry hooks.**
  - Standardize API error parsing (validation, conflict, auth, rate limit).
  - Emit analytics/logging events for list load failures and RSVP/create failures.

#### P2 polish
- [ ] **Add optimistic updates with rollback for RSVP actions.**
  - Show immediate RSVP state change with rollback on API failure.
  - Surface conflict messaging (e.g., capacity reached mid-action).

---

## 2) UI structure (missing sections/components)

### Current state in this repo
- Single header + search/category controls + card grid.
- Create modal and details modal exist.
- No dedicated empty/error/loading states per section.

### Missing behavior/UI mapped to concrete tasks

#### P0 blockers
- [ ] **Add top-level auth-aware shell components.**
  - User menu/avatar/sign-in status.
  - Auth-required banners for guest users attempting RSVP/create.

- [ ] **Add robust state containers around activity list.**
  - Loading skeleton section.
  - Error state section with retry CTA.
  - Empty-state section with context-aware text (no data vs no filter results).

#### P1 core parity
- [ ] **Introduce production-grade list controls panel.**
  - Sort dropdown (date soonest, newest, popularity, availability).
  - Date range controls and “upcoming only” toggle.
  - Clear-all filters control and active filter chips.

- [ ] **Create pagination/footer component.**
  - Prev/next buttons + page indicators.
  - Results count summary.

- [ ] **Extend activity card structure.**
  - Host/organizer meta.
  - RSVP status badge.
  - Availability indicator.
  - Moderation/admin action slot where role allows.

#### P2 polish
- [ ] **Add microcopy/help UI.**
  - Tooltips for RSVP states and capacity logic.
  - Inline helper text for create form constraints.

---

## 3) Interaction logic (sorting, pagination, RSVP state machine, moderation)

### Current state in this repo
- Client-side filtering by search + one category.
- No sorting options, no pagination.
- RSVP state is binary local flag with immediate count increment/decrement.
- No moderation or role-based actions.

### Missing behavior/UI mapped to concrete tasks

#### P0 blockers
- [ ] **Implement server-backed RSVP state machine parity.**
  - Model states: `not_joined`, `joined`, `waitlisted` (if supported), `full`, `closed`, `cancelled`.
  - Prevent invalid transitions in UI based on backend state.
  - Show backend conflict responses (e.g., activity cancelled, RSVP closed).

- [ ] **Add concurrency-safe capacity handling.**
  - Use backend-confirmed participant totals after each RSVP response.
  - Handle race conditions where remaining slots change between view and action.

- [ ] **Implement role-based moderation actions.**
  - Host/admin controls: edit activity, cancel activity, remove attendee, close RSVPs.
  - Enforce permissions in UI + API response handling.

#### P1 core parity
- [ ] **Implement deterministic sorting with backend params.**
  - Send sort key + direction to API.
  - Keep URL query params in sync with control state.

- [ ] **Implement pagination interactions.**
  - Preserve scroll position or scroll-to-top behavior on page change.
  - Disable navigation controls when at boundaries.

- [ ] **Add richer create/edit validation flow.**
  - Show inline field errors from server.
  - Block submit while pending.
  - Prevent duplicate submissions.

#### P2 polish
- [ ] **Improve accessibility interaction model.**
  - Keyboard focus trapping in modals.
  - `Esc` modal close.
  - ARIA labels for filter chips, sort controls, and RSVP status updates.

---

## 4) Visual system (typography, spacing, colors, responsive behavior)

### Current state in this repo
- Basic custom token set in `:root`.
- Simple responsive grid using `auto-fill/minmax`.
- No documented breakpoint strategy or design-token parity mapping.

### Missing behavior/UI mapped to concrete tasks

#### P1 core parity (after blockers)
- [ ] **Create token parity map against production design system.**
  - Typography scale (heading/body/caption weights, sizes, line-heights).
  - Spacing scale (4/8pt rhythm or production equivalent).
  - Semantic colors (surface, text tiers, borders, status colors, focus rings).

- [ ] **Implement explicit responsive breakpoints and layout behavior.**
  - Mobile: stacked filters, full-width CTAs, modal full-height pattern.
  - Tablet: 2-column cards and compact controls.
  - Desktop: multi-column cards with persistent controls alignment.

- [ ] **Align interaction states visually.**
  - Hover/active/disabled/focus-visible states on buttons and inputs.
  - Distinct status styles for full, joined, waitlisted, cancelled.

#### P2 polish
- [ ] **Add visual polish and consistency checks.**
  - Standardize radius/shadow/elevation levels.
  - Improve density and vertical rhythm in cards/modals.
  - Ensure color contrast compliance (WCAG AA).

---

## Blocker-first execution plan (recommended order)

1. **P0 Data + Auth foundation**: API integration, session handling, server persistence model.
2. **P0 RSVP/permissions logic**: state machine, concurrency safety, moderation permissions.
3. **P0/P1 List state UI**: loading/error/empty containers and auth-aware shell.
4. **P1 Sorting + pagination end-to-end**: controls, backend params, URL sync.
5. **P1 Visual parity baseline**: tokens, breakpoints, control/card state styling.
6. **P2 polish**: optimistic UX, accessibility refinements, microcopy and aesthetic tuning.

## Suggested acceptance criteria for “production-like” parity

- [ ] Activity list is fully backend-driven and paginated.
- [ ] All mutating actions require authentication and handle auth expiry.
- [ ] RSVP behavior is server-authoritative with conflict/error handling.
- [ ] Moderation controls appear only for authorized roles and are enforced by API.
- [ ] Loading/error/empty UI states are present and accessible.
- [ ] Core responsive breakpoints and interaction states match production design intent.
