import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

/**
 * Build album frontmatter object using the locked schema.
 * albumDetails: Spotify album object (full)
 * artist: Spotify artist object (selected)
 */
export function buildAlbumFrontmatter(albumDetails, artist) {
  // Helper to convert ms to "Xm Ys"
  const msToDuration = (ms) => {
    if (!ms || typeof ms !== "number") return "";
    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
  };

  // Build tracklist (names)
  const tracklist = (albumDetails.tracks && albumDetails.tracks.items)
    ? albumDetails.tracks.items.map((t) => t.name)
    : [];

  // Compute approximate duration by summing track durations if available
  let durationText = "";
  if (albumDetails.tracks && albumDetails.tracks.items && albumDetails.tracks.items.length) {
    const totalMs = albumDetails.tracks.items.reduce((acc, t) => acc + (t.duration_ms || 0), 0);
    durationText = msToDuration(totalMs);
  }

  // Genres: prefer album genres, fall back to artist genres
  const genres = Array.isArray(albumDetails.genres) && albumDetails.genres.length
    ? albumDetails.genres
    : (artist && Array.isArray(artist.genres) ? artist.genres : []);

  // Label: Spotify exposes albumDetails.label as a string sometimes
  const label = albumDetails.label ? [albumDetails.label] : [];

  // Producers and studio: Spotify rarely exposes these fields.
  // If your source provides them (e.g., MusicBrainz, Discogs), we can merge them here.
  // For now, attempt to use albumDetails.producers / albumDetails.studio if present.
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
    updated: "",
    sticker: "",
    cover: albumDetails.images && albumDetails.images[0] ? albumDetails.images[0].url : "",
    color: "",
  };

  return front;
}

/**
 * Ensure filename has .md extension only if missing.
 */
export function ensureMdExtension(filename) {
  if (!filename.toLowerCase().endsWith(".md")) return `${filename}.md`;
  return filename;
}

/**
 * Write frontmatter + placeholder body to a file.
 * If file exists, merge non-destructively: do not overwrite existing keys.
 */
export async function writeFrontmatterFile(targetPath, frontmatterObj) {
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });

  let existing = null;
  try {
    const txt = await fs.readFile(targetPath, "utf8");
    // Try to parse existing frontmatter if present
    const match = txt.match(/^---\n([\s\S]*?)\n---\n?/);
    if (match) {
      existing = yaml.load(match[1]) || {};
    } else {
      existing = {};
    }
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

  const yamlText = yaml.dump(merged, { lineWidth: 120 });
  const body = `---\n${yamlText}---\n\n`; // empty body for now
  await fs.writeFile(targetPath, body, "utf8");
}

