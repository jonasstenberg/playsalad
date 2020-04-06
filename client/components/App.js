import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import CreateJoin from './CreateJoin'
import Lobby from './Lobby'
import Game from './Game'
import Rules from './Rules'
import TimesUp from './TimesUp'

export default (state, actions) => h('main', {}, [
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
    path: '/game',
    parent: true,
    render: () => Game(state, actions)
  }),
  h(Route, {
    path: '/rules/',
    render: () => Rules(state, actions)
  }),
  // Temp routes for component dev
  h(Route, {
    path: '/times-up',
    render: () => TimesUp(state, actions)
  })
])
