# Frost & Moon interaction layer

The site remains a four-language vanilla static generator with its existing Worker backend. This visual update does not change authentication, community records, map requests, hosting or private bot data.

## Source ownership

- `theme-base.css` provides the synchronous root canvas palette. `site.css` repeats the same body tokens so a late module cannot recolor the initial canvas. Keep the parser-blocking theme initialization and the existing reverse View Transition lifecycle intact.
- `appearance.css` is generated from the owner's editable accent, highlight and radius settings. Do not hardcode over those settings in the composition layer.
- `frost.css` is the final shared composition layer: ambient frost, the hero chamber, independent notebook cards, sidebar compartments and mobile density. Other handwritten assets remain directly editable under `dist/assets/`.
- `glass.css` owns the optical control surfaces. Five inset/base/ambient shadows provide depth. The base transform remains defined when pointer variables are removed, allowing a 460 ms return from the current matrix; tracking uses a shorter transition. No continuously running pointer simulation is needed.
- `note-filter.js` applies each filter immediately, measures the current visible positions before cancellation, and replaces only its own short-lived Web Animations. Reduced motion, owner preferences and page lifecycle changes cancel pending work.
- `companions.css` animates the existing two avatars through anticipation, soft collision, two snuggles and recovery in one second. The existing single timer, repeat-tap guard and offscreen cancellation remain authoritative. The localized status is visible as well as accessible. Optional haptics are bounded and unsupported APIs are harmless.

## Guardrails

The three separate avatar clicks, half-second pointer hints, manual map load, sidebar-only contacts, public/private boundaries and all four language catalogs remain unchanged. New decoration adds no network dependencies, third-party fonts, external imagery or npm runtime packages. The design does not promise a fixed frame rate on every device.

Mobile controls use the existing focus-managed drawer, a safe-area-aware floating top bar and a horizontally scrollable filter track. No redundant bottom toolbar obscures forms or the map. Long names and translated labels wrap instead of truncating. Forced colors removes decorative noise and shadows; reduced motion retains all navigation and textual feedback without continuous animation. Background tabs pause ambient drift.

## Verification

Run `node scripts/build.mjs`, `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -q`, and `git diff --check`. The build must remain deterministic. Browser review should cover both themes, mobile home and friends, long Russian labels, Japanese labels, filter reversals, drawer focus, and desktop composition. Static previews intentionally cannot exercise private Worker APIs.
