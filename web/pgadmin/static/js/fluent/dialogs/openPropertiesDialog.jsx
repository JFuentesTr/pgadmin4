/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Object Create/Properties dialogs as a side panel (Windows 11 flyout)
 * instead of a floating window that covers the Object Explorer.
 * Called from browser/static/js/node.js showPropertiesDialog(); every other
 * dialog keeps using LayoutDocker.openDialog. */

import ErrorBoundary from '../../helpers/ErrorBoundary';
import { LayoutDocker } from '../../helpers/Layout';
import { getPreference } from '../common/preferences';
import { ensureServerSchemaExtension } from '../forms/serverSchemaExtension';

export const FLYOUT_PANEL_ID = 'id-fluent-flyout';
const FLYOUT_MIN_WIDTH = 460;
const FLYOUT_MAX_WIDTH = 600;
const FLYOUT_MAX_RATIO = 0.45;

export function isFlyoutEnabled() {
  return getPreference('misc', 'ui_style') === 'fluent' &&
    (getPreference('misc', 'properties_dialog_mode') ?? 'flyout') === 'flyout';
}

export function openPropertiesDialog(docker, panelData, width, height) {
  /* The dialog content builds its schema when it renders, right after this. */
  ensureServerSchemaExtension();

  if(!isFlyoutEnabled()) {
    docker.openDialog(panelData, width, height);
    return;
  }

  const layout = docker.layoutObj;
  const existing = layout.find(panelData.id);
  if(existing) {
    layout.dockMove(existing, null, 'front');
    return;
  }

  const {width: layoutWidth} = layout.getLayoutSize();
  const size = Math.round(Math.min(
    Math.max(Math.min(width, FLYOUT_MAX_WIDTH), FLYOUT_MIN_WIDTH),
    layoutWidth * FLYOUT_MAX_RATIO,
  ));
  /* rc-dock gives a panel docked against a box its own flex weights and
   * derives the panel minWidth from its tabs, so the width is set on the tab.
   * No panelLock: a locked panel is never removed, even when empty. */
  const tab = LayoutDocker.getPanel({
    ...panelData,
    content: <ErrorBoundary>{panelData.content}</ErrorBoundary>,
    group: 'dialogs',
    closable: true,
    minWidth: size,
  });

  /* Further dialogs open as tabs of the same side panel. */
  const flyout = layout.find(FLYOUT_PANEL_ID);
  if(flyout?.tabs?.length) {
    layout.dockMove(tab, flyout, 'middle');
    return;
  }

  layout.dockMove({
    id: FLYOUT_PANEL_ID,
    size,
    tabs: [tab],
  }, layout.getLayout().dockbox, 'right');
}
