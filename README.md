# react-deffer-renderer

> Render components asynchronously and non blocking

[![NPM](https://img.shields.io/npm/v/react-deffer-renderer.svg)](https://www.npmjs.com/package/react-deffer-renderer) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## This is just a draft, the code isn't there. I am just noting my ideas and looking for contributors

## What is this

Defer the render of your react component(tree) after the first paint.
This increases the time by which the user can interact with the app in general since it wait until paint is done, then request idle callback to tell react it's ok to render that tree

`withDeferRender` is a HOC that decorate your tree adding this capability:
- It renders nothing (`null`) in this first render
- Then register to the render-ability event (when used in a `DeferContextProvider` it's the register function, or else the `standaloneRegister`)
- When the event succeeds (behind the scene, it's either `requestAnimationFrame` or `requestIdleCallback`), the component/tree is rendered.
- Also, a cleanUp event occurs when unmounted to unsubscribe from registration
- A config object is passed to the HOC and support these keys `{ fallback: ReactElement = null, delay: number = 0 }`
- When in a context, it will support different modes:
    - Sequential: No matter how many deferred trees, they will appear in subscription order one after one after a `delay`
    - Async-concurrent: Triggers the render of `bachSize = workQueue.length` of trees in an async approach
    - Sync: Will trigger the render of `batchSize = workQueue.length` of trees in a sync way: render a batch, paint it, then render another one...
- In a context, your can `pause` and `resume` the work
## Use cases

- Time to user interaction in complex trees is reduced drastically
- Defer the render of invisible tabs
- Defer render of trees outside the viewport
- When a list is huge/complex and you have to paint it entirely (ie: 800 inputs, 2000 divs ...), the first render may feel laggy and the user won't be able to interact with some elements until the whole work is done 
- The pause and resume feature could be used to easily manage a deferred infiniteScroll list easily 


## License

MIT © [incepter](https://github.com/incepter)
