import React from 'react'
import { DeferRenderProvider } from 'react-deffer-renderer'
import Commander from './Commander'
import Todos from './Todos'
import SideBar from './SideBar'

const App = () => {
  const [unmount, setUnmount] = React.useState(false)
  const [mode, setMode] = React.useState('sequential')
  const [delay, setDelay] = React.useState(1000)
  const [batchSize, setBatchSize] = React.useState(5)

  return (
    <DeferRenderProvider delay={delay} mode={mode} batchSize={batchSize}>
      <SideBar>
        <Commander
          delay={delay}
          setDelay={setDelay}
          mode={mode}
          setMode={setMode}
          unmounted={unmount}
          unmount={() => setUnmount(old => !old)}
          setBatchSize={setBatchSize}
          batchSize={batchSize}
        />

        {!unmount && (
          <Todos />
        )}
      </SideBar>

    </DeferRenderProvider>
  )
}
export default App
