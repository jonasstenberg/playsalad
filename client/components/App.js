import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import CreateJoin from './CreateJoin'
import Lobby from './Lobby'
import Rules from './Rules'

export default (state, actions) => h('div', {}, [
  h(Route, {
    path: '/',
    render: () => CreateJoin(state, actions)
  }),
  h(Route, {
    path: '/lobby/',
    parent: true,
    render: () => Lobby(state, actions)
  }),
  h(Route, {
    path: '/rules/',
    render: () => Rules(state, actions)
  })
])
