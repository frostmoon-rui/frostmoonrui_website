# Studio recovery and publication safety

## Read path

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
