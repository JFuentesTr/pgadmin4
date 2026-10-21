##########################################################################
#
# pgAdmin 4 - PostgreSQL Tools
#
# Copyright (C) 2013 - 2026, The pgAdmin Development Team
# This software is released under the PostgreSQL Licence
#
##########################################################################

##########################################################################
# Application branding
##########################################################################

# Fluent fork: see FORK_PATCHES.md. Datalith is based on pgAdmin 4.
# Make.bat reads APP_NAME from this file (keep the single quotes).

# Name of the application to display in the UI
APP_NAME = 'Datalith'
APP_ICON = 'pg-icon'

# To help define the configuration directory and data directory.
# Separate from pgAdmin's, so both can be installed side by side.
APP_SHORT_NAME = 'datalith'
APP_PATH = 'datalith'
APP_WIN_PATH = "Datalith"

# Copyright string for display in the app (pgAdmin's notice must be kept).
APP_COPYRIGHT = 'Based on pgAdmin 4. ' \
    'Copyright (C) 2013 - 2026, The pgAdmin Development Team'

# User ID (email address) to use for the default user in desktop mode.
# The default should be fine here, as it's not exposed in the app.
APP_DEFAULT_EMAIL = 'pgadmin4@pgadmin.org'
