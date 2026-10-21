/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import url_for from 'sources/url_for';
import getApiInstance from '../../api_instance';
import usePreferences from '../../../../preferences/static/js/store';

/* Saves preferences by name, e.g. [{module: 'misc', name: 'theme', value: 'dark'}],
 * then reloads the store. The store broadcasts the new values to the Query
 * Tool and other iframes (setupPreferenceBroadcast). */
export async function savePreferences(prefs) {
  await getApiInstance().put(url_for('preferences.update_pref'), {
    pref_data: JSON.stringify(prefs),
  });
  await usePreferences.getState().cache();
}

export function getPreference(module, name) {
  return usePreferences.getState().getPreferences(module, name)?.value;
}
