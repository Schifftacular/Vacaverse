# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

[Inferred from vacaverse_overview.md] Multi-generational families planning trips together — parents, grandparents, teens/kids — who are spread across different cities/states and currently coordinate trips through scattered texts, emails, and disconnected apps. One or two family members typically end up doing the coordination work for everyone.

## Product Purpose

[Inferred from vacaverse_overview.md] VacaVerse ("Plan Apart. Play Together.") is a collaborative family vacation planning app. It gives a whole family group — across generations — a single shared place to plan a trip together instead of one person herding the process through disconnected channels. Success is measured by shared participation (everyone contributing, not just the organizer) and less coordination burden per trip.

## Positioning

[Inferred from vacaverse_overview.md] Purpose-built for multi-generational family trip planning specifically — not a generic group chat, shared doc, or single-purpose travel tool (booking site, budgeting app, etc). The mechanism a competitor can't casually copy: collaborative planning surfaces (itinerary, budget, tasks, documents, meals, activity voting, family tree, social feed) unified under one shared family/trip context, built so contribution works for every generation (grandparents to teens) on their own device and own time.

## Operating Context

Mobile-first web app (React 19 + Vite + Tailwind v4, TypeScript). Existing mobile-first surfaces already have hard-won touch/layout fixes (44px touch targets, fixed bottom composer, BottomNav as the 1-tap path to all trip surfaces) — see recent commit history. A trip has its own layout (`TripLayout`) with sub-surfaces: Feed, Itinerary, Budget, Tasks, Documents, Notes, Polls, Search. Outside a trip: Home, Trips list, Family, Profile, Join, TripPreview. Realtime updates via socket.io. Rich text via TipTap (trip notes). Drag-and-drop via dnd-kit (likely itinerary/tasks ordering).

## Capabilities and Constraints

Core surfaces (from vacaverse_overview.md, confirmed against app/src/pages): collaborative itinerary planning, visual family tree builder, budget tracking with cost-splitting, centralized booking/document hub, shared task management, secure document sharing, meal planning & grocery coordination, smart document/receipt reader, activity discovery & voting, family social feed, multiple family groups per user (nuclear, extended, grandparents-only, etc).

Constraint: this redesign is a visual-world replacement, not a rebuild — existing routes, realtime behavior, TipTap/dnd-kit interactions, and prior mobile-usability fixes (touch targets, fixed composer, BottomNav) must be preserved through the restyle, not regressed.

## Brand Commitments

Name: **VacaVerse**. Tagline: **"Plan Apart. Play Together."** (from vacaverse_overview.md — treated as the current binding tagline).

Two prior brand-kit directions exist in `archived-vacaverse-assets/` and `vacaverse-mockup-prompts.md` (a tropical "Ocean Teal / Sunset Gold" kit and a separate "Cosmic Family Constellation / Cosmic Blue" kit). Both are explicitly archived/superseded and are **not** binding — the current live app (dark slate/teal) is also being rejected as "generic, boring." Per this task's brief, all prior visual directions are anti-reference/evidence only; the redesign picks a fresh world rather than reviving either archived kit.

## Evidence on Hand

- `vacaverse_overview.md` — product pitch, feature list (source of the facts above).
- `archived-vacaverse-assets/` — two superseded brand-kit explorations (tropical, cosmic) — anti-reference only.
- `vacaverse-mockups/` — prior AI-generated mockup images per surface — anti-reference only, not confirmed implemented UI.
- `landing-page/index.html` — a separate marketing landing page, out of scope for this pass (task is the app itself).
- No confirmed user research, testimonials, pricing, or case studies exist. Do not fabricate any.

## Product Principles

1. Every trip surface must work for the widest age range in the household — a grandparent and a teenager should both be able to act on the same screen without instruction.
2. The organizer's job is to disappear — the product's value is distributing planning load across the whole family, not centralizing it.
3. Mobile is the primary usage scene, not an adaptation of desktop.
4. Preserve realtime, collaborative, cross-generational functionality through any visual change — restyle, don't regress behavior.

## Accessibility & Inclusion

Primary user base explicitly spans a wide age range in the same household (kids through grandparents). Existing code already enforces a 16px minimum base font size and 44px minimum touch targets on mobile — these are durable constraints for any new visual system, not just legacy leftovers.
