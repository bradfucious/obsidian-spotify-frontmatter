#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import inquirer from "inquirer";
import dotenv from "dotenv";
import { ensureNotesRoot, getEnv, setEnv, resetNotesRoot } from "./token-helper.mjs";
import {
  buildAlbumFrontmatter,
  buildArtistFrontmatter,
  writeFrontmatterFile,
  ensureMdExtension,
  normalizeArtistFilename,
  downloadImage,
} from "./frontmatter-helper.mjs";

dotenv.config();

async function main() {
  const argv = process.argv.slice(2);
  const deepSearchFlag = argv.includes("--deep-search");
  const dryRunFlag = argv.includes("--dry-run");
  const artistOnlyFlag = argv.includes("--artist");

  if (argv.includes("--reset-root")) {
    await resetNotesRoot();
    process.exit(0);
  }
  if (argv.includes("--reset-auth")) {
    // token-helper.mjs does not export resetAuth; clear stored credentials instead.
    try {
      await setEnv("SPOTIFY_CLIENT_ID", "");
      await setEnv("SPOTIFY_CLIENT_SECRET", "");
      console.log("Cleared Spotify credentials from .env. Run the CLI to set new credentials.");
    } catch (err) {
      console.error("Failed to clear Spotify credentials:", err.message || err);
    }
    process.exit(0);
  }

  const notesRoot = await ensureNotesRoot();

  const clientId = getEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = getEnv("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    await promptForAuth();
  }

  const token = await getClientCredentialsToken();

  while (true) {
    /* ---------------- Mode selection ---------------- */
    // eslint-disable-next-line no-useless-assignment
    let mode = "album";
    if (!artistOnlyFlag) {
      console.log("\n(Type q to quit)\n");
      const { chosenMode } = await inquirer.prompt({
        type: "list",
        name: "chosenMode",
        message: "Create artist note or album note?",
        choices: [
          { name: "Album note", value: "album" },
          { name: "Artist note", value: "artist" },
          { name: "Quit", value: "quit" },
        ],
      });
      if (chosenMode === "quit") {
        console.log("Exiting.");
        process.exit(0);
      }
      mode = chosenMode;
    } else {
      mode = "artist";
    }

    if (mode === "artist") {
      await artistFlow(token, notesRoot, { deepSearchFlag, dryRunFlag });
    } else {
      await albumFlow(token, notesRoot, { deepSearchFlag, dryRunFlag });
    }

    const { again } = await inquirer.prompt({
      type: "confirm",
      name: "again",
      message: "Process another item?",
      default: false,
    });
    if (!again) {
      console.log("Exiting.");
      process.exit(0);
    }
  }
}

/* ----------------- Artist Flow ----------------- */

async function artistFlow(token, notesRoot, flags = {}) {
  console.log("\n(Type q to quit)\n");
  const { artistName } = await inquirer.prompt({
    type: "input",
    name: "artistName",
    message: "Artist name:",
    validate: (v) => (v && v.trim() ? true : "Please enter an artist name"),
  });
  const rawArtist = artistName.trim();
  if (["q", "quit", "exit"].includes(rawArtist.toLowerCase())) {
    console.log("Aborted by user.");
    return;
  }

  const artists = await searchArtist(rawArtist, token);
  if (!artists.length) {
    console.log("\nNo artists found for that query.\n");
    return;
  }

  console.log(`\nResults for: ${rawArtist}\n`);
  const artistChoice = await inquirer.prompt({
    type: "list",
    name: "artist",
    message: "Select artist:",
    choices: artists.map((a) => ({
      name: `${a.name} (${a.followers ? a.followers.total : "0"} followers)`,
      value: a,
    })),
  });
  const artist = artistChoice.artist;

  console.log(`\nPreparing artist frontmatter for: ${artist.name}\n`);

  // Suggested filename using {artist}.md logic, preserving spaces/capitalization
  const suggestedBase = normalizeArtistFilename(artist.name);
  const suggestedFilename = ensureMdExtension(suggestedBase);

  // Filename prompt (Option B style)
  // eslint-disable-next-line no-useless-assignment
  let filename = null;
  while (true) {
    console.log(`Artist: ${artist.name}`);
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
      return;
    }

    // Partial search logic (non-recursive by default; deep if flag)
    const matches = await findMatchingFiles(notesRoot, raw, flags.deepSearchFlag);

    if (matches.length > 0 && raw !== suggestedFilename) {
      console.log(`\nFound ${matches.length} file(s) matching "${raw}" in NOTES_ROOT.\n`);
      const choice = await inquirer.prompt({
        type: "list",
        name: "matchChoice",
        message: "Choose an action:",
        choices: [
          ...matches.map((p) => ({
            name: `Use existing: ${path.relative(notesRoot, p)}`,
            value: p,
          })),
          { name: `Use suggested filename: ${suggestedFilename}`, value: "use-suggested" },
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
        return;
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

  // Determine final target path (ask for folder on first run is handled by ensureNotesRoot)
  const targetPath = path.join(notesRoot, filename);

  // Build artist frontmatter with chosen enrichment fields
  const options = { includeFollowers: true, includePopularity: true, includeImages: true };
  const frontmatter = buildArtistFrontmatter(artist, options);

  // If images exist, prompt whether to use Spotify URL or download
  if (frontmatter.images && frontmatter.images.length) {
    console.log("\nArtist images found on Spotify.\n");
    const { imageChoice } = await inquirer.prompt({
      type: "list",
      name: "imageChoice",
      message: "Use Spotify image URL or download to local assets?",
      choices: [
        { name: "Use Spotify image URL (default)", value: "spotify" },
        { name: "Download to NOTES_ROOT/assets/covers/ (opt-in)", value: "download" },
        { name: "Skip images", value: "skip" },
      ],
    });

    if (imageChoice === "download") {
      // Download first image
      try {
        const imgUrl = frontmatter.images[0].url;
        const ext = path.extname(new URL(imgUrl).pathname) || ".jpg";
        const slug = normalizeArtistFilename(artist.name).replace(/[ \t\r\n]+/g, "-");
        const destRel = path.join("assets", "covers", `${slug}${ext}`);
        const destAbs = path.join(notesRoot, destRel);
        await downloadImage(imgUrl, destAbs);
        // Set cover to local embed
        frontmatter.cover = `[[${path.basename(destRel)}]]`;
      } catch (err) {
        console.error(`Failed to download image: ${err.message}`);
        // fallback to spotify url
        frontmatter.cover = frontmatter.images[0].url;
      }
    } else if (imageChoice === "spotify") {
      frontmatter.cover = frontmatter.images[0].url;
    } else {
      // skip images
      frontmatter.cover = "";
    }
  }

  console.log("\nWriting to:");
  console.log(targetPath + "\n");

  if (flags.dryRunFlag) {
    console.log("--- DRY RUN: preview frontmatter ---\n");
    console.log(frontmatter);
    console.log("\n--- end preview ---\n");
    return;
  }

  const { confirmWrite } = await inquirer.prompt({
    type: "confirm",
    name: "confirmWrite",
    message: "Proceed?",
    default: true,
  });

  if (!confirmWrite) {
    console.log("Cancelled by user.");
    return;
  }

  try {
    await writeFrontmatterFile(targetPath, frontmatter);
    console.log(`\n✓ Wrote frontmatter to ${targetPath}\n`);
  } catch (err) {
    console.error(`\n✗ Failed to update ${targetPath}: ${err.message}\n`);
  }
}

/* ----------------- Album Flow (unchanged logic, Option B prompts) ----------------- */

async function albumFlow(token, notesRoot, flags = {}) {
  console.log("\n(Type q to quit)\n");
  const { artistName } = await inquirer.prompt({
    type: "input",
    name: "artistName",
    message: "Artist name:",
    validate: (v) => (v && v.trim() ? true : "Please enter an artist name"),
  });
  const rawArtist = artistName.trim();
  if (["q", "quit", "exit"].includes(rawArtist.toLowerCase())) {
    console.log("Aborted by user.");
    return;
  }

  const artists = await searchArtist(rawArtist, token);
  if (!artists.length) {
    console.log("\nNo artists found for that query.\n");
    return;
  }

  console.log(`\nResults for: ${rawArtist}\n`);
  const artistChoice = await inquirer.prompt({
    type: "list",
    name: "artist",
    message: "Select artist:",
    choices: artists.map((a) => ({
      name: `${a.name} (${a.followers ? a.followers.total : "0"} followers)`,
      value: a,
    })),
  });
  const artist = artistChoice.artist;

  console.log(`\nFetching releases for: ${artist.name}…\n`);
  const albums = await fetchArtistAlbums(artist.id, token);
  if (!albums.length) {
    console.log("\nNo releases found for this artist.\n");
    return;
  }

  console.log(`\nReleases for: ${artist.name}\n`);
  const albumChoice = await inquirer.prompt({
    type: "list",
    name: "album",
    message: "Select release:",
    choices: albums.map((al) => ({
      name: `${al.name} (${al.release_date})`,
      value: al,
    })),
  });
  const album = albumChoice.album;

  console.log(`\nPreparing frontmatter for: ${album.name}\n`);

  // Suggested filename (slug-style used previously for albums)
  function normalizeForFilename(s) {
    return s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-_.]/g, "")
      .trim()
      .replace(/[ \t\r\n]+/g, "-")
      .replace(/-{1,}/g, "-")
      .toLowerCase();
  }

  function truncateFilename(name, maxLen = 120) {
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen).replace(/-{1,}$/, "");
  }

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

  async function findMatchingFiles(folder, fragment, deep = false) {
    if (!deep) return findExistingFilesInFolder(folder, fragment.toLowerCase());
    // recursive search
    const results = [];
    async function walk(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          await walk(p);
        } else if (e.isFile()) {
          const lower = e.name.toLowerCase();
          if (lower.includes(fragment.toLowerCase()) || lower === `${fragment.toLowerCase()}.md`) {
            results.push(p);
          }
        }
      }
    }
    await walk(folder);
    return results;
  }

  const suggestedBase = truncateFilename(normalizeForFilename(`${artist.name} ${album.name}`));
  const suggestedFilename = ensureMdExtension(suggestedBase);

  // eslint-disable-next-line no-useless-assignment
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
      return;
    }

    const matches = await findMatchingFiles(notesRoot, raw, flags.deepSearchFlag);

    if (matches.length > 0 && raw !== suggestedFilename) {
      console.log(`\nFound ${matches.length} file(s) matching "${raw}" in NOTES_ROOT.\n`);
      const choice = await inquirer.prompt({
        type: "list",
        name: "matchChoice",
        message: "Choose an action:",
        choices: [
          ...matches.map((p) => ({
            name: `Use existing: ${path.relative(notesRoot, p)}`,
            value: p,
          })),
          { name: `Use suggested filename: ${suggestedFilename}`, value: "use-suggested" },
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
        return;
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

  const albumDetails = await fetchAlbumDetails(album.id, token);
  const frontmatter = buildAlbumFrontmatter(albumDetails, artist);

  console.log("\nWriting to:");
  console.log(targetPath + "\n");

  if (flags.dryRunFlag) {
    console.log("--- DRY RUN: preview frontmatter ---\n");
    console.log(frontmatter);
    console.log("\n--- end preview ---\n");
    return;
  }

  const { confirmWrite } = await inquirer.prompt({
    type: "confirm",
    name: "confirmWrite",
    message: "Proceed?",
    default: true,
  });

  if (!confirmWrite) {
    console.log("Cancelled by user.");
    return;
  }

  try {
    await writeFrontmatterFile(targetPath, frontmatter);
    console.log(`\n✓ Wrote frontmatter to ${targetPath}\n`);
  } catch (err) {
    console.error(`\n✗ Failed to update ${targetPath}: ${err.message}\n`);
  }
}

/* ----------------- Shared helpers ----------------- */

async function findMatchingFiles(folder, fragment, deep = false) {
  // Reuse albumFlow's helper if needed; simple wrapper here
  const results = [];
  try {
    if (!deep) {
      const entries = await fs.readdir(folder, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile()) {
          const lower = e.name.toLowerCase();
          if (lower.includes(fragment.toLowerCase()) || lower === `${fragment.toLowerCase()}.md`) {
            results.push(path.join(folder, e.name));
          }
        }
      }
    } else {
      async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) {
            await walk(p);
          } else if (e.isFile()) {
            const lower = e.name.toLowerCase();
            if (lower.includes(fragment.toLowerCase()) || lower === `${fragment.toLowerCase()}.md`) {
              results.push(p);
            }
          }
        }
      }
      await walk(folder);
    }
  } catch {
    // ignore
  }
  return results;
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

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
