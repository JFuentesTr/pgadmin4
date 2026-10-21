/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* "Copy as INSERT / UPDATE statements" for the Query Tool result grid. */

import JSONBigNumber from 'json-bignumber';
import gettext from 'sources/gettext';
import url_for from 'sources/url_for';
import pgAdmin from 'sources/pgadmin';
import * as clipboard from '../../clipboard';
import { stripSql } from './sqlAnalysis';

const SIMPLE_IDENT = /^[a-z_][a-z0-9_$]*$/;
const RESERVED = new Set([
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric', 'both', 'case', 'cast',
  'check', 'collate', 'column', 'constraint', 'create', 'current_catalog', 'current_date', 'current_role',
  'current_time', 'current_timestamp', 'current_user', 'default', 'deferrable', 'desc', 'distinct', 'do',
  'else', 'end', 'except', 'false', 'fetch', 'for', 'foreign', 'from', 'grant', 'group', 'having', 'in',
  'initially', 'intersect', 'into', 'lateral', 'leading', 'limit', 'localtime', 'localtimestamp', 'not',
  'null', 'offset', 'on', 'only', 'or', 'order', 'placing', 'primary', 'references', 'returning', 'select',
  'session_user', 'some', 'symmetric', 'table', 'then', 'to', 'trailing', 'true', 'union', 'unique', 'user',
  'using', 'variadic', 'when', 'where', 'window', 'with',
]);
const NUMBER = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/;

export function quoteIdent(name) {
  const s = String(name);
  return SIMPLE_IDENT.test(s) && !RESERVED.has(s) ? s : '"' + s.replace(/"/g, '""') + '"';
}

export function sqlLiteral(value, column) {
  if(value === null || value === undefined) return 'NULL';
  if(column?.cell === 'boolean' && typeof value === 'boolean') return value ? 'true' : 'false';
  if(column?.cell === 'number' && NUMBER.test(String(value))) return String(value);
  const text = typeof value === 'object' ? JSONBigNumber.stringify(value) : String(value);
  return '\'' + text.replace(/'/g, '\'\'') + '\'';
}

/* Table of a single-table SELECT: "... FROM public.film ..." -> public.film.
 * Joins, sub-selects and multiple tables give up (null). */
export function tableFromQuery(query) {
  const clean = stripSql(query ?? '', {keepIdentifiers: true}).split(';').find((s)=>s.trim()) ?? '';
  if(!/^\s*(SELECT|TABLE)\b/i.test(clean)) return null;
  if(/\bJOIN\b|\bFROM\s*\(/i.test(clean)) return null;
  /* A trailing "," means several tables, "(" a set-returning function. */
  const m = /\bFROM\s+((?:"(?:[^"]|"")+"|[A-Za-z_][\w$]*)(?:\s*\.\s*(?:"(?:[^"]|"")+"|[A-Za-z_][\w$]*))?)\s*([,(])?/i.exec(clean);
  if(!m || m[2]) return null;
  return m[1].replace(/\s*\.\s*/g, '.');
}

function rowValues(row, columns) {
  return columns.map((c)=>sqlLiteral(row[c.key], c));
}

export function buildInsert(table, rows, columns) {
  const cols = columns.map((c)=>quoteIdent(c.name)).join(', ');
  const values = rows.map((r)=>`  (${rowValues(r, columns).join(', ')})`).join(',\n');
  return `INSERT INTO ${table} (${cols}) VALUES\n${values};`;
}

/* One UPDATE per row: SET the copied columns, WHERE the primary key. Without
 * a primary key the WHERE matches every copied column, which is flagged. */
export function buildUpdate(table, rows, columns, pkColumns) {
  const keyCols = pkColumns.length ? pkColumns : columns;
  const setCols = columns.filter((c)=>!pkColumns.some((pk)=>pk.key === c.key));
  if(!setCols.length) return null;
  const lines = rows.map((r)=>{
    const sets = setCols.map((c)=>`${quoteIdent(c.name)} = ${sqlLiteral(r[c.key], c)}`).join(', ');
    const where = keyCols.map((c)=>{
      const v = r[c.key];
      return v === null || v === undefined ? `${quoteIdent(c.name)} IS NULL` : `${quoteIdent(c.name)} = ${sqlLiteral(v, c)}`;
    }).join(' AND ');
    return `UPDATE ${table} SET ${sets} WHERE ${where};`;
  });
  const header = pkColumns.length ? '' : `-- ${gettext('No primary key in the result: rows are matched on every copied column.')}\n`;
  return header + lines.join('\n');
}

/* Full row objects for the copied selection, mirroring the branches of
 * ResultSet.jsx copyDataFunc: column and single-cell copies only carry the
 * selected values, but UPDATE needs the primary key of each row. */
export function getFullRows({selectedRows, selectedColumns, selectedCell, rows, copyRows}) {
  if(selectedRows?.size > 0) return copyRows;
  if(selectedColumns?.size > 0) return rows;
  const cellRow = selectedCell?.current?.[0];
  if(copyRows.length === 1 && cellRow && Object.keys(copyRows[0]).length === 1) {
    return [cellRow];
  }
  return copyRows;
}

async function resolveTable(query, transId, api) {
  const parsed = tableFromQuery(query);
  if(parsed) return parsed;
  /* Updatable results know their table (name only, no schema). */
  try {
    const res = await api.get(url_for('sqleditor.get_object_name', {trans_id: transId}));
    const name = res.data?.data?.status ? res.data.data.result : null;
    if(name) return quoteIdent(name);
  } catch {
    /* fall through to the placeholder */
  }
  return 'table_name';
}

/* Entry point used from ResultSet.jsx copyDataFunc.
 * rows are full row objects, columns the copied (selected) columns and
 * allColumns every result column (to find the primary key). */
export async function copyRowsAsSql({format, rows, columns, allColumns, query, transId, api}) {
  const table = await resolveTable(query, transId, api);
  const pkColumns = (allColumns ?? []).filter((c)=>c.isPK);
  let sql;
  if(format === 'update') {
    sql = buildUpdate(table, rows, columns, pkColumns);
    if(!sql) {
      pgAdmin.Browser.notifier.warning(gettext('Select at least one column that is not part of the primary key.'));
      return;
    }
  } else {
    sql = buildInsert(table, rows, columns);
  }
  clipboard.copyToClipboard(sql);
  pgAdmin.Browser.notifier.success(
    format === 'update' ?
      gettext('Copied %s UPDATE statements.', rows.length) :
      gettext('Copied %s rows as an INSERT statement.', rows.length)
  );
}
