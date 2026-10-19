# Unlisted room

The owner explicitly chose obscurity plus search-engine exclusion, without password protection. This is an unlisted public page, not a private storage system. Anyone who knows its address, reads the public source, or receives a shared copy can read it. Indexing directives are requests to compliant crawlers, not a security guarantee.

Three separate ordinary avatar activations enter the locale's `about-secret/` route. Normal About navigation remains public and unchanged. Modified native link clicks keep their ordinary About destination; no static link, sidebar item, language switch, canonical/alternate link, sitemap entry or bot feed points into the room. A person who knows the URL can still enter directly, as explicitly accepted by the owner.

The room has a separate minimal layout and neutral placeholders in four languages. No personal experiences, identity details or health records were added. Metadata and Worker responses request `noindex`, `nofollow`, `noarchive`, `nosnippet` and `noimageindex`. Responses use `private, no-store` and a `no-referrer` policy, also declared in HTML for static previews. Crawlers must be allowed to retrieve the page to see `noindex`; do not add a robots.txt disallow that prevents that retrieval.

## Editing

The authenticated Studio document selector has an **Unlisted room** option. Its visual fields edit `content/about-secret.json` by language, with a title, introduction and ordered text-only sections. The existing GitHub SHA validation and publication flow apply. The editor warns that saving publishes the text to the public repository and its history. No duplicate room JSON is generated under `dist/data/`.

Do not put sensitive material here unless you deliberately want it readable publicly, including in Git history. Changing an entry later does not remove earlier public commits. Real access protection or non-public storage requires a separate, explicit implementation.

Public About now contains only confirmed technical topics: Python and async automation, Arduino/STM32/ESP32, recovered subsystem archives, public-map provenance and implementation boundaries. It makes no claim about qualifications, completed autonomous hardware, age, school, location or private identity.
