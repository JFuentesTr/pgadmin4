/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Adds two fields to the Register/Properties server dialog, without editing
 * server.ui.js: a "Connection string" box that fills the form from a pasted
 * postgresql:// URI or key=value string, and a "Test connection" button
 * (misc/fluent/__init__.py). Installed by wrapping the server node's
 * getSchema the first time a properties dialog opens. */

import gettext from 'sources/gettext';
import url_for from 'sources/url_for';
import pgAdmin from 'sources/pgadmin';
import getApiInstance, { parseApiError } from '../../api_instance';
import { getConnectionParameters } from '../../../../browser/server_groups/servers/static/js/server.ui';
import { parseConnectionString } from './connectionString';

const URI_FIELD = 'fluent_conn_uri';
const TEST_FIELD = 'fluent_test_connection';

function mergeConnectionParams(current, params) {
  const known = new Set(getConnectionParameters().map((p)=>p.value));
  const rows = [...(current ?? [])];
  for(const [name, value] of Object.entries(params ?? {})) {
    if(!known.has(name)) continue;
    const idx = rows.findIndex((r)=>r.name === name);
    const row = {name, keyword: name, value};
    if(idx >= 0) {
      rows[idx] = {...rows[idx], value};
    } else {
      rows.push(row);
    }
  }
  return rows;
}

/* State changes for the server form from a parsed connection string. */
export function connectionStringToFormState(parsed, state) {
  const changes = {};
  if(parsed.host) changes.host = parsed.host;
  if(parsed.port && /^\d+$/.test(parsed.port)) changes.port = Number(parsed.port);
  if(parsed.db) changes.db = parsed.db;
  if(parsed.username) changes.username = parsed.username;
  if(parsed.password) changes.password = parsed.password;
  if(parsed.service) changes.service = parsed.service;
  if(Object.keys(parsed.params ?? {}).length) {
    changes.connection_params = mergeConnectionParams(state.connection_params, parsed.params);
  }
  if(!state.name && (parsed.host || parsed.service)) {
    const where = parsed.host ?? parsed.service;
    changes.name = parsed.db && parsed.db !== 'postgres' ? `${where}/${parsed.db}` : where;
  }
  return changes;
}

async function testConnection(state) {
  const notifier = pgAdmin.Browser.notifier;
  try {
    const res = await getApiInstance().post(url_for('fluent.test_connection'), {
      host: state.host,
      port: state.port,
      db: state.db,
      username: state.username,
      password: state.password,
      service: state.service,
      connection_params: state.connection_params,
      use_ssh_tunnel: state.use_ssh_tunnel,
      kerberos_conn: state.kerberos_conn,
    });
    const r = res.data?.data ?? {};
    if(r.connected) {
      notifier.success(gettext('Connected to PostgreSQL %s as %s in %s ms%s.',
        r.server_version, r.user, r.elapsed_ms, r.ssl ? gettext(' (SSL)') : ''));
    } else {
      notifier.alert(gettext('Connection failed'), r.message || gettext('Unable to connect.'));
    }
  } catch (err) {
    notifier.alert(gettext('Connection failed'), parseApiError(err));
  }
}

function extraFields(schema) {
  const uriField = {
    id: URI_FIELD,
    label: gettext('Connection string'),
    type: 'text',
    group: gettext('Connection'),
    mode: ['create'],
    /* UI only: never sent with the server data. */
    skipChange: true,
    controlProps: {
      placeholder: 'postgresql://user:password@host:5432/dbname?sslmode=require',
      autoComplete: 'off',
    },
    helpMessage: gettext('Paste a postgresql:// URI or a key=value connection string to fill in the fields below.'),
    depChange: (state)=>{
      const parsed = parseConnectionString(state[URI_FIELD]);
      return parsed ? connectionStringToFormState(parsed, state) : undefined;
    },
  };
  const testField = {
    id: TEST_FIELD,
    type: 'button',
    group: gettext('Connection'),
    mode: ['create', 'edit'],
    skipChange: true,
    btnName: gettext('Test connection'),
    deps: ['host', 'service'],
    disabled: (state)=>!state.host && !state.service,
    helpMessage: gettext('Tries to connect with the values above without saving the server. In edit mode, type the password if it is not saved.'),
    onClick: ()=>{
      const data = schema.state?.data;
      data && testConnection(data);
    },
  };
  return {uriField, testField};
}

function withExtraFields(fields, schema) {
  if(fields.some((f)=>f.id === URI_FIELD)) return fields;
  const {uriField, testField} = extraFields(schema);
  const out = [...fields];
  const hostIdx = out.findIndex((f)=>f.id === 'host');
  out.splice(hostIdx >= 0 ? hostIdx : out.length, 0, uriField);
  const serviceIdx = out.findIndex((f)=>f.id === 'service');
  out.splice(serviceIdx >= 0 ? serviceIdx + 1 : out.length, 0, testField);
  return out;
}

/* Looked up on the instance rather than imported: the server node lives in
 * another webpack bundle, so its ServerSchema class is not the one an import
 * here would see. */
function findGetter(obj, prop) {
  for(let proto = Object.getPrototypeOf(obj); proto; proto = Object.getPrototypeOf(proto)) {
    const getter = Object.getOwnPropertyDescriptor(proto, prop)?.get;
    if(getter) return getter;
  }
  return null;
}

export function extendServerSchema(schema) {
  const baseFieldsGetter = schema && findGetter(schema, 'baseFields');
  if(!baseFieldsGetter) return schema;
  /* BaseUISchema memoizes on the identity of baseFields, so return the same
   * array for the same upstream array. */
  let cache = {source: null, result: null};
  Object.defineProperty(schema, 'baseFields', {
    configurable: true,
    get() {
      const source = baseFieldsGetter.call(this);
      if(cache.source !== source) {
        cache = {source, result: withExtraFields(source, this)};
      }
      return cache.result;
    },
  });
  return schema;
}

export function ensureServerSchemaExtension() {
  const node = pgAdmin.Browser?.Nodes?.server;
  if(!node || node.__fluentSchemaExtended) return;
  const getSchema = node.getSchema;
  node.getSchema = function(...args) {
    return extendServerSchema(getSchema.apply(this, args));
  };
  node.__fluentSchemaExtended = true;
}
