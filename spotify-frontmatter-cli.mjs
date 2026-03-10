#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import inquirer from "inquirer";
import dotenv from "dotenv";
import {
  ensureNotesRoot,
  getEnv,
  setEnv,
  resetNotesRoot,
} from "./token-helper.mjs";
import {
  buildAlbumFrontmatter,
  writeFrontmatterFile,
  ensureMdExtension,
} from "./frontmatter-helper.mjs";

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
    console.log("\nSpotify Client ID/Secret not found.");
    await promptForAuth();
  }

  const token = await getClientCredentialsToken();

  // Main loop: allow multiple album entries until user chooses to exit
  while (true) {
    /* ---------------- Artist selection ---------------- */

    let artist = null;
    while (!artist) {
      console.log("\n(Type q to quit)\n");
      const { artistName } = await inquirer.prompt({
        type: "input",
        name: "artistName",
        message: "Artist name:",
        validate: (v) =>
          v && v.trim() ? true : "Please enter an artist name",
      });
      const rawArtist = artistName.trim();
      if (["q", "quit", "exit"].includes(rawArtist.toLowerCase())) {
        console.log("Aborted by user.");
        process.exit(0);
      }

      const artists = await searchArtist(rawArtist, token);
      if (!artists.length) {
        console.log("\nNo artists found for that query.\n");
        const { tryAgain } = await inquirer.prompt({
          type: "confirm",
          name: "tryAgain",
          message: "Search for another artist?",
          default: true,
        });
        if (!tryAgain) {
          console.log("Exiting.");
          process.exit(0);
        }
        continue;
      }

      console.log(`\nResults for: ${rawArtist}\n`);
      const artistChoice = await inquirer.prompt({
        type: "list",
        name: "artist",
        message: "Select artist:",
        choices: artists.map((a) => ({
          name: `${a.name} (${a.followers.total} followers)`,
          value: a,
        })),
      });
      artist = artistChoice.artist;
    }

    /* ---------------- Album selection ---------------- */

    console.log(`\nFetching releases for: ${artist.name}…\n`);
    const albums = await fetchArtistAlbums(artist.id, token);
    if (!albums.length) {
      console.log("\nNo releases found for this artist.\n");
      const { tryAgain } = await inquirer.prompt({
        type: "confirm",
        name: "tryAgain",
        message: "Search for another artist?",
        default: true,
      });
      if (!tryAgain) {
        console.log("Exiting.");
        process.exit(0);
      }
      continue;
    }

    console.log(`\nReleases for: ${artist.name}\n`);
    let album = null;
    while (!album) {
      const albumChoice = await inquirer.prompt({
        type: "list",
        name: "album",
        message: "Select release:",
        choices: albums.map((al) => ({
          name: `${al.name} (${al.release_date})`,
          value: al,
        })),
      });
      album = albumChoice.album;
    }

    console.log(`\nPreparing frontmatter for: ${album.name}\n`);

    /* ---------------- Filename handling ---------------- */

    function normalizeForFilename(s) {
      return s
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s-_.]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
    }

    function truncateFilename(name, maxLen = 120) {
      if (name.length <= maxLen) return name;
      return name.slice(0, maxLen).replace(/-+$/, "");
    }

    // Non-recursive search in NOTES_ROOT
    async function findExistingFilesInFolder(folder, queryFragment) {
      const results = [];
      try {
        const entries = await fs.readdir(folder, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile()) {
            const lower = e.name.toLowerCase();
            if (lower.includes(queryFragment) || lower === `${queryFragment}.md`) {
              results.push(path.join(folder, e.name));
            }
          }
        }
      } catch {
        // ignore
      }
      return results;
    }

    const suggestedBase = truncateFilename(
      normalizeForFilename(`${artist.name} ${album.name}`)
    );
    const suggestedFilename = ensureMdExtension(suggestedBase);

    let filename = null;
    while (true) {
      console.log(`Album: ${album.name}`);
      console.log(`Suggested filename: ${suggestedFilename}`);
      console.log("(Type q to quit)\n");

      const { filenameInput } = await inquirer.prompt({
        type: "input",
        name: "filenameInput",
        message: "Filename or partial name:",
        default: suggestedFilename,
        validate: (v) => {
          if (!v) return "Please enter a filename or type q to quit";
          const trimmed = v.trim();
          if (["q", "quit", "exit"].includes(trimmed.toLowerCase())) return true;
          if (trimmed.startsWith("/")) {
            return "Absolute paths are not allowed. Enter a filename relative to NOTES_ROOT.";
          }
          return true;
        },
      });

      const raw = filenameInput.trim();
      if (["q", "quit", "exit"].includes(raw.toLowerCase())) {
        console.log("Aborted by user.");
        process.exit(0);
      }

      const fragment = raw.toLowerCase();
      const normalizedFragment = normalizeForFilename(
        fragment.replace(/\.md$/i, "")
      );
      const matches = await findExistingFilesInFolder(
        notesRoot,
        normalizedFragment
      );

      if (
        matches.length === 1 &&
        (raw === suggestedFilename || raw === path.basename(matches[0]))
      ) {
        filename = ensureMdExtension(raw);
        break;
      }

      if (matches.length > 0 && raw !== suggestedFilename) {
        console.log(
          `\nFound ${matches.length} file(s) matching "${raw}" in NOTES_ROOT.\n`
        );
        const choice = await inquirer.prompt({
          type: "list",
          name: "matchChoice",
          message: "Choose an action:",
          choices: [
            ...matches.map((p) => ({
              name: `Use existing: ${path.relative(notesRoot, p)}`,
              value: p,
            })),
            {
              name: `Use suggested filename: ${suggestedFilename}`,
              value: "use-suggested",
            },
            { name: "Enter a different filename", value: "custom" },
            { name: "Abort", value: "abort" },
          ],
        });

        if (choice.matchChoice === "use-suggested") {
          filename = suggestedFilename;
          break;
        } else if (choice.matchChoice === "custom") {
          continue;
        } else if (choice.matchChoice === "abort") {
          console.log("Aborted by user.");
          process.exit(0);
        } else {
          filename = path.relative(notesRoot, choice.matchChoice);
          break;
        }
      }

      filename = ensureMdExtension(raw);
      const candidatePath = path.join(notesRoot, filename);
      try {
        await fs.access(candidatePath);
        console.log(`\nFile already exists: ${filename}\n`);
        const { reuse } = await inquirer.prompt({
          type: "confirm",
          name: "reuse",
          message: "Update this existing file?",
          default: true,
        });
        if (reuse) break;
      } catch {
        break;
      }
    }

    const targetPath = path.join(notesRoot, filename);

    /* ---------------- Fetch album details & write ---------------- */

    const albumDetails = await fetchAlbumDetails(album.id, token);
    const frontmatter = buildAlbumFrontmatter(albumDetails, artist);

    console.log("\nWriting to:");
    console.log(targetPath + "\n");

    const { confirmWrite } = await inquirer.prompt({
      type: "confirm",
      name: "confirmWrite",
      message: "Proceed?",
      default: true,
    });

    if (!confirmWrite) {
      console.log("Cancelled by user.");
    } else {
      try {
        await writeFrontmatterFile(targetPath, frontmatter);
        console.log(`\n✓ Wrote frontmatter to ${targetPath}\n`);
      } catch (err) {
        console.error(`\n✗ Failed to update ${targetPath}: ${err.message}\n`);
      }
    }

    console.log("");
    const { again } = await inquirer.prompt({
      type: "confirm",
      name: "again",
      message: "Process another album?",
      default: false,
    });
    if (!again) {
      console.log("Exiting.");
      process.exit(0);
    }
  }
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
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
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
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
    query
  )}&type=artist&limit=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.artists.items;
}

async function fetchArtistAlbums(artistId, token) {
  const url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on,compilation&limit=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
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
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch album details");
  return res.json();
}

/* ----------------- Auth helpers ----------------- */

async function promptForAuth() {
  console.log("\nSpotify API credentials are required.\n");
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "SPOTIFY_CLIENT_ID",
      message: "Spotify Client ID:",
    },
    {
      type: "input",
      name: "SPOTIFY_CLIENT_SECRET",
      message: "Spotify Client Secret:",
    },
  ]);
  await setEnv("SPOTIFY_CLIENT_ID", answers.SPOTIFY_CLIENT_ID);
  await setEnv("SPOTIFY_CLIENT_SECRET", answers.SPOTIFY_CLIENT_SECRET);
  console.log("\nSaved Spotify credentials to .env\n");
}

async function resetAuth() {
  await promptForAuth();
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

