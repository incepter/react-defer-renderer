import React from 'react'
import DeferContext from './Context'

/**
 * This function will ask the browser for an animation frame
 * then when granted, it will subscribe to a timeout with a delay to execute a registration callback
 * this function returns an object containing the request animation frame id and the timeout id
 * It is important to return them for clean up purposes.
 */
function standaloneRegister(registration, delay) {
  const registrationData = {
    rafId: null,
    timeoutId: null
  }
  registrationData.rafId = window.requestAnimationFrame(() => {
    registrationData.timeoutId = setTimeout(registration, delay)
  })
  return registrationData
}

/**
 * This function will clear a timeout and an animation frame id
 */
function standaloneCleanUp({ timeoutId, rafId }) {
  window.clearTimeout(timeoutId)
  window.cancelAnimationFrame(rafId)
}

/**
 * This hoc defers the render of a component
 * aka:
 * - The first time your component renders, this HOC will render nothing instead
 * - After the paint, your component will render
 * This allows the important parts of the screen to be visible first
 * and later (basically instantly) have the other parts
 *
 *
 * This HOC works with two modes:
 * 1 - Standalone Mode: this means, that the Deferred component doesn't have any DeferContextProvider Parent
 * 2 - Placed in a DeferContextProvider tree; this means that the render of your component is managed by the provider
 *
 * How are the two modes different ?
 * The only differences is that:
 * 1- In standalone mode; the registration function asks instantly/directly
 *    the browser for an animation frame then renders when grated.
 *    The registration function is the `standaloneRegister` declared within this file.
 *    Meanwhile in the controlled mode, it will obey the provider config
 * 2- If you have a lot of deferred components, you may gain nothing from deferring the render
 *    and the user may experience some LAG and cannot fire any event unless the main thread is empty
 *    Meanwhile in context mode, you can specify the sequential mode with a variable delay if some of the components are outside the view port
 */
export default function withDeferRender(WrappedComponent, config) {
  return function WithDeferRender(props) {
    /**
     * First, we retrieve the DeferContext value
     * Then we will try to init the register, next and cleanUp functions
     */
    const contextValue = React.useContext(DeferContext)
    const register = contextValue?.register || standaloneRegister
    const next = contextValue?.next
    const cleanUp = contextValue?.cleanUp || standaloneCleanUp

    /**
     * Initially, the component isn't allowed to render
     * unless the shouldRender become true
     */
    const [shouldRender, setShouldRender] = React.useState(false)

    React.useEffect(() => {
      /** register the component with a callback that sets the shouldRender state to true **/
      const registrationData = register(() => setShouldRender(true))
      /** when the component gets unmounted for some reason; it s important to clean the subscriptions **/
      return () => cleanUp(registrationData)
    }, [])
    React.useEffect(() => {
      /**
       * The first time the component renders correctly
       * And if inside a context (next is a function)
       * We call the next to notify the context that we are willing to render the next components
       */
      if (shouldRender && typeof next === 'function') {
        next()
      }
    }, [shouldRender])

    if (!shouldRender) {
      // if there is a fallback; render it; for example a circular progress or a placeholder
      return config?.fallback || null
    }
    return <WrappedComponent {...props} />
  }
}
