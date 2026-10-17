/* Inline SVG icon helper: the sprite lives at the top of index.html (<symbol id="i-name">). Usage: ico('mic') -> markup string. */
window.ico = (n, cls) => '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
