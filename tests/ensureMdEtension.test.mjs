import { describe, it, expect } from "vitest";
import { ensureMdExtension } from "../frontmatter-helper.mjs";

describe("ensureMdExtension", () => {
  it("adds .md when missing", () => {
    expect(ensureMdExtension("Artist Name")).toBe("Artist Name.md");
  });

  it("does not duplicate .md", () => {
    expect(ensureMdExtension("Album Title.md")).toBe("Album Title.md");
  });
});

