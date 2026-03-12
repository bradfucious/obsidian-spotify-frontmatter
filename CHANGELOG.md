# Changelog — obsidian-spotify-frontmatter

All changes by Bradford Douglas Hill ([@bradfucious](https://github.com/bradfucious)).

---

## [1.0.0] — 2026-03-10

### Added
- Initial release: Node.js CLI utility for fetching Spotify metadata and inserting YAML frontmatter into Obsidian notes
- Artist search by name via Spotify API
- Album/single selection — interactive CLI prompts via `inquirer`
- Non-destructive frontmatter merge — existing fields are never overwritten
- Spotify Client Credentials flow — no manual token pasting required
- Auto-generated short-lived access tokens
- `--reset-auth` flag to reconfigure credentials
- `.env`-based credential storage (gitignored)
- Modular codebase: `spotify-frontmatter-cli.mjs`, `frontmatter-helper.mjs`, `token-helper.mjs`
- Supports Node.js 18+

### Known Limitations
- Album/single support only — artist-level notes not yet supported
- CLI only — not yet an Obsidian plugin
