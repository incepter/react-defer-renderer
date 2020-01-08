
/**
 * DRAFT:
 * work status: IDLE, WORKING, PAUSED
 *
 * workQueue
 *
 * a work : { index: auto-increment-identifier, cb: function, done|false: bool, ready|false: bool, rafId, timeoutId }
 *
 * events:
 * -------
 * register
 * unregister
 * cleanUp
 * pause
 * resume
 * next
 *
 *
 *
 * flow:
 * 1- register work
 * 2- begin work
 *    if not idle abort
 *    take the first
 *        - mark it as ready
 *        - request idle callback then process work
 * 3- process work
 *    call its callback
 *    delete it
 *
 * functions
 * ---------
 * markWorkAsReady (workIndex) => nestedWork.ready
 *
 *
 */
