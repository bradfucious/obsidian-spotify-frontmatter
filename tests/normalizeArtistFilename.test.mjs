import { describe, it, expect } from "vitest";
import { normalizeArtistFilename } from "../frontmatter-helper.mjs";

describe("normalizeArtistFilename", () => {
  it("preserves spaces and capitalization while removing slashes", () => {
    const result = normalizeArtistFilename("  My / Artist  Name ");
    expect(result).toBe("My Artist Name");
  });

  it("removes control characters", () => {
    const result = normalizeArtistFilename("A\x00B\x1FC");
    expect(result).toBe("ABC");
  });
});

