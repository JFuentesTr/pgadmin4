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
import { WORKSPACES } from '../../../../browser/static/js/constants';
import { savePreferences, getPreference } from '../common/preferences';

/* Object types hidden by the "common objects only" preset. Only types that
 * have a show_node_<type> preference in this install are touched. */
export const SIMPLIFIED_HIDDEN_NODES = [
  'aggregate', 'cast', 'catalog', 'collation', 'compound_trigger', 'domain',
  'event_trigger', 'foreign_data_wrapper', 'foreign_table', 'fts_configuration',
  'fts_dictionary', 'fts_parser', 'fts_template', 'language', 'operator',
  'package', 'publication', 'rule', 'subscription', 'synonym',
];

function existingNodePrefs() {
  return SIMPLIFIED_HIDDEN_NODES.filter((t)=>getPreference('browser', 'show_node_' + t) !== undefined);
}

export function isSimplifiedTree() {
  const types = existingNodePrefs();
  return types.length > 0 && types.every((t)=>getPreference('browser', 'show_node_' + t) === false);
}

async function setSimplifiedTree(simplified) {
  await savePreferences(existingNodePrefs().map((t)=>({
    module: 'browser', name: 'show_node_' + t, value: !simplified,
  })));
  /* Same refresh the Preferences dialog does after a show_node_* change. */
  await pgAdmin.Browser.tree.destroy();
  pgAdmin.Browser.Events.trigger('pgadmin-browser:tree:destroyed', undefined, undefined);
}

/* Walks the app menus (File, Object, Tools, Help). The Object menu is rebuilt
 * for the selected tree node, so its commands follow the selection. */
function menuCommands() {
  const commands = [];
  /* Some actions are registered twice under the same menu; list them once. */
  const seen = new Set();
  const walk = (items, path, menuName)=>{
    for(const item of items ?? []) {
      if(item.type == 'separator' || !item.label) continue;
      const children = item.getMenuItems?.();
      if(children?.length) {
        walk(children, [...path, item.label], menuName);
        continue;
      }
      /* Placeholders such as "No object selected" have no name. */
      if(!item.name) continue;
      const dedupeKey = path.join('/') + '|' + item.label;
      if(seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      commands.push({
        id: `menu:${menuName}:${path.join('/')}:${item.name}`,
        label: item.label,
        category: path.join(' › '),
        shortcut: item.shortcut,
        disabled: Boolean(item.isDisabled),
        run: ()=>item.callback(),
      });
    }
  };
  for(const menu of pgAdmin.Browser.MainMenus ?? []) {
    walk(menu.getMenuItems(), [menu.label], menu.name);
  }
  return commands;
}

function forkCommands({workspace}) {
  const viewCat = gettext('View');
  const commands = [];

  const wsLabels = [
    [WORKSPACES.DEFAULT, gettext('Go to Default Workspace')],
    [WORKSPACES.QUERY_TOOL, gettext('Go to Query Tool Workspace')],
    [WORKSPACES.PSQL_TOOL, gettext('Go to PSQL Workspace')],
    [WORKSPACES.SCHEMA_DIFF_TOOL, gettext('Go to Schema Diff Workspace')],
  ];
  if(workspace?.enabled) {
    for(const [ws, label] of wsLabels) {
      if(ws === WORKSPACES.PSQL_TOOL && !pgAdmin['enable_psql']) continue;
      commands.push({
        id: 'ws:' + ws, label, category: gettext('Workspace'),
        disabled: ws !== WORKSPACES.DEFAULT && !workspace.hasOpenTabs(ws),
        run: ()=>workspace.changeWorkspace(ws),
      });
    }
  }

  commands.push({
    id: 'oe:toggle', label: gettext('Toggle Object Explorer'), category: viewCat,
    shortcut: getPreference('browser', 'toggle_object_explorer'),
    run: ()=>pgAdmin.Browser.Events.trigger('pgadmin:object-explorer:toggle'),
  });

  const simplified = isSimplifiedTree();
  commands.push({
    id: 'oe:simplified',
    label: simplified ? gettext('Object Explorer: Show All Object Types') : gettext('Object Explorer: Show Common Object Types Only'),
    category: viewCat,
    run: ()=>setSimplifiedTree(!simplified),
  });

  const theme = getPreference('misc', 'theme');
  for(const [value, label] of [
    ['system', gettext('Theme: Use System Setting')],
    ['light', gettext('Theme: Light')],
    ['dark', gettext('Theme: Dark')],
    ['high_contrast', gettext('Theme: High Contrast')],
  ]) {
    if(value === theme) continue;
    commands.push({
      id: 'theme:' + value, label, category: viewCat,
      run: ()=>savePreferences([{module: 'misc', name: 'theme', value}]),
    });
  }
  commands.push({
    id: 'ui:classic', label: gettext('Interface Style: pgAdmin Classic'), category: viewCat,
    run: ()=>savePreferences([{module: 'misc', name: 'ui_style', value: 'pgadmin'}]),
  });

  if(window.electronWin) {
    for(const [cmd, label] of [
      ['zoomIn', gettext('Zoom In')],
      ['zoomOut', gettext('Zoom Out')],
      ['resetZoom', gettext('Actual Size')],
      ['toggleFullScreen', gettext('Toggle Full Screen')],
      ['toggleDevTools', gettext('Toggle Developer Tools')],
    ]) {
      commands.push({
        id: 'win:' + cmd, label, category: viewCat,
        run: ()=>window.electronWin.command(cmd),
      });
    }
  }

  return commands;
}

export function buildCommands(context) {
  return [...forkCommands(context), ...menuCommands()];
}
