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

const NOTES_ROOT = getEnv("NOTES_ROOT");
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

  // Artist search
  const { artistName } = await inquirer.prompt({
    type: "input",
    name: "artistName",
    message: "Artist name:",
    validate: (v) => (v && v.trim().length ? true : "Please enter an artist name"),
  });

  const artists = await searchArtist(artistName, token);
  if (!artists.length) {
    console.log("No artists found.");
    process.exit(1);
  }

  const artistChoice = await inquirer.prompt({
    type: "list",
    name: "artist",
    message: "Select artist:",
    choices: artists.map((a) => ({ name: `${a.name} (${a.followers.total} followers)`, value: a })),
  });

  const artist = artistChoice.artist;

  // Optionally write artist note in future; currently we proceed to albums
  console.log(`\nFetching releases for ${artist.name}…`);
  const albums = await fetchArtistAlbums(artist.id, token);
  if (!albums.length) {
    console.log("No releases found for this artist.");
    process.exit(0);
  }

  const albumChoice = await inquirer.prompt({
    type: "list",
    name: "album",
    message: "Select release:",
    choices: albums.map((al) => ({ name: `${al.name} (${al.release_date})`, value: al })),
  });

  const album = albumChoice.album;
  console.log(`\nPreparing frontmatter for: ${album.name}`);

  // Option A: single filename per album (confirmed)
  const { filenameInput } = await inquirer.prompt({
    type: "input",
    name: "filenameInput",
    message: `Enter the filename for "${album.name}" (filename only, no leading slash):`,
    validate: (v) => {
      if (!v || !v.trim()) return "Please enter a filename";
      if (v.trim().startsWith("/")) return "Absolute paths are not allowed here. Enter only filenames.";
      return true;
    },
  });

  const filename = ensureMdExtension(filenameInput.trim());
  const targetPath = path.join(notesRoot, filename);

  // Fetch full album details (tracks, images)
  const albumDetails = await fetchAlbumDetails(album.id, token);

  // Build frontmatter object
  const frontmatter = buildAlbumFrontmatter(albumDetails, artist);

  // Write file (create directories as needed)
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

