Changelog

All notable changes to this project are documented here.

---

[0.6.1] — 2026-03-13
Fixed
- Fix ESM import error: align `spotify-frontmatter-cli.mjs` imports with `token-helper.mjs` exports and implement `--reset-auth` to clear credentials via `setEnv`.

---

[0.6.0] — 2026-03-13

Summary
Artist Mode added with Spotify enrichment, image handling prompt, and opt‑in image download logic. Added move-after-write enhancement to allow post-write file relocation configured via .env.

Added
• Artist Mode: create artist notes with canonical frontmatter order.
• Artist enrichment fields: followers, popularity, images.
• Image handling prompt: choose Spotify URL or opt‑in download to NOTES_ROOT/assets/covers/.
• --artist flag to start directly in artist mode.
• --dry-run flag to preview frontmatter without writing.
• Enhancement: move files after writing to a user-configured destination set in .env.

Changed
• README updated with Artist Mode documentation and prompt UX details.
• Prompt formatting standardized across the CLI to avoid cursor drift.
• Filename normalization: artist filenames preserve spaces and capitalization.

Fixed
• Cursor placement issues in terminals when prompts wrapped.

---

[0.5.0] — 2026-03-10
• Cursor rendering and UX improvements, consistent short prompts (Option B), partial filename search, interactive looping, and preparatory enhancements for MusicBrainz integration.

---

[0.4.0] — 2026-03-09
• Partial filename search inside NOTES_ROOT (non‑recursive).
• Suggested filename generation from artist + album.
• Interactive loop: after writing a note, prompt to process another album.
• Newline formatting for cleaner cursor placement.
• ENHANCEMENTS.md added.
• README rewritten for clarity and accuracy.

---

[0.3.0] — 2026-03-01
• Added NOTES_ROOT support.
• Added .md auto‑append.
• Added non‑destructive frontmatter merging.
• Added reset flags.
• Improved error handling.

---

[0.2.0] — 2025-09-04
• Initial stable CLI release.

---

[0.1.0] — 2025-08-15
• Prototype release.
