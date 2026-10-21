/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { analyzeSql, stripSql, summarize } from '../../../pgadmin/static/js/fluent/querytool/sqlAnalysis';
import {
  quoteIdent, sqlLiteral, tableFromQuery, buildInsert, buildUpdate, getFullRows,
} from '../../../pgadmin/static/js/fluent/querytool/sqlFromRows';
import { getGridDensityProps } from '../../../pgadmin/static/js/fluent/querytool/gridDensity';

const kinds = (sql)=>analyzeSql(sql).modifying.map((s)=>s.keyword);

describe('Fluent production guard SQL analysis', ()=>{
  it('ignores read-only statements', ()=>{
    expect(kinds('SELECT * FROM film; SHOW search_path; EXPLAIN SELECT 1; BEGIN; COMMIT;')).toEqual([]);
    expect(kinds('COPY film TO STDOUT')).toEqual([]);
  });

  it('ignores keywords inside comments, strings and dollar quotes', ()=>{
    const sql = `-- DELETE FROM film
      /* DROP TABLE x; /* nested */ UPDATE y */
      SELECT 'DELETE FROM film; DROP TABLE t', $$ TRUNCATE film $$, $fn$ UPDATE $fn$;`;
    expect(kinds(sql)).toEqual([]);
  });

  it('detects DML, DDL and permissions', ()=>{
    expect(kinds('insert into t values (1); UPDATE t SET a=1 WHERE id=2; DELETE FROM t;'))
      .toEqual(['INSERT', 'UPDATE', 'DELETE']);
    expect(kinds('CREATE TABLE a(); ALTER TABLE a ADD b int; DROP TABLE a; TRUNCATE t;'))
      .toEqual(['CREATE', 'ALTER', 'DROP', 'TRUNCATE']);
    expect(kinds('GRANT SELECT ON t TO r; CALL p(); DO $$ BEGIN END $$;'))
      .toEqual(['GRANT', 'CALL', 'DO']);
  });

  it('flags UPDATE/DELETE without WHERE', ()=>{
    const [update, del] = analyzeSql('UPDATE t SET a = 1; DELETE FROM t WHERE id = 1').modifying;
    expect(update.noWhere).toBe(true);
    expect(del.noWhere).toBe(false);
  });

  it('handles CTEs, SELECT INTO, COPY FROM and EXPLAIN ANALYZE', ()=>{
    expect(kinds('WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d')).toEqual(['WITH … DELETE']);
    expect(kinds('WITH x AS (SELECT 1) SELECT * FROM x')).toEqual([]);
    expect(kinds('SELECT * INTO backup FROM t')).toEqual(['SELECT INTO']);
    expect(kinds('COPY t FROM \'/tmp/f.csv\'')).toEqual(['COPY']);
    expect(kinds('EXPLAIN ANALYZE DELETE FROM t')).toEqual(['EXPLAIN ANALYZE DELETE']);
    expect(kinds('EXPLAIN (ANALYZE, BUFFERS) UPDATE t SET a = 1')).toEqual(['EXPLAIN ANALYZE UPDATE']);
    expect(kinds('EXPLAIN DELETE FROM t')).toEqual([]);
  });

  it('summarizes repeated statements', ()=>{
    const summary = summarize(analyzeSql('UPDATE t SET a=1 WHERE id=1; UPDATE t SET a=2 WHERE id=2; DROP TABLE x').modifying);
    expect(summary).toEqual([
      {label: 'UPDATE', count: 2, danger: false},
      {label: 'DROP', count: 1, danger: true},
    ]);
  });

  it('keeps quoted identifiers on request', ()=>{
    expect(stripSql('SELECT "a""b" FROM t', {keepIdentifiers: true})).toContain('"a""b"');
    expect(stripSql('SELECT "a""b" FROM t')).not.toContain('"');
  });
});

describe('Fluent copy as SQL', ()=>{
  const columns = [
    {key: 'id', name: 'id', cell: 'number', isPK: true},
    {key: 'title', name: 'title', cell: 'string'},
    {key: 'Order', name: 'Order', cell: 'number'},
    {key: 'active', name: 'active', cell: 'boolean'},
  ];
  const rows = [
    {id: 1, title: 'It\'s', Order: '10', active: true},
    {id: 2, title: null, Order: 'NaN', active: false},
  ];

  it('quotes identifiers and literals', ()=>{
    expect(quoteIdent('film')).toBe('film');
    expect(quoteIdent('Order')).toBe('"Order"');
    expect(quoteIdent('order')).toBe('"order"');
    expect(sqlLiteral(null, columns[1])).toBe('NULL');
    expect(sqlLiteral('It\'s', columns[1])).toBe('\'It\'\'s\'');
    expect(sqlLiteral('10', columns[2])).toBe('10');
    expect(sqlLiteral('NaN', columns[2])).toBe('\'NaN\'');
    expect(sqlLiteral(false, columns[3])).toBe('false');
    expect(sqlLiteral({a: 1}, {cell: 'Json'})).toBe('\'{"a":1}\'');
  });

  it('finds the table of single-table queries only', ()=>{
    expect(tableFromQuery('SELECT * FROM public.film ORDER BY 1')).toBe('public.film');
    expect(tableFromQuery('select a from "My Schema"."My Table" t')).toBe('"My Schema"."My Table"');
    expect(tableFromQuery('SELECT * FROM a JOIN b ON true')).toBeNull();
    expect(tableFromQuery('SELECT * FROM a, b')).toBeNull();
    expect(tableFromQuery('SELECT * FROM generate_series(1, 3)')).toBeNull();
    expect(tableFromQuery('UPDATE t SET a = 1')).toBeNull();
  });

  it('builds a multi-row INSERT', ()=>{
    expect(buildInsert('public.t', rows, columns)).toBe(
      'INSERT INTO public.t (id, title, "Order", active) VALUES\n' +
      '  (1, \'It\'\'s\', 10, true),\n' +
      '  (2, NULL, \'NaN\', false);'
    );
  });

  it('builds UPDATEs keyed on the primary key', ()=>{
    expect(buildUpdate('t', rows.slice(0, 1), columns.slice(1, 2), [columns[0]]))
      .toBe('UPDATE t SET title = \'It\'\'s\' WHERE id = 1;');
    expect(buildUpdate('t', rows, [columns[0]], [columns[0]])).toBeNull();
    expect(buildUpdate('t', rows.slice(1), columns.slice(1, 2), [])).toContain('WHERE title IS NULL;');
  });

  it('picks full rows for the copied selection', ()=>{
    const all = [{id: 1, a: 'x'}, {id: 2, a: 'y'}];
    expect(getFullRows({selectedRows: new Set([1]), selectedColumns: new Set(), rows: all, copyRows: [all[0]]})).toEqual([all[0]]);
    expect(getFullRows({selectedRows: new Set(), selectedColumns: new Set([2]), rows: all, copyRows: [{a: 'x'}, {a: 'y'}]})).toBe(all);
    expect(getFullRows({selectedRows: new Set(), selectedColumns: new Set(), selectedCell: {current: [all[1], {key: 'a'}]}, rows: all, copyRows: [{a: 'y'}]})).toEqual([all[1]]);
  });
});

describe('Fluent grid density', ()=>{
  it('only overrides the row height for comfortable', ()=>{
    expect(getGridDensityProps({results_grid_density: 'comfortable'})).toEqual({rowHeight: 32});
    expect(getGridDensityProps({results_grid_density: 'compact'})).toEqual({});
    expect(getGridDensityProps(undefined)).toEqual({});
  });
});
