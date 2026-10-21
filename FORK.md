# pgAdmin 4 Fluent fork

A personal fork of [pgAdmin 4](https://github.com/pgadmin-org/pgadmin4) with a
redesigned user interface for the Windows desktop app: Fluent 2 / Windows 11
look, a native title bar, and reworked navigation, Query Tool and dialogs.

- Fork: `JFuentesTr/pgadmin4`, working branch **`redesign`**
- Based on upstream tag **REL-9_18**
- Upstream code stays under the PostgreSQL Licence (see `LICENSE`).

## Rules

- **Never open pull requests or issues against `pgadmin-org/pgadmin4`.**
  Upstream is read-only: we only fetch and merge its release tags. The push URL
  of the `upstream` remote is set to an invalid value on purpose.
- Any PR goes inside the fork: `gh pr create --repo JFuentesTr/pgadmin4 ...`
  (`gh repo set-default JFuentesTr/pgadmin4` is configured, but always pass
  `--repo` anyway, since `gh` targets the parent of a fork by default).
- New code goes in fork-owned folders. Each edit to an upstream file stays as
  small as possible and is listed in [`FORK_PATCHES.md`](FORK_PATCHES.md).

## Where the fork code lives

| Path | Content |
|---|---|
| `web/pgadmin/static/js/fluent/theme/` | Fluent design system: tokens, accent colours, MUI theme, global CSS |
| `web/pgadmin/static/js/fluent/shell/` | Desktop shell UI: title bar, shell info store |
| `web/pgadmin/misc/fluent_ui.py` | `ui_style` and `use_windows_accent` preferences |
| `runtime/src/js/win_shell.js` | Windows window integration: title bar overlay, Mica, accent colour, native theme, maximized state |
| `runtime/src/html/fluent_splash.html` | Fluent splash screen (used when the custom title bar is on) |

Desktop-only switches live in the title bar's **View** menu: *Mica Background*
and *Use the Windows Title Bar* (falls back to the native frame and menu).

The Fluent UI is enabled by the **Preferences > Miscellaneous > User interface >
Interface style** preference (`fluent` by default, `pgadmin` restores the
original look).

## Development setup (Windows)

Prerequisites: Node 20+, Python 3.11 (use the python.org build, not MSYS2),
Docker Desktop (for the test database).

```powershell
# Python backend
& "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" -m venv venv
# psycopg[c] needs a compiler on Windows; the binary wheel is fine for dev
(Get-Content requirements.txt) -replace 'psycopg\[c\]','psycopg[binary]' | Set-Content $env:TEMP\req-dev.txt
venv\Scripts\python -m pip install --only-binary=cryptography -r $env:TEMP\req-dev.txt
# gssapi raises OSError (not ImportError) without MIT Kerberos for Windows,
# which breaks startup; Kerberos auth is not needed in desktop mode
venv\Scripts\python -m pip uninstall -y gssapi

# Frontend
cd web
corepack yarn install
corepack yarn run bundle:dev      # or webpacker:watch while developing
cd ..

# Desktop runtime
cd runtime
corepack yarn install
copy dev_config.json.in dev_config.json   # then set pythonPath to ../venv/Scripts/python.exe
corepack yarn start
```

Gotchas on Windows:

- Yarn 4 skips the `electron` package's install script, so the Electron
  binary is missing after `yarn install`. Download it once with
  `cd runtime\node_modules\electron; node --experimental-require-module install.js`
  (Node 20.17 needs the flag because the script requires an ES module).
- Development bundles use webpack's `eval` devtool, which the default
  Content Security Policy blocks (the page stays blank). `DEBUG = True` would
  relax it but also replaces `socketio.run` with `app.run`, breaking the PSQL
  tool. Instead, `web/config_local.py` (not committed) can carry:

  ```python
  import os
  DATA_DIR = os.path.join(os.environ['APPDATA'], 'pgAdmin-fluent-dev')  # keep apart from an installed pgAdmin
  CONTENT_SECURITY_POLICY = (
      "default-src 'self' ws: http: data: blob:;"
      " script-src 'self' 'nonce-{nonce}' 'unsafe-eval';"
      " style-src 'self' 'unsafe-inline';"
      " object-src 'none';"
      " base-uri 'self';"
  )
  ```
- `View > Reload` in the desktop app may serve cached bundles (same `?ver=`
  URL). Restart the app, or clear the cache from the developer tools.

Test database: `docker run -d --name pgfluent-db -p 5433:5432 -e POSTGRES_PASSWORD=postgres postgres:17`.

## Syncing with upstream

```powershell
git fetch upstream --tags
git switch redesign
git merge REL-9_19            # the new release tag
# Conflicts should only appear in the files listed in FORK_PATCHES.md.
# yarn.lock conflicts: take upstream's version, then run `corepack yarn install`.
cd web; corepack yarn run linter; corepack yarn run test:js-once
```
