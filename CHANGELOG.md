
---

# 📝 **4. Updated CHANGELOG.md (Final)**

```markdown
# Changelog

## 1.2.0 — Improved Album Fetching, Note Validation, and Error Reporting

### Added
- Market parameter (`market=US`) to ensure complete album lists.
- Support for all release groups: album, single, compilation, appears_on.
- Improved error reporting for:
  - empty album lists
  - Spotify API failures
  - invalid note paths
- Automatic creation of missing note files.
- Success/failure logging for each note written.

### Changed
- Updated `chooseNotesForAlbum()` to validate and resolve paths.
- Updated main loop to provide detailed write status messages.

---

## 1.1.0 — Migration to Spotify Client Credentials Flow

### Added
- Client ID + Secret authentication.
- Automatic token generation and refresh.
- `--reset-auth` flag.
- `.env` storage for credentials and tokens.

### Changed
- Removed deprecated Web API Console token flow.
- Updated README and documentation.

---

## 1.0.0 — Initial Release

