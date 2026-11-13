// Post-build checks on out/ (CI runs this after `npm run build`). Catches the mistakes that only show up on the live host.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UNITY_GAMES, readActiveVersion } from "./unity-games.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "out");
const problems = [];
const read = (file) => fs.readFileSync(path.join(out, file), "utf8");

// Every sitemap URL is a real exported page whose canonical link is that exact URL.
const urls = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) problems.push("sitemap.xml has no URLs");
for (const url of urls) {
  const pagePath = new URL(url).pathname;
  const file = path.join(pagePath.replace(/^\//, ""), "index.html");
  if (!fs.existsSync(path.join(out, file))) {
    problems.push(`sitemap lists ${url} but out/${file} does not exist`);
    continue;
  }
  const canonical = read(file).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== url) problems.push(`${pagePath} canonical is ${canonical}, sitemap says ${url}`);
}

// Art and the OG image must stay crawlable.
if (/^Disallow:\s*\/optimized_assets\/\s*$/im.test(read("robots.txt"))) problems.push("robots.txt blocks all of /optimized_assets/");

// Apache needs these long-cache rules; losing them silently slows every repeat visit.
const htaccess = read(".htaccess");
for (const needle of ["/_next/static/", "immutable", "\.(webp|png|svg|ico)$"]) {
  if (!htaccess.includes(needle)) problems.push(`.htaccess is missing the cache rule containing ${needle}`);
}

// Security headers must stay in the .htaccess (the live host sends none by default).
for (const header of ["X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options", "Permissions-Policy"]) {
  if (!htaccess.includes(`Header always set ${header}`)) problems.push(`.htaccess is missing the ${header} header`);
}

// The active Unity build is complete in both encodings the .htaccess can serve.
for (const game of UNITY_GAMES) {
  const version = await readActiveVersion(root, game);
  const dir = path.join("optimized_assets", "game_assets", game.slug, "Build", `${game.prefix}-${version}`, "Build");
  for (const name of ["data", "framework.js", "wasm"]) {
    for (const ext of ["gz", "br"]) {
      const file = path.join(dir, `${game.prefix}-${version}.${name}.${ext}`);
      if (!fs.existsSync(path.join(out, file))) problems.push(`missing out/${file}`);
    }
  }
}

if (problems.length) {
  console.error(problems.map((p) => ` - ${p}`).join("\n"));
  process.exit(1);
}
console.log(`Export checks passed (${urls.length} pages).`);
