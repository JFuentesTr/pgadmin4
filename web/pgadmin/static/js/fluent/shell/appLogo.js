/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import url_for from 'sources/url_for';
import pgAdmin from 'sources/pgadmin';

/* Served by Flask from web/pgadmin/static/img. Resolved at runtime instead of
 * importing the PNG, which Jest has no transform for. */
export function getAppLogoUrl() {
  return url_for('static', {filename: 'img/fluent/datalith-128.png'});
}

/* APP_NAME from web/branding.py, as rendered into browser/js/utils.js. */
export function getAppName() {
  return pgAdmin.Browser?.utils?.app_name || 'Datalith';
}
