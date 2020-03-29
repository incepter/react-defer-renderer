import React from 'react'
import * as PropTypes from 'prop-types'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import PauseIcon from '@material-ui/icons/Pause'
import ResumeIcon from '@material-ui/icons/PlayArrow'
import RefreshIcon from '@material-ui/icons/Refresh'
import StopIcon from '@material-ui/icons/Stop'
import { DeferContext } from 'react-deffer-renderer'
import Select from '@material-ui/core/Select'
import { TextField } from '@material-ui/core'

export function Commander({ mode, setMode, delay, setDelay, unmount, unmounted, batchSize, setBatchSize }) {
  const { pause, resume } = React.useContext(DeferContext)
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '50%', margin: 'auto' }}>
      <Tooltip placement='top' title='Unmount'>
        <IconButton onClick={unmount} color='secondary'>
          {unmounted ? <RefreshIcon /> : <StopIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip placement='top' title='Pause'>
        <IconButton disabled={unmounted} onClick={pause} color='secondary'>
          <PauseIcon />
        </IconButton>
      </Tooltip>
      <Tooltip placement='top' title='Resume'>
        <IconButton disabled={unmounted} onClick={resume} color='secondary'>
          <ResumeIcon />
        </IconButton>
      </Tooltip>
      <Select
        native
        variant='outlined'
        options={['sync', 'async-concurrent', 'sequential']}
        value={mode}
        onChange={e => setMode(e.target.value)}
      >
        {['sync', 'async-concurrent', 'sequential'].map(t => <option key={t} value={t}>{t}</option>)}
      </Select>
      <TextField
        label='Delay'
        variant='outlined'
        value={delay}
        type='number'
        onChange={e => setDelay(e.target.value)}
      />
      {mode !== 'sequential' && (
        <TextField
          label='Batch size'
          variant='outlined'
          value={batchSize}
          type='number'
          onChange={e => setBatchSize(e.target.value)}
        />
      )}
    </div>
  )
}

Commander.propTypes = {
  mode: PropTypes.string,
  setMode: PropTypes.func,
  delay: PropTypes.any,
  batchSize: PropTypes.any,
  setDelay: PropTypes.func,
  unmount: PropTypes.func,
  setBatchSize: PropTypes.func,
  unmounted: PropTypes.bool
}

export default Commander
