// spotify-frontmatter-cli.mjs

import fetch from "node-fetch";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";

import { getClientCredentialsToken } from "./token-helper.mjs";
import { writeFrontmatterToNote } from "./frontmatter-helper.mjs";

/* -------------------------------------------------------
   Utility: detect --reset-auth flag
------------------------------------------------------- */
function hasResetAuthFlag() {
  return process.argv.includes("--reset-auth");
}

/* -------------------------------------------------------
   Utility: Spotify GET wrapper with error handling
------------------------------------------------------- */
async function spotifyGet(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Spotify API error ${res.status} ${res.statusText}: ${text}`
    );
  }

  return res.json();
}

/* -------------------------------------------------------
   Step 1: Choose Artist
------------------------------------------------------- */
async function chooseArtist(token) {
  const { artistQuery } = await inquirer.prompt({
    type: "input",
    name: "artistQuery",
    message: "Artist name:",
    validate: (v) => v.trim().length > 0 || "Please enter an artist name.",
  });

  let data;
  try {
    data = await spotifyGet(
      `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(
        artistQuery
      )}&limit=10&market=US`,
      token
    );
  } catch (err) {
    throw new Error(`Failed to search for artist: ${err.message}`);
  }

  const items = data.artists?.items || [];
  if (!items.length) {
    throw new Error(`No artists found for query: "${artistQuery}".`);
  }

  const { artist } = await inquirer.prompt({
    type: "list",
    name: "artist",
    message: "Select artist:",
    choices: items.map((a) => ({
      name: `${a.name} (${a.followers.total} followers)`,
      value: a,
    })),
  });

  return artist;
}

/* -------------------------------------------------------
   Step 2: Choose Albums (PATCH 1 APPLIED)
------------------------------------------------------- */
async function chooseAlbums(artist, token) {
  console.log(`\nFetching releases for ${artist.name}…`);

  const url =
    `https://api.spotify.com/v1/artists/${artist.id}/albums` +
    `?include_groups=album,single,compilation,appears_on` +
    `&market=US&limit=50`;

  let data;
  try {
    data = await spotifyGet(url, token);
  } catch (err) {
    throw new Error(`Failed to fetch albums: ${err.message}`);
  }

  const albums = data.items || [];

  if (!albums.length) {
    throw new Error(
      `Spotify returned zero releases for ${artist.name}. ` +
        `Try a different artist or check if the Spotify API is filtering by region.`
    );
  }

  const { selected } = await inquirer.prompt({
    type: "checkbox",
    name: "selected",
    message: "Select releases:",
    choices: albums.map((a) => ({
      name: `${a.name} (${a.release_date})`,
      value: a,
    })),
    validate: (arr) =>
      arr.length > 0 || "You must select at least one release.",
  });

  return selected;
}

/* -------------------------------------------------------
   Step 3: Build Frontmatter Object
------------------------------------------------------- */
function buildAlbumFrontmatter(album, artist) {
  return {
    type: "album",
    title: album.name,
    artist: artist.name,
    spotify_id: album.id,
    spotify_url: album.external_urls?.spotify || "",
    release_date: album.release_date,
    total_tracks: album.total_tracks,
    cover_image: album.images?.[0]?.url || "",
  };
}

/* -------------------------------------------------------
   Step 4: Choose Note Paths (PATCH 2 APPLIED)
------------------------------------------------------- */
async function chooseNotesForAlbum(album) {
  console.log(`\nPreparing frontmatter for: ${album.name}`);

  const { notePaths } = await inquirer.prompt({
    type: "input",
    name: "notePaths",
    message:
      `Enter one or more note paths for "${album.name}" ` +
      `(comma-separated, relative to your vault root):`,
    validate: (input) =>
      input.trim().length > 0 ||
      "You must enter at least one note path.",
  });

  const paths = notePaths
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const validated = [];

  for (const p of paths) {
    const full = path.resolve(process.cwd(), p);

    if (!fs.existsSync(full)) {
      console.log(
        `⚠️  Warning: File does not exist yet: ${p}\n` +
          `    It will be created automatically.`
      );
    }

    validated.push(full);
  }

  return validated;
}

/* -------------------------------------------------------
   MAIN WORKFLOW (PATCH 3 APPLIED HERE)
------------------------------------------------------- */
async function main() {
  try {
    const resetAuthFlag = hasResetAuthFlag();
    const token = await getClientCredentialsToken({ resetAuthFlag });

    const artist = await chooseArtist(token);
    const albums = await chooseAlbums(artist, token);

    // 🔥 THIS IS THE LOOP YOU WERE LOOKING FOR
    for (const album of albums) {
      const fm = buildAlbumFrontmatter(album, artist);
      const notePaths = await chooseNotesForAlbum(album);

      for (const notePath of notePaths) {
        try {
          writeFrontmatterToNote(notePath, fm);
          console.log(`✓ Updated frontmatter in: ${notePath}`);
        } catch (err) {
          console.error(`✗ Failed to update ${notePath}: ${err.message}`);
        }
      }
    }

    console.log("\nAll done.\n");
  } catch (e) {
    console.error("\n❌ Fatal Error:", e.message, "\n");
  }
}

main();

