import React from 'react'

/**
 * This is the defer context that developers will be able to consume
 * It provides pause and resume features
 * @type {React.Context<null>}
 */
const DeferContext = React.createContext(null)

/**
 * Will provide features meant to be used internally
 * Like register, cleanUp and next
 * @type {React.Context<null>}
 */
export const InternalDeferContext = React.createContext(null)

export default DeferContext
