// frontmatter-helper.mjs
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: content };
  const data = yaml.load(match[1]) || {};
  const body = content.slice(match[0].length);
  return { data, body };
}

export function mergeFrontmatter(existing, incoming) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      merged[key] === undefined ||
      merged[key] === null ||
      merged[key] === ""
    ) {
      merged[key] = value;
    }
  }
  return merged;
}

export function writeFrontmatterToNote(notePath, incomingFm) {
  const fullPath = path.join(process.cwd(), notePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Note not found: ${notePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const { data: existingFm, body } = parseFrontmatter(content);
  const merged = mergeFrontmatter(existingFm, incomingFm);
  const fmBlock = `---\n${yaml.dump(merged)}---\n`;

  fs.writeFileSync(fullPath, fmBlock + body, "utf8");
  console.log(`Updated frontmatter in: ${notePath}`);
}

