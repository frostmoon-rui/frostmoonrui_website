# Private friend-link review

The public form is on `/zh/links/` (and the other three locales). Owner review lives in the existing password-protected Studio. Recommendations are edited through the `resources` document and published to GitHub like other public site content. Approved friend applications are published immediately from D1, independently of a source rebuild; rejecting or returning one to pending withdraws it.

## One-time database setup

The existing database `frostmoon-community` is declared in `wrangler.jsonc` as `WEBSITE_DB`. Its database ID is a non-secret binding identifier. No API token is stored in source.

Open that database's Console in Cloudflare and execute [the migration](migrations/0001_friend_applications.sql) once. It creates only the new `friend_applications` table and its index. Do not execute it against an unrelated database or re-run it against an existing table. Future changes use new numbered migrations, not edits to an applied migration.

If using an already authenticated Wrangler session, the equivalent owner-run command is:

```text
npx wrangler d1 execute frostmoon-community --remote --file=migrations/0001_friend_applications.sql
```

The form is disabled until both the database schema and the `FRIEND_APPLY_LIMIT` binding are usable. The rate limiter is declared in Wrangler. Saving the binding alone does not create tables. Use Studio's service status panel to diagnose setup without exposing credentials.

## Privacy and review contract

- Pending and rejected applications are never exported into public files or GitHub. No email address, QQ account, health record or IP is stored in the table. A hash of the request IP is used only as the rate-limit key, not persisted by this application.
- Store only the applicant's public website name, HTTPS URL, short description, optional public icon and friend-page URLs, language and review state. Optional icons are visible as text to the owner; external images are not fetched automatically. Newly approved sites use the shared local cat placeholder.
- No automatic metadata fetching or applicant code execution. Public output is constructed with text nodes, bounded fields and validated URLs. External links are opened only by the visitor and carry `noopener noreferrer`.
- Reviews require the existing HTTPS owner session, a same-origin JSON request, the session CSRF value and a matching record version. Approval requires descriptions in all four languages; the owner checks translations rather than inventing them automatically.
- Native rate limiting allows three application attempts per minute per request-IP hash; a bounded atomic insert also limits pending entries to 500 and new entries to 100 per UTC day. Duplicate normalized URLs are refused. There is no CAPTCHA, email verification or email notification claim.
- The review list is paged; never expose this private API to the bot. The bot reads or screenshots only public pages. No admin password or session token is placed in screenshots or the public data feed.

## Public resource and bot integration

`content/resources.json` owns the six curated reference/support/developer links and four-language descriptions. Medical/community references are not personalized treatment or dose instructions. External coverage and opening hours must be checked at the source; no health data is collected here.

`/data/bot-site.json` provides the public route manifest and recommendation entries, with no private queue contents. The bot's explicit `website screenshot` command renders the public website in a new sandboxed, reduced-motion browser context every time. No periodic screenshot sync, localhost exposure, admin login or QQ announcement is needed. Optional Python/Chromium installation is described in the bot repository's `WEBSITE_SCREENSHOTS.md`.
