/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { radius } from './tokens';

/* MUI component overrides for the Fluent theme. They are merged on top of
 * the upstream ones in Theme/index.jsx, so only what differs is set here.
 */
export default function fluentComponents(theme) {
  const f = theme.fluent;
  const t = f.tokens;
  const accent = f.accent;
  const isDark = f.mode === 'dark';
  const focusBg = isDark ? '#1F1F1F' : '#FFFFFF';

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.control,
          fontWeight: 400,
          letterSpacing: 0,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.control,
          '&:hover': {
            backgroundColor: t.subtleHoverBg,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.control,
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: false,
      },
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          lineHeight: '16px',
          padding: '6px 8px',
          color: t.text,
          backgroundColor: t.tooltipBg,
          border: `1px solid ${t.strokeSurface}`,
          borderRadius: radius.control,
          boxShadow: t.shadowTooltip,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.control,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: t.strokeControl,
            borderBottomColor: t.strokeControlStrong,
          },
          '&.Mui-focused': {
            backgroundColor: focusBg,
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1px',
              borderColor: t.strokeControl,
              borderBottom: `2px solid ${accent.main}`,
            },
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderBottomColor: t.error,
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderBottomColor: t.strokeControl,
          },
        },
        notchedOutline: {
          borderColor: t.strokeControl,
          borderBottomColor: t.strokeControlStrong,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: t.controlBg,
        },
        input: {
          backgroundColor: 'transparent',
        },
        inputMultiline: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${t.strokeDivider}`,
        },
        indicator: {
          height: '3px',
          borderRadius: '3px',
          backgroundColor: accent.main,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '32px',
          padding: '6px 12px',
        },
        textColorInherit: {
          color: t.textSecondary,
          '&:hover': {
            color: t.text,
          },
          '&.Mui-selected': {
            color: t.text,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: radius.overlay,
          border: `1px solid ${t.strokeSurface}`,
          boxShadow: t.shadowFlyout,
          backgroundColor: t.flyoutBg,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        list: {
          padding: '4px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: '30px',
          padding: '5px 12px',
          borderRadius: radius.control,
          '&:hover': {
            backgroundColor: t.subtleHoverBg,
          },
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: t.subtleSelectedBg,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.overlay,
          border: `1px solid ${t.strokeSurface}`,
          boxShadow: t.shadowDialog,
          overflow: 'hidden',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          fontWeight: 600,
          padding: '8px 8px 8px 16px',
          minHeight: '40px',
          backgroundColor: t.cardBg,
          borderBottom: `1px solid ${t.strokeDivider}`,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: `${radius.overlay}px !important`,
          border: `1px solid ${t.strokeCard}`,
          backgroundColor: t.cardBg,
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: t.cardBg,
          padding: '0 12px',
          fontWeight: 600,
          borderBottom: `1px solid ${t.strokeDivider}`,
        },
        content: {
          margin: '8px 4px',
          '&.Mui-expanded': {
            margin: '8px 4px',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.overlay,
          border: `1px solid ${t.strokeCard}`,
          boxShadow: t.shadowCard,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '8px 12px',
          fontWeight: 600,
          backgroundColor: t.layerBg,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: t.strokeControlStrong,
          '&.Mui-checked': {
            color: accent.main,
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: t.strokeControlStrong,
          '&.Mui-checked': {
            color: accent.main,
          },
        },
      },
    },
    /* Windows 11 toggle switch: 40x20 pill, 12px knob that grows on hover. */
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 44,
          height: 28,
          padding: '4px 2px',
          '&:hover .MuiSwitch-thumb': {
            width: 14,
            height: 14,
            margin: '-1px',
          },
        },
        switchBase: {
          padding: 8,
          left: -2,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            '& .MuiSwitch-thumb': {
              backgroundColor: accent.contrastText,
            },
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: accent.main,
              borderColor: accent.main,
            },
          },
          '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 0.4,
          },
        },
        thumb: {
          width: 12,
          height: 12,
          border: 'none',
          boxShadow: 'none',
          backgroundColor: t.textSecondary,
          transition: theme.transitions.create(['width', 'height', 'margin'], {
            duration: theme.transitions.duration.shorter,
          }),
        },
        track: {
          opacity: 1,
          borderRadius: 10,
          boxSizing: 'border-box',
          backgroundColor: 'transparent',
          border: `1px solid ${t.strokeControlStrong}`,
        },
      },
    },
  };
}
