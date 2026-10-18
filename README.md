# Frostmoon · a curious corner

An independent technical notebook and public food atlas for **frostmoonrui.com**. The homepage is a personal technical site, inspired by the blog structure of [CacheTide](https://cachetide.top), not a copy of its theme or articles. The food atlas lives at **`/food-map/`**, never on the homepage.

## Local development

No framework or package installation is required. Use Node.js 20+ and Python 3.10+:

```sh
node scripts/build.mjs
node --test tests/*.test.mjs
python -m unittest discover -s tests -q
python -m http.server 8791 --bind 127.0.0.1 --directory dist
```

Edit `content/pages.json` for project/field-note content, then regenerate pages. The homepage and atlas are edited directly in `dist/`. Only `dist/` is deployed. Never serve the repository root or a bot directory publicly.

## Existing Cloudflare Worker

This repository targets the existing **Workers** project `frostmoonrui-website`, not a second Pages project. `wrangler.jsonc` declares static assets in `dist/` and a real 404 page; it does not expose a local computer or create paid storage.

In the existing Worker's **Settings → Builds** Git integration, select this repository and production branch `main`:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Build command | `node scripts/build.mjs` |
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

Only venue facts and original source links are retained. Names and addresses keep their original proper spelling; the interface, documentation and authored text are English. No full articles, photographs, ratings or personal comments are copied. A correction or removal can be requested in Issues. The updater never reads a bot database or weather bindings.

The atlas supports search, city/category filtering, source links, original-coordinate Amap links and an optional interactive OpenStreetMap view. It loads tiles only after a click, never asks for location access and uses no map API credentials. GCJ-02 coordinates are approximately converted to WGS84 for the optional OSM display; use original Amap links when precision matters. Leaflet 1.9.4 and its license are vendored from the official distribution; do not remove OSM attribution or introduce bulk tile downloading.

This deployment has no public write API. Local bot food submissions are not automatically published: only this explicitly configured public feed is imported. Add any future reviewed publisher separately, with a public-field allowlist and no contact/profile data.

## Privacy and publishing

Keep the private Chinese bot, public English bot checkout and this website in separate directories. Never copy `local_settings.json`, contact lists, profiles, private location bindings, chats, stickers, SQLite files, screenshots, backups or credentials here. No `.env` or authentication tokens are required for static visitors. The approved public avatar and original SVG landscape are the only site illustrations.

Official references: [Workers static assets](https://developers.cloudflare.com/workers/static-assets/), [Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).
