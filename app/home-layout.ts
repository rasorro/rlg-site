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

// Fired on window whenever a flag flips.
export const LAYOUT_FLAGS_EVENT = "rlg-layout-flags";

// Runs inline in <head> so the flags are set before first paint.
export const LAYOUT_FLAGS_SCRIPT = `(function(){
var d=document.documentElement,last="";
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
