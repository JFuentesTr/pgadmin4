/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Home page shown in the Dashboard tab when no connected server is selected.
 * Replaces the upstream WelcomeDashboard when the Fluent style is on. */

import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import gettext from 'sources/gettext';
import pgAdmin from 'sources/pgadmin';
import { getEnvironment, formatServerVersion } from '../common/serverInfo';
import { getServerColors } from '../../utils';
import { requestPalette, PALETTE_MODES } from '../palette/paletteEvents';
import EnvironmentBadge from '../shell/EnvironmentBadge';

const TREE_EVENTS = [
  'pgadmin-browser:tree:added',
  'pgadmin-browser:tree:removed',
  'pgadmin-browser:tree:updated',
  'pgadmin-browser:tree:destroyed',
  'pgadmin-browser:tree:refreshed',
  'pgadmin:server:connected',
  'pgadmin:server:disconnect',
];

const Root = styled('div')(({theme}) => {
  const t = theme.fluent.tokens;
  const accent = theme.fluent.accent;
  return {
    height: '100%',
    overflow: 'auto',
    backgroundColor: t.surfaceBg,
    color: t.text,
    '& .Home-content': {
      maxWidth: '1080px',
      margin: '0 auto',
      padding: '36px 32px 48px',
    },
    '& .Home-title': {
      fontFamily: '"Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif',
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: 600,
      margin: 0,
    },
    '& .Home-subtitle': {
      color: t.textSecondary,
      fontSize: '0.875rem',
      margin: '4px 0 28px',
    },
    '& .Home-sectionTitle': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '1rem',
      fontWeight: 600,
      margin: '28px 0 12px',
      '& .Home-count': {
        color: t.textSecondary,
        fontWeight: 400,
      },
    },
    '& .Home-grid': {
      display: 'grid',
      gap: '8px',
      gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    },
    '& .Home-card': {
      position: 'relative',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      textAlign: 'left',
      padding: '14px 16px',
      border: `1px solid ${t.strokeCard}`,
      borderRadius: '8px',
      backgroundColor: t.layerAltBg,
      color: t.text,
      font: 'inherit',
      cursor: 'pointer',
      overflow: 'hidden',
      transition: 'background-color 83ms linear, border-color 83ms linear',
      '&:hover': {
        backgroundColor: t.controlHoverBg,
        borderColor: t.strokeControl,
      },
      '&:focus-visible': {
        outline: `2px solid ${t.text}`,
        outlineOffset: '1px',
      },
    },
    '& .Home-actionIcon': {
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: accent.main,
      backgroundColor: accent.light,
    },
    '& .Home-cardTitle': {
      fontWeight: 600,
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: 0,
      '& span.name': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
    '& .Home-cardText': {
      color: t.textSecondary,
      fontSize: '0.8125rem',
      marginTop: '2px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .Home-cardBody': {
      minWidth: 0,
      flex: 1,
    },
    '& .Home-strip': {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '4px',
    },
    '& .Home-status': {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '8px',
      fontSize: '0.75rem',
      color: t.textSecondary,
      '& .dot': {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: t.textDisabled,
        '&.connected': {
          backgroundColor: t.success,
        },
      },
    },
    '& .Home-tags': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '8px',
    },
    '& .Home-tag': {
      fontSize: '0.6875rem',
      padding: '1px 6px',
      borderRadius: '4px',
      border: `1px solid ${t.strokeControl}`,
      color: t.textSecondary,
    },
    '& .Home-empty': {
      padding: '24px',
      border: `1px dashed ${t.strokeControl}`,
      borderRadius: '8px',
      color: t.textSecondary,
      textAlign: 'center',
    },
    '& .Home-links': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      '& a': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: theme.otherVars.hyperlinkColor,
        textDecoration: 'none',
        fontSize: '0.8125rem',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    },
    '& kbd': {
      fontFamily: 'inherit',
      fontSize: '0.6875rem',
      padding: '0 4px',
      borderRadius: '3px',
      border: `1px solid ${t.strokeControl}`,
      color: t.textSecondary,
    },
  };
});

function getServerGroups() {
  const tree = pgAdmin.Browser.tree;
  return (tree?.children() ?? []).filter((i)=>tree.itemData(i)?._type === 'server_group');
}

/* Same as the upstream welcome page: open the create dialog on the first
 * server group. */
function addNewServer() {
  const group = getServerGroups()[0];
  const serverModule = pgAdmin.Browser.Nodes.server;
  if(group && serverModule) {
    serverModule.callbacks.show_obj_properties.apply(serverModule, [{action: 'create'}, group]);
  }
}

async function loadServers() {
  const tree = pgAdmin.Browser.tree;
  const servers = [];
  for(const group of getServerGroups()) {
    try {
      await tree.ensureLoaded(group);
    } catch {
      continue;
    }
    for(const item of tree.children(group) ?? []) {
      const data = tree.itemData(item);
      if(data?._type !== 'server') continue;
      servers.push({
        item,
        id: data._id,
        group: tree.itemData(group)?.label,
        label: data.label ?? data._label,
        host: data.host,
        port: data.port,
        user: data.username,
        connected: Boolean(data.connected),
        version: formatServerVersion(data.version),
        tags: data.tags ?? [],
        environment: getEnvironment(data.tags),
        colors: getServerColors(data.icon),
      });
    }
  }
  return servers;
}

function openServer(server) {
  const tree = pgAdmin.Browser.tree;
  tree.select(server.item, true, 'center');
  /* Expanding a disconnected server asks pgAdmin to connect to it. */
  tree.open(server.item);
}

function ServerCard({server}) {
  const subtitle = [server.host && `${server.host}${server.port ? ':' + server.port : ''}`, server.user].filter(Boolean).join(' · ');
  return (
    <button className='Home-card' onClick={()=>openServer(server)} title={gettext('Open %s', server.label)}>
      {server.colors.bgcolor && <span className='Home-strip' style={{backgroundColor: server.colors.bgcolor}} />}
      <span className='Home-cardBody'>
        <span className='Home-cardTitle'>
          <span className='name'>{server.label}</span>
          <EnvironmentBadge environment={server.environment} size='small' />
        </span>
        {subtitle && <div className='Home-cardText'>{subtitle}</div>}
        <div className='Home-status'>
          <span className={'dot' + (server.connected ? ' connected' : '')} />
          {server.connected ?
            [gettext('Connected'), server.version && `PostgreSQL ${server.version}`].filter(Boolean).join(' · ') :
            gettext('Not connected')}
        </div>
        {server.tags.length > 0 &&
          <div className='Home-tags'>
            {server.tags.map((tag)=><span key={tag.text} className='Home-tag'>{tag.text}</span>)}
          </div>}
      </span>
    </button>
  );
}

function ActionCard({icon, title, text, keys, onClick}) {
  return (
    <button className='Home-card' onClick={onClick}>
      <span className='Home-actionIcon'>{icon}</span>
      <span className='Home-cardBody'>
        <span className='Home-cardTitle'>{title}</span>
        <div className='Home-cardText'>{text} {keys && <kbd>{keys}</kbd>}</div>
      </span>
    </button>
  );
}

export default function FluentHome() {
  const [servers, setServers] = useState(null);

  useEffect(()=>{
    let alive = true;
    let timer = null;
    let retries = 0;
    const refresh = ()=>{
      clearTimeout(timer);
      timer = setTimeout(async ()=>{
        const list = await loadServers();
        if(!alive) return;
        /* The tree may still be loading right after start-up. */
        if(!list.length && !getServerGroups().length && retries++ < 20) {
          refresh();
          return;
        }
        setServers(list);
      }, 150);
    };
    const offs = TREE_EVENTS.map((ev)=>pgAdmin.Browser.Events.registerListener(ev, refresh));
    refresh();
    return ()=>{
      alive = false;
      clearTimeout(timer);
      offs.forEach((off)=>off?.());
    };
  }, []);

  return (
    <Root data-test="fluent-home">
      <div className='Home-content'>
        <h1 className='Home-title'>{gettext('Welcome to pgAdmin')}</h1>
        <p className='Home-subtitle'>{gettext('Manage, query and monitor your PostgreSQL servers.')}</p>

        <div className='Home-grid'>
          <ActionCard icon={<AddRoundedIcon />} title={gettext('Add a server')}
            text={gettext('Register a new connection')} onClick={addNewServer} />
          <ActionCard icon={<SearchRoundedIcon />} title={gettext('Search objects')}
            text={gettext('Find tables, views, functions')} keys='Ctrl+P'
            onClick={()=>requestPalette(PALETTE_MODES.OBJECTS)} />
          <ActionCard icon={<KeyboardRoundedIcon />} title={gettext('All commands')}
            text={gettext('Run any menu action')} keys='Ctrl+Shift+P'
            onClick={()=>requestPalette(PALETTE_MODES.COMMANDS)} />
          <ActionCard icon={<SettingsRoundedIcon />} title={gettext('Preferences')}
            text={gettext('Theme, editor, shortcuts')} onClick={()=>pgAdmin.Preferences?.show()} />
        </div>

        <div className='Home-sectionTitle'>
          {gettext('Servers')}
          {servers?.length > 0 && <span className='Home-count'>{servers.length}</span>}
        </div>
        {servers?.length === 0 &&
          <div className='Home-empty'>{gettext('No servers yet. Use "Add a server" to register your first connection.')}</div>}
        {servers?.length > 0 &&
          <div className='Home-grid'>
            {servers.map((s)=><ServerCard key={s.id} server={s} />)}
          </div>}

        <div className='Home-sectionTitle'>{gettext('Learn')}</div>
        <div className='Home-links'>
          <a href='https://www.postgresql.org/docs' target='postgres_help'>{gettext('PostgreSQL documentation')} <OpenInNewRoundedIcon style={{fontSize: '14px'}} /></a>
          <a href='https://www.pgadmin.org/docs/' target='pgadmin_docs'>{gettext('pgAdmin documentation')} <OpenInNewRoundedIcon style={{fontSize: '14px'}} /></a>
          <a href='https://www.postgresql.org/community' target='postgres_website'>{gettext('PostgreSQL community')} <OpenInNewRoundedIcon style={{fontSize: '14px'}} /></a>
        </div>
      </div>
    </Root>
  );
}
