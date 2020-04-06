import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import GameIntro from './GameIntro'
import GameRound from './GameRound'

export default (state, actions) => h('div', {
  class: 'game',
  oncreate: () => {
    console.log('game', state)
  }
}, [
  h(Route, {
    path: '/game/intro',
    render: () => GameIntro(state, actions)
  }),
  h(Route, {
    path: '/game/round',
    render: () => GameRound(state, actions)
  })
])
