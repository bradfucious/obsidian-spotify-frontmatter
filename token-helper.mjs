// token-helper.mjs
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import dotenv from "dotenv";

const ENV_PATH = path.join(process.cwd(), ".env");

export function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    dotenv.config({ path: ENV_PATH });
  }
}

export async function getSpotifyToken() {
  loadEnv();

  if (process.env.SPOTIFY_TOKEN) {
    return process.env.SPOTIFY_TOKEN;
  }

  console.log("\nNo Spotify token found.\n");

  const { token } = await inquirer.prompt({
    type: "input",
    name: "token",
    message:
      "Paste your Spotify Bearer Token (press Enter for instructions):",
  });

  if (!token.trim()) {
    printInstructions();
    return await getSpotifyToken();
  }

  saveToken(token.trim());
  return token.trim();
}

function saveToken(token) {
  const content = `SPOTIFY_TOKEN=${token}\n`;
  fs.writeFileSync(ENV_PATH, content, "utf8");
  console.log(`\nSaved token to .env\n`);
}

function printInstructions() {
  console.log(`
To get a Spotify Bearer Token:

1. Open:
   https://developer.spotify.com/console/get-search-item/

2. Click "Get Token"

3. Select these scopes:
   - user-read-private
   - user-read-email (optional)

4. Click "Request Token"

5. Copy the long token string and paste it here.

This token lasts 1 hour. You can regenerate it anytime.
`);
}

