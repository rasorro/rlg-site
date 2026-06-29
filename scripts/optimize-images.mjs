import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const trimmed = arg.replace(/^--/, "");
    const [k, v = "true"] = trimmed.split("=");
    return [k, v];
  })
);

const INPUT_DIR = path.resolve(process.cwd(), args.in ?? "public/original_assets");
const OUTPUT_DIR = path.resolve(process.cwd(), args.out ?? "public/optimized_assets");
const QUALITY = Number.parseInt(args.quality ?? "78", 10);
const MAX_DIMENSION = Number.parseInt(args.max ?? "1600", 10);
const SHOULD_CLEAN_OUTPUT = args.clean === "true";

const CONVERTIBLE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(fullPath);
      }
      return [fullPath];
    })
  );
  return files.flat();
}

function relativeToInput(filePath) {
  return path.relative(INPUT_DIR, filePath);
}

function shouldProcess(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONVERTIBLE_EXTENSIONS.has(ext);
}

function outputPathFor(filePath) {
  const rel = relativeToInput(filePath);
  const parsed = path.parse(rel);
  return path.join(OUTPUT_DIR, parsed.dir, `${parsed.name}.webp`);
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function optimizeImage(srcPath, destPath) {
  const pipeline = sharp(srcPath, { failOn: "none" }).rotate();
  const metadata = await pipeline.metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;

  if (width && height && (width > MAX_DIMENSION || height > MAX_DIMENSION)) {
    pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  await pipeline.webp({ quality: QUALITY, effort: 5 }).toFile(destPath);
}

function formatKB(bytes) {
  return (bytes / 1024).toFixed(1);
}

async function main() {
  const inputExists = await fs
    .stat(INPUT_DIR)
    .then((stat) => stat.isDirectory())
    .catch(() => false);

  if (!inputExists) {
    throw new Error(`Input directory does not exist: ${INPUT_DIR}`);
  }

  const allFiles = await walkFiles(INPUT_DIR);
  const convertibleFiles = allFiles.filter(shouldProcess);
  const passthroughFiles = allFiles.filter((filePath) => !shouldProcess(filePath));

  if (allFiles.length === 0) {
    console.log("No files were found in input directory.");
    return;
  }

  if (SHOULD_CLEAN_OUTPUT) {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  }

  let sourceBytesTotal = 0;
  let outputBytesTotal = 0;
  let processed = 0;

  for (const srcPath of convertibleFiles) {
    const rel = relativeToInput(srcPath);

    const destPath = outputPathFor(srcPath);

    await ensureParentDir(destPath);
    await optimizeImage(srcPath, destPath);

    const srcStat = await fs.stat(srcPath);
    const outStat = await fs.stat(destPath);

    sourceBytesTotal += srcStat.size;
    outputBytesTotal += outStat.size;
    processed += 1;

    const percent = ((1 - outStat.size / srcStat.size) * 100).toFixed(1);
    console.log(`${rel} -> ${path.relative(process.cwd(), destPath)} (${formatKB(srcStat.size)} KB -> ${formatKB(outStat.size)} KB, ${percent}% smaller)`);
  }

  for (const srcPath of passthroughFiles) {
    const rel = relativeToInput(srcPath);
    const destPath = path.join(OUTPUT_DIR, rel);

    await ensureParentDir(destPath);
    await fs.copyFile(srcPath, destPath);

    const srcStat = await fs.stat(srcPath);
    const outStat = await fs.stat(destPath);

    sourceBytesTotal += srcStat.size;
    outputBytesTotal += outStat.size;
    processed += 1;

    console.log(`${rel} -> ${path.relative(process.cwd(), destPath)} (copied as-is)`);
  }

  if (processed === 0) {
    console.log("No images were processed.");
    return;
  }

  const totalPercent = ((1 - outputBytesTotal / sourceBytesTotal) * 100).toFixed(1);
  console.log("\nSummary:");
  console.log(`Processed ${processed} file(s)`);
  console.log(`Source total: ${formatKB(sourceBytesTotal)} KB`);
  console.log(`Output total: ${formatKB(outputBytesTotal)} KB`);
  console.log(`Saved: ${totalPercent}%`);
  console.log(`Output directory: ${path.relative(process.cwd(), OUTPUT_DIR)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
