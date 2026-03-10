# Enhancements Roadmap

Tracks planned improvements and future development for the Obsidian Spotify Frontmatter Utility.

---

## Short-term (next sprint)
- Add `--deep-search` flag:
  - Enables recursive search inside NOTES_ROOT.
  - Default remains non-recursive for speed and safety.
- Add MusicBrainz enrichment:
  - Use album UPC / ISRC / MBID to fetch:
    - producers
    - engineers
    - studios
    - recording locations
  - Merge into existing schema non-destructively.
- Add dry-run mode to preview frontmatter without writing.
- Add optional cover image download into NOTES_ROOT/assets/covers.

---

## Mid-term
- Add artist frontmatter generation.
- Add bulk import mode (playlist → multiple notes).
- Add filename index for faster search in large vaults.
- Add configurable filename templates.

---

## Long-term / Plugin Migration
- Convert CLI into full Obsidian plugin.
- Add settings UI for NOTES_ROOT, cover download, MusicBrainz integration.
- Add command palette actions:
  - “Add album frontmatter”
  - “Add artist frontmatter”
- Add unit tests and CI.
- Add localization support.

---

## Notes
- Always prioritize safety and non-destructive behavior.
- `.env` must never be committed; `.env.example` should remain the template.

