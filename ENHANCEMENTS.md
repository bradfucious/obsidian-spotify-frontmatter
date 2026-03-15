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

## Short-Term Enhancements
- Add optional cover image download
- Add dry-run mode (`--dry-run`)
- Add two-way tagging support
- Add reading progress syncing
- Add custom metadata pushback
- Add automation options (cron, Raycast, etc.)

---

## Medium-Term Enhancements
- Add file‑move behavior after writing frontmatter (destination set via `.env`)
- Improve CLI ergonomics (interactive loops, filename confirmation)
- Add more robust filename normalization options
- Add optional artist‑note prompt during artist frontmatter generation

---

## Long-Term Enhancements
- Add Semgrep to CI (GitHub Actions)
- Add ESLint + Prettier to CI
- Add pre‑commit hooks for lint + Semgrep enforcement
- Add documentation site or richer README examples
- Add plugin‑style architecture for metadata providers (Spotify, MusicBrainz, Discogs, etc.)

---

