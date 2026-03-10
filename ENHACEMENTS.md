i# Enhancements Roadmap

This file tracks enhancement ideas and planned improvements for the obsidian-spotify-frontmatter project.

## Short-term (next sprint)
- Add artist frontmatter generation with a settings toggle (ask / always / never).
- Add cover image download option and local cover filename support.
- Add dry-run flag to preview frontmatter without writing files.
- Add a setting to limit existing-file search depth or folder (currently searches NOTES_ROOT non-recursively).

## Mid-term
- Implement a filename index to speed up existing-file detection for large vaults.
- Add MusicBrainz or Discogs lookup to populate `studio` and `producers` when Spotify lacks data.
- Add a "bulk import" mode to process multiple albums from a CSV or playlist.

## Long-term / Plugin migration
- Convert CLI to an Obsidian plugin with settings UI and commands.
- Implement OAuth flow for richer Spotify data (if needed).
- Add unit tests and CI for plugin build and CLI flows.
- Add localization support for prompts and messages.

## Notes
- Prioritize non-destructive behavior and safety when writing to vaults.
- Keep `.env` and secrets out of the repo; use `.env.example` for placeholders.

