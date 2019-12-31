import React from 'react'
import { withDeferRender, DeferRenderProvider } from 'react-deffer-renderer'

function constructRangerArray(length) {
  const out = []
  for (let i = 0; i < length; i++) {
    out.push(i)
  }
  return out
}

function MyComponent({ value }) {
  return <input value={value} />
}

const MyDeferredComponent = withDeferRender(MyComponent)
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
      <button onClick={() => setUnmount(old => !old)}>Unmount</button>
      {!unmount && (
        <div>
          {constructRangerArray(1000).map(i => <MyDeferredComponent key={i} value={i} />)}
        </div>
      )}

    </DeferRenderProvider>
  )
}
export default App
