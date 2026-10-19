# Studio recovery and publication safety

## First-response language and form layout

Known unprefixed page URLs are served internally from a localized asset in one response. The validated `frostmoon_language` cookie takes priority over the browser's weighted Accept-Language header, with English as the final fallback. Explicit `/zh/`, `/en/`, `/ru/` and `/ja/` URLs always win. Language-specific navigation writes the preference cookie; there is no late `location.replace` reload. Personalized entry responses use private/no-store caching and vary on Cookie and Accept-Language. Static assets, JSON feeds, API calls and unknown paths are not rewritten.

The visual editor keeps each document's disclosure states and its internal scroll offset in memory when fields are rebuilt after array edits, language/view changes, reloads or restoration. Document contents and credentials are not stored in localStorage. A browser refresh still requires exporting unsaved drafts first.

## Collecting a safe connection report

Sign in to the deployed studio and click **Diagnose GitHub connection**. Copy the JSON under **Read-only connection report**. The diagnostic request is available only after owner authentication. It performs three parallel GET probes with five-second budgets: authenticated Contents API, public Contents API and public raw source, all pinned to the existing repository and allowlisted document. Redirects are reported rather than followed. This does not replace strict revision verification or grant publishing capability.

The report contains a correlation ID, timestamp, document key, token-presence boolean, HTTP statuses, elapsed times, allowlisted transport categories and optional GitHub request IDs. It never includes a token, password, cookie, draft, upstream body, destination redirect or raw exception. The same sanitized report appears in Worker logs as `[Studio GitHub diagnostics]`.

- Authenticated 401 with successful public probes: update the existing production runtime token yourself; do not send its value in chat.
- Authenticated 403/404 with successful public probes: inspect the token's repository selection, expiration/approval and Contents permissions for `frostmoon-rui/frostmoonrui_website`.
- All three transport/timeout failures: use the correlation ID and timestamp in Cloudflare Worker logs; changing the local VPN does not test the Worker's outbound connection.
- `runtime-binding`, `dns`, `tls`, `connection` or `redirect`: share the sanitized report so the failing runtime/path can be examined rather than assuming a token fault.
- All probes reachable: use **Verify GitHub connection** to validate and compare the actual document before publishing. Diagnostics do not validate source JSON or prove write permission.

No test publication is necessary to obtain this report. Keep the current tab open or export its draft before reloading an updated deployment.

## Read path

Cloudflare Workers does not implement Fetch's `redirect: "error"`: it throws a TypeError before any network request is sent. Earlier reads and PUTs used that unsupported option and mislabeled its exception as a connection failure. All outbound Worker requests now use `redirect: "manual"`; read/publication redirects are rejected as upstream HTTP failures, and map redirects return a safe 502. No Location is followed and no credential is forwarded to another destination. A regression fixture rejects the unsupported option to cover this runtime difference; ordinary Node Fetch alone would not catch it. See [Cloudflare Request documentation](https://developers.cloudflare.com/workers/runtime-apis/request/).

The editor no longer depends on one outbound GitHub request. An authenticated document read first calls the fixed repository Contents API. Transport failures and HTTP 502/503/504 receive at most one immediate retry, with an eight-second budget per request. Authentication/permission/rate errors can fall back to a public read of that same fixed endpoint. A fixed raw-file URL, without any credentials, is the next read-only source (six seconds). Finally, the Worker can read the exact source bytes packaged with the current deployment through its ASSETS binding.

The interface identifies authenticated API, public API, raw-file and deployed-snapshot sources. Public and deployed fallback content supports editing, validation, preview and export, but never grants publication. Raw content can lag the API; deployed snapshots can lag repository changes. Invalid authoritative JSON or schemas fail explicitly rather than being silently replaced by old data. No read request contains a mutation.

After a fallback to deployed content, switching documents uses an authenticated, snapshot-only read (`source=deployed`) without repeating failed external requests. The connection-verification button remains the explicit path back to a fresh authenticated GitHub read; `strict=1` takes precedence over a requested snapshot source.

## Snapshot boundary

The generator packages only the nine allowlisted public source documents under `dist/__studio/`. It does not read environment variables, bot data, credentials, D1 records, screenshots or local configuration. These files are for internal ASSETS reads after Studio authentication. The Worker refuses direct, encoded and nested-encoded `__studio` paths before calling ASSETS. `run_worker_first: true` is required. Do not host the raw `dist` folder directly as a public alternative deployment: a simple local static preview does not implement that Worker boundary.

The unlisted room remains public source by the owner's explicit choice; packaging it is not a claim of private storage. No snapshot is added to a public data feed or page navigation. Every read still passes the shared schema validator, byte limits and UTF-8 decoding. Fallback SHA values use the real Git blob algorithm, including UTF-8 byte length.

## Connection verification

**Verify GitHub connection** uses `strict=1`: one authenticated read, no retry or fallback. It does not test write permission by sending a write. It preserves unsaved visual or even incomplete JSON drafts when the baseline revision matches. A different remote revision disables publishing until the owner exports/reloads; it never silently rebases a dirty draft. The service-health token indicator reports configuration only, not proven network or write access.

Token-format validation identifies embedded whitespace, quotes and Bearer prefixes before constructing an invalid Authorization header. Errors expose a safe category, optional HTTP status and read-source information, never the token, exception text, password or upstream headers. Tokens still need the selected repository and Contents read/write permissions; a successful authenticated GET alone is not proof of write permission.

## Writes

Saving retains its same-origin JSON checks, signed session, CSRF validation, shared schema checks and current-SHA preflight. The preflight does not retry or fall back. The actual PUT is sent once. An uncertain server or browser result disables further saves while retaining the submitted value in memory. Explicit verification can reconcile a remote document that now matches that value, without resending it or claiming a deployment/commit receipt. An unchanged or different remote document leaves the uncertain state locked; export and inspect the repository before deciding how to proceed.

Drafts stay in page memory, not localStorage. Keep the page open or export before refreshing. Restoring or reloading a dirty draft needs confirmation. No placeholder private identity content, live credentials or test messages were used to verify this update.
