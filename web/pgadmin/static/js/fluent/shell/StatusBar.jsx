/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Bottom status bar: connection of the selected object, server version,
 * environment badge from the server tags, object path and a search button. */

import { useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import gettext from 'sources/gettext';
import pgAdmin from 'sources/pgadmin';
import { getNodeContext } from '../common/serverInfo';
import { requestPalette, PALETTE_MODES } from '../palette/paletteEvents';
import EnvironmentBadge from './EnvironmentBadge';

export const STATUS_BAR_HEIGHT = 26;

const REFRESH_EVENTS = [
  'pgadmin-browser:tree:selected',
  'pgadmin-browser:tree:destroyed',
  'pgadmin:server:connected',
  'pgadmin:server:disconnect',
  'pgadmin:server:connection:lost',
  'pgadmin:database:connected',
  'pgadmin:database:connection:lost',
];

const Root = styled('div')(({theme}) => {
  const t = theme.fluent.tokens;
  return {
    height: STATUS_BAR_HEIGHT,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '0 8px',
    fontSize: '0.75rem',
    color: t.textSecondary,
    backgroundColor: theme.fluent.shellBg,
    borderTop: `1px solid ${t.strokeDivider}`,
    userSelect: 'none',
    '& .StatusBar-item': {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      height: '22px',
      padding: '0 8px',
      borderRadius: '4px',
      whiteSpace: 'nowrap',
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      font: 'inherit',
    },
    '& button.StatusBar-item:hover': {
      backgroundColor: t.subtleHoverBg,
      color: t.text,
    },
    '& .StatusBar-dot': {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: t.textDisabled,
      '&.connected': {
        backgroundColor: t.success,
      },
    },
    '& .StatusBar-path': {
      minWidth: 0,
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      padding: '0 8px',
    },
    '& .StatusBar-sep': {
      width: '1px',
      height: '14px',
      backgroundColor: t.strokeDivider,
    },
    '& kbd': {
      fontFamily: 'inherit',
      fontSize: '0.6875rem',
      padding: '0 4px',
      borderRadius: '3px',
      border: `1px solid ${t.strokeControl}`,
    },
  };
});

export function useStatusBarHeight() {
  return useTheme().fluent ? STATUS_BAR_HEIGHT : 0;
}

export default function StatusBar() {
  const theme = useTheme();
  const [ctx, setCtx] = useState(null);

  useEffect(()=>{
    let frame = null;
    const refresh = ()=>{
      cancelAnimationFrame(frame);
      /* Let the tree update its node data before reading it. */
      frame = requestAnimationFrame(()=>setCtx(getNodeContext(pgAdmin.Browser.tree?.selected())));
    };
    const unsubscribers = REFRESH_EVENTS.map((ev)=>pgAdmin.Browser.Events.registerListener(ev, refresh));
    refresh();
    return ()=>{
      cancelAnimationFrame(frame);
      unsubscribers.forEach((off)=>off?.());
    };
  }, []);

  if(!theme.fluent) return null;

  const server = ctx?.server;
  const database = ctx?.database;

  return (
    <Root data-test="fluent-status-bar" role='status'>
      {server ? <>
        <span className='StatusBar-item' title={server.connected ? gettext('Connected') : gettext('Not connected')}>
          <span className={'StatusBar-dot' + (server.connected ? ' connected' : '')} />
          {server.label}
        </span>
        {server.environment && <EnvironmentBadge environment={server.environment} size='small' />}
        {server.connected && server.version &&
          <span className='StatusBar-item'>{server.serverType === 'ppas' ? 'EDB Postgres' : 'PostgreSQL'} {server.version}</span>}
        {server.connected && server.user &&
          <span className='StatusBar-item'>{database ? `${server.user}@${database.label}` : server.user}</span>}
      </> :
        <span className='StatusBar-item'>{gettext('No server selected')}</span>}
      <span className='StatusBar-path' title={ctx?.path}>{ctx?.path}</span>
      <span className='StatusBar-sep' />
      <button className='StatusBar-item' onClick={()=>requestPalette(PALETTE_MODES.OBJECTS)} title={gettext('Search objects')}>
        <SearchRoundedIcon style={{fontSize: '14px'}} />
        {gettext('Search')} <kbd>Ctrl+P</kbd>
      </button>
      <button className='StatusBar-item' onClick={()=>requestPalette(PALETTE_MODES.COMMANDS)} title={gettext('Show all commands')}>
        {gettext('Commands')} <kbd>Ctrl+Shift+P</kbd>
      </button>
    </Root>
  );
}
