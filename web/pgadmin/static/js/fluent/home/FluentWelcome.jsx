/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import FluentHome from './FluentHome';

/* Used by Dashboard.jsx in place of WelcomeDashboard: the Fluent home page
 * when the Fluent style is on, the upstream page otherwise. */
export default function FluentWelcome({Fallback, ...props}) {
  const theme = useTheme();
  return theme.fluent ? <FluentHome /> : <Fallback {...props} />;
}

FluentWelcome.propTypes = {
  Fallback: PropTypes.elementType.isRequired,
};
