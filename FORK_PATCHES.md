# Upstream files touched by the fork

Every edit to a file that comes from `pgadmin-org/pgadmin4` is listed here.

Last merge rehearsal (2026-10-21, `git merge-tree` against `upstream/master`,
283 commits ahead of REL-9_18): one conflict, in `runtime/src/js/pgadmin.js`,
where upstream reworked the window-open handling next to `launchPgAdminWindow()`.
Every other patched file merged cleanly.
Keep each edit small (an import, a hook call, a conditional) and mark it in the
code with `// Fluent fork: see FORK_PATCHES.md`. When merging a new upstream
release, these are the only files expected to conflict.

| File | Change | Why |
|---|---|---|
| `web/pgadmin/misc/__init__.py` | Import and call `register_fluent_preferences()` | Registers the `ui_style` and `use_windows_accent` preferences |
| `web/pgadmin/static/js/Theme/index.jsx` | Import from `../fluent/theme`; `useFluentOptions()`; `applyFluentBase()` / `applyFluentFinal()` around `getFinalTheme()` | Applies the Fluent design system when `ui_style` is `fluent` |
| `web/pgadmin/static/js/BrowserComponent.jsx` | Import from `./fluent/shell`; render `TitleBar` under Electron, `StatusBar` and `CommandPalette` after the layout; subtract `useShellChromeHeight()` from the layout height | Title bar, status bar and search palette |
| `web/pgadmin/dashboard/static/js/Dashboard.jsx` | Import `FluentWelcome`; render it with `Fallback={WelcomeDashboard}` instead of `WelcomeDashboard` | Fluent home page when no connected server is selected |
| `web/pgadmin/tools/sqleditor/static/js/components/sections/Query.jsx` | Import from `fluent/querytool/productionGuard`; `useProductionIndicator(queryToolCtx.params)`; wrap the `EXECUTION_START` fire in `triggerExecution` with `confirmProductionExecution()` | Production marker and confirmation before modifying statements |
| `web/pgadmin/tools/sqleditor/static/js/components/sections/ResultSet.jsx` | Imports; `copyDataFunc(withHeaders, sqlFormat)` hands SQL formats to `copyRowsAsSql()`; `confirmProductionDataSave()` at the start of `triggerSaveData`; `{...getGridDensityProps()}` on `QueryToolDataGrid` | Copy as INSERT/UPDATE, confirmation when saving grid edits on production, grid density |
| `web/pgadmin/tools/sqleditor/static/js/components/sections/ResultSetToolbar.jsx` | Import and render `<CopyAsSqlMenuItems>` in the "Copy options" menu | Copy as INSERT/UPDATE menu items |
| `web/pgadmin/tools/search_objects/static/js/SearchObjects.jsx` | *Not edited.* `translateSearchObjectsPath()` is copied to `fluent/palette/searchObjectsPath.js` because upstream does not export it | Keep the copy in sync when upstream changes it |
| `runtime/src/js/pgadmin.js` | Import `win_shell.js`; spread `getSplashWindowOptions()` / `getMainWindowOptions()` into the window options; `getSplashFile()`; call `setupMainWindow()` before `show()` | Title bar overlay, Mica, native theme, accent colour, maximized state |
| `runtime/src/js/pgadmin_preload.js` | Second `contextBridge.exposeInMainWorld('electronWin', ...)` appended at the end | Renderer API for `win_shell.js` (no change to `electronUI`) |
