import { h } from 'hyperapp'

import GameIntro from './GameIntro'
import GameRound from './GameRound'
import TimesUp from './TimesUp'
import EmptyBowl from './EmptyBowl'

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
      case 'timesup':
        return TimesUp(state, actions)
      case 'done':
        return EmptyBowl(state, actions)
      default:
        actions.location.go('/')
        break
    }
  })())
}
