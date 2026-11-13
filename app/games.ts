// Single source of truth for the Unity builds. scripts/unity-games.mjs reads the *_BUILD_VERSION constants below
// (keep the `const NAME = "x.y.z";` shape), and game.html reads everything else from the iframe URL.
export const RAPID_PATH_BUILD_VERSION = "1.0.5";
export const RAPID_PATH_BUILD_REVISION = "a9e55d21a398";
export const STICKMAN_BUILD_VERSION = "1.1";
// Bump the revision when re-uploading a build under the same version, so the long-cached files are fetched again.
export const STICKMAN_BUILD_REVISION = "7";

export type UnityBuild = { route: string; slug: string; prefix: string; version: string; revision: string };

export const RAPID_PATH_BUILD: UnityBuild = {
    route: "/rapid-path",
    slug: "rapid-path",
    prefix: "RapidPath",
    version: RAPID_PATH_BUILD_VERSION,
    revision: RAPID_PATH_BUILD_REVISION,
};

export const STICKMAN_BUILD: UnityBuild = {
    route: "/stickman-skydive",
    slug: "stickman-skydive-simulator",
    prefix: "StickmanSkydive",
    version: STICKMAN_BUILD_VERSION,
    revision: STICKMAN_BUILD_REVISION,
};

const BUILDS = [RAPID_PATH_BUILD, STICKMAN_BUILD];

const buildName = (b: UnityBuild) => `${b.prefix}-${b.version}`;
const buildDirectory = (b: UnityBuild) => `Build/${buildName(b)}/Build`;

export function gameFrameSrc(b: UnityBuild): string {
    return `/optimized_assets/game_assets/${b.slug}/game.html?v=${b.version}&revision=${b.revision}&build=${buildDirectory(b)}&file=${buildName(b)}`;
}

// How long a visitor must hover (or keyboard-focus) a game's Play button before its download starts.
export const HOVER_PRELOAD_MS = 500;

const preloaded = new Set<string>();

// Called when a link to a game is clicked: the page-transition animation runs for ~2 s before the iframe starts,
// so fetch the big files during it. The URLs must match game.html's exactly (same query string) to hit the HTTP cache.
// Skipped on touch-only devices (they opt in before the game loads) and when the visitor asked to save data.
export function preloadGameForRoute(href: string): void {
    const path = href.replace(/\/$/, "");
    const build = BUILDS.find((b) => b.route === path);
    if (!build || preloaded.has(build.slug)) return;
    if (!window.matchMedia("(any-pointer: fine)").matches) return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;

    preloaded.add(build.slug);
    const base = `/optimized_assets/game_assets/${build.slug}/${buildDirectory(build)}/${buildName(build)}`;
    for (const ext of ["loader.js", "framework.js", "wasm", "data"]) {
        fetch(`${base}.${ext}?v=${build.version}&revision=${build.revision}`, { priority: "low" } as RequestInit)
            .then((response) => response.arrayBuffer())
            .catch(() => preloaded.delete(build.slug)); // best effort: the iframe will fetch normally
    }
}
