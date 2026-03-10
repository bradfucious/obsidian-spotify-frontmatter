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
- Uses Spotify Client Credentials (Client ID + Secret)  
- Automatically generates short-lived access tokens (no manual token pasting)  
- Supports `--reset-auth` to reconfigure credentials  
- Saves configuration to `.env` (gitignored)  
- Modular, maintainable codebase  

---

## Requirements

### Node.js  
- **Node.js 18 or higher**  

### NPM Dependencies  

Installed automatically via `npm install`:

- `node-fetch@2` — Spotify API requests  
- `inquirer` — interactive CLI prompts  
- `js-yaml` — YAML parsing + serialization  
- `dotenv` — `.env` loading  

---

## Installation

### 1. Clone or download the project

```bash
git clone https://github.com/yourusername/obsidian-spotify-frontmatter.git
cd obsidian-spotify-frontmatter

