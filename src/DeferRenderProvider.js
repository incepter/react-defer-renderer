import React from 'react'
import PropTypes from 'prop-types'
import DeferContext from './Context'

const log = console.log

const __WORKING_STATUS = {
  IDLE: 'idle',
  WORKING: 'working'
}

function isWorkDone(work) {
  return work?.done === true
}

const __DEFFER_MODES = {
  SEQUENTIAL: 'sequential',
  SYNC: 'sync',
  ASYNC_CONCURRENT: 'async-concurrent'
}

function DeferRenderProvider({ delay = 0, mode = __DEFFER_MODES.SEQUENTIAL, children }) {
  const workStatus = React.useRef(__WORKING_STATUS.IDLE)
  const workIndexRef = React.useRef(0)
  const workQueue = React.useRef([])

  function registerWork(work) {
    const queuedWork = {
      work,
      done: false,
      index: ++workIndexRef.current
    }
    workQueue.current.push(queuedWork)
    return queuedWork.index
  }

  function isThereAnyWork() {
    return workQueue.current.length > 0
  }

  function beginWork() {
    clearDoneWork()
    if (workStatus.current !== __WORKING_STATUS.IDLE) {
      return
    }
    if (isThereAnyWork()) {
      workStatus.current = __WORKING_STATUS.WORKING
    }
    switch (mode) {
      case __DEFFER_MODES.SYNC: {
        workQueue.current.forEach(work => {
          work.rafId = window.requestAnimationFrame(() => {
            work.work()
            work.done = true
          })
        })
        break
      }
      case __DEFFER_MODES.SEQUENTIAL: {
        const currentWork = workQueue.current.length > 0 ? workQueue.current[0] : null
        if (!currentWork) {
          return
        }
        currentWork.rafId = window.requestAnimationFrame(() => {
          currentWork.timeoutId = setTimeout(() => {
            currentWork.work()
            currentWork.done = true
            workStatus.current = __WORKING_STATUS.IDLE
          }, delay)
        })
        break
      }
      case __DEFFER_MODES.ASYNC_CONCURRENT: {
        workQueue.current.forEach(work => {
          work.rafId = window.requestAnimationFrame(() => {
            work.timeoutId = setTimeout(() => {
              work.work()
              work.done = true
            }, delay)
          })
        })
        break
      }
      default:
        break
    }
  }

  function clearDoneWork() {
    const doneWorkIndexes = workQueue.current.filter(isWorkDone).map(t => t.index)
    doneWorkIndexes.forEach(cleanUp)
    if (!isThereAnyWork()) {
      workStatus.current = __WORKING_STATUS.IDLE
    }
  }

  function cleanUp(workIndex) {
    const work = workQueue.current.find(t => t.index === workIndex)
    if (work) {
      if (!work.done) {
        clearTimeout(work.timeoutId)
        window.cancelAnimationFrame(work.rafId)
      }
      workQueue.current = workQueue.current.filter(t => t.index !== workIndex)
    }
  }

  function next() {
    // clearDoneWork()
    beginWork()
  }

  React.useEffect(() => {
    beginWork()
  })
  return (
    <DeferContext.Provider value={{
      next,
      cleanUp: cleanUp,
      register: registerWork
    }}>
      {children}
    </DeferContext.Provider>
  )
}

DeferRenderProvider.propTypes = {
  children: PropTypes.any,
  mode: PropTypes.oneOf(Object.values(__DEFFER_MODES)),
  delay: PropTypes.number
}

export default DeferRenderProvider
