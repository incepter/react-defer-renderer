import React from 'react'
import * as PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import { withDeferRender } from 'react-deffer-renderer'
import Fade from '@material-ui/core/Fade'

function StandaloneInput({ value }) {
  const [inputVal, setInputVal] = React.useState(value)
  function changeValue({ target: { value } }) {
    setInputVal(value)
  }
  return <input value={inputVal} style={{ width: '100%' }} onChange={changeValue} />
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
    // eslint-disable-next-line no-undef
    fetch('https://jsonplaceholder.typicode.com/todos')
      .then(res => res.json())
      .then(setTodos)
  }, [renderRef.current])
  console.log('got todos', todos)
  return (
    <Grid style={{ flexFlow: 'wrap-reverse' }} container>
      {todos.sort((a, b) => b.id - a.id).map(todo => <DeferredTodo key={`${renderRef.current}-${todo.id}`} {...todo} />)}
    </Grid>
  )
}

export default Todos
