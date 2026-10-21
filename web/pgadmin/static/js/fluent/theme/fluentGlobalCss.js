/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { radius, motion } from './tokens';
import { mix } from './accent';
import { getAppLogoUrl } from '../shell/appLogo';

/* Fluent "ChevronRight 12 Regular" (MIT, microsoft/fluentui-system-icons). */
const CHEVRON_RIGHT = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M4.65 2.15a.5.5 0 0 0 0 .7L7.79 6 4.65 9.15a.5.5 0 1 0 .7.7l3.5-3.5a.5.5 0 0 0 0-.7l-3.5-3.5a.5.5 0 0 0-.7 0Z\'/%3E%3C/svg%3E")';
/* Fluent "Dismiss 12 Regular". */
const DISMISS = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'m1.9 1.9.05-.05a.5.5 0 0 1 .63-.06l.07.06L6 5.29l3.35-3.44a.5.5 0 0 1 .7.7L6.71 6l3.34 3.35a.5.5 0 0 1 .06.63l-.06.07a.5.5 0 0 1-.63.06l-.07-.06L6 6.71l-3.35 3.34a.5.5 0 0 1-.63.06l-.07-.06a.5.5 0 0 1-.06-.63l.06-.07L5.29 6 1.95 2.65a.5.5 0 0 1-.06-.63l.06-.07-.05.05Z\'/%3E%3C/svg%3E")';

/* Global CSS for the Fluent theme. Keys mirror the ones in
 * Theme/overrides/*.override.js on purpose: the theme deep-merges this
 * object into MuiCssBaseline, so a matching key overrides the upstream rule
 * instead of fighting it on specificity.
 */
export default function fluentGlobalCss(theme) {
  const f = theme.fluent;
  const t = f.tokens;
  const accent = f.accent;
  const rowHover = mix(t.surfaceBg, t.text, f.mode === 'dark' ? 0.06 : 0.035);

  return {
    'html, body': {
      backgroundColor: f.shellBg,
    },
    /* 'html body' beats the inline <style> that base.html puts in <body>,
     * which comes after the emotion styles in document order. */
    'html body': {
      fontFamily: theme.typography.fontFamily,
      color: t.text,
    },
    '::selection': {
      backgroundColor: accent.light,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': {
        animationDuration: '0.01ms !important',
        transitionDuration: '0.01ms !important',
      },
    },

    /* Thin, rounded Windows 11 scrollbars. */
    '::-webkit-scrollbar,::-webkit-scrollbar-corner': {
      width: '12px !important',
      height: '12px !important',
      background: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      border: '4px solid transparent',
      borderRadius: '6px',
      minHeight: '32px',
      background: t.scrollThumb + ' !important',
      backgroundClip: 'content-box !important',
    },
    '::-webkit-scrollbar-thumb:hover': {
      border: '3px solid transparent',
      background: t.scrollThumbHover + ' !important',
      backgroundClip: 'content-box !important',
    },

    /* Keyboard focus ring, Windows style. */
    '.MuiButtonBase-root.Mui-focusVisible, .dock-tab > div:focus-visible': {
      outline: `2px solid ${t.text} !important`,
      outlineOffset: '1px',
    },

    /* ---------- Docking layout (rc-dock) ---------- */
    '.dock-layout': {
      borderTop: 'none',
      backgroundColor: f.shellBg,
      '& .dock-ink-bar': {
        height: '0px',
      },
      '& .dock-bar': {
        backgroundColor: f.shellBg,
        borderBottom: 'none',
        paddingLeft: '4px',
      },
      '& .dock-content': {
        backgroundColor: t.surfaceBg,
      },
      '& .dock-panel': {
        backgroundColor: f.shellBg,
        '&.dock-style-object-explorer': {
          /* The title did not fit next to the toolbar and rc-tabs scrolled
           * it out of view. The rail already says which pane this is, so
           * the header is just the command bar. */
          '& .dock-nav-wrap, & .dock-nav-operations': {
            flex: '0 0 0',
            width: 0,
            overflow: 'hidden',
          },
          '& .dock-extra-content': {
            flex: '1 1 auto',
            justifyContent: 'flex-start',
            paddingLeft: '4px',
          },
          /* Fluent CommandBar: borderless, compact icon buttons. */
          '& .dock-extra-content .Buttons-iconButtonDefault': {
            minWidth: '28px',
            border: 'none',
            borderRadius: radius.control + 'px',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: t.subtleHoverBg,
            },
          },
          '& .dock-tab-active': {
            backgroundColor: 'transparent',
          },
          '& .dock-content, & .dock-tabpane': {
            backgroundColor: f.shellBg,
          },
        },
        '&.dock-style-dialogs': {
          borderRadius: radius.overlay + 'px',
          overflow: 'hidden',
          border: `1px solid ${t.strokeSurface}`,
          boxShadow: t.shadowDialog,
          '& .dock-bar': {
            backgroundColor: t.layerBg,
            paddingLeft: '8px',
          },
          '& .dock-tab-active': {
            backgroundColor: 'transparent',
            fontWeight: 600,
          },
        },
        '& .dock-tabpane': {
          backgroundColor: t.surfaceBg,
          color: t.text,
        },
      },
      '& .dock-tab': {
        color: t.textSecondary,
        margin: '4px 2px 0 0',
        borderRadius: '6px 6px 0 0',
        transition: `background-color ${motion.fast} linear, color ${motion.fast} linear`,
        '&:hover': {
          backgroundColor: t.subtleHoverBg,
          color: t.text,
        },
        '&.dock-tab-active': {
          color: t.text,
          backgroundColor: t.surfaceBg,
          '&:hover': {
            backgroundColor: t.surfaceBg,
          },
        },
        '& > div': {
          padding: '5px 10px',
          fontSize: '0.8125rem',
          '&:focus': {
            outline: 'none',
          },
        },
        '& .drag-initiator': {
          alignItems: 'center',
          '& .dock-tab-close-btn': {
            width: '20px',
            height: '20px',
            marginLeft: '6px',
            borderRadius: radius.control + 'px',
            color: t.textSecondary,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '4px',
              left: '4px',
              width: '12px',
              height: '12px',
              backgroundColor: 'currentColor',
              maskImage: DISMISS,
              maskRepeat: 'no-repeat',
              maskSize: '12px',
            },
            position: 'relative',
            '&:hover': {
              backgroundColor: t.subtleHoverBg,
              color: t.text,
            },
          },
        },
      },
      '& .dock-vbox, & .dock-hbox .dock-vbox': {
        '& .dock-divider': {
          '&::before': {
            backgroundColor: t.strokeDivider,
          },
        },
      },
      '& .dock-hbox, & .dock-vbox .dock-hbox': {
        '& .dock-divider': {
          '&::before': {
            backgroundColor: t.strokeDivider,
          },
        },
      },
    },
    '.dock-dropdown': {
      '& .dock-dropdown-menu': {
        padding: '4px',
        backgroundColor: t.flyoutBg,
        border: `1px solid ${t.strokeSurface}`,
        borderRadius: radius.overlay + 'px',
        boxShadow: t.shadowFlyout,
      },
      '& .dock-dropdown-menu-item': {
        padding: '5px 12px',
        borderRadius: radius.control + 'px',
        '&.dock-dropdown-menu-item-active, &:hover': {
          backgroundColor: t.subtleHoverBg,
          color: t.text,
        },
      },
    },

    /* ---------- Object Explorer tree (react-aspen) ---------- */
    '.file-tree': {
      fontSize: '0.8125rem !important',
    },
    '.file-entry': {
      position: 'relative',
      borderRadius: radius.control + 'px',
      margin: '0 4px',
      '&:before': {
        background: t.strokeDivider,
      },
      '&:hover, &.pseudo-active': {
        backgroundColor: t.subtleHoverBg + ' !important',
      },
      '&.active, &.prompt': {
        backgroundColor: t.subtleSelectedBg + ' !important',
        borderRight: 'none !important',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: '0px',
          top: '50%',
          width: '3px',
          height: '14px',
          marginTop: '-7px',
          borderRadius: '2px',
          backgroundColor: accent.main,
        },
      },
      i: {
        '&.directory-toggle': {
          color: t.textSecondary,
          '&:before': {
            content: '""',
            width: '16px',
            height: '16px',
            marginLeft: '2px',
            marginTop: '2px',
            backgroundColor: 'currentColor',
            maskImage: CHEVRON_RIGHT,
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: '12px',
            transition: `transform ${motion.normal} ${motion.easing}`,
          },
          '&.open:before': {
            content: '""',
            marginLeft: '2px',
            transform: 'rotate(90deg) !important',
          },
          '&.loading:before': {
            maskImage: 'none',
            backgroundColor: 'transparent',
            transform: 'none !important',
          },
        },
      },
    },

    /* ---------- Menus (@szhsin/react-menu) ---------- */
    '& .szh-menu': {
      padding: '4px',
      minWidth: '180px',
      backgroundColor: t.flyoutBg,
      border: `1px solid ${t.strokeSurface}`,
      borderRadius: radius.overlay + 'px',
      boxShadow: t.shadowFlyout,
    },
    '& .szh-menu__divider': {
      margin: '4px 0',
      background: t.strokeDivider,
    },
    '& .szh-menu__item': {
      padding: '5px 12px',
      margin: '1px 0',
      borderRadius: radius.control + 'px',
      '&.szh-menu__item--active, &.szh-menu__item--hover': {
        backgroundColor: t.subtleHoverBg,
        color: t.text,
      },
      '&.szh-menu__item--disabled': {
        color: t.textDisabled,
      },
    },
    /* PgMenuItem paints the shortcut with primary.contrastText on hover,
     * which assumes the old accent-filled hover. */
    'body .szh-menu__item--hover > .MuiBox-root': {
      color: t.textSecondary,
    },

    /* ---------- Workspace rail (WorkspaceToolbar.jsx) ----------
     * The rail has no class of its own; it is the element right before the
     * layout wrapper. Styled like a Windows 11 NavigationView rail. */
    'div:has(+ .MuiBox-root .dock-layout)': {
      borderTop: 'none',
      borderRight: 'none',
      padding: '4px',
      gap: '2px',
      backgroundColor: f.shellBg,
      '& .Buttons-iconButtonDefault.Buttons-iconButtonDefault': {
        position: 'relative',
        width: '36px',
        minWidth: '36px',
        height: '36px',
        padding: '6px',
        border: 'none',
        borderRadius: radius.control + 'px',
        backgroundColor: 'transparent',
        color: t.textSecondary,
        '&:hover': {
          backgroundColor: t.subtleHoverBg,
          color: t.text,
        },
        '&.active': {
          backgroundColor: t.subtleSelectedBg,
          color: t.text,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            width: '3px',
            height: '16px',
            marginTop: '-8px',
            borderRadius: '2px',
            backgroundColor: accent.main,
          },
        },
        '&.Mui-disabled': {
          backgroundColor: 'transparent',
          color: t.textDisabled,
        },
      },
    },

    /* ---------- Browser-mode menu bar (AppMenuBar.jsx) ----------
     * Height stays at 30px: BrowserComponent subtracts it from the layout. */
    'html body [data-test="app-menu-bar"]': {
      backgroundColor: f.shellBg,
      color: t.text,
      '& .AppMenuBar-logo': {
        width: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        fontSize: '0.75rem',
        '&::before': {
          content: '""',
          width: '16px',
          height: '16px',
          background: `url(${getAppLogoUrl()}) center / contain no-repeat`,
        },
        '&::after': {
          content: '"pgAdmin 4"',
        },
      },
      '& .Buttons-primaryButton, & .MuiButton-containedPrimary': {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: t.text,
        fontSize: '0.8125rem',
        padding: '2px 10px',
        '&:hover, &[aria-expanded="true"]': {
          backgroundColor: t.subtleHoverBg,
          borderColor: 'transparent',
        },
        '& .MuiSvgIcon-root[data-testid="KeyboardArrowDownIcon"]': {
          display: 'none',
        },
      },
    },

    /* ---------- Buttons ---------- */
    'body .Buttons-defaultButton:not(.Buttons-noBorder):not(.Buttons-iconButtonDefault)': {
      borderBottomColor: f.mode === 'dark' ? t.strokeControl : '#CCCCCC',
    },
    'body .Buttons-primaryButton:not(.Buttons-noBorder)': {
      borderColor: accent.main,
      '&:hover': {
        borderColor: accent.hover,
      },
    },

    /* ---------- Dialogs ---------- */
    'body .Dialog-content': {
      borderRadius: radius.overlay + 'px',
      border: `1px solid ${t.strokeSurface}`,
      overflow: 'hidden',
    },
    'body .Modal-footer, body .Alert-footer': {
      backgroundColor: t.layerBg,
      padding: '12px 16px',
      gap: '8px',
      borderTop: `1px solid ${t.strokeDivider}`,
      '& .Alert-margin': {
        marginLeft: 0,
        minWidth: '96px',
      },
    },

    /* ---------- InfoBars and toasts ---------- */
    'body [data-test="notifier-message"][class*="FormFooter-container"]': {
      borderColor: t.strokeCard,
      borderRadius: radius.control + 'px',
      padding: '6px 8px',
    },
    '.notistack-SnackbarContainer [data-test="notifier-message"][class*="FormFooter-container"]': {
      borderRadius: radius.overlay + 'px',
      border: `1px solid ${t.strokeSurface}`,
      boxShadow: t.shadowFlyout,
      padding: '10px 12px',
    },

    /* ---------- Data grids (react-data-grid) ---------- */
    'body .rdg': {
      '--rdg-selection-color': accent.main,
      '& .rdg-header-row': {
        backgroundColor: t.layerBg,
        fontWeight: 600,
      },
      '& .rdg-row:not([aria-selected=true]):hover': {
        backgroundColor: rowHover,
      },
    },
  };
}
