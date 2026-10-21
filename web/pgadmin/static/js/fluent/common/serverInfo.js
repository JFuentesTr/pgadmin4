/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import gettext from 'sources/gettext';
import pgAdmin from 'sources/pgadmin';
import { getServerColors } from '../../utils';

/* Environment detected from the server tags, so production servers can be
 * flagged everywhere (status bar, home page, and later the Query Tool). */
export const ENVIRONMENTS = {
  prod: {key: 'prod', label: 'PROD', title: gettext('Production'), pattern: /^(prod|production|prd|live)$/i},
  staging: {key: 'staging', label: 'STAGING', title: gettext('Staging'), pattern: /^(stag|stage|staging|uat|qa|test|testing|pre|preprod)$/i},
  dev: {key: 'dev', label: 'DEV', title: gettext('Development'), pattern: /^(dev|develop|development|local|sandbox)$/i},
};

export function getEnvironment(tags) {
  for(const tag of tags ?? []) {
    const text = String(tag?.text ?? '').trim();
    for(const env of Object.values(ENVIRONMENTS)) {
      if(env.pattern.test(text)) {
        return env;
      }
    }
  }
  return null;
}

/* PostgreSQL reports server_version_num, e.g. 180006 -> 18.6, 90624 -> 9.6.24 */
export function formatServerVersion(version) {
  const num = Number(version);
  if(!num) return null;
  const major = Math.floor(num / 10000);
  if(major >= 10) {
    return `${major}.${num % 100}`;
  }
  return `${major}.${Math.floor(num / 100) % 100}.${num % 100}`;
}

/* Describes the server/database around a tree item, for the status bar. */
export function getNodeContext(item) {
  const tree = pgAdmin.Browser?.tree;
  if(!tree || !item) return null;

  let hierarchy;
  try {
    hierarchy = tree.getTreeNodeHierarchy(item);
  } catch {
    return null;
  }
  const data = tree.itemData(item);
  const server = hierarchy?.server;
  const serverInfo = server ? pgAdmin.Browser.serverInfo?.[server._id] : null;

  return {
    item,
    data,
    path: tree.getNodeDisplayPath(item, ' › ', true),
    server: server ? {
      id: server._id,
      label: server.label ?? server._label,
      connected: Boolean(server.connected),
      version: formatServerVersion(server.version ?? serverInfo?.version),
      serverType: server.server_type,
      user: server.user?.name ?? server.username,
      host: server.host,
      port: server.port,
      tags: server.tags ?? [],
      environment: getEnvironment(server.tags),
      colors: getServerColors(server.icon),
    } : null,
    database: hierarchy?.database ? {
      id: hierarchy.database._id,
      label: hierarchy.database.label ?? hierarchy.database._label,
      connected: Boolean(hierarchy.database.connected),
    } : null,
    hierarchy,
  };
}
