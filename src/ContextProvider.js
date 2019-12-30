import React from 'react'
import * as PropTypes from 'prop-types'
import DeferContext from './Context'

function DeferRenderProvider({ mode = 'sync', delay = 0, children }) {
  console.log('defer context provider booted')
  return (
    <DeferContext.Provider>
      {children}
    </DeferContext.Provider>
  )
}

DeferRenderProvider.propTypes = {
  mode: PropTypes.oneOf(['sync', 'async']),
  delay: PropTypes.number,
  children: PropTypes.any
}

export default DeferRenderProvider
