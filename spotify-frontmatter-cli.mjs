// spotify-frontmatter-cli.mjs
import fetch from "node-fetch";
import inquirer from "inquirer";
import { getClientCredentialsToken } from "./token-helper.mjs";
import { writeFrontmatterToNote } from "./frontmatter-helper.mjs";

function hasResetAuthFlag() {
  return process.argv.includes("--reset-auth");
}

async function spotifyGet(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function chooseArtist(token) {
  const { artistQuery } = await inquirer.prompt({
    type: "input",
    name: "artistQuery",
    message: "Artist name:",
  });

  const data = await spotifyGet(
    `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(
      artistQuery
    )}&limit=10`,
    token
  );

  const items = data.artists.items;
  if (!items.length) throw new Error("No artists found.");

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

async function chooseAlbums(artist, token) {
  const data = await spotifyGet(
    `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=20`,
    token
  );

  const albums = data.items;

  const { selected } = await inquirer.prompt({
    type: "checkbox",
    name: "selected",
    message: "Select releases:",
    choices: albums.map((a) => ({
      name: `${a.name} (${a.release_date})`,
      value: a,
    })),
  });

  if (!selected.length) throw new Error("No releases selected.");
  return selected;
}

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

async function chooseNotesForAlbum(album) {
  const { notePaths } = await inquirer.prompt({
    type: "input",
    name: "notePaths",
    message: `Enter note path(s) for "${album.name}" (comma-separated, relative to vault):`,
  });

  return notePaths
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  try {
    const resetAuthFlag = hasResetAuthFlag();
    const token = await getClientCredentialsToken({ resetAuthFlag });

    const artist = await chooseArtist(token);
    const albums = await chooseAlbums(artist, token);

    for (const album of albums) {
      const fm = buildAlbumFrontmatter(album, artist);
      const notePaths = await chooseNotesForAlbum(album);

      for (const notePath of notePaths) {
        writeFrontmatterToNote(notePath, fm);
      }
    }

    console.log("Done.");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();

