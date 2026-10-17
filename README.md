# Reaction Lab Games

The website is a Next.js static export hosted on Apache/cPanel. The exported site
does not require a Node.js process on the production host. The PHP files under
`public/api/` provide the leaderboard endpoints.

## Local development

```bash
npm run dev
```

Run the source lint check with:

```bash
npm run lint
```

## Build and deploy

Build the site with:

```bash
npm ci
npm run build
```

The build writes a deployable static site to `out/`. The post-build step removes
unused Unity build versions and uncompressed copies from that export while
leaving the source assets untouched.

Upload the **contents** of `out/` to the cPanel document root (commonly
`public_html/`), including the hidden `.htaccess` file. Synchronize deletions
when deploying so old Unity build files do not accumulate on the host. The
export contains the site pages, precompressed Unity assets, and PHP endpoints.

Apache must allow `.htaccess` overrides and provide `mod_rewrite` and
`mod_headers`. The `.htaccess` file handles canonical routes, gzip delivery,
Unity content types, and cache headers. Next.js response-header configuration
does not control the static files served by cPanel.

The leaderboard endpoints require PHP with PDO MySQL support. Configure the
database constants and admin token in the server-side `config.php` expected by
the PHP files; keep that file outside the document root and never upload its
secrets as part of the static export. Confirm the configured path matches the
cPanel account before deploying.

## Unity WebGL builds

The current browser game build version is set in
`app/rapid-path/rapid-path-client.tsx`. Place that version's Unity WebGL output
under `public/optimized_assets/game_assets/rapid-path/Build/RapidPath-<version>/`
with its loader, `.data.gz`, `.framework.js.gz`, and `.wasm.gz` files in the
`Build/` subdirectory. Build using Unity's gzip compression; cPanel serves the
precompressed files with the required encoding and MIME headers. The export
step fails if the active build is missing.
