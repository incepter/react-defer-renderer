import React from 'react'
import DeferContext from './Context'

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

function standaloneCleanUp({ timeoutId, rafId }) {
  window.clearTimeout(timeoutId)
  window.cancelAnimationFrame(rafId)
}

export default function withDeferRender(WrappedComponent, config) {
  return function WithDeferRender(props) {
    const contextValue = React.useContext(DeferContext)
    const register = contextValue?.register || standaloneRegister
    const next = contextValue?.next
    const cleanUp = contextValue?.cleanUp || standaloneCleanUp

    const [shouldRender, setShouldRender] = React.useState(false)

    React.useEffect(() => {
      const registrationData = register(() => setShouldRender(true))
      return () => cleanUp(registrationData)
    }, [])
    React.useEffect(() => {
      if (shouldRender && typeof next === 'function') {
        next()
      }
    }, [shouldRender])

    if (!shouldRender) {
      return config?.fallback || null
    }
    return <WrappedComponent {...props} />
  }
}
