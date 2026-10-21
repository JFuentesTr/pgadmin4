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
        'user_interface', 'use_windows_accent',
        gettext("Use the Windows accent color"), 'boolean', True,
        category_label=PREF_LABEL_USER_INTERFACE,
        help_str=gettext(
            'Desktop mode only. When enabled, the Fluent interface style '
            'uses the accent color chosen in Windows Settings > '
            'Personalization > Colors.'
        )
    )
