# Upstream files touched by the fork

Every edit to a file that comes from `pgadmin-org/pgadmin4` is listed here.

Last merge rehearsal (2026-10-21, `git merge-tree` against `upstream/master`,
283 commits ahead of REL-9_18): one conflict, in `runtime/src/js/pgadmin.js`,
where upstream reworked the window-open handling next to `launchPgAdminWindow()`.
Every other patched file merged cleanly, including `Make.bat` and
`installer.iss.in` (upstream reworked the Windows build and signing steps, so
keep the fork's edits there to the lines listed below).
Keep each edit small (an import, a hook call, a conditional) and mark it in the
code with `// Fluent fork: see FORK_PATCHES.md`. When merging a new upstream
release, these are the only files expected to conflict.

| File | Change | Why |
|---|---|---|
| `web/pgadmin/misc/__init__.py` | Import and call `register_fluent_preferences()`; append the `misc/fluent` blueprint in `register()` | Fork preferences and the `fluent.test_connection` endpoint |
| `web/pgadmin/browser/static/js/node.js` | Import `openPropertiesDialog`; `showPropertiesDialog()` calls it instead of `docker.openDialog()` (two places) | Create/Properties dialogs as a side panel; server form extension (connection string, Test connection) |
| `web/pgadmin/static/js/Theme/index.jsx` | Import from `../fluent/theme`; `useFluentOptions()`; `applyFluentBase()` / `applyFluentFinal()` around `getFinalTheme()` | Applies the Fluent design system when `ui_style` is `fluent` |
| `web/pgadmin/static/js/BrowserComponent.jsx` | Import from `./fluent/shell`; render `TitleBar` under Electron, `StatusBar` and `CommandPalette` after the layout; subtract `useShellChromeHeight()` from the layout height | Title bar, status bar and search palette |
| `web/pgadmin/dashboard/static/js/Dashboard.jsx` | Import `FluentWelcome`; render it with `Fallback={WelcomeDashboard}` instead of `WelcomeDashboard` | Fluent home page when no connected server is selected |
| `web/pgadmin/tools/sqleditor/static/js/components/sections/Query.jsx` | Import from `fluent/querytool/productionGuard`; `useProductionIndicator(queryToolCtx.params)`; wrap the `EXECUTION_START` fire in `triggerExecution` with `confirmProductionExecution()` | Production marker and confirmation before modifying statements |
| `web/pgadmin/tools/sqleditor/static/js/components/sections/ResultSet.jsx` | Imports; `copyDataFunc(withHeaders, sqlFormat)` hands SQL formats to `copyRowsAsSql()`; `confirmProductionDataSave()` at the start of `triggerSaveData`; `{...getGridDensityProps()}` on `QueryToolDataGrid` | Copy as INSERT/UPDATE, confirmation when saving grid edits on production, grid density |
| `web/pgadmin/tools/sqleditor/static/js/components/sections/ResultSetToolbar.jsx` | Import and render `<CopyAsSqlMenuItems>` in the "Copy options" menu | Copy as INSERT/UPDATE menu items |
| `web/pgadmin/tools/search_objects/static/js/SearchObjects.jsx` | *Not edited.* `translateSearchObjectsPath()` is copied to `fluent/palette/searchObjectsPath.js` because upstream does not export it | Keep the copy in sync when upstream changes it |
| `runtime/src/js/pgadmin.js` | Import `brand.js` right after the `electron` import; import `win_shell.js`; spread `getSplashWindowOptions()` / `getMainWindowOptions()` into the window options; `getSplashFile()`; call `setupMainWindow()` before `show()` | Product name, userData folder and AppUserModelID (must run before `misc.js` and the store are created); title bar overlay, Mica, native theme, accent colour, maximized state |
| `web/branding.py` | `APP_NAME = 'Datalith'`; `APP_SHORT_NAME`/`APP_PATH` `datalith`, `APP_WIN_PATH` `Datalith`; `APP_COPYRIGHT` prefixed with "Based on pgAdmin 4." | Product name in the UI and page titles; own data folder (`%APPDATA%\Datalith`, `datalith.db`) so it installs side by side with pgAdmin. Make.bat reads `APP_NAME` from here |
| `pkg/win32/installer.iss.in` | Defines (name, publisher, URL, exe, icon, AppUserModelID, a new AppID GUID); `OutputBaseFilename=datalith-setup`; `SetupIconFile` and `WizardImageFile` use the Datalith files; `[Files]` installs `runtime\pgAdmin4.exe` as `Datalith.exe`; Start menu icon gets `IconFilename` and `AppUserModelID` | Datalith installer that does not upgrade or replace an installed pgAdmin; taskbar grouping matches `brand.js` |
| `Make.bat` | rcedit `--set-icon` and the icon copy use `datalith.ico`; the installer is moved from `Output\datalith-setup.exe` | Datalith icon on the executable. The build keeps upstream's `pgAdmin4.exe` name for the staged executable (the installer renames it), so upstream's signing and build steps merge without conflicts |
| `runtime/src/js/pgadmin_preload.js` | Second `contextBridge.exposeInMainWorld('electronWin', ...)` appended at the end | Renderer API for `win_shell.js` (no change to `electronUI`) |
