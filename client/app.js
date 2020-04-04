import { h, app } from 'hyperapp'
import { Route, location } from '@hyperapp/router'
import state from './state'
import actions from './actions'

import CreateJoin from './components/CreateJoin'
import Lobby from './components/Lobby'

const main = app(
  state,
  actions,
  (state, actions) => h('div', {}, [
    h(Route, {
      path: '/',
      render: () => CreateJoin(state, actions)
    }),
    h(Route, {
      path: '/lobby/',
      parent: true,
      render: () => Lobby(state, actions)
    })
  ]),
  document.getElementById('app')
)

location.subscribe(main.location)
