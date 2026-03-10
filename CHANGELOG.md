# Changelog

All notable changes to this project are documented here.

---

## [0.4.0] — 2026‑03‑10
### Summary
Major UX improvements, partial filename search, interactive looping, newline‑clean prompts, and improved enrichment.

### Added
- Partial filename search inside NOTES_ROOT (non‑recursive).
- Suggested filename generation from artist + album.
- Interactive loop: after writing a note, prompt to process another album.
- Newline formatting for cleaner cursor placement.
- ENHANCEMENTS.md file added.
- README rewritten for clarity and accuracy.

### Changed
- Improved enrichment: genres merged from album + artist.
- Label preserved when present.
- Filename selection flow redesigned for safety and ergonomics.

### Fixed
- Cursor placement issues.
- Early exits replaced with re‑prompt loops.
- NOTES_ROOT search limited to the configured folder only.

---

## [0.3.0] — 2026‑03‑09
- Added NOTES_ROOT support.
- Added `.md` auto‑append.
- Added non‑destructive frontmatter merging.
- Added reset flags.
- Improved error handling.

---

## [0.2.0] — 2025‑09‑04
- Initial stable CLI release.

---

## [0.1.0] — 2025‑08‑15
- Prototype release.
