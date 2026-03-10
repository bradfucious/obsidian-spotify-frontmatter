# Changelog

## 1.0.0 — Project Initialization
### Added
- Complete rebuild of the Spotify metadata → Obsidian frontmatter generator.
- Interactive CLI workflow:
  - Prompt for artist name
  - Select one or more releases
  - Enter one or more note paths
  - Non-destructive frontmatter merging
- Token helper system:
  - Prompts for Spotify Bearer Token
  - Provides step-by-step instructions for obtaining a token
  - Automatically stores token in `.env`
  - Automatically loads token on future runs
- Modular architecture:
  - `spotify-frontmatter-cli.mjs` (main workflow)
  - `token-helper.mjs` (token loading + instructions)
  - `frontmatter-helper.mjs` (YAML parsing + merging + writing)
- Added `package.json` with all required dependencies:
  - `node-fetch@2`
  - `inquirer`
  - `js-yaml`
  - `dotenv`
- Added Node.js version requirement (`>=18`)
- Added full README with installation, usage, and troubleshooting instructions

### Notes
- Token auto-refresh (Client Credentials flow) is planned but not yet implemented.
- This version focuses on stability, clarity, and reproducibility.

