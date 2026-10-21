/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { alpha, createTheme, darken, lighten } from '@mui/material/styles';
import { getTokens, fontFamily, fontFamilyMono, radius, motion } from './tokens';
import { getAccentShades, mix } from './accent';

/* MUI transitions with Fluent timings. pgAdmin turns transitions off
 * globally, the Fluent theme brings short ones back. */
const fluentTransitions = createTheme({
  transitions: {
    duration: {
      shortest: 83,
      shorter: 120,
      short: 167,
      standard: 187,
      complex: 250,
      enteringScreen: 167,
      leavingScreen: 120,
    },
    easing: {
      easeOut: motion.easing,
      easeIn: motion.easingAccelerate,
    },
  },
}).transitions;

/* Builds the Fluent variant on top of an already resolved pgAdmin theme.
 * The palette, custom and otherVars keys are the same that light.js and
 * dark.js define, so every existing component keeps working.
 * `name` is left untouched (light/dark) because charts look colours up by it.
 */
export default function getFluentBaseTheme(baseTheme, {mode, accentColor, mica}) {
  const t = getTokens(mode);
  const accent = getAccentShades(mode, accentColor, t.surfaceBg);
  const isDark = mode === 'dark';
  const onColor = isDark ? '#000000' : '#FFFFFF';

  return createTheme(baseTheme, {
    typography: {
      fontFamily: fontFamily,
      fontFamilySourceCode: fontFamilyMono,
      fontWeightBold: 600,
    },
    shape: {
      borderRadius: radius.control,
    },
    transitions: fluentTransitions,
    palette: {
      /* palette.mode is deliberately not set: upstream never sets it, and
       * MUI would add elevation overlays to Paper in dark mode. */
      default: {
        main: t.controlBg,
        contrastText: t.text,
        borderColor: t.strokeControl,
        disabledBorderColor: t.strokeControl,
        disabledContrastText: t.textDisabled,
        hoverMain: t.controlHoverBg,
        hoverContrastText: t.text,
        hoverBorderColor: t.strokeControl,
      },
      primary: {
        main: accent.main,
        dark: accent.pressed,
        light: accent.light,
        contrastText: accent.contrastText,
        contrastTextLight: t.text,
        hoverMain: accent.hover,
        hoverBorderColor: accent.hover,
        hoverLight: accent.lightHover,
        disabledMain: accent.main,
      },
      success: {
        main: t.success,
        light: t.successBg,
        contrastText: onColor,
      },
      error: {
        main: t.error,
        light: t.errorBg,
        lighter: t.errorBg,
        contrastText: onColor,
        hoverMain: isDark ? darken(t.error, 0.1) : lighten(t.error, 0.1),
        hoverBorderColor: isDark ? darken(t.error, 0.1) : lighten(t.error, 0.1),
      },
      warning: {
        main: isDark ? t.warningFill : '#D18F00',
        light: t.warningBg,
        contrastText: '#000000',
        hoverMain: isDark ? darken(t.warningFill, 0.1) : '#E09B00',
        hoverBorderColor: isDark ? darken(t.warningFill, 0.1) : '#E09B00',
      },
      grey: isDark ? {
        '200': '#3A3A3A',
        '400': '#2D2D2D',
        '600': '#262626',
        '800': '#1F1F1F',
        '900': '#9A9A9A',
      } : {
        '200': '#F9F9F9',
        '400': '#F3F3F3',
        '600': '#D1D1D1',
        '800': '#8A8A8A',
        '900': '#5D5D5D',
      },
      text: {
        primary: t.text,
        secondary: t.textSecondary,
        muted: t.textSecondary,
        disabled: t.textDisabled,
      },
      background: {
        paper: t.cardBg,
        default: t.surfaceBg,
      },
      divider: t.strokeDivider,
    },
    custom: {
      checkbox: {
        borderColor: t.strokeControlStrong,
        disabled: t.textDisabled,
      },
      icon: {
        main: t.controlBg,
        contrastText: t.text,
        borderColor: t.strokeControl,
        disabledMain: t.controlDisabledBg,
        disabledContrastText: t.textDisabled,
        disabledBorderColor: t.strokeControl,
        hoverMain: t.controlHoverBg,
        hoverContrastText: t.text,
      },
    },
    otherVars: {
      colorBrand: accent.main,
      hyperlinkColor: accent.text,
      borderColor: t.strokeDivider,
      inputBorderColor: t.strokeControl,
      inputDisabledBg: t.controlDisabledBg,
      errorColor: t.error,
      headerBg: t.surfaceBg,
      activeBorder: accent.main,
      activeColor: t.text,
      tableBg: t.surfaceBg,
      activeStepBg: accent.main,
      activeStepFg: accent.contrastText,
      stepBg: t.strokeControl,
      stepFg: t.text,
      toggleBtnBg: t.strokeControlStrong,
      editorToolbarBg: t.layerAltBg,
      qtDatagridBg: t.surfaceBg,
      qtDatagridSelectFg: t.text,
      cardHeaderBg: t.layerBg,
      emptySpaceBg: t.shellBg,
      textMuted: t.textSecondary,
      erdCanvasBg: t.surfaceBg,
      erdGridColor: t.strokeDivider,
      noteBg: mix(t.surfaceBg, accent.main, isDark ? 0.1 : 0.06),
      loader: {
        backgroundColor: alpha('#000000', isDark ? 0.5 : 0.3),
        color: '#FFFFFF',
      },
      scroll: {
        baseColor: t.scrollThumbHover,
        barBackgroundColor: 'transparent',
        thumbBackground: t.scrollThumb,
      },
      editor: {
        fg: t.text,
        bg: t.surfaceBg,
        selectionBg: isDark ? '#264F78' : '#ADD6FF',
        ...t.editor,
        foldmarker: accent.main,
        activeline: isDark ? '#2F2F2F' : '#F5F5F5',
        activelineLight: isDark ? '#2F2F2F' : '#F5F5F5',
        currentQueryBorderColor: accent.main,
        guttersBg: t.surfaceBg,
        guttersFg: isDark ? '#858585' : '#8A8A8A',
      },
      tree: {
        textFg: t.text,
        inputBg: t.shellBg,
        fgHover: t.text,
        bgHover: t.subtleHoverBg,
        textHoverFg: t.text,
        bgSelected: t.subtleSelectedBg,
      },
    },
    /* Extra data for the fork's own overrides and shell components. */
    fluent: {
      mode,
      tokens: t,
      accent,
      mica: Boolean(mica),
      shellBg: mica ? 'transparent' : t.shellBg,
    },
  });
}
