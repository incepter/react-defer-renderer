import React from 'react'
import PropTypes from 'prop-types'
import DeferContext from './Context'

/**
 * represents the work status
 */
const __WORK_STATUS = {
  IDLE: 0,
  PAUSED: 1,
  WORKING: 2
}
/**
 * The only three modes supported by the provider
 */
const __DEFER_MODES = {
  SEQUENTIAL: 'sequential',
  SYNC: 'sync',
  ASYNC_CONCURRENT: 'async-concurrent'
}

/**
 * just returns a work object to be saved in the context
 */
function makeNewWork(work, index) {
  return { work, index, ready: false, done: false, timeoutId: null, rafId: null }
}

/**
 * This is the defer render context provider that will manage deferring many of your components.
 *
 * It wraps your components with a DeferContext.Provider while giving as value the following:
 * - register: will register a callback to be called when the time comes
 * - next: will invoke the next callback if idle
 * - pause: will pause the work
 * - resume: will resume the work
 * - cleanUp: will unsubscribe a work a delete it from context
 *
 *
 * @param delay: number. The delay in ms after which the subscribed component is rendered
 * @param batchSize: number, In async-concurrent and sync modes; we can batch subscribers
 * @param mode: string. one of sync, sequential, async-concurrent
 * @param children: ReactNode. the children of context
 */
function DeferRenderProvider({
  delay = 0,
  batchSize,
  mode = __DEFER_MODES.SEQUENTIAL,
  children
}) {
  /**
   * Work status inside Provider
   * IDLE: ready to work
   * WORKING: actually working on deferring the render of subscribed components
   * PAUSED: work is interrupted and provider isn't doing anything
   */
  const workStatus = React.useRef(__WORK_STATUS.IDLE)
  /**
   * Used to identify works
   * it's given to a work after the subscription
   */
  const indexTracker = React.useRef(0)
  /**
   * The work queue: contains the work to be done
   */
  const workQueue = React.useRef([])
  /**
   * The work that it's currently ongoing
   * How it's different from the queue ?
   * Depending on the Defer mode, the provider slices the batchSize from the work queue
   * and places it the current work and then triggers the work
   */
  const currentWorkQueue = React.useRef([])
  /**
   * The provider should not relay on the values of { delay, batchSize, deferMode } from props
   * Because the provider will register the work with the old values provided from the initial render closure
   * So we use refs to track them: if they change, the ref's value will change also and the new values will be taken
   */
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

  /**
   * This function will create a new work with a new index
   *
   * It is important to note that this function is used to subscribe deferred components
   * and should return an identifier that will used in the clean-up function
   */
  function register(work) {
    /**
     * The index tracker is used to identify works
     * it is basically an auto-increment integer value
     */
    const newWork = makeNewWork(work, ++indexTracker.current)
    /** add the work to the queue **/
    workQueue.current.push(newWork)
    /**
     * If the work queue contains only one element, asynchronously trigger the work
     * So after the first registration the work will begin
     *
     * It is important to run it asynchronously in a setTimeout function
     * this will give the main thread the time to register all deferred components' work
     * before starting the work so we won't start the work for one element immediately
     */
    if (workQueue.current.length === 1) {
      setTimeout(next)
    }
    /** The work index will be given to the clean up function to identify which work to clean */
    return newWork.index
  }

  /**
   * With the asynchronous behavior of components' subscription and the work being randomly executed in several ways
   * It is important to control the work status
   * this function will only set the work status to idle if there is no more work in the current work queue
   */
  function reconcileWorkStatus() {
    if (currentWorkQueue.current.length === 0 && workStatus.current !== __WORK_STATUS.PAUSED) {
      workStatus.current = __WORK_STATUS.IDLE
      next()
    }
  }

  /**
   * This function will remove a work entirely from both the work queue and the current work queue
   * It is executed after a work is done
   * So basically; after a work is done, it is immediatly removed and the work status is reconciled
   */
  function removeWork(work) {
    workQueue.current = workQueue.current.filter(t => t.index !== work.index)
    currentWorkQueue.current = currentWorkQueue.current.filter(t => t.index !== work.index)
    reconcileWorkStatus()
  }

  /**
   * This is actually the work
   * it will trigger the registered work (basically the setShouldRender to true)
   * flags the work as Done then removes it
   * Why flagging it as done then removing it ? because of the asynchronous behavior of the entire js event loop
   * the work, if not done, may be executed from a next call from a previously rendered component
   * All defer modes pass through this function
   */
  function commitWork(work) {
    work.work()
    work.done = true
    removeWork(work)
  }

  /**
   * This function is executed in both modes: SEQUENTIAL and ASYNC_CONCURRENT
   */
  function asyncProcessCurrentWork() {
    /** the work status need to be either idle or working, if paused, we should do nothing **/
    if (workStatus.current !== __WORK_STATUS.PAUSED) {
      /** flag the work status as working **/
      workStatus.current = __WORK_STATUS.WORKING
      currentWorkQueue.current.forEach(work => {
        /**
         * It is important to mutate the work and remember the both the window animation frame and the timeout id
         * Because if the tree get's unmounted (or a single component) we need to unsubscribe from these events
         * Saving both IDs in the work will allow the work to be it's single source of truth
         */
        work.rafId = window.requestAnimationFrame(() => {
          work.timeoutId = setTimeout(() => commitWork(work), delayRef.current)
        })
      })
    }
  }

  /**
   * This function is executed when using the sync defer mode
   */
  function processCurrentWork() {
    if (workStatus.current !== __WORK_STATUS.PAUSED) {
      workStatus.current = __WORK_STATUS.WORKING
      // will immediately commit all work in the current work queue.
      // aka: the sliced batchSize from the remaining work in the queue
      currentWorkQueue.current.forEach(commitWork)
    }
  }

  /**
   * This function is called only from the `next` function
   * but it is the main function of the provider
   * depending on the defer mode, will execute the corresponding function (processCurrentWork or asyncProcessCurrentWork)
   */
  function beginWork() {
    /** immediately exit if there is no work in the main queue **/
    if (workQueue.current.length === 0) {
      return
    }
    /** flag the work as working **/
    workStatus.current = __WORK_STATUS.WORKING
    /**
     * In the sequential work mode; the provider renders only one component at a time
     * each deferred component after rendering, calls the next function
     */
    if (modeRef.current === __DEFER_MODES.SEQUENTIAL) {
      /** add work to the current work queue only if there is no ongoing work **/
      if (currentWorkQueue.current.length === 0) {
        /** grab the first work from the queue, flag it as ready, then push it in the current work queue **/
        const nextWork = workQueue.current[0]
        nextWork.ready = true
        currentWorkQueue.current.push(nextWork)
      }
      asyncProcessCurrentWork()
      /**
       * In the synchronous mode of deferring, a bunch of work is executed simultaneously
       * say we have a batch size of 10, and a delay of 100, this means
       * each 100 millis, 10 components will be printed to the screen at the same time
       */
    } else if (modeRef.current === __DEFER_MODES.SYNC) {
      if (currentWorkQueue.current.length === 0) {
        /** take either the batch size or the whole work and send it to the current work queue **/
        const nextWork = workQueue.current.slice(0, batchSizeRef.current || workQueue.current.length)
        currentWorkQueue.current.push(...nextWork)
        currentWorkQueue.current.forEach(t => { t.ready = true })
      }
      setTimeout(processCurrentWork, delayRef.current)
      /**
       * in the concurrent asynchronous mode, we slice some work
       * say we have a batch size of 10, and a delay of 100, this means
       * each 100 millis, 10 components will be printed to the screen, but they may not be printed at the same time
       */
    } else if (modeRef.current === __DEFER_MODES.ASYNC_CONCURRENT) {
      if (currentWorkQueue.current.length === 0) {
        /** take either the batch size or the whole work and send it to the current work queue **/
        const nextWork = workQueue.current.slice(0, batchSizeRef.current || workQueue.current.length)
        currentWorkQueue.current.push(...nextWork)
        currentWorkQueue.current.forEach(t => { t.ready = true })
      }
      asyncProcessCurrentWork()
    }
  }

  /**
   * This is the entry-point of all work; it only checks that the work status is idle and that there is something the queue, then triggers the beginWork function
   * This function is also called each time a deferred component renders
   */
  function next() {
    if (workStatus.current === __WORK_STATUS.IDLE && workQueue.current.length > 0) {
      beginWork()
    }
  }

  /**
   * If a tree get unmounted, it is important to remove all the associated work to avoid calling the callback
   * after we are granted the animation frame or the timeout resolves
   */
  function cleanUp(index) {
    /** grab the work given the identifier we are trying to remove **/
    const fromCurrent = currentWorkQueue.current.find(t => t.index === index)
    /**
     * the only relevant unsubscription from the animation frame and/or the timeout is when the work is ready and not done yet
     */
    if (fromCurrent && fromCurrent.ready && !fromCurrent.done) {
      window.cancelAnimationFrame(fromCurrent?.rafId)
      clearTimeout(fromCurrent?.timeoutId)
    }
    /** Remove the work from both queues **/
    removeWork({ index })
  }

  /**
   * To pause a work, it is only necessary to flag the work status as PAUSED
   * todo: unsubscribe from the animation frame and/or the timeout and remove the work only from the currentWorkQueue
   */
  function pause() {
    workStatus.current = __WORK_STATUS.PAUSED
  }

  /**
   * To resume the work, we need to flag the status as idle then call next
   */
  function resume() {
    workStatus.current = __WORK_STATUS.IDLE
    next()
  }

  /**
   * After each provider render, it will trigger the work
   */
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
  mode: PropTypes.oneOf(['sequential', 'sync', 'async-concurrent'])
}

export default DeferRenderProvider
