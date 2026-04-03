import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import fetch from "node-fetch";

/**
 * Normalize an images array into plain serializable objects:
 * [{ url: string, height?: number, width?: number }, ...]
 */
function normalizeImages(raw) {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter(Boolean)
    .map((img) => {
      const url = img && (img.url || img.src) ? String(img.url || img.src) : null;
      return url;
    })
    .filter(Boolean);
}

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

  const albumImages = normalizeImages(albumDetails.images);

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
    updated: new Date().toISOString().slice(0, 10),
    sticker: "",
    cover: albumImages && albumImages.length ? albumImages[0] : "",
    images: albumImages,
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

  const images = includeImages ? normalizeImages(artistDetails.images) : [];
 
  const cover = images && images.length ? images[0] : "";

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
    updated: new Date().toISOString().slice(0, 10),
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
  // Replace runs of whitespace (space, tab, newline) with a single space
  const collapsed = cleaned.replace(/[ \t\r\n]+/g, " ").trim();
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
    existing = match ? yaml.load(match[1], { schema: yaml.FAILSAFE_SCHEMA }) || {} : {};
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

if (merged.images && Array.isArray(merged.images)) {
  merged.images = merged.images
    .filter(Boolean)
    .map((i) => (typeof i === "string" ? i : (i && (i.url || i.src) ? String(i.url || i.src) : null)))
    .filter(Boolean);
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
    yamlText = yaml.dump(ordered, { lineWidth: 120, noRefs: true });
  } else {
    yamlText = yaml.dump(merged, { lineWidth: 120, noRefs: true });
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

/**
 * downloadCoverArt(imageUrl, externalCoversPath, mediaType, slug)
 *
 * Downloads a cover image from imageUrl to:
 *   {externalCoversPath}/{mediaType}/{slug}.jpg
 *
 * Returns a file:/// URI for use in Obsidian frontmatter.
 * Skips download if the file already exists and is non-zero bytes.
 * Returns null on failure (caller should fall back to CDN URL).
 *
 * @param {string} imageUrl          - Source URL (Spotify CDN)
 * @param {string} externalCoversPath - Absolute path to covers root (tilde already expanded)
 * @param {"albums"|"artists"} mediaType - Subfolder name
 * @param {string} slug              - Filename-safe identifier (no extension)
 */
export async function downloadCoverArt(imageUrl, externalCoversPath, mediaType, slug) {
  const destPath = path.join(externalCoversPath, mediaType, `${slug}.jpg`);

  // Skip if already downloaded and non-empty
  try {
    const stat = await fs.stat(destPath);
    if (stat.size > 0) {
      return `file://${encodeURI(destPath)}`;
    }
  } catch { /* file doesn't exist yet */ }

  try {
    await downloadImage(imageUrl, destPath);
    return `file://${encodeURI(destPath)}`;
  } catch (err) {
    console.error(`Failed to download cover art for ${slug}: ${err.message}`);
    return null;
  }
}

