/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import PropTypes from 'prop-types';
import gettext from 'sources/gettext';
import { PgMenuDivider, PgMenuItem } from '../../components/Menu';
import { QUERY_TOOL_EVENTS } from '../../../../tools/sqleditor/static/js/components/QueryToolConstants';

/* Extra entries for the result grid "Copy options" menu. COPY_DATA carries
 * the format as its second argument; ResultSet.jsx hands it to sqlFromRows.
 * The items reserve the check column to line up with "Copy with headers". */
export default function CopyAsSqlMenuItems({eventBus}) {
  const copyAs = (format)=>()=>eventBus.fireEvent(QUERY_TOOL_EVENTS.COPY_DATA, false, format);
  return (
    <>
      <PgMenuDivider />
      <PgMenuItem hasCheck checked={false} closeOnCheck onClick={copyAs('insert')}>
        {gettext('Copy as INSERT statement')}
      </PgMenuItem>
      <PgMenuItem hasCheck checked={false} closeOnCheck onClick={copyAs('update')}>
        {gettext('Copy as UPDATE statements')}
      </PgMenuItem>
    </>
  );
}

CopyAsSqlMenuItems.propTypes = {
  eventBus: PropTypes.object.isRequired,
};
