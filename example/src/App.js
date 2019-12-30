import React from 'react'
import withDeferRender from 'react-deffer-renderer'

function constructRangerArray(length) {
  const out = []
  for (let i = 0; i < length; i++) {
    out.push(i)
  }
  return out
}

function MyComponent() {
  console.log('rendered my component')
  return <p>Hello, world !</p>
}

const MyDeferredComponent = withDeferRender(MyComponent)
const App = () => {
  console.log('APP')
  return <div>
    {constructRangerArray(30).map(i => <MyDeferredComponent key={i} />)}
  </div>
}
export default App
