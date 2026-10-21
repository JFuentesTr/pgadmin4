/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Row height for the Query Tool result grid, from the misc preference
 * results_grid_density. "compact" keeps the upstream 25px rows.
 * QueryToolDataGrid spreads its props after its own defaults, so these
 * props override them without touching the grid component. */
const DENSITY_ROW_HEIGHT = {
  compact: undefined,
  comfortable: 32,
};

export function getGridDensityProps(miscPrefs) {
  const rowHeight = DENSITY_ROW_HEIGHT[miscPrefs?.results_grid_density];
  return rowHeight ? {rowHeight} : {};
}
