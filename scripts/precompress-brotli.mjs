import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { UNITY_GAMES, gameBuildRoot, readActiveVersion } from "./unity-games.mjs";

// Writes a .br copy next to each gzip Unity artifact of every game's active build in public/,
// so the static export ships both and .htaccess can serve Brotli to browsers that accept it.
// Brotli at max quality takes about a minute and a half, so up-to-date .br files are skipped.

const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "public");
const force = process.argv.includes("--force");

async function mtimeOrNull(filePath) {
  try {
    return (await fs.stat(filePath)).mtimeMs;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function main() {
  for (const game of UNITY_GAMES) {
    const version = await readActiveVersion(projectRoot, game);
    const buildDirectory = path.join(
      gameBuildRoot(publicRoot, game),
      `${game.prefix}-${version}`,
      "Build"
    );

    for (const name of ["data", "framework.js", "wasm"]) {
      const gzPath = path.join(buildDirectory, `${game.prefix}-${version}.${name}.gz`);
      const brPath = path.join(buildDirectory, `${game.prefix}-${version}.${name}.br`);

      const gzTime = await mtimeOrNull(gzPath);
      if (gzTime === null) throw new Error(`Active Unity build is missing ${gzPath}`);

      const brTime = await mtimeOrNull(brPath);
      if (!force && brTime !== null && brTime >= gzTime) {
        console.log(`Up to date: ${path.basename(brPath)}`);
        continue;
      }

      const raw = await gunzip(await fs.readFile(gzPath));
      const compressed = await brotliCompress(raw, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
          [zlib.constants.BROTLI_PARAM_LGWIN]: 24,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
        },
      });
      await fs.writeFile(brPath, compressed);

      const gzSize = (await fs.stat(gzPath)).size;
      console.log(
        `Wrote ${path.basename(brPath)}: ${(gzSize / 1024 / 1024).toFixed(2)} MB gzip -> ${(compressed.length / 1024 / 1024).toFixed(2)} MB brotli`
      );
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
