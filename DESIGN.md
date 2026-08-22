---
name: VacaVerse — Concourse
description: A lit departures-board language for multi-generational family trip planning.
colors:
  carbon: "#17130f"
  ivory: "#f7ecd9"
  goldenrod: "#d99a1f"
  vermilion: "#d1502c"
  bottle-green: "#1f6f4a"
  brand-teal-dark: "#dda233"
  brand-teal-light: "#9c5c17"
  bg-primary-dark: "#15100a"
  bg-secondary-dark: "#1d160d"
  bg-card-dark: "#221a10"
  border-dark: "#3c2e18"
  text-primary-dark: "#f7ecd9"
  text-secondary-dark: "#cbb897"
  text-muted-dark: "#8c7d63"
  bg-primary-light: "#f6ecd3"
  bg-secondary-light: "#eeddb4"
  bg-card-light: "#fffcf4"
  border-light: "#dcc596"
  text-primary-light: "#201a12"
  text-secondary-light: "#5b4d38"
  text-muted-light: "#8a7a5d"
typography:
  headline:
    fontFamily: "Archivo Condensed, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo Condensed, Arial Narrow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Archivo Condensed, Arial Narrow, sans-serif"
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
    backgroundColor: "{colors.brand-teal-dark}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-teal-dark}"
    textColor: "{colors.carbon}"
  button-danger:
    backgroundColor: "{colors.vermilion}"
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

# Design System: VacaVerse — Concourse

## Overview

**Creative North Star: "The Lit Departures Board"**

Concourse reads a family trip the way an airport departures board reads a flight: one shared surface, one prose register ranked by weight/case/rule instead of a size ramp, panels leaning off a common raked axis like boards seen at an angle, and a single light sweep marking whichever position is live right now (the current trip, the active tab, today's marker). The ground is warm goldenrod/amber, not the generic dark-slate-and-teal SaaS dashboard the redesign explicitly rejects; surfaces are tinted glass slides — translucent, blurred to whatever sits behind them — rather than opaque cards. Night mode is the board unlit (carbon ground, amber-lit panel edges), not an inverted palette swap.

The system is deliberately restrained in its type scale (two heading sizes, everything else carried by weight/case/tracking) and deliberately committed in its geometry (the raked parallelogram edge recurs on hero bands, the trip rack, and headers as the one signature silhouette). It is built to work for a grandparent and a teenager on the same screen: 16px minimum body text and 44px minimum touch targets are load-bearing accessibility floors, not incidental choices.

**Key Characteristics:**
- Warm amber/goldenrod ground in both themes; dark mode is the board at night, not an inverted palette
- Tinted glass panels (`.cx-slide`) with backdrop blur, never opaque flat cards
- One raked (parallelogram) edge as the system's signature silhouette, applied to hero bands, headers, and the trip rack
- Two-step heading scale; rank below that carried by weight, case, and rule — not more sizes
- One authored motion moment (the sweeping light, `.cx-lit`) reserved for "this is live right now"

## Colors

The palette is a single warm goldenrod/amber world carried consistently across both themes, with four named accent roles used as fixed state colors regardless of theme.

### Primary
- **Concourse Amber** (`--color-brand-teal`, `#dda233` dark / `#9c5c17` light): the one interactive accent — primary buttons, active nav state, links, active tab, focus borders, the `.cx-lit` glow ring. Carried in the `brand-teal` token name so every pre-redesign `text-/bg-/border-brand-teal` utility repoints automatically; it is amber now, never literal teal.
- **Goldenrod** (`#d99a1f`): the raw ground tone — text selection highlight, the `.cx-lit` sweep's glow color, one budget-chart slice.

### Secondary
- **Vermilion** (`#d1502c`): danger/destructive actions (delete, logout), error states, and one alert tag tone. Never used as a primary CTA color.
- **Bottle Green** (`#1f6f4a`): a positive/confirmation tag tone (paid, claimed, done-state chips).

### Neutral
- **Carbon** (`#17130f`): the raw dark-ground role — hero-band base, gradient scrims behind photo titles, dark-mode text-on-photo shadow target.
- **Ivory** (`#f7ecd9`): the raw light role — text over photos/dark hero bands, dark-mode primary text.
- **Dark surfaces** — bg-primary `#15100a`, bg-secondary `#1d160d`, bg-card `#221a10`, border `#3c2e18`: the unlit-board layering in dark mode (default theme).
- **Light surfaces** — bg-primary `#f6ecd3`, bg-secondary `#eeddb4`, bg-card `#fffcf4`, border `#dcc596`: the lit-board layering in light mode.
- **Text** — primary/secondary/muted pairs per theme (dark: `#f7ecd9`/`#cbb897`/`#8c7d63`; light: `#201a12`/`#5b4d38`/`#8a7a5d`).

### Named Rules
**The Amber-Not-Teal Rule.** The single interactive accent is always warm amber/goldenrod, tuned per theme (`#dda233` dark, `#9c5c17` light). It is never rendered as literal teal, despite the `brand-teal` token name carried forward for repoint compatibility.

**The Four-State-Colors Rule.** Vermilion (danger), bottle-green (positive), goldenrod, and carbon/ivory (contrast-on-photo) are the only fixed-regardless-of-theme colors. They exist because state meaning (delete vs. confirm) must read the same in both themes; no other color is theme-invariant.

## Typography

**Display/Label Font:** Archivo Condensed (with Arial Narrow, sans-serif fallback)
**Body Font:** system UI stack (no custom body face)

**Character:** A condensed, tracked, weighted display face carries every heading and label — the "timetable" register — while body copy stays on the system stack for maximum legibility across the widest possible age range of readers. The pairing is deliberately narrow: one distinctive display voice, one invisible reading voice.

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
- **Primary:** amber fill (`bg-brand-teal`), carbon text, `hover:brightness-110`. Standard padding `px-4 py-2.5` (md) or full-width `px-6 py-3.5` (lg).
- **Outline:** transparent background, themed border, hover shifts border to amber.
- **Ghost:** no background/border, secondary text color, hover shifts to primary text color.
- **Danger:** vermilion fill, white text — reserved for destructive actions (delete trip, logout confirmation contexts).
- **Icon size:** 44×44px (`w-11 h-11`), meeting the accessibility touch-target floor.

### Chips / Tags
- **Style:** small rounded-md pill with border, condensed uppercase label type, 11px.
- **Tones:** neutral (secondary bg/border), gold (amber at 15% fill / 30% border), green (bottle-green, positive states), vermilion (danger/alert states). Tone is chosen by state meaning, not decoration.

### Cards / Panels
- **Corner Style:** 14px radius (`.cx-slide`).
- **Background:** translucent glass over the theme's card color (62% mix), blurred.
- **Shadow Strategy:** see Elevation & Depth — the single tinted directional shadow.
- **Border:** barely-visible glass edge (45%-opacity themed border color), never a second elevation cue.
- **Raked variant:** `Panel raked` applies `.cx-rake` for hero/rack contexts; most secondary panels (stat tiles, list rows) stay unraked.

### Inputs / Fields
- **Style:** themed background, 1px themed border, rounded-xl (12px).
- **Focus:** border shifts to amber (`focus:border-brand-teal`), no separate glow ring on inputs (the glow/sweep is reserved for `.cx-lit` elements).

### Navigation
- **BottomNav:** fixed, full-width, themed card background with top border, safe-area-aware padding. Outside a trip: 4 labeled icon+label items. Inside a trip: 8 icon-only items (labels as `sr-only` + `title`/`aria-label`) so all 8 trip surfaces fit one row without scrolling; active state is amber text plus a small pill indicator bar above the icon.
- **Trip tabs (`TripLayout`):** horizontal scrollable row of `cx-label` tabs; active tab gets amber text, amber underline, and the `.cx-lit` sweep — the one place besides the hero slide/FAB where the sweep appears.

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
- **Don't** invert the palette for dark mode. Dark mode is the unlit board (carbon ground, amber-lit edges); it is a different lighting state of the same amber world, not a color swap.
- **Don't** use vermilion as a primary CTA color — it is reserved for destructive/danger meaning only.
- **Don't** stack a border and a shadow as two separate elevation signals on the same panel; `.cx-slide`'s border is a glass edge, not a second depth cue.
- **Don't** treat the condensed display face (`cx-label`/`cx-headline`) as a body-copy font at small sizes; body copy stays on the system stack for cross-generational legibility.

**Not canonized:** `TripBudget.tsx`'s category chart palette mixes the 4 named accent tokens with three raw hex values (`#b5603a`, `#4a3420`, `#c9a227`) because no 7-hue categorical token exists in the system. This is recorded here as a known build gap, not written into the token set — a future categorical-data need should get a real named ramp, not inherit these one-off hex values as precedent.
