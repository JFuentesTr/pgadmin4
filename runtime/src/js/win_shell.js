/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

// Windows 11 integration for the main window: custom title bar drawn by the
// web app over the native caption buttons (Window Controls Overlay), optional
// Mica backdrop, native theme and accent colour. Everything here is a no-op
// on other platforms, so pgadmin.js can call it unconditionally.

import { app, BrowserWindow, ipcMain, nativeTheme, systemPreferences } from 'electron';
import os from 'os';
import { BRAND } from './brand.js';

const isWindows = process.platform === 'win32';
const TITLE_BAR_HEIGHT = 40;
// Mica needs Windows 11 22H2 (build 22621) or later.
const MICA_MIN_BUILD = 22621;

const STORE_KEYS = {
  customTitleBar: 'fluentCustomTitleBar',
  mica: 'fluentMica',
  themeSource: 'fluentThemeSource',
  maximized: 'fluentMaximized',
  normalBounds: 'fluentNormalBounds',
};

let mainWindow = null;
let ipcRegistered = false;

function windowsBuild() {
  return parseInt(os.release().split('.')[2] ?? '0', 10);
}

function supportsMica() {
  return isWindows && windowsBuild() >= MICA_MIN_BUILD;
}

function isCustomTitleBar(configStore) {
  return isWindows && configStore.get(STORE_KEYS.customTitleBar, true);
}

function isMica(configStore) {
  return isCustomTitleBar(configStore) && supportsMica() && configStore.get(STORE_KEYS.mica, false);
}

function getAccentColor() {
  if(!isWindows) return null;
  try {
    return systemPreferences.getAccentColor();
  } catch {
    return null;
  }
}

// Child windows (tools opened in a new window) keep the native frame, so the
// custom title bar and Mica only apply to the main window.
function getShellInfo(configStore, isMainWindow=true) {
  return {
    platform: process.platform,
    customTitleBar: isMainWindow && isCustomTitleBar(configStore),
    titleBarHeight: TITLE_BAR_HEIGHT,
    mica: isMainWindow && isMica(configStore),
    micaSupported: supportsMica(),
    accentColor: getAccentColor(),
  };
}

function sendShellInfo(configStore) {
  if(mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('winShellInfoChanged', getShellInfo(configStore));
  }
}

function applyStoredThemeSource(configStore) {
  if(!isWindows) return;
  const themeSource = configStore.get(STORE_KEYS.themeSource, 'system');
  if(['system', 'light', 'dark'].includes(themeSource)) {
    nativeTheme.themeSource = themeSource;
  }
}

// Options merged into the splash BrowserWindow. Also restores the last theme
// the user picked so the splash does not flash the wrong colours.
export function getSplashWindowOptions(configStore) {
  if(!isCustomTitleBar(configStore)) return {icon: BRAND.icon};
  applyStoredThemeSource(configStore);
  return {
    icon: BRAND.icon,
    width: 560,
    height: 360,
    backgroundColor: '#00000000',
  };
}

export function getSplashFile(configStore, defaultFile) {
  return isCustomTitleBar(configStore) ? './src/html/fluent_splash.html' : defaultFile;
}

// Options merged into the main BrowserWindow.
export function getMainWindowOptions(configStore) {
  if(!isCustomTitleBar(configStore)) return {icon: BRAND.icon};
  applyStoredThemeSource(configStore);
  const dark = nativeTheme.shouldUseDarkColors;
  const mica = isMica(configStore);
  return {
    icon: BRAND.icon,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: dark ? '#FFFFFF' : '#1B1B1B',
      height: TITLE_BAR_HEIGHT,
    },
    autoHideMenuBar: false,
    backgroundColor: mica ? '#00000000' : (dark ? '#202020' : '#F3F3F3'),
    ...(mica ? {backgroundMaterial: 'mica'} : {}),
  };
}

function runWindowCommand(win, command, configStore, callbacks) {
  const contents = win.webContents;
  switch(command) {
  case 'zoomIn':
    contents.setZoomLevel(contents.getZoomLevel() + 0.5);
    break;
  case 'zoomOut':
    contents.setZoomLevel(contents.getZoomLevel() - 0.5);
    break;
  case 'resetZoom':
    contents.setZoomLevel(0);
    break;
  case 'toggleFullScreen':
    win.setFullScreen(!win.isFullScreen());
    break;
  case 'toggleDevTools':
    contents.toggleDevTools();
    break;
  case 'reload':
    callbacks['reloadApp']?.();
    break;
  case 'viewLogs':
    callbacks['view_logs']?.();
    break;
  case 'configure':
    callbacks['configure']?.();
    break;
  case 'quit':
    win.close();
    break;
  case 'toggleMica': {
    if(!supportsMica()) break;
    const enable = !configStore.get(STORE_KEYS.mica, false);
    configStore.set(STORE_KEYS.mica, enable);
    win.setBackgroundColor(enable ? '#00000000' : (nativeTheme.shouldUseDarkColors ? '#202020' : '#F3F3F3'));
    win.setBackgroundMaterial(enable ? 'mica' : 'none');
    sendShellInfo(configStore);
    break;
  }
  case 'toggleCustomTitleBar':
    // Needs a new window, so restart the whole app.
    configStore.set(STORE_KEYS.customTitleBar, !configStore.get(STORE_KEYS.customTitleBar, true));
    app.relaunch();
    app.exit(0);
    break;
  }
}

// Called once the main window exists, before it is shown.
export function setupMainWindow(win, configStore, callbacks={}) {
  if(!isWindows) return;
  mainWindow = win;

  if(isCustomTitleBar(configStore)) {
    // The web app renders the menus in its own title bar. The native menu is
    // still set by menu.js for its accelerators, but must not be drawn.
    const setMenu = win.setMenu.bind(win);
    win.setMenu = (menu) => {
      setMenu(menu);
      win.setMenuBarVisibility(false);
    };
    win.setMenuBarVisibility(false);
  }

  if(configStore.get(STORE_KEYS.maximized, false)) {
    // pgadmin.js stores the maximized size as 'bounds', so restore the
    // normal size first, otherwise un-maximizing would keep it full screen.
    const normalBounds = configStore.get(STORE_KEYS.normalBounds);
    normalBounds && win.setBounds(normalBounds);
    win.maximize();
  }

  win.on('close', () => {
    configStore.set(STORE_KEYS.maximized, win.isMaximized());
    configStore.set(STORE_KEYS.normalBounds, win.getNormalBounds());
  });

  const sendMaximized = () => {
    win.webContents.send('winMaximizedChanged', win.isMaximized());
  };
  win.on('maximize', sendMaximized);
  win.on('unmaximize', sendMaximized);

  const onAccentChanged = () => sendShellInfo(configStore);
  systemPreferences.on('accent-color-changed', onAccentChanged);
  win.on('closed', () => {
    systemPreferences.removeListener('accent-color-changed', onAccentChanged);
    mainWindow = null;
  });

  if(ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('winGetShellInfo', (event) => (
    getShellInfo(configStore, BrowserWindow.fromWebContents(event.sender) === mainWindow)
  ));

  ipcMain.on('winSetTitleBarTheme', (event, {themeSource, symbolColor}) => {
    const caller = BrowserWindow.fromWebContents(event.sender);
    if(['system', 'light', 'dark'].includes(themeSource)) {
      nativeTheme.themeSource = themeSource;
      configStore.set(STORE_KEYS.themeSource, themeSource);
    }
    if(caller && isCustomTitleBar(configStore) && symbolColor) {
      caller.setTitleBarOverlay({
        color: '#00000000',
        symbolColor: symbolColor,
        height: TITLE_BAR_HEIGHT,
      });
    }
  });

  ipcMain.on('winCommand', (event, command) => {
    const caller = BrowserWindow.fromWebContents(event.sender);
    if(caller) {
      runWindowCommand(caller, command, configStore, callbacks);
    }
  });
}
