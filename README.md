# react-deffer-renderer

> Render components asynchronously and non blocking

[![NPM](https://img.shields.io/npm/v/react-deffer-renderer.svg)](https://www.npmjs.com/package/react-deffer-renderer) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## What is this ?

`react-defer-render` provides utilities that helps you defer the render of some components after the `natural` render. It is only `1.76 KB gripped`.

During the first render, or the render of a complex tree, you may want to unblock the main thread
and release it so that the most important parts of the app are rendered and painted first, the user may then navigate and abort the painting of a huge tree that is being rendered.

Concrete examples:
- Rendering the menu and/or side bars of the app first.
- Rendering the `Tab` headers and delay the actual content.
- When pressing on a Tab, if its content contains for example 10000 html tags,
the touch ripple along with the tab content will feel laggy and the user will be unable to work on the app until the render of the whole tree is done

This package provides a [`High Order Component`](https://reactjs.org/docs/higher-order-components.html) called [`withDeferRender`](./src/withDeferRender.js) and it is responsible about deferring your component.
And a [`Context Provider`](https://reactjs.org/docs/context.html#contextprovider) called [`DeferRenderProvider`](./src/DeferRenderProvider.js) which is optional and is used if you want to manage a bunch of deferred components.

I tried to comment almost each expression of code for people looking to read the source code.
## How it works
1. The standalone mode: This means, each of your components is working independently out of context.
Technically, in the first render, we render nothing or a fallback that can be used as a placeholder. and then we request an animation frame from the browser, when granted, we render the component.

2. The context mode: This means that a lot of your components' deferring is managed by a context.
This mode works like the standalone, except that there are a lot of components managed by the context, so they all obey the current deferring mode.

## Use cases

- Drastically reduce user's time to interaction when the tree is relatively huge
- Pause and resume render on-demand
- Defer the render of invisible tabs
- Defer render of trees outside the viewport
- When a list is huge/complex and you have to paint it entirely (ie: more than 20000 html tags in total), the first render may feel laggy and the user won't be able to interact with some elements until the whole work is done
- The pause and resume feature could be used to easily manage a deferred infiniteScroll list

## Usage and props

### Using the HOC

The hoc just wraps your initial component.

```jsx
import { withDeferRender } from 'react-deffer-renderer'

// WrappedComponent: a React Component
// config: an object accepting only `fallback` property that is a React element
const DeferredComponent = withDeferRender(WrappedComponent, config);
```

### Using the Provider
The Provider, like any react context provider, needs to be in the right place wrapping your tree
```jsx
import { DeferRenderProvider } from 'react-deffer-renderer'

<DeferRenderProvider delay={10} batchSize={5} mode="sync">
  <AppTreeThatContainsSomeDeferredComponents />
</DeferRenderProvider>

```

|Prop         | PropType                                          | Default value                    | Usage            |
|-------------|---------------------------------------------------|----------------------------------|------------------|
|`mode`       | `oneOf(['sync', sequential', 'async-concurrent])` | `sync`                           | Represents the context deferring mode
|`delay`      | `number`                                          | `0`                              | The delay in ms after which the component is granted the render
|`batchSize`  | `number`                                          | `deferred components count`      | In sync and async-concurrent modes, it batches renders

## Context Deferring Modes

1. `sync`: The sync mode will grant the render to the `batchSize` components and are painted synchronously at the same time.

2. `sequential`: The sequential mode will render component after component following the order of subscription.

3. `async-concurrent`: The sync mode will grant the render to the `batchSize` components with an asynchronous behavior, the paint order will managed by react internals.

## TODO and road-map

1. Write a lot of tests for the project. I have not wrote them yet because I had just the idea that was complex at first, and I still do not have a complete overview of how the complete version of the product will look like.
2. Exclude `register`, `next` and `cleanUp` from `DeferContext`, because they are meant for internal use.
3. When pausing a work that has been granted but the delay has not being resolved yet, the work should be interrupted immediately.
4. Support `props` resolve to defer the render of a component until some props has same exact values.
5. Support `Promise` resolve to defer the render until a promise resolves.

### Other examples
```jsx

import LongTabContentForm from './path'
import { withDeferRender } from 'react-deffer-renderer'

const DeferredComponent = withDeferRender(LongTabContentForm)
const DeferredComponent = withDeferRender(LongTabContentForm, { fallback: <Spinner /> })

// ...

<DeferredComponent />
```
---
```jsx

import MyComponent from './path'
import { DeferRenderProvider } from 'react-deffer-renderer'

// ...

<DeferRenderProvider >
  // <App />
  // <Section />
  // <SideBar />
</DeferRenderProvider>

<DeferRenderProvider
  delay={20}
  batchSize={20}
  mode="async-concurrent|sync|sequential"
  >
  <App />
  <Section />
  <SideBar />
</DeferRenderProvider>
```
## More on provider

The defer provider puts in context value the following functions:

|Function     |Should be used ? |args             | Usage
|-------------|-----------------|-----------------|--------------------------------------------------
|`register`   |`NO`             |`A callback`     | Registers a callback to be called after the animation granted is called depending from the deferring mode. returns the internal id of the work
|`cleanUp`    |`NO`             |`work id`        | takes the work id, interrupts it and then removes it
|`next`       |`NO`             |`N/A`            | will inform the provider to pass to the next deferred work (depends highly from the internal work status and the deferred mode)
|`pause`      |`YES`            |`N/A`            | Will set the provider work status to paused, so it will stop granting the render for other components
|`resume`     |`YES`            |`N/A`            | Will ask the provider to resume the rendering work

```jsx
import { DeferContext } from 'react-deffer-renderer'

function Commander() {
  const { pause, resume } = React.useContext(DeferContext)
  return (
    <div>
      <Button onClick={pause}>pause</Button>
      <Button onClick={resume}>resume</Button>
    </div>
  )
}
```

## License

MIT © [incepter](https://github.com/incepter)
