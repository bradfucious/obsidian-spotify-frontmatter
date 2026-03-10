# Obsidian Spotify Frontmatter Utility

A Node.js command‑line tool that fetches album metadata from Spotify and writes structured YAML frontmatter into notes inside your Obsidian vault. Designed for safety, reproducibility, and ergonomic workflows.

---

## Features

### 🎵 Spotify Metadata Enrichment
- Fetches album metadata using Spotify’s Client Credentials API.
- Populates:
  - title  
  - artist  
  - release_date  
  - original_release  
  - label  
  - genres (merged from album + artist)  
  - duration (computed from tracklist)  
  - discs  
  - tracklist  
  - cover image URL  
- Preserves existing frontmatter (non‑destructive merge).

### 🗂 NOTES_ROOT System
- All notes are created inside a single configured folder.
- NOTES_ROOT is stored in `.env` and can be reset with:
node spotify-frontmatter-cli.mjs –reset-root


### 📝 Filename Handling
- Suggested filename automatically generated from `artist + album`.
- Partial filename search:
- Type any substring → utility shows matching files in NOTES_ROOT.
- Non‑recursive search (fast and safe).
- `.md` auto‑appended only if missing.
- Absolute paths rejected.

### 🔁 Interactive Loop
- After writing a note, the utility asks whether to process another album.
- Clean newline formatting for all prompts.

### 🔐 Safe Behavior
- Never overwrites without confirmation.
- Never writes outside NOTES_ROOT.
- `.env` is ignored by Git; `.env.example` provided.

---

## Installation
npm install

## Dependencies:
• inquirer
• node-fetch
• dotenv
• js-yaml

---

## Usage

### First Run
node spotify-frontmatter-cli.mjs
You will be prompted for:
• NOTES_ROOT (absolute path)
• Spotify Client ID
• Spotify Client Secret

### Resetting Settings
node spotify-frontmatter-cli.mjs --reset-root
node spotify-frontmatter-cli.mjs --reset-auth

### Album Frontmatter Schema
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

## Roadmap
See ENHANCEMENTS.md for the full roadmap.

---

## Credits
• Bradford Douglas Hill (Brad) — project owner, schema designer, workflow architect
• Microsoft Copilot — implementation partner, CLI design, UX, and documentation
