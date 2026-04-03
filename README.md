# Obsidian Spotify Frontmatter Utility

![CI](https://github.com/bradfucious/obsidian-spotify-frontmatter/actions/workflows/ci.yml/badge.svg)&nbsp;![Security](https://github.com/bradfucious/obsidian-spotify-frontmatter/actions/workflows/cl.yml/badge.svg)&nbsp;![Release](https://img.shields.io/github/v/release/bradfucious/obsidian-spotify-frontmatter)&nbsp;![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)


A Node.js command-line tool that fetches album and artist metadata from Spotify and writes structured YAML frontmatter into notes inside your Obsidian vault. Designed for safety, reproducibility, and ergonomic workflows.

---

## Features

### Spotify Metadata Enrichment

- Fetches album and artist metadata using Spotify’s Client Credentials API.
- **Album frontmatter fields:**
  - title  
  - artist  
  - release_date  
  - original_release  
  - label  
  - genres (merged from album + artist)  
  - duration (computed from tracklist)  
  - discs  
  - tracklist  
  - cover image — downloaded to `EXTERNAL_COVERS_PATH/albums/` and referenced via `file:///` URI (falls back to Spotify CDN URL if not configured)
- **Artist frontmatter fields:**
  - type  
  - name  
  - origin  
  - active_years  
  - genres  
  - labels  
  - notable_releases  
  - spotify_url  
  - emotional_resonance  
  - ikigai_alignment  
  - followers  
  - popularity  
  - images (Spotify images array)  
  - cover — downloaded to `EXTERNAL_COVERS_PATH/artists/` and referenced via `file:///` URI (falls back to Spotify CDN URL if not configured)
  - created and updated dates (YYYY-MM-DD)

---

## NOTES_ROOT System

- All notes are created inside a single configured folder.
- `NOTES_ROOT` is stored in `.env` and can be reset with:

```
node spotify-frontmatter-cli.mjs --reset-root
```

---

## Filename Handling

- Suggested filename automatically generated from artist + album for albums, and `{artist}.md` for artist notes.
- **Partial filename search:**
  - Type any substring → utility shows matching files in `NOTES_ROOT`.
- **Non-recursive search** (fast and safe) by default.
- Optional `--deep-search` flag enables recursive search across subfolders.
- `.md` auto-appended only if missing.
- Absolute paths rejected.
- Artist filenames preserve spaces and capitalization; album filenames use the slug-style pattern used previously.

---

## Artist Mode

- After selecting an artist, choose between creating an artist note or an album note.
- **Artist note behavior:**
  - Builds canonical artist frontmatter in the project’s preferred YAML order.
  - Enrichment fields included: followers, popularity, images.
  - `cover` downloaded to `EXTERNAL_COVERS_PATH/artists/` and referenced via `file:///` URI.
  - `notable_releases` is an empty list by default and can be filled manually or via future bulk import.
  - Filename template: `{artist}.md` with the same normalization logic used for albums.

---

## Interactive Loop and Prompt UX

- Prompts use a consistent, short format:
  - Context printed above the prompt (album/artist, suggested filename).
  - Short prompt line on its own (no wrapping).
  - `(Type q to quit)` shown only where quitting is meaningful.
- Cursor rendering issues resolved by avoiding long, wrapped prompt messages.

---

## CLI Flags

- `--deep-search` — enable recursive filename search  
- `--dry-run` — preview frontmatter without writing  
- `--artist` — start directly in artist mode  
- `--reset-root` — reset `NOTES_ROOT`  
- `--reset-auth` — reset Spotify credentials  

---

## Safe Behavior

- Never overwrites without confirmation.
- Never writes outside `NOTES_ROOT`.
- `.env` is ignored by Git; `.env.example` provided.

---

## Installation

```
npm install
```

**Dependencies:**

- inquirer  
- node-fetch  
- dotenv  
- js-yaml  

---

## Usage

### First Run

```
node spotify-frontmatter-cli.mjs
```

You will be prompted for:

- `NOTES_ROOT` (absolute path to your vault notes folder)
- `EXTERNAL_COVERS_PATH` (absolute path outside the vault for cover art downloads — leave blank to use Spotify CDN URLs)
- Spotify Client ID
- Spotify Client Secret

---

### Creating an Artist Note

1. Run the CLI.  
2. Choose **Artist note** when prompted.  
3. Search for the artist and select the correct result.  
4. Confirm or edit the suggested filename.  
5. Choose whether to use the Spotify image URL or download the image (download is opt‑in).  
6. Confirm write.  

---

### Resetting Settings

```
node spotify-frontmatter-cli.mjs --reset-root
node spotify-frontmatter-cli.mjs --reset-auth
```

### Deep Search (Recursive)

```
node spotify-frontmatter-cli.mjs --deep-search
```

---

## Album Frontmatter Schema

```
type: album
title: string
artist: string
release_date: date
original_release: date
label: list(string)
genres: list(string)
duration: string
discs: number
studio: list(string)
producers: list(string)
tracklist: list(string)
emotional_resonance: list(string)
ikigai_alignment: list(string)
bonus_content: list(string)
updated: date
sticker: string
cover: string
color: string
```

---

## Artist Frontmatter Schema

```
type: artist
name: string
origin: string
active_years: string
genres: list(string)
labels: list(string)
notable_releases: list(string)
spotify_url: string
emotional_resonance: list(string)
ikigai_alignment: list(string)
followers: integer
popularity: integer
images: list(object)
cover: string
created: date
modified: date
updated: date
sticker: string
color: string
```

---

## Development

### Linting

```
npm run lint
```

### Static Analysis

```
semgrep --config .semgrep.yml
```

### Planned CI Enhancements

- Semgrep in CI  
- ESLint + Prettier in CI  
- Pre‑commit hooks for lint + Semgrep  

---

## Roadmap

See `ENHANCEMENTS.md` for the full roadmap.

---

## Credits

- **Bradford Douglas Hill (Brad)** — project owner, schema designer, workflow architect  
- **Microsoft Copilot** — implementation partner, CLI design, UX, and documentation  

