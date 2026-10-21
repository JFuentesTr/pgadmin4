/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { parseConnectionString } from '../../../pgadmin/static/js/fluent/forms/connectionString';
import {
  connectionStringToFormState, extendServerSchema,
} from '../../../pgadmin/static/js/fluent/forms/serverSchemaExtension';

describe('Fluent connection string parser', ()=>{
  it('parses postgresql:// URIs', ()=>{
    expect(parseConnectionString('postgresql://app%40corp:p%40ss@db.example.com:6543/sales?sslmode=require&application_name=x'))
      .toEqual({
        host: 'db.example.com', port: '6543', username: 'app@corp', password: 'p@ss', db: 'sales',
        params: {sslmode: 'require', application_name: 'x'},
      });
  });

  it('accepts postgres://, IPv6 and a host query parameter', ()=>{
    expect(parseConnectionString('postgres://[::1]/postgres')).toEqual({host: '::1', db: 'postgres', params: {}});
    expect(parseConnectionString('postgresql:///mydb?host=/var/run/postgresql'))
      .toEqual({host: '/var/run/postgresql', db: 'mydb', params: {}});
  });

  it('parses key=value strings with quoted values', ()=>{
    expect(parseConnectionString('host=localhost port=5432 dbname=app user=me password=\'it\\\'s secret\' sslmode=disable'))
      .toEqual({
        host: 'localhost', port: '5432', db: 'app', username: 'me', password: 'it\'s secret',
        params: {sslmode: 'disable'},
      });
  });

  it('ignores text that is not a connection string', ()=>{
    expect(parseConnectionString('')).toBeNull();
    expect(parseConnectionString('localhost:5432')).toBeNull();
    expect(parseConnectionString('https://example.com')).toBeNull();
  });
});

describe('Fluent server form from a connection string', ()=>{
  it('fills the connection fields and keeps known parameters only', ()=>{
    const state = {name: '', connection_params: [{name: 'sslmode', keyword: 'sslmode', value: 'prefer'}]};
    const changes = connectionStringToFormState({
      host: 'db', port: '6543', db: 'sales', username: 'u', password: 'p',
      params: {sslmode: 'require', not_a_libpq_param: '1'},
    }, state);
    expect(changes).toEqual({
      host: 'db', port: 6543, db: 'sales', username: 'u', password: 'p',
      connection_params: [{name: 'sslmode', keyword: 'sslmode', value: 'require'}],
      name: 'db/sales',
    });
  });

  it('does not overwrite a name the user already typed', ()=>{
    expect(connectionStringToFormState({host: 'db', params: {}}, {name: 'Mine'}).name).toBeUndefined();
  });
});

describe('Fluent server schema extension', ()=>{
  class FakeSchema {
    constructor() {
      this.upstream = [{id: 'name'}, {id: 'host'}, {id: 'port'}, {id: 'service'}, {id: 'connection_params'}];
    }
    get baseFields() {
      return this.upstream;
    }
  }

  it('adds the connection string and test fields once, around the upstream ones', ()=>{
    const schema = extendServerSchema(new FakeSchema());
    const ids = schema.baseFields.map((f)=>f.id);
    expect(ids).toEqual(['name', 'fluent_conn_uri', 'host', 'port', 'service', 'fluent_test_connection', 'connection_params']);
    /* Same array while the upstream fields do not change (BaseUISchema memoizes on it). */
    expect(schema.baseFields).toBe(schema.baseFields);
    expect(schema.baseFields.find((f)=>f.id === 'fluent_conn_uri').skipChange).toBe(true);
  });
});
