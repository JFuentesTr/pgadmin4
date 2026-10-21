/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* The palette lives in the main window, but the Query Tool, PSQL and other
 * tools run in same-origin iframes with their own bundles. Requests go through
 * a DOM event on the top window so every frame reaches the same palette. */

export const OPEN_PALETTE_EVENT = 'fluent:open-palette';
export const PALETTE_MODES = {
  OBJECTS: 'objects',
  COMMANDS: 'commands',
};

function getTopWindow() {
  try {
    /* Accessing a cross-origin parent throws; fall back to this window. */
    return window.top?.document ? window.top : window;
  } catch {
    return window;
  }
}

export function requestPalette(mode=PALETTE_MODES.OBJECTS) {
  getTopWindow().dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT, {detail: {mode}}));
}

let shortcutsEnabled = false;
let shortcutsInstalled = false;

/* Ctrl+P opens object search, Ctrl+Shift+P the command list. Neither is used
 * by pgAdmin; Ctrl+P is the browser's print shortcut, hence preventDefault.
 * Installed in every pgAdmin page (main window and tool iframes). */
export function setPaletteShortcutsEnabled(enabled) {
  shortcutsEnabled = enabled;
  if(shortcutsInstalled) return;
  shortcutsInstalled = true;

  window.addEventListener('keydown', (e)=>{
    if(!shortcutsEnabled) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if(!ctrl || e.altKey || e.code !== 'KeyP') return;
    e.preventDefault();
    e.stopPropagation();
    requestPalette(e.shiftKey ? PALETTE_MODES.COMMANDS : PALETTE_MODES.OBJECTS);
  }, true);
}
