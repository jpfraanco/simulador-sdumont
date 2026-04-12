// js/ui/highlight.js
// Adds a pulsing halo + arrow to the element matching a CSS selector.

let haloEl = null;
let arrowEl = null;

export function highlight(selector) {
    clearHighlight();
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('halo-target');
    haloEl = el;
}

export function clearHighlight() {
    if (haloEl) { haloEl.classList.remove('halo-target'); haloEl = null; }
    if (arrowEl) { arrowEl.remove(); arrowEl = null; }
}
