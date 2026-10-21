/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

/* PROD / STAGING / DEV badge derived from the server tags (serverInfo.js). */
const Badge = styled('span')(({theme}) => {
  const t = theme.fluent?.tokens;
  const isDark = theme.fluent?.mode === 'dark';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: '18px',
    padding: '0 6px',
    borderRadius: '4px',
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    '&.size-medium': {
      height: '20px',
      padding: '0 8px',
      fontSize: '0.75rem',
    },
    '&.env-prod': {
      color: '#FFFFFF',
      backgroundColor: '#C42B1C',
    },
    '&.env-staging': {
      color: '#000000',
      backgroundColor: isDark ? '#FCE100' : '#F7B500',
    },
    '&.env-dev': {
      color: t?.success,
      border: `1px solid ${t?.success}`,
    },
  };
});

export default function EnvironmentBadge({environment, size='medium'}) {
  if(!environment) return null;
  return (
    <Badge className={`env-${environment.key} size-${size}`} title={environment.title}>
      {environment.label}
    </Badge>
  );
}

EnvironmentBadge.propTypes = {
  environment: PropTypes.object,
  size: PropTypes.oneOf(['small', 'medium']),
};
