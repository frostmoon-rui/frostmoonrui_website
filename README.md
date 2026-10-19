# Frostmoon · a curious corner

An independent technical notebook and public food atlas for **frostmoonrui.com**, with complete Chinese / English / Russian / Japanese versions. The homepage is a personal technical site. Acknowledgements and public-data attribution are collected on **`/about/`**, rather than repeated across the site. The food atlas lives at **`/food-map/`** or its locale-prefixed equivalent, never on the homepage.

The atlas uses a quiet card layout with numbered, category-specific SVG pins. The list and map share stable venue numbers and selection state. Amap vector maps follow the site's light/dark theme using the official `whitesmoke` / `darkblue` styles; satellite imagery is not recolored. Marker chrome and information cards use the site's CSS colors, including in the optional OpenStreetMap view. Theme switching reuses the loaded map, and reduced-motion preferences are respected. Maps still load only on request, without geolocation access.

## Local development

No framework or package installation is required. Use Node.js 20+ and Python 3.10+:

```sh
pnpm build
node --test tests/*.test.mjs
python -m unittest discover -s tests -q
python -m http.server 8791 --bind 127.0.0.1 --directory dist
```

`pnpm build` is supported directly from the repository root because `package.json` is tracked. `node scripts/build.mjs` is a compatibility entry point to the same multilingual build; it does not revert to an English-only site. No dependency installation or translation API is needed.

Edit `content/pages.json` for English project/field-note content and the matching `content/pages.zh.json`, `content/pages.ru.json` and `content/pages.ja.json` files for full translations. `content/ui.json` contains the complete UI catalogs. Author homepage, atlas and 404 markup in `templates/`, not in their generated `dist/` files. Shared CSS and authored JavaScript remain in `dist/assets/`. A build validates matching catalogs and generates all localized pages plus the UI runtime and sitemap. Only `dist/` is deployed. Never serve the repository root or a bot directory publicly.

## Site-wide language switching

Every page includes **ZH / EN / RU / JA** links, with native accessible labels **中文 / English / Русский / 日本語**. They retain the current article or section, then keep internal navigation in that language. The selection is stored only in the visitor's browser; later visits to unprefixed pages reuse that preference. Explicit locale URLs are always respected:

- `/zh/`, `/en/`, `/ru/`, `/ja/`: complete homepages.
- `/<locale>/projects/`, `/<locale>/privacy/`, `/<locale>/notes/.../`: translated full content, not just navigation.
- `/<locale>/food-map/`: localized filtering, statuses, result counts, dates and map controls. Original business names and public addresses remain unchanged.

The root `/` remains the default English entry. The build produces 35 indexable routes plus localized 404 documents, with language-specific `lang`, canonical and alternate-language links. No automatic model-based translation runs on visitors or deploys.

## Existing Cloudflare Worker

This repository targets the existing **Workers** project `frostmoonrui-website`, not a second Pages project. `src/worker.js` serves `dist/` through the `ASSETS` binding and supplies the Amap configuration/security proxy. It does not expose a local computer, create storage, or add a public write API. `wrangler.jsonc` enables Worker-first routing while retaining the existing domain route and real 404 page.

In the existing Worker's **Settings → Builds** Git integration, select this repository and production branch `main`:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `frostmoonrui-website` |
| Static asset directory | `dist` (declared in the Wrangler configuration) |

A source push is not proof of deployment: check the Cloudflare build result and the returned `workers.dev` URL. If Cloudflare cannot run its deploy command, complete the existing account/Git integration rather than committing tokens into this repository.

### Connect the purchased domain

1. Complete the registrar's nameserver change to the **two exact nameservers assigned by your Cloudflare zone**. Do not guess these values, change MX/TXT mail records, or add wildcard DNS records.
2. Wait until the `frostmoonrui.com` zone reports **Active** in Cloudflare. A DNS query that still returns the registrar's nameservers is not confirmation of Cloudflare delegation.
3. The Wrangler configuration declares the requested `frostmoonrui.com/*` Worker route on the `frostmoonrui.com` zone. This preserves the already-existing proxied DNS records. A previous Custom Domain deployment returned error `100117` because those records were externally managed; it was not a pnpm build failure. The route avoids deleting or taking over DNS records. If the build token lacks route permissions, add this exact route under the existing Worker → **Settings → Domains & Routes → Add → Route**, with the correct zone. Keep the current website DNS records proxied and Universal SSL enabled. Do not disable TLS checks.
4. Verify both `https://frostmoonrui.com/` and `https://frostmoonrui.com/food-map/`. A `www` alias is optional and must also be configured explicitly.

The repository contains only the explicitly requested apex-domain route, never a zone ID, account ID, wildcard route or security credential. Domain registration, nameserver delegation and HTTPS issuance happen in the hosting account, not merely by adding source files. Mail records and unrelated hostnames are outside this deployment's scope.

If you intentionally choose Cloudflare **Pages** instead, this static output also works with production branch `main`, build command `node scripts/build.mjs`, and output directory `dist`. Do not create a duplicate deployment merely to use these alternative settings.

## Public food data

`python scripts/sync_food.py` imports only the fixed public feed at `https://cachetide.top/food-map/index.json`. A GitHub Action checks it once daily at 01:20 UTC / 09:20 Asia/Shanghai and commits `dist/data/food.json` only when its sanitized contents change. Failed downloads preserve the existing dataset; the displayed timestamp means the source content last changed, not a guaranteed daily availability check. GitHub schedules can be delayed.

Only venue facts and original source links are retained. Names and addresses keep their original proper spelling; the authored interface and articles have all four language versions, while source comments and maintenance documentation remain English. No full source articles, photographs, ratings or personal comments are copied. A correction or removal can be requested in Issues. The updater never reads a bot database or weather bindings.

Source-link compatibility: CacheTide's September 2026 Valaxy bundle encodes already percent-encoded article slugs again during client-router initialization. Its rendered canonical URLs reflect the same encoding, while its exported food feed uses single encoding. `articleLink()` adapts only encoded `https://cachetide.top/posts/<slug>` links in venue cards and map popups to the published client-route form, preserving query/fragment data. It does not rewrite either owner's exchanged JSON or affect other origins. Recheck/remove this narrowly scoped workaround when the upstream router is corrected. A successful HTTP response alone is not proof of client-route availability.

The atlas defaults to Amap JS API 2.0, with standard/satellite imagery and optional traffic layers using the original GCJ-02 coordinates. The SDK loads only on request. Traffic does not auto-refresh. OpenStreetMap remains a manually selected fallback using approximate WGS84 conversion. Neither provider requests location permission. Keep the vendored Leaflet license and OSM attribution; never bulk-download map tiles.

There is no anonymous write API. The password-protected owner studio can publish reviewed original venues; local bot submissions are never imported automatically. The original feed contains only approved public venue fields, never contacts or profiles.

## About, contacts and motion

The avatar is a real link to `/about/` (and the corresponding locale route). A normal click or touch runs three complete flips, then fades into the separate About page. Keyboard activation works too; modifier clicks keep normal browser behavior. Reduced-motion visitors and the owner's motion setting skip the animation without blocking navigation.

Homepage contact icons include the two supplied Bilibili channels, email and X, with hover notes and accessible labels. `/links/` provides a public companion-link collection and a copyable backlink card. CacheTide's acknowledgement and companion link remain on About rather than recurring around the site. The About introduction is an editable technical placeholder; no sensitive biography is inferred.

On mobile, the upper-left menu opens a sliding drawer with a dimmed backdrop, contact links and a theme toggle. Escape, the close button and the backdrop dismiss it; focus stays inside while open. The top bar also keeps the avatar and theme control available. Light/dark switching uses a circular View Transition where supported, a color fade otherwise, and no animation when reduced motion is requested.

The shared motion layer covers article introductions, About sections, cards, atlas results and studio feedback. Scroll reveals use bounded stagger delays; only the first eight venue results animate, and selected markers pulse twice rather than continuously. Decorative hero motion pauses offscreen and in background tabs. Changes to reduced-motion or owner preferences cancel active effects without hiding content or blocking navigation. Observer failures reveal content immediately, return navigation clears temporary states, and no generic link handler bypasses the studio's unsaved-draft warning.

`tests/motion-interruption.test.mjs` exercises queued drawer-close timers and theme cancellation before and during the reveal, including reduced-motion changes, owner preferences, background tabs and rejected transition readiness. These offline cases supplement browser layout checks; they do not verify owner credentials or publish test content.

Navigation links and controls use theme-aware frosted surfaces with restrained pointer lighting and pressure. A single delegated controller covers dynamic venue links without adding per-card observers. Pointer updates are coalesced into animation frames; touch pointers do not run hover work. Hints appear after 500 ms, follow the pointer within viewport bounds, also support keyboard focus, and dismiss on Escape, scrolling, leaving or backgrounding. Labels remain plain text and preserve existing accessible descriptions. Reduced-motion and owner settings suppress moving glass while retaining usable hints. Map attribution stays plain and readable. Navigation uses original inline line icons rather than third-party font assets.

## Password-protected owner studio

Open the entry at the bottom of About, or `/zh/studio/` (`/en/`, `/ru/` and `/ja/` are also supported). In the existing Cloudflare Worker's **production runtime Secrets**, configure:

- `ADMIN_PASSWORD`: an owner-chosen password of 16–256 characters.
- `ADMIN_SESSION_SECRET`: a securely generated random string of at least 32 characters, generated once and retained until rotation.
- `WEBSITE_GITHUB_TOKEN`: a fine-grained GitHub token scoped only to `frostmoon-rui/frostmoonrui_website`, with repository **Contents: read and write**. No account, workflow or other-repository permissions are needed.

Never put these values into Wrangler source, build variables, browser storage or the public JSON. `keep_vars: true` retains dashboard-managed runtime settings. The Worker verifies the password and issues a Secure, HTTPOnly, SameSite=Strict session cookie for one hour. Password/session-key rotation invalidates existing sessions. Native `ADMIN_LOGIN_LIMIT` protection allows five login attempts per minute per hashed IP at a Cloudflare location; this is approximate per-edge protection, not a globally synchronized account lockout. Login fails closed without the binding. Writes require both a same-origin JSON request and a session CSRF nonce.

The editor offers visual fields, supported rich-text article formatting, a sandboxed live preview, JSON editing, draft import/export and explicit GitHub publication. It edits public home/About text, contacts, appearance, companion links, existing articles in all languages, UI translations and original food entries. About acknowledgement text is in the matching article's About body. Page paths, application code, runtime secrets, DNS and account permissions cannot be edited here. `content/site.json` and all published drafts are public content, not secret storage.

The studio also provides local draft validation and a confirmation-protected restore to the version loaded in this session; neither action publishes or overwrites GitHub. Restore does not recover older commits. Its preview follows the site's light/dark theme, and the sticky action bar keeps draft export and publication accessible. Ctrl/Cmd+S invokes the existing confirmation-protected publication flow only for an unlocked, publication-enabled studio. Drafts and credentials are never persisted to browser storage.

Every save reads and compares the current file SHA before updating the fixed website repository on `main`. Conflicts do not overwrite newer changes; uncertain network results are not replayed automatically. Drafts remain in browser memory, with an unload warning, and can be exported before reloading. A successful save returns a GitHub commit receipt, not proof of a completed deployment.

The `Render studio content` Action builds and checks owner-created `Studio: ` commits, then synchronizes only generated `dist/` files with a normal push. A concurrent branch update makes that push fail rather than force-overwriting anything. Existing Cloudflare Git integration builds the selected source commit independently. Check both the repository checks and Cloudflare build before considering the public site updated. End-to-end owner login and a real studio publication must be verified by the owner with their own password; offline fixtures do not prove live credential permissions.

### Amap server configuration

In the existing Cloudflare Worker, set `AMAP_JS_KEY` and `AMAP_SECURITY_CODE` as secrets, then deploy. The JS key must be a JavaScript API key, not a Web Service key. Add `frostmoonrui.com` to its allowed domains in the Amap console. `AMAP_WEB_KEY` is not needed for the current map display and is not exposed or used by the site.

Use the production Worker's **Settings → Variables and Secrets**, not the separate build environment variables. `keep_vars: true` preserves dashboard-managed ordinary variables on later Git deployments; secrets are still preferred. If `/api/map-config` returns HTTP 503, its `missing` array lists only absent binding names, never values. Save/deploy runtime configuration after correcting them.

`/api/map-config` returns the browser SDK key and a same-origin `serviceHost`; the security code stays in the Worker and is added only to allowlisted Amap requests. The SDK key is necessarily visible to map visitors, so its domain restrictions still matter. The proxy pins upstream hosts, replaces caller-supplied credentials, rejects unknown paths and cross-origin requests, bounds timeouts and disables redirects. It is not a general-purpose API relay. The map-specific CSP permits Amap's SDK while other pages keep the restrictive static policy. See [Amap's official security proxy documentation](https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode).

The plain Python preview serves static files only: its map configuration endpoint is intentionally unavailable. Test full Amap behavior on the deployed Worker or through Wrangler with ignored `.dev.vars` configuration. Never paste secret values into this README or tracked files.

### Bidirectional public JSON exchange

Give CacheTide **https://frostmoonrui.com/food-map/index.json**. The alternative raw URL is **https://raw.githubusercontent.com/frostmoon-rui/frostmoonrui_website/main/dist/food-map/index.json**. Both contain the same Valaxy food-map v1 document: `schema`, `schemaVersion`, `generator`, `owner`, `site`, `generatedAt`, `coordinateSystem` and `spots`, matching CacheTide's published format. Cross-origin GET is allowed, with one-hour caching. The JSON URL is shared by all four interface languages.

Edit **`content/food-spots.json`**, not the generated file. Add only your reviewed, original public recommendations to `spots`, and update its `generatedAt` timestamp. Each venue needs `name`, `city`, numeric `lng`/`lat` in GCJ-02; optional fields include `address`, `category`, `price`, `rating`, `articleUrl` and `amapUrl`. The build generates stable IDs, explicit `source.type: "local"` attribution and the public-field allowlist. Invalid data fails the build rather than publishing partial records. Commit and push the source plus rebuilt output.

The initial original collection is intentionally empty: no personal bot records were copied and no recommendations were fabricated. CacheTide's imported collection remains visible on the map, but is never republished as yours. The daily importer skips externally sourced/returned records to prevent feedback loops. The display merges and deduplicates both sources, preferring your original entry for an exact venue match. This is feed exchange, not permission to write to or change the other person's repository. Each owner manages their own source file and adds the other's JSON URL to their own subscription list.

## Privacy and publishing

Keep the private Chinese bot, public English bot checkout and this website in separate directories. Never copy `local_settings.json`, contact lists, profiles, private location bindings, chats, stickers, SQLite files, screenshots, backups or credentials here. No `.env` or authentication tokens are required for static visitors. The approved public avatar and original SVG landscape are the only site illustrations.

Official references: [Workers static assets](https://developers.cloudflare.com/workers/static-assets/), [Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).
