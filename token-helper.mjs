import fs from "fs/promises";
import path from "path";
import os from "os";
import inquirer from "inquirer";
import dotenv from "dotenv";

dotenv.config();

const ENV_PATH = path.resolve(process.cwd(), ".env");

export function getEnv(key) {
  return process.env[key] || null;
}

async function readEnvFile() {
  try {
    const txt = await fs.readFile(ENV_PATH, "utf8");
    const parsed = {};
    for (const line of txt.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      parsed[k] = v;
    }
    return parsed;
  } catch {
    return {};
  }
}

async function writeEnvFile(obj) {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    lines.push(`${k}=${v}`);
  }
  await fs.writeFile(ENV_PATH, lines.join(os.EOL), "utf8");
  // reload into process.env
  for (const [k, v] of Object.entries(obj)) {
    process.env[k] = v;
  }
}

export async function ensureNotesRoot() {
  const env = await readEnvFile();
  if (env.NOTES_ROOT && env.NOTES_ROOT.trim()) {
    process.env.NOTES_ROOT = env.NOTES_ROOT;
    return env.NOTES_ROOT;
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "NOTES_ROOT",
      message: "Enter the absolute path to your notes root directory:",
      validate: async (v) => {
        if (!v || !v.trim()) return "Please enter an absolute path";
        if (!path.isAbsolute(v.trim())) return "Please enter an absolute path";
        return true;
      },
    },
  ]);

  env.NOTES_ROOT = answers.NOTES_ROOT.trim();
  await writeEnvFile(env);
  console.log(`Saved NOTES_ROOT to .env: ${env.NOTES_ROOT}`);
  return env.NOTES_ROOT;
}

export async function resetNotesRoot() {
  const env = await readEnvFile();
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "NOTES_ROOT",
      message: "Enter the new absolute path to your notes root directory:",
      validate: (v) => {
        if (!v || !v.trim()) return "Please enter an absolute path";
        if (!path.isAbsolute(v.trim())) return "Please enter an absolute path";
        return true;
      },
    },
  ]);
  env.NOTES_ROOT = answers.NOTES_ROOT.trim();
  await writeEnvFile(env);
  console.log(`Updated NOTES_ROOT in .env: ${env.NOTES_ROOT}`);
}

export async function setEnv(key, value) {
  const env = await readEnvFile();
  env[key] = value;
  await writeEnvFile(env);
}
