# Changelog

All notable changes to this project are documented in this file.

## [Unreleased] — 0.2.0
**Summary:** Major UX and configuration improvements; added NOTES_ROOT support, safer filename handling, and a locked album frontmatter schema matching the user's vault.

### Added
- **NOTES_ROOT support** — single configurable root directory for all generated notes; stored in `.env` and editable via `--reset-root`.
- **First-run prompt** for NOTES_ROOT when `.env` does not contain it.
- **Spotify credentials handling** — prompts for `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` if missing; saved to `.env`.
- **One-filename-per-album UX** — CLI prompts for a single filename per album (no leading slash).
- **`.md` auto-append** — `.md` appended only if the user did not include it.
- **Absolute path rejection** — filenames starting with `/` are rejected to avoid accidental writes outside the vault.
- **Non-destructive frontmatter merging** — existing frontmatter keys are preserved; missing keys are filled from Spotify-derived schema.
- **Album frontmatter schema implemented** exactly as specified by the user (fields and types locked in).
- **`--reset-root`** flag to change NOTES_ROOT from the CLI.
- **`--reset-auth`** flag to re-enter Spotify credentials.
- **Improved album fetching** — deduplication of releases by name + release_date.
- **Improved error reporting** and clearer CLI prompts.
- **README** updated with usage, schema, and credits.
- **CHANGELOG** entry for this release.

### Changed
- CLI flow reorganized for clarity and reliability.
- `cover` field populated with Spotify image URL by default.
- `duration` computed by summing track durations (converted to `Xm Ys`).
- `discs` default behavior simplified (set to `1` when tracks exist).

### Fixed
- Race conditions and directory creation issues when writing files.
- Parsing of existing frontmatter to avoid accidental data loss.

### Notes / Migration
- After upgrading, run the CLI once to set `NOTES_ROOT` in `.env`.
- Existing album notes will not be overwritten; existing frontmatter values are preserved.
- If you previously used absolute paths in prompts, you must now provide filenames relative to `NOTES_ROOT`.

---

## 0.1.1 — 2025-09-01
**Summary:** Minor fixes and improvements to the original prototype.

### Fixed
- Minor bug fixes in Spotify token handling.
- Improved tracklist extraction for some album responses.

### Added
- Initial README and basic CLI.

---

## 0.1.0 — 2025-08-15
**Initial release**
- Prototype CLI to fetch Spotify album metadata and write frontmatter to a specified file.
- Basic frontmatter fields and minimal merging behavior.

