import { describe, it, expect } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { writeFrontmatterFile } from "../frontmatter-helper.mjs";

describe("writeFrontmatterFile", () => {
  it("merges existing frontmatter without overwriting", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "fmtest-"));
    const file = path.join(tmp, "Artist.md");

    const existing = `---
name: Radiohead
genres:
  - rock
---
`;
    await fs.writeFile(file, existing);

    const incoming = {
      name: "SHOULD NOT OVERWRITE",
      genres: ["alternative"],
      updated: "2026-01-01"
    };

    await writeFrontmatterFile(file, incoming);

    const result = await fs.readFile(file, "utf8");

    expect(result).toContain("rock"); // preserved
    expect(result).not.toContain("SHOULD NOT OVERWRITE");
    expect(result).toContain("updated:");
  });
});

