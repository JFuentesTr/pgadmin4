/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

// Product identity of the desktop app. Imported by pgadmin.js before any
// module that reads app paths (misc.js computes the log file path when it is
// imported, electron-store reads userData when the store is created).
// The web app takes its name from web/branding.py.

import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BRAND = {
  name: 'Datalith',
  appUserModelId: 'com.datalith.desktop',
  icon: path.join(__dirname, '../../assets/datalith.png'),
};

app.setName(BRAND.name);
// %APPDATA%\Datalith\Desktop: next to the server data (%APPDATA%\Datalith,
// see APP_WIN_PATH) and apart from an installed pgAdmin.
app.setPath('userData', path.join(app.getPath('appData'), BRAND.name, 'Desktop'));
if(process.platform === 'win32') {
  // Taskbar grouping and notifications; matches the installer shortcut.
  app.setAppUserModelId(BRAND.appUserModelId);
}
