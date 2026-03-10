# Obsidian Spotify Frontmatter Generator

A Node.js CLI utility that fetches Spotify metadata (artists, albums, singles, compilations, appearances) and inserts **non-destructive YAML frontmatter** into Obsidian notes.

This tool is designed for users who maintain music libraries, discographies, or media notes inside Obsidian and want accurate metadata without overwriting existing fields.

---

## Features

- Search for artists by name  
- Select one or more releases (albums, singles, compilations, appearances)  
- Choose which notes to update  
- Generates clean YAML frontmatter  
- Merges frontmatter without overwriting existing fields  
- Automatically creates missing notes  
- Uses Spotify Client Credentials (Client ID + Secret)  
- Automatically generates short-lived access tokens  
- Supports `--reset-auth` to reconfigure credentials  
- Improved error reporting and validation  
- Fully compatible with Obsidian vaults  

---

## Installation

Clone the repo:

```bash
git clone https://github.com/YOURNAME/obsidian-spotify-frontmatter.git
cd obsidian-spotify-frontmatter
npm install

