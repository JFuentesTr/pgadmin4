/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Lightweight classification of the statements in a SQL script, used to ask
 * for confirmation before changing a production server. It is a safety net,
 * not a parser: when in doubt a statement counts as modifying. */

const MODIFYING = {
  INSERT: 'dml', UPDATE: 'dml', DELETE: 'dml', MERGE: 'dml', COPY: 'dml',
  TRUNCATE: 'ddl', DROP: 'ddl', ALTER: 'ddl', CREATE: 'ddl', COMMENT: 'ddl',
  REINDEX: 'ddl', CLUSTER: 'ddl', REFRESH: 'ddl', VACUUM: 'ddl', IMPORT: 'ddl',
  SECURITY: 'ddl', LOCK: 'ddl',
  GRANT: 'dcl', REVOKE: 'dcl', REASSIGN: 'dcl',
  CALL: 'proc', DO: 'proc',
};

/* Replaces comments, string literals, dollar-quoted bodies and (unless
 * keepIdentifiers) quoted identifiers with placeholders, keeping statement
 * separators intact. */
export function stripSql(sql, {keepIdentifiers=false}={}) {
  let out = '';
  let i = 0;
  const n = sql.length;
  while(i < n) {
    const c = sql[i];
    const next = sql[i + 1];
    if(c === '-' && next === '-') {
      while(i < n && sql[i] !== '\n') i++;
      out += ' ';
    } else if(c === '/' && next === '*') {
      let depth = 1;
      i += 2;
      while(i < n && depth > 0) {
        if(sql[i] === '/' && sql[i + 1] === '*') { depth++; i += 2; }
        else if(sql[i] === '*' && sql[i + 1] === '/') { depth--; i += 2; }
        else i++;
      }
      out += ' ';
    } else if(c === '\'') {
      i++;
      while(i < n) {
        if(sql[i] === '\'' && sql[i + 1] === '\'') { i += 2; continue; }
        if(sql[i] === '\\' && sql[i + 1] !== undefined) { i += 2; continue; }
        if(sql[i] === '\'') { i++; break; }
        i++;
      }
      out += ' \'\' ';
    } else if(c === '"') {
      const start = i;
      i++;
      while(i < n && !(sql[i] === '"' && sql[i + 1] !== '"')) {
        i += sql[i] === '"' ? 2 : 1;
      }
      i++;
      out += keepIdentifiers ? sql.slice(start, i) : ' ident ';
    } else if(c === '$') {
      const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if(tag) {
        const end = sql.indexOf(tag[0], i + tag[0].length);
        i = end < 0 ? n : end + tag[0].length;
        out += ' $body$ ';
      } else {
        out += c;
        i++;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function words(stmt) {
  return stmt.trim().split(/[\s(),]+/).filter(Boolean).map((w)=>w.toUpperCase());
}

function classify(stmt) {
  const w = words(stmt);
  if(!w.length) return null;
  let keyword = w[0];

  if(keyword === 'EXPLAIN') {
    /* Only EXPLAIN ANALYZE runs the statement. */
    const head = stmt.replace(/^\s*EXPLAIN\s*(\([^)]*\))?/i, '');
    const options = /^\s*EXPLAIN\s*(\([^)]*\))?/i.exec(stmt)?.[1] ?? '';
    const analyze = /\bANALY[SZ]E\b/i.test(options) || /^\s*ANALY[SZ]E\b/i.test(head);
    if(!analyze) return {keyword: 'EXPLAIN', kind: null};
    const inner = classify(head.replace(/^\s*ANALY[SZ]E\b/i, '').replace(/^\s*VERBOSE\b/i, ''));
    return inner?.kind ? {...inner, keyword: 'EXPLAIN ANALYZE ' + inner.keyword} : {keyword: 'EXPLAIN ANALYZE', kind: null};
  }

  if(keyword === 'WITH') {
    /* Data-modifying CTE: WITH x AS (DELETE ...) SELECT ... */
    const dml = w.find((x)=>['INSERT', 'UPDATE', 'DELETE', 'MERGE'].includes(x));
    return dml ? {keyword: 'WITH … ' + dml, kind: 'dml', noWhere: false} : {keyword, kind: null};
  }

  if(keyword === 'SELECT' || keyword === 'TABLE' || keyword === 'VALUES') {
    /* SELECT ... INTO new_table creates a table. */
    const into = w.indexOf('INTO');
    return into > 0 && w[into + 1] !== 'STRICT' ? {keyword: 'SELECT INTO', kind: 'ddl'} : {keyword, kind: null};
  }

  if(keyword === 'COPY') {
    /* COPY ... TO only reads. */
    return w.includes('FROM') && !w.includes('TO') ? {keyword, kind: 'dml'} : {keyword, kind: null};
  }

  if(keyword === 'SECURITY' && w[1] === 'LABEL') keyword = 'SECURITY LABEL';
  const kind = MODIFYING[w[0]] ?? null;
  return {
    keyword,
    kind,
    /* UPDATE/DELETE without WHERE touch every row. */
    noWhere: (keyword === 'UPDATE' || keyword === 'DELETE') && !w.includes('WHERE'),
    destructive: ['DROP', 'TRUNCATE'].includes(keyword),
  };
}

/* Returns {statements: [{keyword, kind, noWhere, destructive}], modifying}
 * where modifying lists only the statements that change something. */
export function analyzeSql(sql) {
  const statements = stripSql(sql ?? '').split(';').map(classify).filter(Boolean);
  return {
    statements,
    modifying: statements.filter((s)=>s.kind),
  };
}

/* "UPDATE ×2, DELETE (no WHERE)" style summary items. */
export function summarize(modifying) {
  const groups = new Map();
  for(const s of modifying) {
    const label = s.keyword + (s.noWhere ? ' (no WHERE)' : '');
    const g = groups.get(label) ?? {label, count: 0, danger: s.noWhere || s.destructive};
    g.count++;
    groups.set(label, g);
  }
  return [...groups.values()];
}
