import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UNITY_GAMES, gameBuildRoot, readActiveVersion } from "./unity-games.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportRoot = path.join(projectRoot, "out");
const dryRun = process.argv.includes("--dry-run");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function pathSize(filePath) {
  const stats = await fs.stat(filePath);
  if (!stats.isDirectory()) return stats.size;

  const entries = await fs.readdir(filePath, { withFileTypes: true });
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      return pathSize(path.join(filePath, entry.name));
    })
  );
  return sizes.reduce((total, size) => total + size, 0);
}

async function isGzip(filePath) {
  const file = await fs.open(filePath, "r");
  try {
    const header = Buffer.alloc(2);
    const { bytesRead } = await file.read(header, 0, header.length, 0);
    return bytesRead === 2 && header[0] === 0x1f && header[1] === 0x8b;
  } finally {
    await file.close();
  }
}

async function removePath(filePath, removedPaths) {
  if (!(await exists(filePath))) return;
  const size = await pathSize(filePath);
  if (!dryRun) await fs.rm(filePath, { recursive: true, force: true });
  removedPaths.push({ path: path.relative(exportRoot, filePath), size });
}

// Next's client prefetches segment data as "__next.about.__PAGE__.txt" (dots), but the export writes
// "__next.about/__PAGE__.txt" (folders). cPanel's rewrite for this never matched, so every page logged a 404.
async function addDottedSegmentFiles(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory() || entry.name === "_next" || entry.name === "optimized_assets") continue;
    if (!entry.name.startsWith("__next.")) {
      await addDottedSegmentFiles(full);
      continue;
    }
    const stack = [[full, ""]];
    while (stack.length) {
      const [current, prefix] = stack.pop();
      for (const child of await fs.readdir(current, { withFileTypes: true })) {
        if (child.isDirectory()) stack.push([path.join(current, child.name), `${prefix}${child.name}.`]);
        else if (!dryRun) await fs.copyFile(path.join(current, child.name), `${full}.${prefix}${child.name}`);
      }
    }
  }
}

async function main() {
  // Check every game's active build before touching anything.
  const activeBuilds = [];
  for (const game of UNITY_GAMES) {
    const version = await readActiveVersion(projectRoot, game);
    const buildRoot = gameBuildRoot(exportRoot, game);
    const currentBuildDirectory = path.join(buildRoot, `${game.prefix}-${version}`, "Build");
    const requiredFiles = [
      `${game.prefix}-${version}.loader.js`,
      `${game.prefix}-${version}.data.gz`,
      `${game.prefix}-${version}.framework.js.gz`,
      `${game.prefix}-${version}.wasm.gz`,
    ];

    for (const requiredFile of requiredFiles) {
      const requiredPath = path.join(currentBuildDirectory, requiredFile);
      if (!(await exists(requiredPath))) {
        throw new Error(`Active Unity build is incomplete: ${requiredPath}`);
      }
      if (requiredFile.endsWith(".gz") && !(await isGzip(requiredPath))) {
        throw new Error(`Active Unity build artifact is not gzip-compressed: ${requiredPath}`);
      }
    }
    activeBuilds.push({ game, version, buildRoot, currentBuildDirectory });
  }

  const requiredExportFiles = [
    "index.html",
    ...UNITY_GAMES.map((game) => `${game.route ?? game.slug}/index.html`),
    "robots.txt",
    "sitemap.xml",
    ".htaccess",
    "api/leaderboard.php",
    "api/submit-score.php",
    "api/clear-leaderboard.php",
  ];
  for (const requiredFile of requiredExportFiles) {
    if (!(await exists(path.join(exportRoot, requiredFile)))) {
      throw new Error(`Static export is missing required deployment file: ${requiredFile}`);
    }
  }

  await addDottedSegmentFiles(exportRoot);

  const initialSize = await pathSize(exportRoot);
  const removedPaths = [];
  // Local source media (gitignored) still gets copied out of public/ by the export.
  await removePath(path.join(exportRoot, "original_assets"), removedPaths);

  for (const { game, version, buildRoot, currentBuildDirectory } of activeBuilds) {
    const entries = await fs.readdir(buildRoot, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(buildRoot, entry.name);
      if (entry.isDirectory()) {
        if (
          (entry.name.startsWith(`${game.prefix}-`) && entry.name !== `${game.prefix}-${version}`) ||
          entry.name.includes("DoNotShip")
        ) {
          await removePath(entryPath, removedPaths);
        }
        continue;
      }

      if (/^Unity Builds\.(data|framework\.js|loader\.js|wasm)(\.gz)?$/.test(entry.name)) {
        await removePath(entryPath, removedPaths);
      }
    }

    const currentBuildEntries = await fs.readdir(currentBuildDirectory, { withFileTypes: true });
    for (const entry of currentBuildEntries) {
      if (
        entry.isFile() &&
        /\.(data|framework\.js|wasm)$/.test(entry.name) &&
        (await exists(path.join(currentBuildDirectory, `${entry.name}.gz`)))
      ) {
        await removePath(path.join(currentBuildDirectory, entry.name), removedPaths);
      }
    }
  }

  const reclaimedBytes = removedPaths.reduce((total, item) => total + item.size, 0);
  const finalSize = dryRun ? initialSize - reclaimedBytes : await pathSize(exportRoot);
  console.log(`${dryRun ? "Would remove" : "Removed"} ${removedPaths.length} unused Unity artifact(s).`);
  for (const removedPath of removedPaths) console.log(` - ${removedPath.path}`);
  console.log(
    `Export size: ${(initialSize / 1024 / 1024).toFixed(1)} MB -> ${(finalSize / 1024 / 1024).toFixed(1)} MB`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
