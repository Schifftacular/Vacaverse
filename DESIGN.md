---
name: VacaVerse — Concourse (Liquid Glass)
description: A lit departures-board language, repainted in VacaVerse's own tropical brand — Apple-style glass materials and spring motion over ocean/aqua/sun/cream.
colors:
  ocean-carbon: "#0a2e35"
  cream-ivory: "#fff8ec"
  sun-goldenrod: "#ffc72c"
  coral-vermilion: "#ef5350"
  tropical-green: "#22c55e"
  brand-aqua-dark: "#2dd4c8"
  brand-teal-light: "#0e7490"
  bg-primary-dark: "#0a2e35"
  bg-secondary-dark: "#0f3c44"
  bg-card-dark: "#123f47"
  border-dark: "color-mix(in srgb, #7de8de 22%, transparent)"
  text-primary-dark: "#fff8ec"
  text-secondary-dark: "#bfe4e0"
  text-muted-dark: "#7fa8a5"
  bg-primary-light: "#fff8ec"
  bg-secondary-light: "#f2f9f7"
  bg-card-light: "#ffffff"
  border-light: "#d9ece8"
  text-primary-light: "#0a2e35"
  text-secondary-light: "#3d6067"
  text-muted-light: "#7c9a9a"
typography:
  headline:
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.02em"
    fontFeature: "uppercase"
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "14px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-aqua-dark}"
    textColor: "{colors.ocean-carbon}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-aqua-dark}"
    textColor: "{colors.ocean-carbon}"
  button-danger:
    backgroundColor: "{colors.coral-vermilion}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  panel:
    backgroundColor: "{colors.bg-card-dark}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: VacaVerse — Concourse (Liquid Glass)

## Overview

**Creative North Star: "The Lit Departures Board, Over the Ocean"**

Concourse still reads a family trip the way an airport departures board reads a flight: one shared surface, one prose register ranked by weight/case/rule instead of a size ramp, panels leaning off a common raked axis like boards seen at an angle, and a single light sweep marking whichever position is live right now (the current trip, the active tab, today's marker). What changed in this pass is the world the board lives in: the ground is now VacaVerse's own tropical brand — deep ocean teal, aqua, sun-gold, cream — sampled directly from the app's logo, not the original amber/goldenrod departures-hall palette. Surfaces are still tinted glass slides — translucent, blurred to whatever sits behind them — rather than opaque cards; that glass mechanic is now also extended to navigation chrome (`BottomNav`, `Sidebar`) via `.cx-glass-nav`, and every interactive primitive (buttons, the active-nav pill, toasts, sheets) carries real spring physics (Framer Motion) instead of static or CSS-only transitions. Night mode is the ocean unlit (deep teal ground, aqua/gold-lit panel edges), not an inverted palette swap.

The system is still deliberately restrained in its type scale (two heading sizes, everything else carried by weight/case/tracking) and deliberately committed in its geometry (the raked parallelogram edge recurs on hero bands, the trip rack, and headers as the one signature silhouette). It is built to work for a grandparent and a teenager on the same screen: 16px minimum body text and 44px minimum touch targets are load-bearing accessibility floors, not incidental choices.

**Key Characteristics:**
- Tropical ocean/aqua/sun/cream ground in both themes, sampled from the app logo; dark mode is the ocean at night, not an inverted palette
- Tinted glass panels (`.cx-slide`) and glass chrome (`.cx-glass-nav`) with backdrop blur, never opaque flat cards or nav bars
- One raked (parallelogram) edge as the system's signature silhouette, applied to hero bands, headers, and the trip rack
- Two-step heading scale in a rounded display face (Fredoka); rank below that carried by weight, case, and rule — not more sizes
- Real spring motion (Framer Motion) on buttons, the active-nav indicator, toasts, and sheets — reserved for interaction feedback, not decoration
- One authored motion moment (the sweeping light, `.cx-lit`) reserved for "this is live right now"

## Colors

The palette is VacaVerse's own tropical brand — ocean teal, aqua, sun-gold, cream — carried consistently across both themes, with four named accent roles used as fixed state colors regardless of theme.

### Primary
- **VacaVerse Aqua** (`--color-brand-teal`, `#2dd4c8` dark / `#0e7490` light): the one interactive accent — primary buttons, active nav state, links, active tab, focus borders. Carried in the `brand-teal` token name from the prior Concourse system, and now rendered as literal teal/aqua again, matching the logo's ocean.
- **Sun Goldenrod** (`#ffc72c`): the raw "lit" tone — text selection highlight, the `.cx-lit` glow ring and sweep color, one budget-chart slice. Sampled from the logo's sun motif.

### Secondary
- **Coral Vermilion** (`#ef5350`): danger/destructive actions (delete, logout), error states, and one alert tag tone. Never used as a primary CTA color.
- **Tropical Green** (`#22c55e`): a positive/confirmation tag tone (paid, claimed, done-state chips).

### Neutral
- **Ocean Carbon** (`#0a2e35`): the raw dark-ground role — hero-band base, gradient scrims behind photo titles, dark-mode text-on-photo shadow target.
- **Cream Ivory** (`#fff8ec`): the raw light role — text over photos/dark hero bands, dark-mode primary text.
- **Dark surfaces** — bg-primary `#0a2e35`, bg-secondary `#0f3c44`, bg-card `#123f47`, border `color-mix(in srgb, #7de8de 22%, transparent)`: the unlit-ocean layering in dark mode (default theme).
- **Light surfaces** — bg-primary `#fff8ec`, bg-secondary `#f2f9f7`, bg-card `#ffffff`, border `#d9ece8`: the sunlit layering in light mode.
- **Text** — primary/secondary/muted pairs per theme (dark: `#fff8ec`/`#bfe4e0`/`#7fa8a5`; light: `#0a2e35`/`#3d6067`/`#7c9a9a`).

### Named Rules
**The Aqua-Not-Amber Rule.** The single interactive accent is always the logo's ocean aqua, tuned per theme (`#2dd4c8` dark, `#0e7490` light). This supersedes the prior system's "amber, never teal" rule — the `brand-teal` token name is now literal again.

**The Four-State-Colors Rule.** Coral vermilion (danger), tropical green (positive), sun goldenrod, and ocean-carbon/cream-ivory (contrast-on-photo) are the only fixed-regardless-of-theme colors. They exist because state meaning (delete vs. confirm) must read the same in both themes; no other color is theme-invariant.

## Typography

**Display/Label Font:** Fredoka (self-hosted variable woff2; `ui-rounded, system-ui, sans-serif` fallback)
**Body Font:** system UI stack (no custom body face)

**Character:** A bubbly, rounded display face — sampled from the logo's lettering — carries every heading and label, replacing the prior system's condensed/tracked "timetable" face while keeping the same two-step scale and label conventions. Body copy stays on the system stack for maximum legibility across the widest possible age range of readers. The pairing is deliberately narrow: one distinctive display voice, one invisible reading voice.

### Hierarchy
- **Headline / H1** (700, 1.75rem, line-height 1.15, `-0.01em` tracking, `cx-h1`): the one hero/page-title size — trip titles, page headers.
- **Title / H2** (700, 1.25rem, line-height 1.2, `-0.01em` tracking, `cx-h2`): the one section/modal-title size — panel headers, modal titles.
- **Label** (700, ~0.75rem/11px in practice, `0.02em` tracking, uppercase, `cx-label`): nav items, tags, section heads, stat captions. Never used for body copy.
- **Body** (400, 1rem base, system stack): all reading copy, form labels, descriptions. 16px minimum enforced app-wide for accessibility.

### Named Rules
**The Two-Step Scale Rule.** There are exactly two heading sizes (`cx-h1`, `cx-h2`). Everything ranked below that is carried by weight, case, and rule (`cx-label`), never by adding a third size.
**The Label-Is-Not-Body Rule.** `cx-label` (condensed, uppercase, tracked) is reserved for tags, nav, and section captions. Reading copy always uses the body stack, never the display face at small sizes.

## Layout

Mobile-first single column throughout, by product design — the app's primary usage scene is a single phone in one hand, not an adapted desktop layout (per PRODUCT.md). Trip surfaces are organized as tabs/slides on one shared rack (`TripLayout`) reached via a sticky header and a fixed `BottomNav`; the 8 trip surfaces (Itinerary, Feed, Notes, Search, Tasks, Budget, Files, Polls) are icon-only in the bottom nav specifically to fit one no-scroll row on a 390px viewport, each column staying above the 44px touch-target floor. Content padding runs on an 8/16/24px rhythm (`p-3`/`p-4`/`p-6` in practice). Trip lists use a "rack" pattern: one full hero slide (`TripHeroSlide`) at the near edge, followed by receding strips (`TripRackStrip`) that lose width, gain indent, and dim (opacity floor 0.6) the further back they sit — simulating a physical rack viewed at an angle rather than a flat list.

## Elevation & Depth

Concourse is a hybrid of glass translucency and directional shadow, not flat and not classically layered. The signature surface, `.cx-slide`, is translucent (`color-mix` at 62% opacity over the background) with `backdrop-filter: blur(18px) saturate(160%)`, so panels read as lit glass over whatever sits behind them (a hero photo, the board ground) rather than opaque cards. Elevation is carried once per surface — a soft directional shadow tinted per-theme (`--shadow-tint`, `0 14px 32px -16px`) — with the border reduced to a barely-visible glass edge so it never doubles as a second elevation signal.

### Shadow Vocabulary
- **Slide shadow** (`box-shadow: 0 14px 32px -16px rgb(var(--shadow-tint) / 0.55)`): the one elevation shadow, applied via `.cx-slide` to every panel/card surface.
- **Lit ring** (`box-shadow: 0 0 0 1px var(--color-goldenrod), 0 0 20px -4px var(--color-goldenrod)`): marks the single "this is live" element (active trip hero, active tab, primary FAB) via `.cx-lit`, paired with an animated light-sweep gradient (disabled under `prefers-reduced-motion`).

### Named Rules
**The One Shadow Rule.** Every panel carries the same `.cx-slide` shadow; elevation is not tiered by importance. Importance is instead signaled by the `.cx-lit` ring/sweep, a separate and rarer device.

## Shapes

Two form devices carry the system's geometry. Corners default to a soft 12–14px radius (`rounded-xl`/`rounded-lg`, `.cx-slide`'s 14px) on panels, buttons, inputs, and images — never sharp/square, never fully pill-shaped except for avatars, badges, and the FAB. The signature device is the raked edge (`.cx-rake` / `.cx-rake-b`): a `clip-path` parallelogram lean cut into one corner pair, applied to hero bands, the trip rack's hero slide, and page headers. It affects only the silhouette — content inside stays fully upright and legible — and always shares the same ~2.5rem lean axis across every instance.

## Components

### Buttons
- **Shape:** rounded-xl (12px), condensed/tracked label type (`cx-label`) inside every variant.
- **Primary:** aqua fill (`bg-brand-teal`), ocean-carbon text, `hover:brightness-110`, spring press feedback (`whileTap` scale via Framer Motion). Standard padding `px-4 py-2.5` (md) or full-width `px-6 py-3.5` (lg).
- **Outline:** transparent background, themed border, hover shifts border to aqua.
- **Ghost:** no background/border, secondary text color, hover shifts to primary text color.
- **Danger:** coral-vermilion fill, white text — reserved for destructive actions (delete trip, logout confirmation contexts).
- **Icon size:** 44×44px (`w-11 h-11`), meeting the accessibility touch-target floor.

### Chips / Tags
- **Style:** small rounded-md pill with border, condensed uppercase label type, 11px.
- **Tones:** neutral (secondary bg/border), gold (aqua at 15% fill / 30% border — tone name kept from the prior system, renders as aqua now), green (tropical-green, positive states), vermilion (coral, danger/alert states). Tone is chosen by state meaning, not decoration.

### Cards / Panels
- **Corner Style:** 14px radius (`.cx-slide`).
- **Background:** translucent glass over the theme's card color (62% mix), blurred.
- **Shadow Strategy:** see Elevation & Depth — the single tinted directional shadow.
- **Border:** barely-visible glass edge (45%-opacity themed border color), never a second elevation cue.
- **Raked variant:** `Panel raked` applies `.cx-rake` for hero/rack contexts; most secondary panels (stat tiles, list rows) stay unraked.

### Inputs / Fields
- **Style:** themed background, 1px themed border, rounded-xl (12px).
- **Focus:** border shifts to aqua (`focus:border-brand-teal`), no separate glow ring on inputs (the glow/sweep is reserved for `.cx-lit` elements).

### Navigation
- **BottomNav / Sidebar:** glass chrome (`.cx-glass-nav` — tinted-blur, same recipe as `.cx-slide` without the rounded corners/rake), not an opaque card background. `BottomNav` is fixed, full-width, safe-area-aware, mobile-only (`lg:hidden`); `Sidebar` is a fixed-width left rail, desktop-only (`hidden lg:flex`), sharing the same nav config so the two can't drift apart. Outside a trip: 4 labeled icon+label items. Inside a trip: 8 icon-only items on `BottomNav` (labels as `sr-only` + `title`/`aria-label`) so all 8 trip surfaces fit one row without scrolling, or all 8 labeled on `Sidebar` where vertical room isn't constrained; active state is aqua text plus a spring-animated pill indicator (`layoutId`-based `motion.span`, shared across nav items) rather than a static bar.
- **Trip tabs (`TripLayout`):** horizontal scrollable row of `cx-label` tabs; active tab gets aqua text, aqua underline, and the `.cx-lit` sweep — the one place besides the hero slide/FAB where the sweep appears.

### Sheets / Overlays
- **Component:** `Sheet` (`src/components/ui/Sheet.tsx`) — portal-based (`createPortal` to `document.body`), `role="dialog"`/`aria-modal`, focus trap + focus restore, Escape-to-close, body scroll lock. Owns its own `AnimatePresence`/spring transition internally; call sites just toggle `open`.
- **Variants:** `responsive` (bottom-anchored on mobile, centered dialog at `sm:`+ — the default, used for create/edit forms) and `bottom` (always bottom-anchored, for lighter-weight popups like the share sheet).
- **Scrim:** flat translucent dark tint + blur (`bg-[var(--color-carbon)]/50 backdrop-blur-sm`) — not `.cx-slide`, which is reserved for content panels, not full-screen scrims.
- **Adoption:** migrated so far — `Trips.tsx`'s create-trip modal, `TripLayout.tsx`'s share popup. Other hand-rolled overlays (`Family.tsx`, `TripTasks`/`TripBudget`/`TripPolls`/`TripDocuments`/`TripNotes`/`TripItinerary` create/confirm dialogs, `ThreadPanel.tsx`, `FeedbackWidget.tsx`) still use their original inline overlay markup — functionally correct and already repainted via the token swap, just not yet on the shared `Sheet` primitive. Migrate opportunistically when touching those surfaces, not as a standalone sweep.

### Signature Component: The Trip Rack
The Trips list is not a grid of equal cards. It is one full-detail `TripHeroSlide` (raked, lit, with photo/stats/CTA) representing the nearest upcoming trip, followed by `TripRackStrip` rows for every other trip — each strip progressively indented and dimmed (opacity floor 0.6, indent step 14px, capped at depth 5) to simulate a physical rack of slides receding at an angle. This is the system's clearest embodiment of its North Star: one board, one light on the current position, everything else visibly behind it.

## Do's and Don'ts

### Do:
- **Do** use `.cx-slide` for every card/panel surface — glass translucency + blur + the one shared shadow, never an opaque flat card.
- **Do** reserve `.cx-lit` (glow ring + sweep) for exactly one "this is live" element per view (active trip, active tab, primary FAB) — its rarity is what makes it legible.
- **Do** carry rank through weight/case/tracking (`cx-label` vs. `cx-h1`/`cx-h2`) rather than adding a third heading size.
- **Do** keep the raked edge (`.cx-rake`/`.cx-rake-b`) on the same shared lean axis everywhere it appears — hero bands, headers, the rack's hero slide.
- **Do** hold the 16px body-text and 44px touch-target floors on every new surface; they are durable accessibility constraints, not legacy leftovers.

### Don't:
- **Don't** invert the palette for dark mode. Dark mode is the unlit ocean (ocean-carbon ground, aqua/gold-lit edges); it is a different lighting state of the same tropical world, not a color swap.
- **Don't** use coral-vermilion as a primary CTA color — it is reserved for destructive/danger meaning only.
- **Don't** stack a border and a shadow as two separate elevation signals on the same panel; `.cx-slide`'s border is a glass edge, not a second depth cue.
- **Don't** treat the display face (`cx-label`/`cx-headline`, now Fredoka) as a body-copy font at small sizes; body copy stays on the system stack for cross-generational legibility.
- **Don't** put glass/blur on content cards (list rows, stat tiles, feed posts) — glass is reserved for chrome (nav bars, sheets/scrims, the FeedbackWidget FAB). Content stays on `.cx-slide`'s existing translucent-but-legible treatment; it doesn't get heavier blur just because glass is now used more broadly.
- **Don't** combine Framer Motion's `layout`/`animate` props with `position: fixed` elements that must stay pinned regardless of ancestor transforms (`BottomNav`, the Feed composer, the `FeedbackWidget` FAB) — keep `MainLayout`/`TripLayout` transform-free at that level; use `Sheet`'s portal pattern instead of nesting a fixed element under an animated ancestor.

**Not canonized:** `TripBudget.tsx`'s category chart palette mixes the 4 named accent tokens with three raw hex values (`#2dd4c8`, `#14616e`, `#7de8de` — aqua tones, tuned for the tropical palette) because no 7-hue categorical token exists in the system. This is recorded here as a known build gap, not written into the token set — a future categorical-data need should get a real named ramp, not inherit these one-off hex values as precedent.
