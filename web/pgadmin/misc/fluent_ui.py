##########################################################################
#
# pgAdmin 4 - Fluent fork
#
# Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
# This software is released under the PostgreSQL Licence
#
##########################################################################

"""Preferences for the fork's Fluent (Windows 11) user interface."""

from flask_babel import gettext
from pgadmin.utils.constants import PREF_LABEL_USER_INTERFACE

UI_STYLE_FLUENT = 'fluent'
UI_STYLE_PGADMIN = 'pgadmin'


def register_fluent_preferences(preference):
    """Register the Fluent UI preferences in the Miscellaneous module."""
    preference.register(
        'user_interface', 'ui_style',
        gettext("Interface style"), 'options', UI_STYLE_FLUENT,
        category_label=PREF_LABEL_USER_INTERFACE,
        options=[
            {'label': gettext('Fluent (Windows 11)'),
             'value': UI_STYLE_FLUENT},
            {'label': gettext('pgAdmin classic'),
             'value': UI_STYLE_PGADMIN},
        ],
        control_props={
            'allowClear': False,
            'creatable': False,
        },
        help_str=gettext(
            'Fluent applies the Windows 11 look to the whole application '
            'with the Light, Dark and System themes. pgAdmin classic keeps '
            'the original look. High contrast always uses the original '
            'high contrast theme.'
        )
    )
    preference.register(
        'user_interface', 'properties_dialog_mode',
        gettext("Object dialogs"), 'options', 'flyout',
        category_label=PREF_LABEL_USER_INTERFACE,
        options=[
            {'label': gettext('Side panel'), 'value': 'flyout'},
            {'label': gettext('Floating window'), 'value': 'floating'},
        ],
        control_props={
            'allowClear': False,
            'creatable': False,
        },
        help_str=gettext(
            'Fluent interface style only. Side panel opens the Create and '
            'Properties dialogs docked on the right, so the Object Explorer '
            'stays visible. Floating window keeps the original behaviour.'
        )
    )
    preference.register(
        'user_interface', 'prod_safe_mode',
        gettext("Confirm changes on production servers"), 'boolean', True,
        category_label=PREF_LABEL_USER_INTERFACE,
        help_str=gettext(
            'When a server has a tag named prod or production, the Query '
            'Tool marks it as PRODUCTION and asks for confirmation before '
            'running statements that change data or the schema (INSERT, '
            'UPDATE, DELETE, DDL, GRANT, EXPLAIN ANALYZE of those...).'
        )
    )
    preference.register(
        'user_interface', 'results_grid_density',
        gettext("Results grid density"), 'options', 'compact',
        category_label=PREF_LABEL_USER_INTERFACE,
        options=[
            {'label': gettext('Compact'), 'value': 'compact'},
            {'label': gettext('Comfortable'), 'value': 'comfortable'},
        ],
        control_props={
            'allowClear': False,
            'creatable': False,
        },
        help_str=gettext(
            'Row height of the Query Tool results grid. Applies to Query '
            'Tool tabs opened after the change.'
        )
    )
    preference.register(
        'user_interface', 'use_windows_accent',
        gettext("Use the Windows accent color"), 'boolean', True,
        category_label=PREF_LABEL_USER_INTERFACE,
        help_str=gettext(
            'Desktop mode only. When enabled, the Fluent interface style '
            'uses the accent color chosen in Windows Settings > '
            'Personalization > Colors.'
        )
    )
