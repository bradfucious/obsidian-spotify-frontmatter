# Enhancements Roadmap

This document tracks potential improvements, future features, and workflow refinements for the Obsidian Spotify Frontmatter Utility. Items are not commitments; they represent opportunities for future development.

---

## Completed Enhancements
- Recursive filename search (`--deep-search`)
- MusicBrainz enrichment for album metadata
- Artist frontmatter generation
- Lint cleanup (ESLint)
- Static analysis cleanup (Semgrep)
- YAML schema hardening (`FAILSAFE_SCHEMA`)
- Regex normalization safety improvements

---

## Added
- Initial unit test suite using Vitest
- Tests for filename normalization, frontmatter builders, and merge behavior
- Test infrastructure for future CI integration
- AI usage disclosure and contribution guidelines

---

## Short-Term Enhancements

### **Bug Fixes**
- **Artist `images:` field not editable in Obsidian**  
  Replace nested Spotify image objects with a simple list of URLs.
- **`updated:` field triggers “Expected Date” warning**  
  Create the field but allow Obsidian’s Frontmatter Writing plugin to normalize the date format.

### **Metadata Improvements**
- Normalize all date fields to plugin‑compatible placeholders (`now`, `{{date}}`, etc.).
- Ensure album and artist frontmatter always includes all expected fields, even if empty.

### **Existing Short-Term Items**
- Add optional cover image download
- Add dry-run mode (`--dry-run`)
- Add two-way tagging support
- Add reading progress syncing
- Add custom metadata pushback
- Add automation options (cron, Raycast, etc.)

---

## Medium-Term Enhancements

### **Metadata Expansion**
- Add MusicBrainz enrichment for:
  - producers  
  - engineers  
  - studios  
  - recording locations  
  - catalog numbers  
  - release groups  
  - alternate release dates  

### **Future Metadata Providers (Planned)**
- **Wikidata**: origin, active years, biography summary, associated acts  
- **Cover Art Archive**: high‑resolution album art  
- **Discogs**: label history, catalog numbers, pressing info  
- **AcousticBrainz**: BPM, key, mood, energy  

### **Existing Medium-Term Items**
- Add file‑move behavior after writing frontmatter (destination set via `.env`)
- Improve CLI ergonomics (interactive loops, filename confirmation)
- Add more robust filename normalization options
- Add optional artist‑note prompt during artist frontmatter generation

---

## Long-Term Enhancements

### **Plugin Architecture + Fusion Engine**
- Add plugin‑style architecture for metadata providers (Spotify, MusicBrainz, Discogs, etc.)
- Combine Spotify + MusicBrainz + Wikidata into a unified schema
- Add enrichment priority rules
- Add metadata completeness scoring

### **CI + Tooling**
- Add Semgrep to CI (GitHub Actions)
- Add ESLint + Prettier to CI
- Add pre‑commit hooks for lint + Semgrep enforcement

### **Documentation + UX**
- Add documentation site or richer README examples

---

