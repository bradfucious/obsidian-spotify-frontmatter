# Changelog

All notable changes to this project are documented here.

---

## [0.5.0] — 2026-03-10
### Summary
Cursor rendering and UX improvements, consistent short prompts (Option B), partial filename search, interactive looping, and preparatory enhancements for MusicBrainz integration.

### Added
- Consistent Option B prompt formatting across the CLI (context above prompt; short prompt line).
- `--deep-search` flag to enable recursive filename search across NOTES_ROOT subfolders.
- ENHANCEMENTS.md updated with MusicBrainz integration plan.
- README updated to document prompt behavior and deep-search flag.

### Changed
- Cursor drift fixed by removing long/wrapping prompt messages and printing dynamic context above prompts.
- Filename selection flow improved: partial-match listing, suggested filename, and reuse confirmation.
- Interactive loop: process multiple albums without restarting.

### Fixed
- Cursor placement issues in terminals when prompts wrapped.
- Early exits replaced with re-prompt loops where appropriate.

---

## [0.4.0] — 2026-03-09
- Partial filename search inside NOTES_ROOT (non‑recursive).
- Suggested filename generation from artist + album.
- Interactive loop: after writing a note, prompt to process another album.
- Newline formatting for cleaner cursor placement.
- ENHANCEMENTS.md added.
- README rewritten for clarity and accuracy.

---

## [0.3.0] — 2026-03-01
- Added NOTES_ROOT support.
- Added `.md` auto‑append.
- Added non‑destructive frontmatter merging.
- Added reset flags.
- Improved error handling.

---

## [0.2.0] — 2025-09-04
- Initial stable CLI release.

---

## [0.1.0] — 2025-08-15
- Prototype release.
