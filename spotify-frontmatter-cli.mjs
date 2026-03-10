#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import os from "os";
import fetch from "node-fetch";
import inquirer from "inquirer";
import dotenv from "dotenv";
import { ensureNotesRoot, getEnv, setEnv, resetNotesRoot } from "./token-helper.mjs";
import { buildAlbumFrontmatter, writeFrontmatterFile, ensureMdExtension } from "./frontmatter-helper.mjs";

dotenv.config();

const CLIENT_ID = getEnv("SPOTIFY_CLIENT_ID");
const CLIENT_SECRET = getEnv("SPOTIFY_CLIENT_SECRET");

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--reset-root")) {
    await resetNotesRoot();
    process.exit(0);
  }
  if (argv.includes("--reset-auth")) {
    await resetAuth();
    process.exit(0);
  }

  const notesRoot = await ensureNotesRoot();

  // Ensure Spotify credentials exist
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log("Spotify Client ID/Secret not found. Run with --reset-auth to set them.");
    await promptForAuth();
  }

  const token = await getClientCredentialsToken();

  // Artist selection loop with retry/quit
  let artist = null;
  while (!artist) {
    const { artistName } = await inquirer.prompt({
      type: "input",
      name: "artistName",
      message: "Artist name (or type q/quit/exit to abort):",
      validate: (v) => (v && v.trim() ? true : "Please enter an artist name"),
    });
    const rawArtist = artistName.trim();
    if (["q", "quit", "exit"].includes(rawArtist.toLowerCase())) {
      console.log("Aborted by user.");
      process.exit(0);
    }
    const artists = await searchArtist(rawArtist, token);
    if (!artists.length) {
      const { tryAgain } = await inquirer.prompt({
        type: "confirm",
        name: "tryAgain",
        message: "No artists found. Try again?",
        default: true,
      });
      if (!tryAgain) process.exit(0);
      continue;
    }
    const artistChoice = await inquirer.prompt({
      type: "list",
      name: "artist",
      message: "Select artist:",
      choices: artists.map((a) => ({ name: `${a.name} (${a.followers.total} followers)`, value: a })),
    });
    artist = artistChoice.artist;
  }

  // Fetch releases for artist
  console.log(`\nFetching releases for ${artist.name}…`);
  const albums = await fetchArtistAlbums(artist.id, token);
  if (!albums.length) {
    console.log("No releases found for this artist.");
    process.exit(0);
  }

  // Album selection loop
  let album = null;
  while (!album) {
    const albumChoice = await inquirer.prompt({
      type: "list",
      name: "album",
      message: "Select release:",
      choices: albums.map((al) => ({ name: `${al.name} (${al.release_date})`, value: al })),
    });
    if (!albumChoice.album) {
      const { tryAgain } = await inquirer.prompt({
        type: "confirm",
        name: "tryAgain",
        message: "No album selected. Try again?",
        default: true,
      });
      if (!tryAgain) process.exit(0);
      continue;
    }
    album = albumChoice.album;
  }

  console.log(`\nPreparing frontmatter for: ${album.name}`);

  /* ---------------- filename handling and existing-file detection ---------------- */

  // helper: normalize filename
  function normalizeForFilename(s) {
    return s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/[^a-zA-Z0-9\s-_.]/g, "") // remove punctuation except - _ .
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
  }

  function truncateFilename(name, maxLen = 120) {
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen).replace(/-+$/, "");
  }

  // Find existing files only in the specified NOTES_ROOT folder (non-recursive)
  async function findExistingFilesInFolder(folder, normalizedBase) {
    const results = [];
    try {
      const entries = await fs.readdir(folder, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile()) {
          const lower = e.name.toLowerCase();
          if (lower.includes(normalizedBase) || lower === `${normalizedBase}.md`) {
            results.push(path.join(folder, e.name));
          }
        }
      }
    } catch {
      // ignore
    }
    return results;
  }

  // Build a safe default filename
  const suggestedBase = truncateFilename(normalizeForFilename(`${artist.name} ${album.name}`));
  const suggestedFilename = ensureMdExtension(suggestedBase);

  // Search only the NOTES_ROOT folder (non-recursive)
  const existingMatches = await findExistingFilesInFolder(notesRoot, suggestedBase);

  let filename = null;
  while (true) {
    if (existingMatches && existingMatches.length) {
      const choice = await inquirer.prompt({
        type: "list",
        name: "fileChoice",
        message: `Found ${existingMatches.length} existing file(s) in NOTES_ROOT that may match this album. Choose an action:`,
        choices: [
          ...existingMatches.map((p) => ({ name: `Use existing: ${path.relative(notesRoot, p)}`, value: p })),
          { name: `Use suggested filename: ${suggestedFilename}`, value: "use-suggested" },
          { name: "Enter custom filename", value: "custom" },
          { name: "Abort", value: "abort" },
        ],
      });

      if (choice.fileChoice === "use-suggested") {
        filename = suggestedFilename;
        break;
      } else if (choice.fileChoice === "custom") {
        // fall through to custom prompt below
      } else if (choice.fileChoice === "abort") {
        console.log("Aborted by user.");
        process.exit(0);
      } else {
        // user selected an existing path
        filename = path.relative(notesRoot, choice.fileChoice);
        break;
      }
    }

    // If no matches or user chose custom, prompt for filename with default
    const { filenameInput } = await inquirer.prompt({
      type: "input",
      name: "filenameInput",
      message: `Enter filename for "${album.name}" (or type q/quit/exit to abort):`,
      default: suggestedFilename,
      validate: (v) => {
        if (!v) return "Please enter a filename or type q to abort";
        const trimmed = v.trim();
        if (["q", "quit", "exit"].includes(trimmed.toLowerCase())) return true;
        if (trimmed.startsWith("/")) return "Absolute paths are not allowed. Enter a filename relative to NOTES_ROOT.";
        return true;
      },
    });

    const raw = filenameInput.trim();
    if (["q", "quit", "exit"].includes(raw.toLowerCase())) {
      console.log("Aborted by user.");
      process.exit(0);
    }

    // normalize and ensure .md
    filename = ensureMdExtension(raw);
    // check if file exists in NOTES_ROOT (non-recursive)
    const candidatePath = path.join(notesRoot, filename);
    try {
      await fs.access(candidatePath);
      // file exists — confirm reuse
      const { reuse } = await inquirer.prompt({
        type: "confirm",
        name: "reuse",
        message: `${filename} already exists in NOTES_ROOT. Do you want to update this file?`,
        default: true,
      });
      if (reuse) break;
      // else loop and re-prompt
    } catch {
      // file does not exist — accept
      break;
    }
  }
  const targetPath = path.join(notesRoot, filename);

  // Fetch full album details (tracks, images)
  const albumDetails = await fetchAlbumDetails(album.id, token);

  // Build frontmatter object
  const frontmatter = buildAlbumFrontmatter(albumDetails, artist);

  // Confirm and write file
  console.log(`\nWill write frontmatter to: ${targetPath}`);
  const { confirmWrite } = await inquirer.prompt({
    type: "confirm",
    name: "confirmWrite",
    message: "Proceed?",
    default: true,
  });
  if (!confirmWrite) {
    console.log("Cancelled by user.");
    process.exit(0);
  }

  try {
    await writeFrontmatterFile(targetPath, frontmatter);
    console.log(`\n✓ Wrote frontmatter to ${targetPath}`);
  } catch (err) {
    console.error(`✗ Failed to update ${targetPath}: ${err.message}`);
  }

  console.log("\nAll done.");
  process.exit(0);
}

/* ----------------- Spotify helpers ----------------- */

async function getClientCredentialsToken() {
  const clientId = getEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = getEnv("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials. Run with --reset-auth to set them.");
  }
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to get token: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function searchArtist(query, token) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.artists.items;
}

async function fetchArtistAlbums(artistId, token) {
  const url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on,compilation&limit=50`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const data = await res.json();
  // Deduplicate by name+release_date
  const seen = new Set();
  const items = [];
  for (const it of data.items) {
    const key = `${it.name}::${it.release_date}`;
    if (!seen.has(key)) {
      seen.add(key);
      items.push(it);
    }
  }
  return items;
}

async function fetchAlbumDetails(albumId, token) {
  const url = `https://api.spotify.com/v1/albums/${albumId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to fetch album details");
  return res.json();
}

/* ----------------- Auth helpers ----------------- */

async function promptForAuth() {
  const answers = await inquirer.prompt([
    { type: "input", name: "SPOTIFY_CLIENT_ID", message: "Enter Spotify Client ID:" },
    { type: "input", name: "SPOTIFY_CLIENT_SECRET", message: "Enter Spotify Client Secret:" },
  ]);
  await setEnv("SPOTIFY_CLIENT_ID", answers.SPOTIFY_CLIENT_ID);
  await setEnv("SPOTIFY_CLIENT_SECRET", answers.SPOTIFY_CLIENT_SECRET);
  console.log("Saved Spotify credentials to .env");
}

async function resetAuth() {
  await promptForAuth();
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

