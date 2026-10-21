/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Entry point used by Theme/index.jsx. Upstream code only calls the three
 * functions below, everything else stays inside the fluent folder. */

import { useEffect, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import getFluentBaseTheme from './fluentBaseTheme';
import fluentComponents from './fluentComponents';
import fluentGlobalCss from './fluentGlobalCss';
import useShellInfo, { initShellInfo } from '../shell/shellInfoStore';
import { setPaletteShortcutsEnabled } from '../palette/paletteEvents';

const FLUENT_MODES = ['light', 'dark'];

export function useFluentOptions(prefStore) {
  const misc = prefStore?.getPreferencesForModule('misc');
  const enabled = misc?.ui_style === 'fluent';
  const useWindowsAccent = misc?.use_windows_accent ?? true;
  const accentColor = useShellInfo((s)=>s.accentColor);
  const mica = useShellInfo((s)=>s.mica);

  useEffect(()=>{
    initShellInfo();
  }, []);

  /* Theme is mounted by every pgAdmin page, tool iframes included, so this
   * is where the Ctrl+P / Ctrl+Shift+P forwarding gets installed. */
  useEffect(()=>{
    setPaletteShortcutsEnabled(enabled);
  }, [enabled]);

  return useMemo(()=>({
    enabled,
    accentColor: useWindowsAccent ? accentColor : null,
    mica: enabled && mica,
  }), [enabled, useWindowsAccent, accentColor, mica]);
}

/* Called with the resolved light/dark/high_contrast theme, before
 * getFinalTheme adds mixins and global overrides. */
export function applyFluentBase(baseTheme, themeName, options) {
  if(!options?.enabled || !FLUENT_MODES.includes(themeName)) {
    return baseTheme;
  }
  return getFluentBaseTheme(baseTheme, {
    mode: themeName,
    accentColor: options.accentColor,
    mica: options.mica,
  });
}

/* Called with the output of getFinalTheme. */
export function applyFluentFinal(finalTheme) {
  if(!finalTheme.fluent) {
    return finalTheme;
  }
  return createTheme(finalTheme, {
    mixins: {
      fontSourceCode: {
        fontFamily: finalTheme.typography.fontFamilySourceCode,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: fluentGlobalCss(finalTheme),
      },
      ...fluentComponents(finalTheme),
    },
  });
}
