# Changelog
All notable changes to this project are documented here.

---

## [0.7.0] — 2026-03-29

### Added

- **ENH-011: External cover art folder — download Spotify images outside vault with `file://` references**

  Replaces fragile Spotify CDN URLs with locally-cached cover art downloaded to an external folder outside the Obsidian vault. Images inside the vault pollute Obsidian Sync and the file graph; this moves them out.

  **New `.env` key:** `EXTERNAL_COVERS_PATH` — prompted once on first run if not set, stored in `.env` for subsequent runs. Default suggestion: `~/Pictures/ObsidianCovers/Spotify`. Leave blank to keep using Spotify CDN URLs.

  **Album flow:** now downloads cover to `{EXTERNAL_COVERS_PATH}/albums/{slug}.jpg` and writes `cover: file:///...` in frontmatter. Previously wrote CDN URL silently with no download option.

  **Artist flow:** now downloads cover to `{EXTERNAL_COVERS_PATH}/artists/{slug}.jpg` and writes `cover: file:///...`. Previously prompted between CDN URL, in-vault download (`NOTES_ROOT/assets/covers/`), or skip. The in-vault download option is removed.

  **Behaviour:**
  - Skip download if local file already exists and is non-zero bytes
  - Falls back to Spotify CDN URL if `EXTERNAL_COVERS_PATH` not configured or download fails
  - `file:///` URI confirmed working in Obsidian desktop (tested 2026-03-22)

  **New helpers:**
  - `token-helper.mjs`: `ensureExternalCoversPath()`, `expandPath()`
  - `frontmatter-helper.mjs`: `downloadCoverArt()` — thin wrapper over `downloadImage()` with skip-if-exists logic and `file:///` URI return

---

## [0.6.1] — 2026‑03‑13
### Summary
Artist Mode refinements, enrichment fixes, documentation updates, and reset‑auth bugfix.

### Added
- Followers, popularity, and images enrichment for artists
- Artist Mode documentation updates
- Additional image handling logic

### Changed
- Improved Artist Mode UX
- Updated README and CHANGELOG

### Fixed
- `--reset-auth` now correctly clears stored credentials
- Minor schema alignment fixes

---

## [0.6.0] — 2026‑03‑13
### Summary
Introduced Artist Mode with full frontmatter generation and enrichment.

### Added
- Artist Mode (`--artist`)
- Artist frontmatter builder with canonical ordering
- Image handling prompt (Spotify URL vs. local download)
- Optional image download to `NOTES_ROOT/assets/covers/`
- `--dry-run` flag
- Move‑after‑write enhancement (configurable via `.env`)

### Changed
- Standardized prompt formatting to avoid cursor drift
- Updated README with Artist Mode documentation
- Improved filename normalization for artist notes

### Fixed
- Cursor placement issues in terminals when prompts wrapped

---

## [0.5.0] — 2026‑03‑10
### Summary
Major CLI UX improvements and prep for MusicBrainz integration.

### Added
- Partial filename search inside `NOTES_ROOT` (non‑recursive)
- Interactive looping after writing notes
- Preparatory enhancements for MusicBrainz enrichment

### Changed
- Cursor rendering and prompt formatting improvements
- Cleaner newline handling
- Improved error messages

---

## [0.4.0] — 2026‑03‑10
### Summary
Major UX improvements, partial filename search, interactive looping, newline‑clean prompts, and improved enrichment.

### Added
- Partial filename search inside NOTES_ROOT (non‑recursive)
- Suggested filename generation from artist + album
- Interactive loop: after writing a note, prompt to process another album
- Newline formatting for cleaner cursor placement
- ENHANCEMENTS.md file added
- README rewritten for clarity and accuracy

### Changed
- Improved enrichment: genres merged from album + artist
- Label preserved when present
- Filename selection flow redesigned for safety and ergonomics

### Fixed
- Cursor placement issues
- Early exits replaced with re‑prompt loops
- NOTES_ROOT search limited to the configured folder only

---

## [0.3.0] — 2026‑03‑09
### Added
- NOTES_ROOT support
- `.md` auto‑append
- Non‑destructive frontmatter merging
- Reset flags
- Improved error handling

---

## [0.2.0] — 2025‑09‑04
- Initial stable CLI release

---

## [0.1.0] — 2025‑08‑15
- Prototype release

---

## [Unreleased]
### Added
- Initial Vitest test suite
- Tests for filename normalization, frontmatter builders, and merge behavior
- Test infrastructure for future CI integration
- AI usage disclosure and contribution guidelines
- CODEOWNERS, issue templates, PR template
- CI workflow (linting, Semgrep, tests)

### Changed
- Updated frontmatter-helper for testability
- Updated package.json to align version with manifest.json
