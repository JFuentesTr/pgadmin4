##########################################################################
#
# pgAdmin 4 - Fluent fork
#
# Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
# This software is released under the PostgreSQL Licence
#
##########################################################################

"""Fluent fork endpoints: test a server connection before saving it."""

import time

import psycopg
from psycopg.conninfo import make_conninfo
from flask import request
from flask_babel import gettext
from flask_security import permissions_required

from pgadmin.user_login_check import pga_login_required
from pgadmin.utils import PgAdminModule, get_complete_file_path
from pgadmin.utils.ajax import make_json_response, bad_request
from pgadmin.browser.server_groups.servers.utils import \
    convert_connection_parameter
from pgadmin.tools.user_management.PgAdminPermissions import \
    AllPermissionTypes

MODULE_NAME = 'fluent'

# libpq parameters that point to files; resolved like the server node does
# (in server mode they are confined to the user's storage directory).
FILE_PARAMS = ('passfile', 'sslcert', 'sslkey', 'sslrootcert', 'sslcrl',
               'sslcrldir')
DEFAULT_TIMEOUT_SECONDS = 10
MAX_TIMEOUT_SECONDS = 30


class FluentModule(PgAdminModule):
    LABEL = gettext('Fluent interface')

    def get_exposed_url_endpoints(self):
        return ['fluent.test_connection']


blueprint = FluentModule(MODULE_NAME, __name__, url_prefix='/misc/fluent')


def _connection_kwargs(data):
    """Build libpq keywords from the Register/Properties server form."""
    kwargs = {}
    for form_key, libpq_key in (('service', 'service'), ('host', 'host'),
                                ('port', 'port'), ('db', 'dbname'),
                                ('username', 'user'),
                                ('password', 'password')):
        value = data.get(form_key)
        if value not in (None, ''):
            kwargs[libpq_key] = str(value)

    params = convert_connection_parameter(
        data.get('connection_params') or []) or {}
    for key, value in params.items():
        if value in (None, ''):
            continue
        if key in FILE_PARAMS:
            value = get_complete_file_path(value)
            if value is None:
                continue
        kwargs[key] = str(value)

    try:
        timeout = int(kwargs.get('connect_timeout', DEFAULT_TIMEOUT_SECONDS))
    except ValueError:
        timeout = DEFAULT_TIMEOUT_SECONDS
    kwargs['connect_timeout'] = str(
        min(max(timeout, 1), MAX_TIMEOUT_SECONDS))
    kwargs['application_name'] = 'pgAdmin 4 - connection test'
    kwargs.setdefault('dbname', 'postgres')
    return kwargs


@blueprint.route('/test_connection', methods=['POST'],
                 endpoint='test_connection')
@pga_login_required
@permissions_required(AllPermissionTypes.object_register_server)
def test_connection():
    """
    Try to connect with the given server settings without saving them.
    Nothing is stored, and the password is only used for this attempt.
    """
    data = request.get_json(silent=True) or {}

    if not data.get('host') and not data.get('service'):
        return bad_request(gettext('Enter a host name or a service.'))
    if data.get('use_ssh_tunnel'):
        return make_json_response(data={
            'connected': False,
            'message': gettext(
                'Testing a connection through an SSH tunnel is not '
                'supported. Save the server and connect to it instead.'),
        })
    if data.get('kerberos_conn'):
        return make_json_response(data={
            'connected': False,
            'message': gettext(
                'Testing a Kerberos connection is not supported. Save the '
                'server and connect to it instead.'),
        })

    start = time.monotonic()
    try:
        conninfo = make_conninfo(**_connection_kwargs(data))
        with psycopg.connect(conninfo, autocommit=True) as conn:
            info = conn.info
            result = {
                'connected': True,
                'server_version': info.parameter_status('server_version'),
                'ssl': bool(info.pgconn.ssl_in_use),
                'user': info.user,
                'dbname': info.dbname,
            }
    except psycopg.Error as e:
        return make_json_response(data={
            'connected': False,
            'message': str(e).strip(),
        })
    except Exception as e:
        return make_json_response(data={
            'connected': False,
            'message': str(e),
        })

    result['elapsed_ms'] = round((time.monotonic() - start) * 1000)
    return make_json_response(data=result)
