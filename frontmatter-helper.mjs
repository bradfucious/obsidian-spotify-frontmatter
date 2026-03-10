// frontmatter-helper.mjs

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

/* -------------------------------------------------------
   Extract YAML frontmatter from a Markdown file
------------------------------------------------------- */
function parseFrontmatter(content) {
  if (!content.startsWith("---")) return { data: {}, body: content };

  const end = content.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: content };

  const raw = content.slice(3, end).trim();
  const body = content.slice(end + 4).trimStart();

  let data = {};
  try {
    data = yaml.load(raw) || {};
  } catch {
    console.warn("⚠️  Warning: Invalid YAML frontmatter detected. Preserving raw content.");
  }

  return { data, body };
}

/* -------------------------------------------------------
   Merge new frontmatter without overwriting existing keys
------------------------------------------------------- */
function mergeFrontmatter(existing, incoming) {
  return { ...incoming, ...existing };
}

/* -------------------------------------------------------
   Write merged frontmatter back to file
------------------------------------------------------- */
export function writeFrontmatterToNote(notePath, fm) {
  const dir = path.dirname(notePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let content = "";
  if (fs.existsSync(notePath)) {
    content = fs.readFileSync(notePath, "utf8");
  }

  const { data: existing, body } = parseFrontmatter(content);
  const merged = mergeFrontmatter(existing, fm);

  const yamlBlock = yaml.dump(merged, { lineWidth: -1 }).trim();
  const newContent = `---\n${yamlBlock}\n---\n\n${body}`;

  fs.writeFileSync(notePath, newContent, "utf8");
}

