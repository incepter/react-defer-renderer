import React from 'react'
import DeferContext from './Context'

function standaloneRegister(registration) {
  let timeoutId = null
  const callback = () => {
    timeoutId = setTimeout(registration)
  }
  const rafId = window.requestAnimationFrame(
    () => callback()
  )

  return {
    timeoutId,
    rafId
  }
}

function standaloneCleanUp({ timeoutId, rafId }) {
  window.clearTimeout(timeoutId)
  window.cancelAnimationFrame(rafId)
}

export default function withDeferRender(WrappedComponent) {
  return function WithDeferRender(props) {
    const contextValue = React.useContext(DeferContext)
    const register = contextValue?.register || standaloneRegister
    const next = contextValue?.next
    const cleanUp = contextValue?.cleanUp || standaloneCleanUp

    const [shouldRender, setShouldRender] = React.useState(false)

    React.useEffect(() => {
      const registrationData = register(() => {
        window.requestAnimationFrame(() => setShouldRender(true))
      })
      return () => cleanUp(registrationData)
    }, [])
    React.useEffect(() => {
      if (shouldRender && typeof next === 'function') {
        next()
      }
    }, [shouldRender])

    if (!shouldRender) {
      return null
    }
    return <WrappedComponent {...props} />
  }
}
