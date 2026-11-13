// Layout modes are flagged on <html> from the window size instead of aspect-ratio media queries:
// iOS Safari can leave aspect-ratio queries stale after rotating back to portrait (until a reload).
// The `home-stacked` and `nav-stacked` selectors in globals.css key off these attributes.

// Portrait screens stack the home game cards in a zig-zag column instead of three across (aspect ratio <= 4:5).
export const HOME_STACKED_ATTR = "data-home-stacked";
// Two-row navbar: aspect ratio <= 3:2, or narrower than 780px.
export const NAV_STACKED_ATTR = "data-nav-stacked";

export function isHomeStacked(): boolean {
    return document.documentElement.hasAttribute(HOME_STACKED_ATTR);
}

// Home page first load: the page is hidden (CSS keys off this attribute) until the background photo, fonts and pipes are
// ready, then fades in as one piece instead of arriving in three stages. The inline script's timer is the safety net:
// the page always shows after BOOT_MAX_MS, even if hydration fails or a request hangs.
export const BOOT_ATTR = "data-rlg-boot";
export const BOOT_MAX_MS = 5000;
export const HOME_BACKGROUND_SRC = "/optimized_assets/global_assets/rlg_background.webp";
// Set on <html> and fired on window by the first Pipes render that has paths to draw.
export const PIPES_READY_ATTR = "data-rlg-pipes";
export const PIPES_READY_EVENT = "rlg-pipes-ready";

// Fired on window whenever a flag flips.
export const LAYOUT_FLAGS_EVENT = "rlg-layout-flags";

// Runs inline in <head> so the flags are set before first paint.
export const LAYOUT_FLAGS_SCRIPT = `(function(){
var d=document.documentElement,last="";
if(location.pathname==="/"||location.pathname==="/index.html"){d.setAttribute("${BOOT_ATTR}","");setTimeout(function(){d.removeAttribute("${BOOT_ATTR}");},${BOOT_MAX_MS});}
function u(){var w=window.innerWidth,h=window.innerHeight,home=w*5<=h*4,nav=w*2<=h*3||w<780;
d.toggleAttribute("${HOME_STACKED_ATTR}",home);
d.toggleAttribute("${NAV_STACKED_ATTR}",nav);
var key=home+","+nav;
if(last&&key!==last){window.dispatchEvent(new Event("${LAYOUT_FLAGS_EVENT}"));}
last=key;}
u();
window.addEventListener("resize",u);
window.addEventListener("orientationchange",function(){setTimeout(u,0);setTimeout(u,300);});
})();`;
