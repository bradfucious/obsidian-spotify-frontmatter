# Obsidian Spotify Frontmatter Generator

A Node.js CLI utility that fetches Spotify metadata (artists, albums, singles) and inserts **non-destructive YAML frontmatter** into Obsidian notes.

This tool is designed for users who maintain music libraries, discographies, or media notes inside Obsidian and want accurate metadata without overwriting existing fields.

---

## Features

- Search for artists by name  
- Select one or more releases (albums/singles)  
- Choose which notes to update  
- Generates clean YAML frontmatter  
- Merges frontmatter without overwriting existing fields  
- Prompts for Spotify Bearer Token  
- Provides step-by-step token instructions  
- Saves token to `.env` for future runs  
- Modular, maintainable codebase  

---

## Requirements

### Node.js  
- **Node.js 18 or higher**  
  Required for:
  - native ESM support  
  - stable fetch behavior  
  - compatibility with dependencies  

### NPM Dependencies  
Installed automatically via `npm install`:

- `node-fetch@2` — Spotify API requests  
- `inquirer` — interactive CLI prompts  
- `js-yaml` — YAML parsing + serialization  
- `dotenv` — `.env` token loading  

---

## Installation

### 1. Clone or download the project
git clone https://github.com/yourusername/obsidian-spotify-frontmatter.git
cd obsidian-spotify-frontmatter

Or simply drop the folder into your Obsidian vault or your `~/scripts` directory.

---

### 2. Install dependencies

From inside the project folder:
npm install

This will create:
- node_modules/
- package.json
- package-lock.json

---

### 3. Verify installation (optional)
npm list –depth=0

You should see:
- inquirer
- js-yaml
- dotenv
- node-fetch

---

## Usage

Run the CLI:

Or:
node spotify-frontmatter-cli.mjs


### First Run
If no token is found, the script will:

1. Prompt you for a Spotify Bearer Token
2. Provide instructions for obtaining one
3. Save it to `.env`
4. Continue running normally

---

## Getting a Spotify Bearer Token

1. Open:
   https://developer.spotify.com/console/get-search-item/

2. Click **Get Token**

3. Select scopes:
   - `user-read-private`
   - `user-read-email` (optional)

4. Click **Request Token**

5. Copy the long token string and paste it into the script prompt

This token lasts **1 hour**.
You can regenerate it anytime.

---

## Workflow

1. Enter an artist name
2. Select one or more releases
3. Enter one or more note paths (comma-separated)
4. Script merges frontmatter into each note
5. Existing fields are preserved
6. Missing fields are added

---

## Example Frontmatter Output

```yaml
---
type: album
title: "Random Access Memories"
artist: "Daft Punk"
spotify_id: "4m2880jivSbbyEGAKfITCa"
spotify_url: "https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa"
release_date: "2013-05-17"
total_tracks: 13
cover_image: "https://i.scdn.co/image/ab67616d0000b273..."
---
```

## Project Structure

spotify-frontmatter/
│
├── spotify-frontmatter-cli.mjs      # main script
├── token-helper.mjs                 # token loader + instructions + .env writer
├── frontmatter-helper.mjs           # YAML merge + note writing
├── CHANGELOG.md
├── README.md
└── .env                             # auto-created on first run

