import { describe, it, expect } from "vitest";
import { buildAlbumFrontmatter } from "../frontmatter-helper.mjs";

describe("buildAlbumFrontmatter", () => {
  it("computes total duration and tracklist", () => {
    const album = {
      name: "Test Album",
      release_date: "2020-01-01",
      tracks: {
        items: [
          { name: "Track 1", duration_ms: 60000 },
          { name: "Track 2", duration_ms: 90000 }
        ]
      },
      images: [{ url: "http://example.com/cover.jpg" }]
    };

    const artist = { name: "Test Artist", genres: ["rock"] };

    const fm = buildAlbumFrontmatter(album, artist);

    expect(fm.duration).toBe("2m 30s");
    expect(fm.tracklist).toEqual(["Track 1", "Track 2"]);
    expect(fm.cover).toBe("http://example.com/cover.jpg");
  });
});

