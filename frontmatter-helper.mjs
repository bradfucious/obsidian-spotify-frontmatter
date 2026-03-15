import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import fetch from "node-fetch";
const existing = yaml.load(match[1], { schema: yaml.FAILSAFE_SCHEMA }) || {};

/**
 * Helper utilities for building and writing frontmatter for albums and artists.
 *
 * - buildAlbumFrontmatter(albumDetails, artist)
 * - buildArtistFrontmatter(artistDetails, options)
 * - ensureMdExtension(filename)
 * - writeFrontmatterFile(targetPath, frontmatterObj)
 *
 * Notes:
 * - Dates are formatted as MM-DD-YYYY per user preference.
 * - writeFrontmatterFile merges non-destructively with existing frontmatter.
 */

/* ----------------- Date formatting ----------------- */

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateMMDDYYYY(d = new Date()) {
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${month}-${day}-${year}`;
}

/* ----------------- Album frontmatter builder ----------------- */

export function buildAlbumFrontmatter(albumDetails, artist) {
  const msToDuration = (ms) => {
    if (!ms || typeof ms !== "number") return "";
    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
  };

  const tracklist =
    albumDetails.tracks && albumDetails.tracks.items
      ? albumDetails.tracks.items.map((t) => t.name)
      : [];

  let durationText = "";
  if (albumDetails.tracks && albumDetails.tracks.items && albumDetails.tracks.items.length) {
    const totalMs = albumDetails.tracks.items.reduce(
      (acc, t) => acc + (t.duration_ms || 0),
      0
    );
    durationText = msToDuration(totalMs);
  }

  const genres =
    Array.isArray(albumDetails.genres) && albumDetails.genres.length
      ? albumDetails.genres
      : artist && Array.isArray(artist.genres)
      ? artist.genres
      : [];

  const label = albumDetails.label ? [albumDetails.label] : [];

  const producers = Array.isArray(albumDetails.producers) ? albumDetails.producers : [];
  const studio = Array.isArray(albumDetails.studio) ? albumDetails.studio : [];

  const front = {
    type: "album",
    title: albumDetails.name || "",
    artist: artist.name || "",
    release_date: albumDetails.release_date || "",
    original_release: albumDetails.release_date || "",
    label,
    genres,
    duration: durationText,
    discs: albumDetails.total_tracks ? 1 : 0,
    studio,
    producers,
    tracklist,
    emotional_resonance: [],
    ikigai_alignment: [],
    bonus_content: [],
    updated: formatDateMMDDYYYY(),
    sticker: "",
    cover:
      albumDetails.images && albumDetails.images[0] ? albumDetails.images[0].url : "",
    color: "",
  };

  return front;
}

/* ----------------- Artist frontmatter builder ----------------- */

/**
 * buildArtistFrontmatter
 * - artistDetails: Spotify artist object (full)
 * - options: { includeFollowers: bool, includePopularity: bool, includeImages: bool }
 */
export function buildArtistFrontmatter(artistDetails = {}, options = {}) {
  const { includeFollowers = true, includePopularity = true, includeImages = true } = options;

  const genres = Array.isArray(artistDetails.genres) ? artistDetails.genres : [];

  const labels = []; // Spotify does not provide artist labels reliably; leave empty for manual edits.

  const notable_releases = []; // Default empty; can be populated later via album fetch or manual edits.

  const spotify_url =
    artistDetails.external_urls && artistDetails.external_urls.spotify
      ? artistDetails.external_urls.spotify
      : artistDetails.uri || "";

  const images = includeImages && Array.isArray(artistDetails.images) ? artistDetails.images : [];

  const cover = images && images.length ? images[0].url : "";

  const followers = includeFollowers && artistDetails.followers ? artistDetails.followers.total : undefined;

  const popularity = includePopularity && typeof artistDetails.popularity === "number" ? artistDetails.popularity : undefined;

  const front = {
    type: "artist",
    name: artistDetails.name || "",
    origin: "",
    active_years: "",
    genres,
    labels,
    notable_releases,
    spotify_url,
    emotional_resonance: [],
    ikigai_alignment: [],
    updated: formatDateMMDDYYYY(),
    sticker: "",
    cover: cover ? cover : "",
    created: formatDateMMDDYYYY(),
    modified: formatDateMMDDYYYY(),
    color: "",
  };

  // Attach optional enrichment fields if requested
  if (followers !== undefined) front.followers = followers;
  if (popularity !== undefined) front.popularity = popularity;
  if (images && images.length) front.images = images;

  return front;
}

/* ----------------- Filename helpers ----------------- */

/**
 * Ensure .md extension
 */
export function ensureMdExtension(filename) {
  if (!filename) return filename;
  if (!filename.toLowerCase().endsWith(".md")) return `${filename}.md`;
  return filename;
}

/**
 * Normalize artist filename while preserving spaces and capitalization.
 * - Remove control characters and slashes
 * - Collapse multiple spaces
 * - Trim
 * - Keep diacritics
 */
export function normalizeArtistFilename(name) {
  if (!name) return "";
  // Remove path separators and control chars
  const cleaned = name
  // eslint-disable-next-line no-control-regex
  .replace(/[/\\\x00]/g, "")
  // eslint-disable-next-line no-control-regex
  .replace(/[\x00-\x1F\x7F]/g, "");
  const collapsed = cleaned.replace(/\s+/g, " ").trim();
  return collapsed;
}

/* ----------------- File write / merge ----------------- */

/**
 * Write frontmatter + placeholder body to a file.
 * If file exists, merge non-destructively: do not overwrite existing keys.
 */
export async function writeFrontmatterFile(targetPath, frontmatterObj) {
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });

  let existing;
  try {
    const txt = await fs.readFile(targetPath, "utf8");
    const match = txt.match(/^---\n([\s\S]*?)\n---\n?/);
    existing = match ? yaml.load(match[1]) || {} : {};
  } catch {
    existing = {};
  }

  // Merge: keep existing values, fill missing from frontmatterObj
  const merged = { ...frontmatterObj };
  for (const [k, v] of Object.entries(existing)) {
    if (v !== undefined && v !== null && v !== "") {
      merged[k] = v;
    }
  }

  // Preserve canonical ordering for artist frontmatter if type === 'artist'
  let yamlText;
  if (merged.type === "artist") {
    const ordered = {
      type: merged.type || "",
      name: merged.name || "",
      origin: merged.origin || "",
      active_years: merged.active_years || "",
      genres: merged.genres || [],
      labels: merged.labels || [],
      notable_releases: merged.notable_releases || [],
      spotify_url: merged.spotify_url || "",
      emotional_resonance: merged.emotional_resonance || [],
      ikigai_alignment: merged.ikigai_alignment || [],
      updated: merged.updated || "",
      sticker: merged.sticker || "",
      cover: merged.cover || "",
      created: merged.created || "",
      modified: merged.modified || "",
      color: merged.color || "",
    };
    // Attach optional enrichment fields if present
    if (merged.followers !== undefined) ordered.followers = merged.followers;
    if (merged.popularity !== undefined) ordered.popularity = merged.popularity;
    if (merged.images !== undefined) ordered.images = merged.images;
    yamlText = yaml.dump(ordered, { lineWidth: 120 });
  } else {
    yamlText = yaml.dump(merged, { lineWidth: 120 });
  }

  const body = `---\n${yamlText}---\n\n`;
  await fs.writeFile(targetPath, body, "utf8");
}

/* ----------------- Optional image download helper ----------------- */

/**
 * downloadImage(url, destPath)
 * - downloads a binary image from url and writes to destPath
 */
export async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, Buffer.from(buffer));
}

