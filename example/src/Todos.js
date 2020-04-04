import React from 'react'
import * as PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import { withDeferRender } from 'react-defer-renderer'

function range(size, startAt = 0) {
  return [...Array(size).keys()].map(i => i + startAt)
}

function StandaloneInput({ value }) {
  const [inputVal, setInputVal] = React.useState(value)
  function changeValue({ target: { value } }) {
    setInputVal(value)
  }
  return <input value={inputVal} style={{ width: '100%' }} onChange={changeValue} />
}
StandaloneInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

const useStyles = makeStyles({
  root: {
    padding: 16
  },
  wrapper: {
    minHeight: 80,
    maxHeight: 100,
    minWidth: 100,
    borderRadius: 8,
    padding: 24,
    fontSize: '1rem',
    alignItems: 'center',
    display: 'flex',
    fontFamily: 'Roboto'
  }
})

export function ToDo({ id, userId, title, completed }) {
  const classes = useStyles()
  return (
    <Grid
      item
      xs={12}
      md={4}
      lg={3}
      xl={1}
      className={classes.root}
    >
      <Grid
        item
        container
        className={classes.wrapper}
        style={{ backgroundColor: completed ? '#71f580' : '#fa6339' }}
      >
        <Grid item xs={12}>
          <StandaloneInput value={`${id}-${userId}`} />
        </Grid>
        <Grid item xs={12}>
          {title}
        </Grid>
      </Grid>
    </Grid>
  )
}

ToDo.propTypes = {
  id: PropTypes.number,
  userId: PropTypes.number,
  title: PropTypes.string,
  completed: PropTypes.bool
}

const DeferredTodo = withDeferRender(ToDo) //, { fallback: <CircularProgress /> })

function Todos() {
  const renderRef = React.useRef(0)
  const [todos, setTodos] = React.useState([])

  // React.useEffect(() => {
  //   renderRef.current++
  // })
  React.useEffect(() => {
    const allTodos = range(1000).map(t => ({
      id: t,
      userId: t,
      title: `This is the todo with index ${t}`,
      completed: Math.random() > 0.5
    }))
    setTodos(allTodos)
  }, [renderRef.current])
  return (
    <Grid style={{ flexFlow: 'wrap-reverse' }} container>
      {todos.sort((a, b) => b.id - a.id).map(todo => <DeferredTodo key={`${renderRef.current}-${todo.id}`} {...todo} />)}
    </Grid>
  )
}

export default Todos
