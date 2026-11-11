import fs from "node:fs/promises";
import path from "node:path";

// Every Unity WebGL game the site serves. A game's active build version is the constant in its client page;
// the build lives in public/optimized_assets/game_assets/<slug>/Build/<prefix>-<version>/Build/.
export const UNITY_GAMES = [
  {
    name: "Rapid Path",
    slug: "rapid-path",
    prefix: "RapidPath",
    clientFile: path.join("app", "rapid-path", "rapid-path-client.tsx"),
    versionConstant: "RAPID_PATH_BUILD_VERSION",
  },
  {
    name: "Stickman Skydive",
    slug: "stickman-skydive-simulator", // asset folder name; the page route is "stickman-skydive"
    route: "stickman-skydive",
    prefix: "StickmanSkydive",
    clientFile: path.join("app", "stickman-skydive", "stickman-client.tsx"),
    versionConstant: "STICKMAN_BUILD_VERSION",
  },
];

export async function readActiveVersion(projectRoot, game) {
  const source = await fs.readFile(path.join(projectRoot, game.clientFile), "utf8");
  const match = source.match(new RegExp(`const ${game.versionConstant} = "([0-9]+(?:\\.[0-9]+)*)";`));
  if (!match) throw new Error(`Could not read ${game.versionConstant} from the ${game.name} page.`);
  return match[1];
}

export function gameBuildRoot(root, game) {
  return path.join(root, "optimized_assets", "game_assets", game.slug, "Build");
}
