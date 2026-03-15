# Changelog
All notable changes to this project are documented here.

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
