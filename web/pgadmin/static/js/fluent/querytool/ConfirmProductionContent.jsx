/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/CloseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import gettext from 'sources/gettext';
import { DefaultButton } from '../../components/Buttons';
import { InputCheckbox } from '../../components/FormComponents';
import CodeMirror from '../../components/ReactCodeMirror';

const Root = styled('div')(({theme}) => {
  const t = theme.fluent?.tokens;
  return {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
    '& .Prod-body': {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    '& .Prod-banner': {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      padding: '10px 12px',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.error.light,
      border: `1px solid ${t?.strokeCard ?? theme.palette.error.main}`,
      '& svg': {
        color: theme.palette.error.main,
        flexShrink: 0,
      },
    },
    '& .Prod-chips': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    },
    '& .Prod-chip': {
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '10px',
      border: `1px solid ${t?.strokeControl ?? theme.otherVars.borderColor}`,
      '&.danger': {
        color: '#FFFFFF',
        backgroundColor: '#C42B1C',
        borderColor: '#C42B1C',
      },
    },
    '& .Prod-sql': {
      maxHeight: '180px',
      overflow: 'auto',
      border: `1px solid ${theme.otherVars.borderColor}`,
      borderRadius: theme.shape.borderRadius,
    },
    /* Solid red in every theme: Fluent dark uses a light pink for errors,
     * which reads as harmless on a filled button. */
    '& .Prod-run.Buttons-defaultButton': {
      color: '#FFFFFF',
      backgroundColor: '#C42B1C',
      borderColor: '#C42B1C',
      '&:hover': {
        color: '#FFFFFF',
        backgroundColor: '#A4262C',
        borderColor: '#A4262C',
      },
    },
    '& .Prod-footer': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: t?.layerBg ?? theme.otherVars.headerBg,
      ...theme.mixins.panelBorder?.top,
    },
  };
});

export default function ConfirmProductionContent({kind='script', serverName, summary, sql, onRun, onCancel}) {
  const [skipForTab, setSkipForTab] = useState(false);
  const isGrid = kind === 'grid';

  return (
    <Root data-test="confirm-production">
      <div className='Prod-body'>
        <div className='Prod-banner'>
          <WarningAmberRoundedIcon />
          <span>
            {isGrid ?
              gettext('This Query Tool is connected to %s, which is tagged as a production server. Saving the edited rows will run:', serverName) :
              gettext('This Query Tool is connected to %s, which is tagged as a production server. The script changes data or the schema:', serverName)}
          </span>
        </div>
        <div className='Prod-chips'>
          {summary.map((s)=>(
            <span key={s.label} className={'Prod-chip' + (s.danger ? ' danger' : '')}>
              {s.count > 1 ? `${s.label} ×${s.count}` : s.label}
            </span>
          ))}
        </div>
        {sql &&
          <div className='Prod-sql'>
            <CodeMirror value={sql} readonly={true} />
          </div>}
      </div>
      <div className='Prod-footer'>
        <InputCheckbox
          controlProps={{label: gettext('Don\'t ask again in this Query Tool')}}
          value={skipForTab}
          onChange={(e)=>setSkipForTab(e.target.checked)}
        />
        <Box sx={{display: 'flex', gap: '8px'}}>
          <DefaultButton data-test="cancel" startIcon={<CloseIcon />} onClick={onCancel} autoFocus>
            {gettext('Cancel')}
          </DefaultButton>
          <DefaultButton data-test="run-on-production" className='Prod-run' color='error' startIcon={<PlayArrowRoundedIcon />}
            onClick={()=>onRun(skipForTab)}>
            {isGrid ? gettext('Save on production') : gettext('Run on production')}
          </DefaultButton>
        </Box>
      </div>
    </Root>
  );
}

ConfirmProductionContent.propTypes = {
  kind: PropTypes.oneOf(['script', 'grid']),
  serverName: PropTypes.string,
  summary: PropTypes.array,
  sql: PropTypes.string,
  onRun: PropTypes.func,
  onCancel: PropTypes.func,
};
