# Changelog

## [Unreleased] — 0.3.0
**Summary:** Improved field population, safer filename handling, non-recursive NOTES_ROOT search, interactive re-prompting.

### Added
- Populate `genres` from album or artist data when available.
- Attempt to preserve `label` when present on album.
- Interactive filename flow with suggested safe filename and existing-file detection.
- Non-recursive search limited to `NOTES_ROOT` folder for existing-file detection.
- Re-prompt loops for artist and album selection; accept `q/quit/exit` to abort.
- ENHANCEMENTS.md added to track future ideas.

### Changed
- CLI now confirms before writing and will not overwrite without confirmation.
- Version bumped to `0.3.0`.

### Fixed
- Improved merging behavior and safer file writes.

## 0.2.0 — 2025-09-04
- feat: NOTES_ROOT support and album frontmatter schema.
- feat: .md auto-append only if missing; reject absolute filenames.
- feat: One-filename-per-album UX.
- fix: Non-destructive frontmatter merging; safe directory creation.

