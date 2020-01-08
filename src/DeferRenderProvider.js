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

function DeferRenderProvider({ delay = 100, batchSize = 10, mode = __DEFFER_MODES.SEQUENTIAL, children }) {
  const workStatus = React.useRef(__WORKING_STATUS.IDLE)
  const lastRegisteredWorkIndex = React.useRef(0)
  const workQueue = React.useRef([])
  const currentWork = React.useRef([])

  function register(work) {
    const newWork = makeNewWork(work, ++lastRegisteredWorkIndex.current)
    workQueue.current.push(newWork)
    return newWork.index
  }
  function reconcileWorkStatus() {
    if (currentWork.current.length === 0 && workStatus.current !== __WORKING_STATUS.PAUSED) {
      workStatus.current = __WORKING_STATUS.IDLE
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
    workStatus.current = __WORKING_STATUS.WORKING
    currentWork.current.forEach(work => {
      work.timeoutId = setTimeout(() => {
        work.rafId = window.requestAnimationFrame(() => commitWork(work))
      }, delay)
    })
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
    if (mode === __DEFFER_MODES.SEQUENTIAL) {
      if (currentWork.current.length === 0) {
        const nextWork = workQueue.current[0]
        nextWork.ready = true
        currentWork.current.push(nextWork)
      }
      asyncProcessCurrentWork()
    } else if (mode === __DEFFER_MODES.SYNC) {
      if (currentWork.current.length === 0) {
        const nextWork = workQueue.current.slice(0, batchSize || workQueue.current.length)
        currentWork.current.push(...nextWork)
        currentWork.current.forEach(t => { t.ready = true })
      }
      setTimeout(processCurrentWork, delay)
    } else if (mode === __DEFFER_MODES.ASYNC_CONCURRENT) {
      if (currentWork.current.length === 0) {
        const nextWork = workQueue.current.slice(0, batchSize || workQueue.current.length)
        currentWork.current.push(...nextWork)
        currentWork.current.forEach(t => { t.ready = true })
      }
      asyncProcessCurrentWork()
    }
  }
  function next() {
    if (workStatus.current === __WORKING_STATUS.IDLE && workQueue.current.length > 0) {
      workStatus.current = __WORKING_STATUS.WORKING
      beginWork()
    }
  }
  function cleanUp(index) {
    const workFromQueue = workQueue.current.find(t => t.index === index)
    const workFromCurrent = workQueue.current.find(t => t.index === index)
    if (!workFromCurrent && !workFromQueue) {
      return
    }
    if (workFromCurrent || workFromQueue) {
      clearTimeout(workFromCurrent?.timeoutId)
      window.cancelAnimationFrame(workFromCurrent?.rafId)
      removeWork({ index })
    }
  }
  function pause() {
    workStatus.current = __WORKING_STATUS.PAUSED
  }
  function resume() {
    workStatus.current = __WORKING_STATUS.IDLE
    next()
  }
  React.useEffect(() => {
    beginWork()
  }, [])
  return (
    <DeferContext.Provider value={{
      pause,
      resume,
      next,
      cleanUp,
      register
    }}>
      {children}
    </DeferContext.Provider>
  )
}

DeferRenderProvider.propTypes = {
  children: PropTypes.any,
  batchSize: PropTypes.number,
  mode: PropTypes.oneOf(Object.values(__DEFFER_MODES)),
  delay: PropTypes.number
}

export default DeferRenderProvider
