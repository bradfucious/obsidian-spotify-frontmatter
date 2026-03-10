// token-helper.mjs
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import dotenv from "dotenv";
import fetch from "node-fetch";

const ENV_PATH = path.join(process.cwd(), ".env");

function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    dotenv.config({ path: ENV_PATH });
  }
}

function parseEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, "utf8");
  const lines = content.split("\n");
  const env = {};
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

function writeEnvFile(envObj) {
  const lines = [];
  for (const [key, value] of Object.entries(envObj)) {
    if (value !== undefined && value !== null) {
      lines.push(`${key}=${value}`);
    }
  }
  const content = lines.join("\n") + "\n";
  fs.writeFileSync(ENV_PATH, content, "utf8");
}

function setEnvVars(updates) {
  const current = parseEnvFile();
  const merged = { ...current, ...updates };
  writeEnvFile(merged);
  Object.assign(process.env, updates);
}

async function promptForClientCredentials() {
  console.log(`
To use this utility, you need a Spotify app (Client ID + Client Secret).

1. Go to: https://developer.spotify.com/dashboard
2. Log in with your Spotify account.
3. Click "Create app" (or select an existing app you want to use).
4. Give it a name (e.g., "Obsidian Frontmatter Utility").
5. After creation, open the app and copy:
   - Client ID
   - Client Secret
`);

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "clientId",
      message: "Enter your Spotify Client ID:",
      validate: (v) => (v.trim() ? true : "Client ID cannot be empty."),
    },
    {
      type: "password",
      name: "clientSecret",
      message: "Enter your Spotify Client Secret:",
      mask: "*",
      validate: (v) => (v.trim() ? true : "Client Secret cannot be empty."),
    },
  ]);

  setEnvVars({
    SPOTIFY_CLIENT_ID: answers.clientId.trim(),
    SPOTIFY_CLIENT_SECRET: answers.clientSecret.trim(),
  });

  console.log("\nSaved Spotify Client ID and Secret to .env\n");
}

function getStoredTokenIfValid() {
  const token = process.env.SPOTIFY_ACCESS_TOKEN;
  const expiresAt = process.env.SPOTIFY_TOKEN_EXPIRES_AT;

  if (!token || !expiresAt) return null;

  const now = Math.floor(Date.now() / 1000);
  const exp = parseInt(expiresAt, 10);

  // Refresh 60 seconds before expiry
  if (Number.isNaN(exp) || now >= exp - 60) {
    return null;
  }

  return token;
}

async function requestNewAccessToken(clientId, clientSecret) {
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to obtain Spotify access token: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = await res.json();
  const accessToken = data.access_token;
  const expiresIn = data.expires_in; // seconds

  if (!accessToken || !expiresIn) {
    throw new Error("Spotify token response missing access_token or expires_in.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  setEnvVars({
    SPOTIFY_ACCESS_TOKEN: accessToken,
    SPOTIFY_TOKEN_EXPIRES_AT: String(expiresAt),
  });

  return accessToken;
}

export async function getClientCredentialsToken({ resetAuthFlag = false } = {}) {
  loadEnv();

  if (resetAuthFlag) {
    console.log("\nResetting Spotify authentication configuration...\n");
    await promptForClientCredentials();
  } else {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      await promptForClientCredentials();
    }
  }

  const existingToken = getStoredTokenIfValid();
  if (existingToken) {
    return existingToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify Client ID or Secret missing after configuration.");
  }

  return await requestNewAccessToken(clientId, clientSecret);
}

