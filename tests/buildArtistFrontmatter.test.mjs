import { describe, it, expect } from "vitest";
import { buildArtistFrontmatter } from "../frontmatter-helper.mjs";

describe("buildArtistFrontmatter", () => {
  it("builds minimal artist frontmatter with defaults", () => {
    const artist = {
      name: "Radiohead",
      genres: ["alternative"],
      followers: { total: 1000 },
      popularity: 88,
      images: [{ url: "http://example.com/img.jpg" }]
    };

    const fm = buildArtistFrontmatter(artist);

    expect(fm.type).toBe("artist");
    expect(fm.name).toBe("Radiohead");
    expect(fm.genres).toContain("alternative");
    expect(fm.cover).toBe("http://example.com/img.jpg");
    expect(fm.followers).toBe(1000);
    expect(fm.popularity).toBe(88);
  });
});

