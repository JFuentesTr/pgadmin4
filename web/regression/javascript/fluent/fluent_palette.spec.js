/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { fuzzyMatch, highlightChunks } from '../../../pgadmin/static/js/fluent/palette/fuzzy';
import { getEnvironment, formatServerVersion } from '../../../pgadmin/static/js/fluent/common/serverInfo';

describe('Fluent palette fuzzy matching', ()=>{
  it('matches contiguous text and scores word starts higher', ()=>{
    const start = fuzzyMatch('query', 'Query Tool');
    const middle = fuzzyMatch('query', 'Export Data Using Query...');
    expect(start.indices).toEqual([0, 1, 2, 3, 4]);
    expect(start.score).toBeGreaterThan(middle.score);
  });

  it('requires every term, in any order', ()=>{
    expect(fuzzyMatch('tool query', 'Query Tool')).not.toBeNull();
    expect(fuzzyMatch('query view', 'Query Tool')).toBeNull();
  });

  it('falls back to subsequence matching below the contiguous score', ()=>{
    const res = fuzzyMatch('fac', 'film_actor');
    expect(res).not.toBeNull();
    expect(res.score).toBeLessThan(100);
  });

  it('splits text into highlight chunks', ()=>{
    expect(highlightChunks('actor', [0, 1])).toEqual([
      {text: 'ac', match: true},
      {text: 'tor', match: false},
    ]);
  });
});

describe('Fluent server info helpers', ()=>{
  it('detects the environment from server tags', ()=>{
    expect(getEnvironment([{text: 'Production'}])?.key).toBe('prod');
    expect(getEnvironment([{text: 'billing'}, {text: 'qa'}])?.key).toBe('staging');
    expect(getEnvironment([{text: 'local'}])?.key).toBe('dev');
    expect(getEnvironment([{text: 'reporting'}])).toBeNull();
    expect(getEnvironment(undefined)).toBeNull();
  });

  it('formats server_version_num', ()=>{
    expect(formatServerVersion(180006)).toBe('18.6');
    expect(formatServerVersion(160002)).toBe('16.2');
    expect(formatServerVersion(90624)).toBe('9.6.24');
    expect(formatServerVersion(null)).toBeNull();
  });
});
