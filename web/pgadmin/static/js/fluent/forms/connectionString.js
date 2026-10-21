/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Parses libpq connection strings, both forms:
 *   postgresql://user:password@host:5432/dbname?sslmode=require
 *   host=localhost port=5432 dbname=app user=me sslmode=require
 * Returns {host, port, db, username, password, service, params} with only
 * the keys present in the string, or null when it is not a connection
 * string. `params` holds the remaining libpq keywords (sslmode, ...). */

const KEY_MAP = {
  host: 'host',
  hostaddr: 'host',
  port: 'port',
  dbname: 'db',
  user: 'username',
  password: 'password',
  service: 'service',
};

function assign(result, key, value) {
  if(value === undefined || value === null || value === '') return;
  const mapped = KEY_MAP[key];
  if(mapped) {
    /* A host given as a URI parameter wins (e.g. a Unix socket path). */
    result[mapped] = value;
  } else {
    result.params[key] = value;
  }
}

function parseUri(text) {
  let url;
  try {
    /* Chromium parses non-special schemes, including user info and port. */
    url = new URL(text);
  } catch {
    return null;
  }
  const result = {params: {}};
  const decode = (s)=>{
    try { return decodeURIComponent(s); } catch { return s; }
  };
  if(url.hostname) result.host = decode(url.hostname.replace(/^\[(.*)\]$/, '$1'));
  if(url.port) result.port = url.port;
  if(url.username) result.username = decode(url.username);
  if(url.password) result.password = decode(url.password);
  const db = decode(url.pathname.replace(/^\/+/, ''));
  if(db) result.db = db;
  for(const [key, value] of url.searchParams) {
    assign(result, key, value);
  }
  return result;
}

function parseKeyValue(text) {
  const result = {params: {}};
  /* key = value, where value is bare or single-quoted with \' and \\ escapes */
  const re = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:'((?:[^'\\]|\\.)*)'|(\S+))/g;
  let match;
  let found = false;
  while((match = re.exec(text)) !== null) {
    found = true;
    const value = match[2] !== undefined ? match[2].replace(/\\(.)/g, '$1') : match[3];
    assign(result, match[1].toLowerCase(), value);
  }
  return found ? result : null;
}

export function parseConnectionString(text) {
  const trimmed = String(text ?? '').trim();
  if(!trimmed) return null;
  if(/^postgres(ql)?:\/\//i.test(trimmed)) {
    return parseUri(trimmed);
  }
  if(/^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trimmed)) {
    return parseKeyValue(trimmed);
  }
  return null;
}
