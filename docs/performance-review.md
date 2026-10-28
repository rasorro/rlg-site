# Performance review — 2026-10-28

## Architecture

The site is a Next.js static export, served by Apache. React handles navigation,
the decorative shell, and Rapid Path's responsive iframe layout. Unity's compiled
WebAssembly/WebGL build runs inside that same-origin iframe; the game loop and
gameplay source are not in this repository. PHP handles leaderboard requests.

The existing separation is useful: React does not update game state every frame,
homepage pipes/cards are absent on Rapid Path, and Unity loading waits for the
page transition to finish. Touch-only visitors download Unity only after opting in.
Keep these properties when adding features.

## Changes

| Area | Change | Expected benefit / visual tradeoff |
| --- | --- | --- |
| Unity rendering | Cap render density at 2x and update it on resize or DPI changes. | Native rendering through 2x. At 3x, 56% fewer render-target pixels; at 4x, 75% fewer. Fine detail can be slightly softer above 2x. Game dimensions, timing and input stay the same. |
| Backdrop geometry | Replace the body-wide mutation observer with size observers on the navbar, flask, home container and cards. Coalesce measurements and retain unchanged state objects. | Unrelated DOM changes no longer trigger layout reads or backdrop rerenders. No backdrop observers in Rapid Path focus mode. Artwork and animation counts stay the same. |
| Page transitions | Allocate the full-size canvas only for transitions, ignore unchanged dimensions, then shrink it to 1x1. Attach resize listeners only while transitioning. | Avoid retaining a screen-size backing buffer during gameplay or reallocating it while resizing an idle page. Bubble visuals and timing stay the same. |
| Focus button | Remove backdrop blur and limit its transition to colors. | Avoid filtering the moving game beneath an essentially opaque button. |

Unity documents its canvas/DPI controls in [Configure a Web Canvas size](https://docs.unity.com/en-us/engine/6000.5/manual/platform-specific/webgl/develop/canvas-size).
The checked-in loader/framework also exposes `unityInstance.Module.devicePixelRatio`.
Canvas dimension writes reset the rendering context even when the value is
unchanged; see [MDN's canvas width reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/width).

## Validation and limits

Production build (including TypeScript, Brotli preparation and export pruning)
and ESLint pass. Local headless Chrome runs the actual Unity build through a
static server that serves the precompressed artifacts with their content types
and encoding headers. This checks the export, not the production Apache config.

At a 1440x900 desktop viewport, the idle transition buffer changed from 1440x810
to 1x1 (about 4.45 MiB less nominal RGBA buffer storage, excluding browser overhead).
Rapid Path's normal-density render target stayed 688x688, and focus mode stayed
810x810. Before/after screenshots show the same board and page layout.
At an emulated 3x density, a 682x682 CSS board renders at 1364x1364.

Short three-second desktop samples showed no convincing CPU/FPS improvement;
both versions were already idle between shell events. The concrete gains are
less retained canvas storage, less work on unrelated DOM mutations, and fewer
Unity pixels on displays above 2x. These are not claims of a measured FPS gain.

Repeat browser checks when changing this code:

- Load Rapid Path directly; confirm the real Unity ready message, canvas focus,
  and no JavaScript exceptions.
- Toggle focus mode both ways without reloading Unity.
- Navigate back home, resize during the bubble transition, and confirm the
  transition finishes, its canvas returns to 1x1, and all three desktop pipes return.
- Check portrait/landscape layouts and the `RLG_DPAD_CHANGED` layout message.
- Check 1x, 2x and 3x density, including changing density without changing iframe size.
- Check touch-only opt-in and swipe instructions.
- Mutate an unrelated body data attribute; the backdrop should perform no new
  geometry reads.

## Next profiling targets

1. **Unity internals:** profile the original Unity project on a device that
   actually struggles. Inspect CPU/GPU frame time, allocations/GC, UI rebuilds,
   draw calls and texture memory before changing render quality or gameplay code.
   This repository contains compiled artifacts, so those causes cannot be
   established here.
2. **Cold-load delivery:** the active game's three large artifacts total 6.67 MiB
   Brotli versus 8.59 MiB gzip. Compression negotiation, Wasm MIME types and
   immutable versioned-asset caching are already configured in `.htaccess`.
   Check actual response headers on the host before adding another caching layer.
3. **Decorative GPU cost:** if traces on lower-end hardware still show shell paint
   overhead, profile the animated flask's SVG glow/bubbles. Freezing or simplifying
   those would change the site's feel, so they are preserved in this pass.
4. **Loading UX:** keep heavy Unity initialization after the transition. Starting
   downloads earlier may improve cold-load time, but should be measured separately
   from startup/animation contention before changing that scheduling.
