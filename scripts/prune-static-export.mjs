import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

async function main() {
  const clientSource = await fs.readFile(
    path.join(projectRoot, "app", "rapid-path", "rapid-path-client.tsx"),
    "utf8"
  );
  const versionMatch = clientSource.match(
    /const RAPID_PATH_BUILD_VERSION = "([0-9]+(?:\.[0-9]+)*)";/
  );
  if (!versionMatch) {
    throw new Error("Could not read RAPID_PATH_BUILD_VERSION from the Rapid Path page.");
  }

  const version = versionMatch[1];
  const rapidPathBuildRoot = path.join(
    exportRoot,
    "optimized_assets",
    "game_assets",
    "rapid-path",
    "Build"
  );
  const currentBuildDirectory = path.join(rapidPathBuildRoot, `RapidPath-${version}`, "Build");
  const requiredFiles = [
    `RapidPath-${version}.loader.js`,
    `RapidPath-${version}.data.gz`,
    `RapidPath-${version}.framework.js.gz`,
    `RapidPath-${version}.wasm.gz`,
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

  const requiredExportFiles = [
    "index.html",
    "rapid-path/index.html",
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

  const initialSize = await pathSize(exportRoot);
  const removedPaths = [];
  // Local source media (gitignored) still gets copied out of public/ by the export.
  await removePath(path.join(exportRoot, "original_assets"), removedPaths);

  const entries = await fs.readdir(rapidPathBuildRoot, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rapidPathBuildRoot, entry.name);
    if (entry.isDirectory()) {
      if (
        (entry.name.startsWith("RapidPath-") && entry.name !== `RapidPath-${version}`) ||
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
