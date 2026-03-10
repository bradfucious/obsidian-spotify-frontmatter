# obsidian-spotify-frontmatter

Adds Spotify-derived frontmatter to album notes in your Obsidian vault.

## Features
- Configure a single NOTES_ROOT directory for all generated notes.
- One filename per album (prompted).
- `.md` appended automatically only if missing.
- Absolute paths rejected; filenames are resolved relative to NOTES_ROOT.
- Non-destructive frontmatter merging (existing fields preserved).
- Album frontmatter schema matches your vault (see below).

## Album frontmatter schema
- type: text
- title: text
- artist: text
- release_date: date
- original_release: date
- label: list(string)
- genres: list(string)
- duration: text
- discs: number
- studio: list(string)
- producers: list(string)
- tracklist: list(string)
- emotional_resonance: list(string)
- ikigai_alignment: list(string)
- bonus_content: list(string)
- updated: date
- sticker: text
- cover: text
- color: text

## Usage
1. Install dependencies:
npm install
2. First run:
You will be prompted to enter:
- NOTES_ROOT (absolute path to your notes directory)
- Spotify Client ID and Client Secret (if not already in `.env`)
3. To change the notes root later:
node spotify-frontmatter-cli.mjs –reset-root
4. To reset Spotify credentials:
node spotify-frontmatter-cli.mjs –reset-auth

## Credits
- **Bradford Douglas Hill (Brad)** — original project owner and schema design
- **Microsoft Copilot** — implementation and integration assistance
