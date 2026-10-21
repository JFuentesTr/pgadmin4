/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Copied from tools/search_objects/static/js/SearchObjects.jsx, where these
 * helpers are not exported. Keep in sync when merging upstream: they turn the
 * search API path (":schema.2200:/public/:table.41773:/film") into the display
 * path and the id path the tree locator (tree.findNodeWithToggle) needs. */

import pgAdmin from 'sources/pgadmin';

function getCollNode(nodeType) {
  const nodes = pgAdmin.Browser.Nodes;
  if('coll-' + nodeType in nodes) {
    return nodes['coll-' + nodeType];
  } else if(nodeType in nodes && typeof(nodes[nodeType].collection_type) === 'string') {
    return nodes[nodes[nodeType].collection_type];
  }
  return null;
}

export function translateSearchObjectsPath(nodeData, path, catalogLevel) {
  if(path === null) {
    return [null, null];
  }
  catalogLevel = catalogLevel || 'N';

  const idPath = [
    nodeData?.server_group?.id,
    nodeData?.server?.id,
    getCollNode('database').type + '_' + nodeData?.server?._id,
    nodeData?.database?.id,
  ];
  let prevNodeId = nodeData?.database?._id;

  path = '/' + path;
  let newPath = path.replace(/\/:[a-zA-Z_]+\.\d+:\//g, (token)=>{
    const origToken = token;
    token = token.slice(2, -2);
    let [nodeType, nodeOid, others] = token.split('.');
    if(typeof(others) !== 'undefined') {
      return token;
    }
    nodeType = (['D', 'O'].indexOf(catalogLevel) != -1 && nodeType == 'schema') ? 'catalog' : nodeType;
    nodeType = (catalogLevel === 'O' && ['view', 'table'].indexOf(nodeType) != -1) ? 'catalog_object' : nodeType;
    nodeType = (catalogLevel === 'O' && nodeType == 'column') ? 'catalog_object_column' : nodeType;

    const collNode = getCollNode(nodeType);
    if(collNode) {
      if(prevNodeId != null) idPath.push(`${collNode.type}_${prevNodeId}`);
      idPath.push(`${nodeType}_${nodeOid}`);
      prevNodeId = nodeOid;
      return `/${collNode.label}/`;
    } else if(nodeType in pgAdmin.Browser.Nodes) {
      idPath.push(`${nodeType}_${nodeOid}`);
      prevNodeId = nodeOid;
      return '/';
    }
    prevNodeId = null;
    return origToken;
  });

  newPath = newPath.substring(1);
  return [newPath, idPath];
}
