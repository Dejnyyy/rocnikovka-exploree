# Landing page app mockups — design

**Date:** 2026-06-15
**Goal:** Replace the three static stock preview images on the homepage with code-built mockups that faithfully match the real Exploree app UI, so the landing page accurately represents the product.

## Problem

The landing page (`src/components/LandingPage/index.tsx`) shows three stock `<Image>` previews that do not match the real app:

| Preview image | Current mockup | Real app |
|---|---|---|
| `swipe-preview.png` | iPhone frame, X/♥ buttons, title *below* image | Rounded card, author chip + title + location *over* image, round comment button (`CardFace` in `SwipeDeck`) |
| `collections-preview.png` | iPhone "My Collections", search, star ratings, bottom nav | Grid of cover tiles with a frosted *name + "N items"* pill (`CollectionCard`) |
| `map-preview.png` | Dark map + pink pins + popup (close-ish) | CARTO dark-matter basemap, pink glowing dot markers (#ec4899), image+title+location popup (`map.tsx`) |

## Approach

Build all three previews as **presentational React components** recreated from the real app components — no app logic, no data fetching, no interactivity (subtle float animation only). They adapt to the landing page's light/dark theme. This keeps them crisp at any size, removes external/stock dependencies, and needs no authed app screenshots.

Note: the map screen is not a shipped feature yet — its mockup is a forward-looking preview of the planned map view.

## Components

New folder `src/components/LandingPage/mockups/` with three components.

### 1. `SwipeCardMockup`
Faithful recreation of `CardFace`:
- Portrait `rounded-3xl` card, full-bleed cover photo.
- Theme-aware bottom gradient overlay (white→transparent in light, black→transparent in dark).
- Author chip (small circular avatar + name).
- Bold title + location row with a `MapPin` icon.
- Round comment button bottom-right.

Two render modes via a prop:
- **`deck` (hero):** stacked deck — front card plus a blurred, slightly offset card peeking behind (mirrors the real `SwipeDeck` background card), with faint `SAVE` / `SKIP` corner badges.
- **`single` (feature section 1):** one clean card.

### 2. `CollectionsMockup`
2×2 grid of `CollectionCard`-style tiles:
- Cover photo at the real `pt-[60%]` aspect ratio, `rounded-2xl`.
- Bottom gradient.
- Frosted `bg-black/35 backdrop-blur` pill with collection name + "N items".

### 3. `MapMockup`
Dark map panel matching dark-matter:
- Simplified world-map SVG asset (landmasses tinted gray on near-black) + faint graticule grid.
- Pink glowing dot markers (#ec4899, white ring, soft glow) scattered across it.
- One popup card (photo + bold title + gray location) like the real maplibre popup.

## Assets

- **Travel photos:** harvested by cropping the photos already inside the existing preview PNGs (Santorini, waterfall, beach, jungle, temple, coast, desert, torii) → saved as clean files in `public/landing/photos/`.
- **World map:** one compact world-map SVG asset (landmass paths) tinted to match dark-matter.
- Avatars: reuse existing dicebear-style or a small bundled avatar; placeholder names only.

## Integration

In `src/components/LandingPage/index.tsx`:
- Hero "App Preview" section: replace the `<Image src="/landing/swipe-preview.png">` with `<SwipeCardMockup variant="deck" />`.
- FeatureShowcase #1 (swipe): visual side → `<SwipeCardMockup variant="single" />`.
- FeatureShowcase #2 (collections): visual side → `<CollectionsMockup />`.
- FeatureShowcase #3 (map): visual side → `<MapMockup />`.

`FeatureShowcase` gains the ability to render an arbitrary node on its visual side (instead of only an image `src`). The existing rounded container + `ring-1` framing (no heavy shadow, per recent change) is kept.

## Out of scope

- No real swiping/drag, no real map tiles/maplibre, no live data.
- No changes to the actual app screens.
- The >30-spot explore pagination issue (tracked separately).

## Success criteria

- The three homepage previews visually read as the real Exploree app (card overlay layout, collections grid pills, dark map with pink pins + popup).
- Mockups look correct in both light and dark landing themes.
- No new runtime errors; `tsc` and the build stay clean.
- Old stock preview PNGs no longer referenced.
