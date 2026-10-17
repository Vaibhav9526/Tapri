// Painted backdrops for the "mohalla" environment (owned by the backdrop session). Filled in by the backdrop work:
// { day|dusk|night|morning: { desktop: { src, rect:[x,y,w,h] }, mobile: { src, rect:[x,y,w,h] } } }
// rect = where the 480x320 scene sits inside that image, in image pixels (w/h = 3/2). morning may be omitted (falls back to day).
window.MOHALLA_BACKDROP = window.MOHALLA_BACKDROP || null;
