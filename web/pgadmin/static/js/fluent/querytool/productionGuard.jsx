/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Production safe mode for the Query Tool. A server tagged prod/production
 * (see common/serverInfo.js) gets a PRODUCTION marker in its Query Tool, and
 * scripts that change data or the schema need an explicit confirmation.
 * Called from Query.jsx right before EXECUTION_START is fired. */

import { useEffect } from 'react';
import gettext from 'sources/gettext';
import getApiInstance from '../../api_instance';
import usePreferences from '../../../../preferences/static/js/store';
import { getEnvironment } from '../common/serverInfo';
import { analyzeSql, summarize } from './sqlAnalysis';
import ConfirmProductionContent from './ConfirmProductionContent';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();
/* Query Tool transactions where the user chose "don't ask again". */
const skippedTransactions = new Set();
/* Query.jsx registers its execution listener once, so the context it passes
 * can be stale after a connection switch. The indicator hook runs on every
 * render and keeps the current params here (one Query Tool per iframe). */
let latestParams = null;

/* The Query Tool runs at <base>/sqleditor/panel/...; the server properties
 * live at <base>/browser/server/obj/<group>/<server>. */
function serverPropertiesUrl(sgid, sid) {
  const base = window.location.pathname.split('/sqleditor/')[0];
  return `${base}/browser/server/obj/${sgid}/${sid}`;
}

export async function getServerEnvironment(params) {
  const {sgid, sid} = params ?? {};
  if(!sgid || !sid) return null;
  const key = `${sgid}/${sid}`;
  const hit = cache.get(key);
  if(hit && Date.now() - hit.time < CACHE_TTL_MS) {
    return hit.promise;
  }
  const promise = getApiInstance().get(serverPropertiesUrl(sgid, sid))
    .then((res)=>getEnvironment(res.data?.tags))
    .catch(()=>null);
  cache.set(key, {time: Date.now(), promise});
  return promise;
}

function isSafeModeOn() {
  return usePreferences.getState().getPreferencesForModule('misc')?.prod_safe_mode ?? true;
}

/* Marks the page so the Fluent CSS can draw the production indicator. */
export function useProductionIndicator(params) {
  latestParams = params;
  useEffect(()=>{
    let alive = true;
    getServerEnvironment(params).then((env)=>{
      if(alive) {
        document.documentElement.dataset.pgaEnv = env?.key ?? '';
      }
    });
    return ()=>{ alive = false; };
  }, [params?.sgid, params?.sid]);
}

async function needsConfirmation(queryToolCtx) {
  const params = latestParams ?? queryToolCtx.params;
  if(!isSafeModeOn() || skippedTransactions.has(params.trans_id)) return null;
  const env = await getServerEnvironment(params);
  return env?.key === 'prod' ? params : null;
}

/* Resolves true when the query may run. */
export async function confirmProductionExecution(queryToolCtx, query, explainObject) {
  /* A plain EXPLAIN only plans the statement; EXPLAIN ANALYZE runs it. */
  if(explainObject && !explainObject.analyze) return true;
  const params = await needsConfirmation(queryToolCtx);
  if(!params) return true;

  const {modifying} = analyzeSql(query);
  if(!modifying.length) return true;

  return askConfirmation(queryToolCtx, params, {kind: 'script', summary: summarize(modifying), sql: query});
}

/* Saving edits made in the result grid (ResultSet.jsx triggerSaveData). */
export async function confirmProductionDataSave(queryToolCtx, changes) {
  const params = await needsConfirmation(queryToolCtx);
  if(!params) return true;

  const summary = [
    {label: 'INSERT', count: Object.keys(changes.added ?? {}).length},
    {label: 'UPDATE', count: Object.keys(changes.updated ?? {}).length},
    {label: changes.delete_all ? gettext('DELETE all rows') : 'DELETE', count: Object.keys(changes.deleted ?? {}).length, danger: Boolean(changes.delete_all)},
  ].filter((s)=>s.count > 0 || s.danger);
  return askConfirmation(queryToolCtx, params, {kind: 'grid', summary, sql: null});
}

function askConfirmation(queryToolCtx, params, {kind, summary, sql}) {
  return new Promise((resolve)=>{
    let answered = false;
    const answer = (closeModal, value)=>{
      answered = true;
      closeModal();
      resolve(value);
    };
    const title = kind === 'grid' ?
      gettext('Save changes on a production server?') : gettext('Run on a production server?');
    queryToolCtx.modal.showModal(title, (closeModal)=>(
      <ConfirmProductionContent
        kind={kind}
        serverName={params.server_name ?? ''}
        summary={summary}
        sql={sql}
        onCancel={()=>answer(closeModal, false)}
        onRun={(skipForTab)=>{
          skipForTab && skippedTransactions.add(params.trans_id);
          answer(closeModal, true);
        }}
      />
    ), {
      onClose: (closeModal)=>{
        closeModal?.();
        !answered && resolve(false);
      },
    });
  });
}
