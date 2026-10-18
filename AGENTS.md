# Website collaboration

- Do not use subagents. The user explicitly requires all work to be handled by the main agent.

- This is the public multilingual website for frostmoonrui.com. Keep authored code/comments/documentation in English; the user explicitly requested complete Chinese, English, Russian and Japanese UI/article catalogs. Never substitute untranslated fallbacks for missing required translations. Keep the homepage separate from each locale's food-map page.
- Preserve the independent private Chinese bot runtime. Never copy its configuration, JSON records, databases, contacts, locations, chat history, screenshots or backups into this repository.
- Use CacheTide as the contributor's public name. Retain original business and place names from explicitly public food feeds without inventing translations.
- Run offline tests, inspect staged files, commit scoped changes and push normally to origin. Never force-push. Verify the remote commit and distinguish a source push from a successful deployment.
- Do not add real API keys or Cloudflare credentials. Domain/DNS/account setup must not enable paid services or expose a local bot to the internet.
