/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Windows 11 style title bar for the desktop app. The window is created with
 * titleBarStyle 'hidden' (runtime/src/js/win_shell.js): Windows still draws
 * the caption buttons on the right, this component draws everything else and
 * acts as the drag region. It replaces the native Win32 menu bar. */

import { useEffect, useRef, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import gettext from 'sources/gettext';
import _ from 'lodash';
import { PgMenu, PgMenuDivider, PgMenuItem, PgSubMenu } from '../../components/Menu';
import { usePgAdmin } from '../../PgAdminProvider';
import { useForceUpdate } from '../../custom_hooks';
import usePreferences from '../../../../preferences/static/js/store';
import useShellInfo from './shellInfoStore';
import { getAppLogoUrl } from './appLogo';

const Root = styled('div')(({theme}) => ({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '12px',
  /* Leave room for the native caption buttons, zoom aware. */
  paddingRight: 'calc(100vw - env(titlebar-area-width, calc(100vw - 138px)) - env(titlebar-area-x, 0px))',
  backgroundColor: theme.fluent?.shellBg ?? theme.otherVars.emptySpaceBg,
  color: theme.palette.text.primary,
  fontSize: '0.75rem',
  userSelect: 'none',
  WebkitAppRegion: 'drag',
  '&.TitleBar-inactive .TitleBar-title, &.TitleBar-inactive .TitleBar-menuButton': {
    color: theme.palette.text.disabled ?? theme.palette.text.muted,
  },
  '& .TitleBar-logo': {
    width: '16px',
    height: '16px',
    marginRight: '8px',
  },
  '& .TitleBar-title': {
    marginRight: '12px',
    whiteSpace: 'nowrap',
  },
  '& .TitleBar-menus': {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    WebkitAppRegion: 'no-drag',
  },
  '& .TitleBar-menuButton': {
    height: '28px',
    padding: '0 10px',
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    background: 'transparent',
    color: theme.palette.text.primary,
    font: 'inherit',
    fontSize: '0.8125rem',
    cursor: 'default',
    outline: 'none',
    '&:hover, &[aria-expanded="true"]': {
      backgroundColor: theme.fluent?.tokens.subtleHoverBg ?? theme.palette.grey[400],
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.text.primary}`,
      outlineOffset: '-2px',
    },
  },
}));

/* Maps the theme preference to Electron's nativeTheme.themeSource, so native
 * surfaces (caption buttons, context menus, dialogs) match the app. */
function useNativeThemeSync() {
  const theme = useTheme();
  const prefTheme = usePreferences((s)=>s.getPreferencesForModule('misc')?.theme) ?? 'system';
  const symbolColor = theme.palette.text.primary;

  useEffect(()=>{
    let themeSource = prefTheme;
    if(prefTheme === 'high_contrast') {
      themeSource = 'dark';
    } else if(!['system', 'light', 'dark'].includes(prefTheme)) {
      themeSource = 'system';
    }
    window.electronWin?.setTitleBarTheme({themeSource, symbolColor});
  }, [prefTheme, symbolColor]);
}

function useWindowActive() {
  const [active, setActive] = useState(document.hasFocus());
  useEffect(()=>{
    const onFocus = ()=>setActive(true);
    const onBlur = ()=>setActive(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return ()=>{
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
  return active;
}

/* A lone Alt press moves focus to the menu bar, like a native Win32 menu. */
function useAltFocusesMenu(menusRef) {
  useEffect(()=>{
    let altAlone = false;
    const onKeyDown = (e)=>{
      altAlone = e.key === 'Alt' && !e.ctrlKey && !e.shiftKey && !e.metaKey;
    };
    const onKeyUp = (e)=>{
      if(e.key === 'Alt' && altAlone) {
        e.preventDefault();
        const first = menusRef.current?.querySelector('.TitleBar-menuButton');
        if(document.activeElement && menusRef.current?.contains(document.activeElement)) {
          document.activeElement.blur();
        } else {
          first?.focus();
        }
      }
      altAlone = false;
    };
    const onMouseDown = ()=>{ altAlone = false; };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('mousedown', onMouseDown, true);
    return ()=>{
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('mousedown', onMouseDown, true);
    };
  }, []);
}

function onMenuBarKeyDown(e) {
  if(!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const buttons = [...e.currentTarget.querySelectorAll('.TitleBar-menuButton')];
  const idx = buttons.indexOf(document.activeElement);
  if(idx < 0) return;
  const next = e.key === 'ArrowRight' ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
  buttons[next].focus();
  e.preventDefault();
}

function getMenuItem(menuItem, i, forceUpdate) {
  if(menuItem.type == 'separator') {
    return <PgMenuDivider key={i}/>;
  }
  const submenus = menuItem.getMenuItems?.();
  if(submenus) {
    return (
      <PgSubMenu key={menuItem.label} label={menuItem.label}>
        {submenus.map((sub, j)=>getMenuItem(sub, j, forceUpdate))}
      </PgSubMenu>
    );
  }
  const hasCheck = typeof menuItem.checked == 'boolean';
  return (
    <PgMenuItem
      key={i}
      disabled={menuItem.isDisabled}
      onClick={()=>{
        menuItem.callback();
        hasCheck && forceUpdate();
      }}
      hasCheck={hasCheck}
      checked={menuItem.checked}
      closeOnCheck={true}
      shortcut={menuItem.shortcut}
    >{menuItem.label}</PgMenuItem>
  );
}

/* Every View item reserves the check column, so the Mica toggle lines up
 * with the plain commands like in a native Windows menu. */
function ViewItem({command, checked=false, ...props}) {
  return (
    <PgMenuItem hasCheck checked={checked} closeOnCheck
      onClick={()=>window.electronWin?.command(command)} {...props} />
  );
}

function ViewMenu() {
  const {mica, micaSupported} = useShellInfo();
  return (
    <PgMenu
      menuButton={<button className='TitleBar-menuButton' data-label='View'>{gettext('View')}</button>}
      label={gettext('View')}
    >
      <ViewItem command='zoomIn' shortcut={{control: true, key: {char: '+'}}}>{gettext('Zoom In')}</ViewItem>
      <ViewItem command='zoomOut' shortcut={{control: true, key: {char: '-'}}}>{gettext('Zoom Out')}</ViewItem>
      <ViewItem command='resetZoom' shortcut={{control: true, key: {char: '0'}}}>{gettext('Actual Size')}</ViewItem>
      <PgMenuDivider />
      <ViewItem command='toggleFullScreen'>{gettext('Toggle Full Screen')}</ViewItem>
      {micaSupported &&
        <ViewItem command='toggleMica' checked={Boolean(mica)}>{gettext('Mica Background')}</ViewItem>}
      <ViewItem command='toggleCustomTitleBar'>{gettext('Use the Windows Title Bar (restarts)')}</ViewItem>
      <PgMenuDivider />
      <ViewItem command='reload'>{gettext('Reload')}</ViewItem>
      <ViewItem command='toggleDevTools'>{gettext('Toggle Developer Tools')}</ViewItem>
      <PgMenuDivider />
      <ViewItem command='viewLogs'>{gettext('View Logs...')}</ViewItem>
      <ViewItem command='configure'>{gettext('Configure Runtime...')}</ViewItem>
    </PgMenu>
  );
}

export function useTitleBarHeight() {
  const {customTitleBar, titleBarHeight} = useShellInfo();
  return customTitleBar ? titleBarHeight : 0;
}

export default function TitleBar() {
  const pgAdmin = usePgAdmin();
  const forceUpdate = useForceUpdate();
  const {customTitleBar, titleBarHeight} = useShellInfo();
  const active = useWindowActive();
  const menusRef = useRef(null);

  useNativeThemeSync();
  useAltFocusesMenu(menusRef);

  useEffect(()=>{
    const refresh = _.debounce(forceUpdate, 100);
    pgAdmin.Browser.Events.on('pgadmin:enable-disable-menu-items', refresh);
    pgAdmin.Browser.Events.on('pgadmin:refresh-app-menu', refresh);
    return ()=>{
      pgAdmin.Browser.Events.off('pgadmin:enable-disable-menu-items', refresh);
      pgAdmin.Browser.Events.off('pgadmin:refresh-app-menu', refresh);
    };
  }, []);

  if(!customTitleBar) {
    return null;
  }

  const mainMenus = pgAdmin.Browser.MainMenus ?? [];
  const helpMenu = mainMenus.find((m)=>m.name == 'help');

  const renderMenu = (menu)=>(
    <PgMenu
      key={menu.name}
      menuButton={<button className='TitleBar-menuButton' data-label={menu.label}>{menu.label}</button>}
      label={menu.label}
    >
      {menu.getMenuItems()?.map((menuItem, i)=>getMenuItem(menuItem, i, forceUpdate))}
    </PgMenu>
  );

  return (
    <Root className={active ? '' : 'TitleBar-inactive'} style={{height: titleBarHeight}} data-test="fluent-title-bar">
      <img className='TitleBar-logo' src={getAppLogoUrl()} alt='' />
      <span className='TitleBar-title'>pgAdmin 4</span>
      <div className='TitleBar-menus' ref={menusRef} role='menubar' onKeyDown={onMenuBarKeyDown}>
        {mainMenus.filter((m)=>m !== helpMenu).map(renderMenu)}
        <ViewMenu />
        {helpMenu && renderMenu(helpMenu)}
      </div>
    </Root>
  );
}
