import React from 'react'
import { useMyHook } from 'react-deffer-renderer'

const App = () => {
  const example = useMyHook()
  return (
    <div>
      {example}
    </div>
  )
}
export default App