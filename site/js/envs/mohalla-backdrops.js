// Painted backdrops for the "mohalla" environment (ElevenLabs flow "Tapri mohalla backdrops", gpt-image-2; fetched with tools/fetch_backdrops.mjs).
// { day|dusk|night|morning: { desktop: { src, rect:[x,y,w,h], size:[w,h] }, mobile: {...} } }
// rect = where the 480x320 scene sits inside that image, in image pixels (w/h = 3/2): the plastered wall lines up with the
// stall's back wall and the wall's foot with the stall floor (scene y 262). size lets the layout keep the image covering the screen.
(() => {
  const D = { rect: [414, 276, 1810, 1206.7], size: [2560, 1440] }, M = { rect: [0, 1323, 1152, 768], size: [1152, 2560] };
  const at = t => ({ desktop: Object.assign({ src: 'img/mohalla/' + t + '-desktop.webp' }, D), mobile: Object.assign({ src: 'img/mohalla/' + t + '-mobile.webp' }, M) });
  window.MOHALLA_BACKDROP = { day: at('day'), dusk: at('dusk'), night: at('night') };   // morning falls back to day
})();
