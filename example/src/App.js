import React from 'react'
import { withDeferRender, DeferRenderProvider, DeferContext } from 'react-deffer-renderer'

function constructRangerArray(length) {
  const out = []
  for (let i = 0; i < length; i++) {
    out.push(i)
  }
  return out
}

function MyComponent({ value }) {
  const [inputVal, setInputVal] = React.useState(value)
  function changeValue({ target: { value } }) {
    setInputVal(value)
  }
  return <input value={inputVal} onChange={changeValue} />
}

const MyDeferredComponent = withDeferRender(MyComponent)

function Commander() {
  const { pause, resume } = React.useContext(DeferContext)
  return (
    <div>
      <button onClick={pause}>pause</button>
      <button onClick={resume}>resume</button>
    </div>
  )
}
const App = () => {
  const [unmount, setUnmount] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      // setUnmount(true)
    }, 200)
  }, [])
  console.log('APP')
  return (
    <DeferRenderProvider>
      <Commander />
      <button onClick={() => setUnmount(old => !old)}>Unmount</button>
      {!unmount && (
        <div>
          {constructRangerArray(2000).map(i => <MyDeferredComponent key={i} value={i} />)}
        </div>
      )}
    </DeferRenderProvider>
  )
}
export default App
