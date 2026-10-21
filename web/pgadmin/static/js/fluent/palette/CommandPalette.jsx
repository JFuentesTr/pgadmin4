/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Search everywhere, Windows 11 / VS Code style.
 *   Ctrl+P        objects: loaded Object Explorer nodes, then the selected
 *                 database through the Search Objects API.
 *   Ctrl+Shift+P  commands (or type ">"): every app menu item plus the
 *                 fork's own commands.
 * Mounted once in the main window; tool iframes reach it through
 * paletteEvents.js. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { styled, useTheme } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import gettext from 'sources/gettext';
import url_for from 'sources/url_for';
import pgAdmin from 'sources/pgadmin';
import getApiInstance, { parseApiError } from '../../api_instance';
import { shortcutToString } from '../../components/ShortcutTitle';
import { useWorkspace } from '../../../../misc/workspaces/static/js/WorkspaceProvider';
import { WORKSPACES } from '../../../../browser/static/js/constants';
import { buildCommands } from './commands';
import { fuzzyMatch, highlightChunks } from './fuzzy';
import { OPEN_PALETTE_EVENT, PALETTE_MODES } from './paletteEvents';
import { translateSearchObjectsPath } from './searchObjectsPath';
import { getNodeContext } from '../common/serverInfo';
import useShellInfo from '../shell/shellInfoStore';

const MAX_LOCAL_NODES = 5000;
const MAX_RESULTS = 60;
const REMOTE_MIN_CHARS = 3;
const REMOTE_DEBOUNCE_MS = 250;

const Root = styled('div')(({theme}) => {
  const t = theme.fluent.tokens;
  return {
    position: 'fixed',
    inset: 0,
    zIndex: theme.zIndex.modal + 100,
    '& .Palette-panel': {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(640px, calc(100vw - 32px))',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'min(560px, calc(100vh - 96px))',
      backgroundColor: t.flyoutBg,
      color: t.text,
      border: `1px solid ${t.strokeSurface}`,
      borderRadius: '8px',
      boxShadow: t.shadowDialog,
      overflow: 'hidden',
    },
    '& .Palette-inputRow': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      borderBottom: `1px solid ${t.strokeDivider}`,
      color: t.textSecondary,
    },
    '& .Palette-input': {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: t.text,
      font: 'inherit',
      fontSize: '0.9375rem',
    },
    '& .Palette-mode': {
      fontSize: '0.75rem',
      padding: '2px 8px',
      borderRadius: '10px',
      backgroundColor: t.subtleSelectedBg,
      color: t.textSecondary,
      whiteSpace: 'nowrap',
    },
    '& .Palette-list': {
      overflowY: 'auto',
      padding: '4px',
    },
    '& .Palette-section': {
      padding: '8px 12px 4px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: t.textSecondary,
    },
    '& .Palette-hint': {
      padding: '6px 12px 10px',
      fontSize: '0.8125rem',
      color: t.textSecondary,
    },
    '& .Palette-item': {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minHeight: '34px',
      padding: '4px 10px',
      borderRadius: '4px',
      cursor: 'default',
      '&.active': {
        backgroundColor: t.subtleSelectedBg,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '3px',
          height: '16px',
          marginTop: '-8px',
          borderRadius: '2px',
          backgroundColor: theme.fluent.accent.main,
        },
      },
      '&.disabled': {
        color: t.textDisabled,
      },
    },
    '& .Palette-icon': {
      width: '20px',
      height: '20px',
      flexShrink: 0,
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: t.textSecondary,
    },
    '& .Palette-text': {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      flex: 1,
    },
    '& .Palette-label': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      '& mark': {
        background: 'none',
        color: 'inherit',
        fontWeight: 700,
      },
    },
    '& .Palette-detail': {
      fontSize: '0.75rem',
      color: t.textSecondary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .Palette-keys': {
      display: 'flex',
      gap: '3px',
      flexShrink: 0,
      '& kbd': {
        fontFamily: 'inherit',
        fontSize: '0.6875rem',
        padding: '1px 5px',
        borderRadius: '4px',
        border: `1px solid ${t.strokeControl}`,
        borderBottomColor: t.strokeControlStrong,
        color: t.textSecondary,
        backgroundColor: t.controlBg,
      },
    },
    '& .Palette-footer': {
      display: 'flex',
      gap: '16px',
      padding: '6px 12px',
      fontSize: '0.75rem',
      color: t.textSecondary,
      borderTop: `1px solid ${t.strokeDivider}`,
      backgroundColor: t.layerBg,
    },
  };
});

function Highlight({text, indices}) {
  if(!indices?.length) return text;
  return highlightChunks(text, indices).map((c, i)=>(
    c.match ? <mark key={i}>{c.text}</mark> : <span key={i}>{c.text}</span>
  ));
}

function Keys({shortcut}) {
  if(!shortcut?.key) return null;
  const keys = shortcutToString(shortcut, null, true);
  if(!Array.isArray(keys) || !keys.length) return null;
  return <span className='Palette-keys'>{keys.map((k)=><kbd key={k}>{k}</kbd>)}</span>;
}

/* fuzzyMatch scores contiguous matches at 100 and above. When some exist,
 * scattered subsequence matches are mostly noise, so drop them. */
function dropWeakMatches(list, getScore) {
  const hasStrong = list.some((x)=>getScore(x) >= 100);
  return hasStrong ? list.filter((x)=>getScore(x) >= 100) : list;
}

function iconClass(icon) {
  return typeof icon === 'string' ? icon.split(' ')[0] : null;
}

/* Every node already loaded in the Object Explorer, collections excluded. */
function snapshotTreeNodes() {
  const tree = pgAdmin.Browser.tree;
  const root = tree?.tree?.getModel?.()?.root;
  if(!root) return [];
  const out = [];
  const queue = [...(root.children ?? [])];
  while(queue.length && out.length < MAX_LOCAL_NODES) {
    const item = queue.shift();
    const data = item?._metadata?.data;
    if(data && !String(data._type).startsWith('coll-')) {
      out.push({
        key: 'tree:' + item.path,
        item,
        label: String(data._label ?? data.label ?? ''),
        type: pgAdmin.Browser.Nodes[data._type]?.label ?? data._type,
        icon: iconClass(data.icon),
        parentPath: item.parent?.parent ? tree.getNodeDisplayPath(item.parent, ' › ', true) : '',
      });
    }
    if(item?.children?.length) queue.push(...item.children);
  }
  return out;
}

async function revealInTree(idPath) {
  const tree = pgAdmin.Browser.tree;
  tree.suppressEventsForPath = '/browser/' + idPath.join('/');
  const node = await tree.findNodeWithToggle(idPath);
  setTimeout(()=>tree.select(node, true, 'center'), 100);
}

export default function CommandPalette() {
  const theme = useTheme();
  const workspace = useWorkspace();
  const {customTitleBar, titleBarHeight} = useShellInfo();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [snapshot, setSnapshot] = useState({commands: [], nodes: [], context: null});
  const [remote, setRemote] = useState({status: 'idle', items: [], error: null});
  const [anchor, setAnchor] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const enabled = Boolean(theme.fluent);

  const mode = query.startsWith('>') ? PALETTE_MODES.COMMANDS : PALETTE_MODES.OBJECTS;
  const term = mode === PALETTE_MODES.COMMANDS ? query.slice(1).trim() : query.trim();

  const openPalette = useCallback((requestedMode)=>{
    restoreFocusRef.current = document.activeElement;
    setSnapshot({
      commands: buildCommands({workspace}),
      nodes: snapshotTreeNodes(),
      context: getNodeContext(pgAdmin.Browser.tree?.selected()),
    });
    setQuery(requestedMode === PALETTE_MODES.COMMANDS ? '>' : '');
    setActive(0);
    setRemote({status: 'idle', items: [], error: null});
    /* Drop down from the title bar search box when there is one. */
    const box = document.querySelector('.TitleBar-search')?.getBoundingClientRect();
    setAnchor(box?.width ? {center: box.left + box.width / 2, top: box.top - 4} : null);
    setOpen(true);
  }, [workspace]);

  const close = useCallback((restoreFocus=true)=>{
    setOpen(false);
    if(restoreFocus) {
      restoreFocusRef.current?.focus?.();
    }
  }, []);

  useEffect(()=>{
    if(!enabled) return;
    const onOpen = (e)=>openPalette(e.detail?.mode);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return ()=>window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
  }, [enabled, openPalette]);

  useEffect(()=>{
    open && inputRef.current?.focus();
  }, [open]);

  /* Database scope for the Search Objects API. */
  const dbScope = useMemo(()=>{
    const ctx = snapshot.context;
    if(!ctx?.database?.connected || !ctx.server) return null;
    return ctx;
  }, [snapshot.context]);

  useEffect(()=>{
    if(!open || mode !== PALETTE_MODES.OBJECTS || !dbScope || term.length < REMOTE_MIN_CHARS) {
      setRemote({status: 'idle', items: [], error: null});
      return;
    }
    let cancelled = false;
    setRemote((r)=>({...r, status: 'loading'}));
    const timer = setTimeout(()=>{
      getApiInstance().get(url_for('search_objects.search', {
        sid: dbScope.server.id, did: dbScope.database.id,
      }), {params: {text: term, type: 'all'}})
        .then((res)=>{
          if(cancelled) return;
          const items = (res?.data?.data ?? []).slice(0, MAX_RESULTS).map((d)=>{
            const [path, idPath] = translateSearchObjectsPath(dbScope.hierarchy, d.path, d.catalog_level);
            /* "Schemas/public/Tables/actor/Columns/actor_id" -> "public › actor":
             * drop the collection labels and the object's own name. */
            const parts = (path ?? '').split('/').filter(Boolean);
            parts.pop();
            const readable = parts.filter((_p, i)=>i % 2 === 1).join(' › ');
            return {...d, path: readable, idPath};
          });
          setRemote({status: 'done', items, error: null});
        })
        .catch((err)=>{
          !cancelled && setRemote({status: 'error', items: [], error: parseApiError(err)});
        });
    }, REMOTE_DEBOUNCE_MS);
    return ()=>{
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, mode, term, dbScope]);

  const goToDefaultWorkspace = ()=>{
    if(workspace?.enabled && workspace.currentWorkspace !== WORKSPACES.DEFAULT) {
      workspace.changeWorkspace(WORKSPACES.DEFAULT);
    }
    pgAdmin.Browser.Events.trigger('pgadmin:object-explorer:show');
  };

  /* Flat list of rows: {kind: 'section'|'hint'|'item', ...}. */
  const rows = useMemo(()=>{
    const out = [];
    if(!open) return out;

    if(mode === PALETTE_MODES.COMMANDS) {
      /* Match on the label first; fall back to "category label" so that
       * e.g. "tools query" finds Tools › Query Tool. Only label matches are
       * highlighted. */
      let cmds = snapshot.commands.map((c)=>{
        if(!term) return {c, score: 0, indices: []};
        const onLabel = fuzzyMatch(term, c.label);
        if(onLabel) return {c, score: onLabel.score + 50, indices: onLabel.indices};
        const onPath = fuzzyMatch(term, `${c.category} ${c.label}`);
        return onPath ? {c, score: onPath.score, indices: []} : null;
      }).filter(Boolean);
      cmds = dropWeakMatches(cmds, (x)=>x.score);
      if(term) {
        cmds.sort((a, b)=>(Number(a.c.disabled) - Number(b.c.disabled)) || (b.score - a.score));
      }
      cmds = cmds.slice(0, MAX_RESULTS * 2);
      if(!cmds.length) {
        out.push({kind: 'hint', key: 'nocmd', text: gettext('No matching commands.')});
      }
      for(const {c, indices} of cmds) {
        out.push({
          kind: 'item', key: c.id, label: c.label, indices,
          detail: c.category, shortcut: c.shortcut, disabled: c.disabled,
          icon: <ChevronRightRoundedIcon fontSize='small' />,
          run: c.run,
        });
      }
      return out;
    }

    /* Objects mode */
    let nodes = snapshot.nodes;
    let matched;
    if(term) {
      matched = dropWeakMatches(nodes.map((n)=>({n, m: fuzzyMatch(term, n.label)})).filter((x)=>x.m), (x)=>x.m.score)
        .sort((a, b)=>b.m.score - a.m.score).slice(0, 30);
    } else {
      matched = nodes.filter((n)=>['server', 'database'].includes(n.item._metadata.data._type))
        .slice(0, 20).map((n)=>({n, m: {indices: []}}));
    }
    out.push({kind: 'section', key: 'sec-tree', text: term ? gettext('Object Explorer') : gettext('Servers and databases')});
    if(!matched.length) {
      out.push({kind: 'hint', key: 'notree', text: term ? gettext('No loaded object matches.') : gettext('No servers registered yet.')});
    }
    for(const {n, m} of matched) {
      out.push({
        kind: 'item', key: n.key, label: n.label, indices: m.indices,
        detail: [n.type, n.parentPath].filter(Boolean).join(' · '),
        iconClass: n.icon,
        run: ()=>{
          goToDefaultWorkspace();
          revealInTree(n.item.path.replace(/^\/browser\//, '').split('/'))
            .catch(()=>pgAdmin.Browser.notifier.error(gettext('Unable to locate this object in the Object Explorer.')));
        },
      });
    }

    if(term) {
      if(!dbScope) {
        out.push({kind: 'section', key: 'sec-db', text: gettext('Database')});
        out.push({kind: 'hint', key: 'nodb', text: gettext('Select a connected database in the Object Explorer to search all of its objects.')});
      } else {
        out.push({kind: 'section', key: 'sec-db', text: gettext('In database %s', dbScope.database.label)});
        if(term.length < REMOTE_MIN_CHARS) {
          out.push({kind: 'hint', key: 'short', text: gettext('Type at least %s characters to search the database.', REMOTE_MIN_CHARS)});
        } else if(remote.status === 'loading') {
          out.push({kind: 'hint', key: 'loading', text: gettext('Searching...')});
        } else if(remote.status === 'error') {
          out.push({kind: 'hint', key: 'err', text: remote.error});
        } else if(remote.status === 'done' && !remote.items.length) {
          out.push({kind: 'hint', key: 'noremote', text: gettext('No objects found.')});
        }
        for(const d of remote.items) {
          out.push({
            kind: 'item', key: 'db:' + (d.idPath?.join('/') ?? d.name + d.path), label: d.name,
            indices: fuzzyMatch(term, d.name)?.indices ?? [],
            detail: [d.type_label, d.path].filter(Boolean).join(' · ') + (d.show_node ? '' : ' · ' + gettext('hidden by preferences')),
            iconClass: 'icon-' + d.type,
            disabled: !d.show_node,
            run: ()=>{
              goToDefaultWorkspace();
              revealInTree(d.idPath)
                .catch(()=>pgAdmin.Browser.notifier.error(gettext('Unable to locate this object in the Object Explorer.')));
            },
          });
        }
      }
    }
    return out;
  }, [open, mode, term, snapshot, remote, dbScope]);

  const items = rows.filter((r)=>r.kind === 'item');
  const activeItem = items[Math.min(active, items.length - 1)];

  useEffect(()=>{
    setActive(0);
  }, [term, mode]);

  useEffect(()=>{
    listRef.current?.querySelector('.Palette-item.active')?.scrollIntoView({block: 'nearest'});
  }, [active, rows]);

  const runItem = (item)=>{
    if(!item || item.disabled) return;
    close(false);
    setTimeout(()=>item.run(), 0);
  };

  const onKeyDown = (e)=>{
    if(e.key === 'ArrowDown') {
      setActive((a)=>Math.min(a + 1, items.length - 1));
    } else if(e.key === 'ArrowUp') {
      setActive((a)=>Math.max(a - 1, 0));
    } else if(e.key === 'PageDown') {
      setActive((a)=>Math.min(a + 8, items.length - 1));
    } else if(e.key === 'PageUp') {
      setActive((a)=>Math.max(a - 8, 0));
    } else if(e.key === 'Enter') {
      runItem(activeItem);
    } else if(e.key === 'Escape') {
      close();
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  if(!enabled || !open) return null;

  /* Keep the panel inside the window when the search box is near an edge. */
  const panelStyle = anchor ? {
    top: anchor.top,
    left: `clamp(calc(min(640px, 100vw - 32px) / 2 + 16px), ${anchor.center}px, calc(100vw - min(640px, 100vw - 32px) / 2 - 16px))`,
  } : {
    top: (customTitleBar ? titleBarHeight : 30) + 8,
  };
  let itemIndex = -1;

  return createPortal(
    <Root onMouseDown={(e)=>{ if(e.target === e.currentTarget) close(); }} data-test="fluent-command-palette">
      <div className='Palette-panel' style={panelStyle} role='dialog' aria-label={gettext('Search')} onKeyDown={onKeyDown}>
        <div className='Palette-inputRow'>
          <SearchRoundedIcon fontSize='small' />
          <input
            ref={inputRef}
            className='Palette-input'
            value={query}
            placeholder={gettext('Search objects, or type > for commands')}
            onChange={(e)=>setQuery(e.target.value)}
            spellCheck={false}
            aria-controls='fluent-palette-list'
            aria-activedescendant={activeItem ? 'fluent-palette-' + activeItem.key : undefined}
          />
          <span className='Palette-mode'>{mode === PALETTE_MODES.COMMANDS ? gettext('Commands') : gettext('Objects')}</span>
        </div>
        <div className='Palette-list' ref={listRef} id='fluent-palette-list' role='listbox'>
          {rows.map((row)=>{
            if(row.kind === 'section') {
              return <div key={row.key} className='Palette-section'>{row.text}</div>;
            }
            if(row.kind === 'hint') {
              return <div key={row.key} className='Palette-hint'>{row.text}</div>;
            }
            itemIndex++;
            const idx = itemIndex;
            const isActive = row === activeItem;
            return (
              <div
                key={row.key}
                id={'fluent-palette-' + row.key}
                role='option'
                aria-selected={isActive}
                aria-disabled={row.disabled || undefined}
                className={['Palette-item', isActive ? 'active' : '', row.disabled ? 'disabled' : ''].join(' ')}
                onMouseMove={()=>!isActive && setActive(idx)}
                onClick={()=>runItem(row)}
              >
                {row.iconClass ?
                  <span className={'Palette-icon ' + row.iconClass} /> :
                  <span className='Palette-icon'>{row.icon}</span>}
                <span className='Palette-text'>
                  <span className='Palette-label'><Highlight text={row.label} indices={row.indices} /></span>
                  {row.detail && <span className='Palette-detail'>{row.detail}</span>}
                </span>
                <Keys shortcut={row.shortcut} />
              </div>
            );
          })}
        </div>
        <div className='Palette-footer'>
          <span>{gettext('↑↓ Navigate')}</span>
          <span>{gettext('Enter Open')}</span>
          <span>{gettext('Esc Close')}</span>
          <span>{mode === PALETTE_MODES.COMMANDS ? gettext('Delete > to search objects') : gettext('> Commands')}</span>
        </div>
      </div>
    </Root>,
    document.body
  );
}
