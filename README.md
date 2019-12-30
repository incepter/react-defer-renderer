# react-deffer-renderer

> Render components asynchronously and non blocking

[![NPM](https://img.shields.io/npm/v/react-deffer-renderer.svg)](https://www.npmjs.com/package/react-deffer-renderer) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-deffer-renderer
```

## Usage

```jsx
import React, { Component } from 'react'

import { useMyHook } from 'react-deffer-renderer'

const Example = () => {
  const example = useMyHook()
  return (
    <div>{example}</div>
  )
}
```

## License

MIT © [incepter](https://github.com/incepter)
