/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { darken, lighten, getContrastRatio, decomposeColor, recomposeColor } from '@mui/material/styles';
import { FLUENT_DEFAULT_ACCENT } from './tokens';

/* Windows 11 shades for the default accent. Custom accents are derived. */
const DEFAULT_SHADES = {
  light: '#005FB8',
  dark: '#60CDFF',
};

/* Opaque mix of two colours, weight is the share of `top`. */
export function mix(base, top, weight) {
  const b = decomposeColor(base).values;
  const t = decomposeColor(top).values;
  const values = [0, 1, 2].map((i)=>Math.round(b[i] * (1 - weight) + t[i] * weight));
  return recomposeColor({type: 'rgb', values});
}

export function normalizeAccent(color) {
  if(typeof color !== 'string') return null;
  /* Electron returns RRGGBBAA without the hash. */
  const hex = color.replace(/^#/, '');
  if(!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return null;
  return '#' + hex.substring(0, 6).toUpperCase();
}

export function getAccentShades(mode, accent, surfaceBg) {
  const base = normalizeAccent(accent) ?? FLUENT_DEFAULT_ACCENT;
  let main;
  if(base === FLUENT_DEFAULT_ACCENT) {
    main = DEFAULT_SHADES[mode];
  } else {
    main = mode === 'dark' ? lighten(base, 0.45) : darken(base, 0.18);
  }

  const contrastText = getContrastRatio(main, '#FFFFFF') >= 3 ? '#FFFFFF' : '#000000';
  const hover = mode === 'dark' ? darken(main, 0.1) : lighten(main, 0.1);
  const pressed = mode === 'dark' ? darken(main, 0.2) : lighten(main, 0.2);

  return {
    base,
    main,
    hover,
    pressed,
    contrastText,
    /* Selection tint, kept opaque because pgAdmin computes text contrast on it. */
    light: mix(surfaceBg, main, mode === 'dark' ? 0.22 : 0.12),
    lightHover: mix(surfaceBg, main, mode === 'dark' ? 0.3 : 0.18),
    /* Accent used as text or icon colour on top of a surface. */
    text: main,
  };
}
