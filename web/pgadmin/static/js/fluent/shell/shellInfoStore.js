/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { create } from 'zustand';

/* What the desktop runtime tells us about the native window. In a plain
 * browser (server mode) nothing is filled and the defaults apply. */
const DEFAULT_SHELL_INFO = {
  platform: null,
  customTitleBar: false,
  titleBarHeight: 40,
  mica: false,
  accentColor: null,
};

const useShellInfo = create(() => ({...DEFAULT_SHELL_INFO}));

let initialized = false;

export function initShellInfo() {
  if(initialized) return;
  initialized = true;

  /* Exposed by runtime/src/js/pgadmin_preload.js (desktop mode only). */
  const electronWin = window.electronWin;
  if(!electronWin?.getShellInfo) return;

  electronWin.getShellInfo()
    .then((info)=>{
      useShellInfo.setState({...DEFAULT_SHELL_INFO, ...info});
    })
    .catch((err)=>{
      console.error('Unable to read the desktop shell info', err);
    });

  electronWin.onShellInfoChanged((info)=>{
    useShellInfo.setState(info);
  });
}

export default useShellInfo;
