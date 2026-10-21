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
| `web/pgadmin/static/js/BrowserComponent.jsx` | Import `TitleBar`; render it under Electron; subtract `useTitleBarHeight()` from the layout height | Custom Windows 11 title bar in desktop mode |
| `runtime/src/js/pgadmin.js` | Import `win_shell.js`; spread `getSplashWindowOptions()` / `getMainWindowOptions()` into the window options; `getSplashFile()`; call `setupMainWindow()` before `show()` | Title bar overlay, Mica, native theme, accent colour, maximized state |
| `runtime/src/js/pgadmin_preload.js` | Second `contextBridge.exposeInMainWorld('electronWin', ...)` appended at the end | Renderer API for `win_shell.js` (no change to `electronUI`) |
