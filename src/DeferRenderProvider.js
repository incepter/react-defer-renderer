import React from 'react'
import PropTypes from 'prop-types'
import DeferContext from './Context'

const __WORKING_STATUS = {
  IDLE: 'idle',
  PAUSED: 'paused',
  WORKING: 'working'
}

const __DEFFER_MODES = {
  SEQUENTIAL: 'sequential',
  SYNC: 'sync',
  ASYNC_CONCURRENT: 'async-concurrent'
}

function makeNewWork(work, index) {
  return { work, index, ready: false, done: false, timeoutId: null, rafId: null }
}

function DeferRenderProvider({ delay = 0, batchSize = 10, mode = __DEFFER_MODES.SEQUENTIAL, children }) {
  const workStatus = React.useRef(__WORKING_STATUS.IDLE)
  const lastRegisteredWorkIndex = React.useRef(0)
  const workQueue = React.useRef([])
  const currentWork = React.useRef([])
  const delayRef = React.useRef(delay)
  if (delayRef.current !== delay) {
    delayRef.current = delay
  }
  const modeRef = React.useRef(mode)
  if (modeRef.current !== mode) {
    modeRef.current = mode
  }
  const batchSizeRef = React.useRef(batchSize)
  if (batchSizeRef.current !== batchSize) {
    batchSizeRef.current = batchSize
  }

  function register(work) {
    const newWork = makeNewWork(work, ++lastRegisteredWorkIndex.current)
    workQueue.current.push(newWork)
    if (workQueue.current.length === 1) {
      setTimeout(next)
    }
    return newWork.index
  }
  function reconcileWorkStatus() {
    if (currentWork.current.length === 0 && workStatus.current !== __WORKING_STATUS.PAUSED) {
      workStatus.current = __WORKING_STATUS.IDLE
      next()
    }
  }
  function removeWork(work) {
    workQueue.current = workQueue.current.filter(t => t.index !== work.index)
    currentWork.current = currentWork.current.filter(t => t.index !== work.index)
    reconcileWorkStatus()
  }
  function commitWork(work) {
    work.work()
    work.done = true
    removeWork(work)
  }
  function asyncProcessCurrentWork() {
    if (workStatus.current !== __WORKING_STATUS.PAUSED) {
      workStatus.current = __WORKING_STATUS.WORKING
      currentWork.current.forEach(work => {
        work.rafId = window.requestAnimationFrame(() => {
          work.timeoutId = setTimeout(() => commitWork(work), delayRef.current)
        })
      })
    }
  }
  function processCurrentWork() {
    if (workStatus.current !== __WORKING_STATUS.PAUSED) {
      workStatus.current = __WORKING_STATUS.WORKING
      currentWork.current.forEach(commitWork)
    }
  }
  function beginWork() {
    if (workQueue.current.length === 0) {
      return
    }
    workStatus.current = __WORKING_STATUS.WORKING
    if (modeRef.current === __DEFFER_MODES.SEQUENTIAL) {
      if (currentWork.current.length === 0) {
        const nextWork = workQueue.current[0]
        nextWork.ready = true
        currentWork.current.push(nextWork)
      }
      asyncProcessCurrentWork()
    } else if (modeRef.current === __DEFFER_MODES.SYNC) {
      if (currentWork.current.length === 0) {
        const nextWork = workQueue.current.slice(0, batchSizeRef.current || workQueue.current.length)
        currentWork.current.push(...nextWork)
        currentWork.current.forEach(t => { t.ready = true })
      }
      setTimeout(processCurrentWork, delayRef.current)
    } else if (modeRef.current === __DEFFER_MODES.ASYNC_CONCURRENT) {
      if (currentWork.current.length === 0) {
        const nextWork = workQueue.current.slice(0, batchSizeRef.current || workQueue.current.length)
        currentWork.current.push(...nextWork)
        currentWork.current.forEach(t => { t.ready = true })
      }
      asyncProcessCurrentWork()
    }
  }
  function next() {
    if (workStatus.current === __WORKING_STATUS.IDLE && workQueue.current.length > 0) {
      beginWork()
    }
  }
  function cleanUp(index) {
    const fromCurrent = currentWork.current.find(t => t.index === index)
    if (fromCurrent && fromCurrent.ready && !fromCurrent.done) {
      window.cancelAnimationFrame(fromCurrent?.rafId)
      clearTimeout(fromCurrent?.timeoutId)
    }
    removeWork({ index })
  }
  function pause() {
    workStatus.current = __WORKING_STATUS.PAUSED
  }
  function resume() {
    workStatus.current = __WORKING_STATUS.IDLE
    next()
  }
  React.useEffect(() => {
    next()
  })
  return (
    <DeferContext.Provider value={{
      next,
      pause,
      resume,
      cleanUp,
      register
    }}>
      {children}
    </DeferContext.Provider>
  )
}

DeferRenderProvider.propTypes = {
  children: PropTypes.any,
  delay: PropTypes.number,
  batchSize: PropTypes.number,
  mode: PropTypes.oneOf(Object.values(__DEFFER_MODES))
}

export default DeferRenderProvider
