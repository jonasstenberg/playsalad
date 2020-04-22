import { h } from 'hyperapp'

import GameIntro from './GameIntro'
import GameRound from './GameRound'
import TimesUp from './TimesUp'
import Done from './Done'

export default (state, actions) => {
  if (!state.room || !state.room.players) {
    actions.location.go('/')
  }
  return h('div', {
    class: 'game',
    oncreate: () => {
      console.log('game', state)
    }
  }, (() => {
    switch (state.room.gameState) {
      case 'intro':
        return GameIntro(state, actions)
      case 'round':
        return GameRound(state, actions)
      case 'timeout':
        return TimesUp(state, actions)
      case 'done':
        return Done(state, actions)
      default:
        actions.location.go('/')
        break
    }
  })())
}
