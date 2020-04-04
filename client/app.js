import { h, app } from 'hyperapp'
import { Route } from '@hyperapp/router'
import state from './state/index'
import actions from './actions/index'

import CreateJoin from './components/CreateJoin.js'

app(
  state,
  actions,
  h('div', {}, [
    h(Route, {
      path: '/',
      render: () => CreateJoin(state, actions)
    })
  ]),
  document.getElementById('app')
)
