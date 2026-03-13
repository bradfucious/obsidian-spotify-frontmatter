Enhancements Roadmap

Tracks planned improvements and future development for the Obsidian Spotify Frontmatter Utility.

---

Short-term (next sprint)
• Add --deep-search flag:
	◦ Enables recursive search inside NOTES_ROOT.
	◦ Default remains non-recursive for speed and safety.
• Add MusicBrainz enrichment:
	◦ Use album UPC / ISRC / MBID to fetch:
		▪︎ producers
		▪︎ engineers
		▪︎ studios
		▪︎ recording locations
	◦ Merge into existing schema non-destructively.
• Add dry-run mode to preview frontmatter without writing.
• Add optional cover image download into NOTES_ROOT/assets/covers/.
• Add move-after-write behavior:
	◦ New .env key POST_WRITE_DEST or NOTES_DESTINATION to configure a target folder.
	◦ After writing frontmatter, the script will optionally move the file to the configured destination.
	◦ Behavior:
		▪︎ If POST_WRITE_DEST is set, prompt user to confirm move or skip.
		▪︎ If not set, prompt user to set it once (persist to .env) or skip.
		▪︎ Ensure moves never escape NOTES_ROOT boundaries unless explicitly allowed by user.
	◦ Use cases:
		▪︎ Write to a staging folder then move to a final location.
		▪︎ Organize notes into artists/, albums/, or date-based folders automatically.

---

Mid-term
• Add artist frontmatter generation (completed in 0.6.0).
• Add bulk import mode (playlist → multiple notes).
• Add filename index for faster search in large vaults.
• Add configurable filename templates.

---

Long-term / Plugin Migration
• Convert CLI into full Obsidian plugin.
• Add settings UI for NOTES_ROOT, cover download, MusicBrainz integration.
• Add command palette actions:
	◦ “Add album frontmatter”
	◦ “Add artist frontmatter”
• Add unit tests and CI.
• Add localization support.

---

Notes
• Always prioritize safety and non-destructive behavior.
• .env must never be committed; .env.example should remain the template.
