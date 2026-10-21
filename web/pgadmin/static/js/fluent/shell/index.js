/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* What BrowserComponent.jsx mounts around the docking layout. */

import { useTitleBarHeight } from './TitleBar';
import { useStatusBarHeight } from './StatusBar';

export { default as TitleBar } from './TitleBar';
export { default as StatusBar } from './StatusBar';
export { default as CommandPalette } from '../palette/CommandPalette';

/* Height taken by the fork's title bar and status bar, to subtract from the
 * layout. */
export function useShellChromeHeight() {
  return useTitleBarHeight() + useStatusBarHeight();
}
