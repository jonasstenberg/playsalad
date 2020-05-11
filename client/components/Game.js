import { h } from 'hyperapp'

import GameIntro from './GameIntro'
import GameRound from './GameRound'
import GameOver from './GameOver'
import TimesUp from './TimesUp'
import EmptyBowl from './EmptyBowl'

import { debug } from '../config'

export default (state, actions) => {
  if (!state.room || !state.players) {
    actions.location.go('/')
  }
  return h('div', {
    class: 'game',
    oncreate: () => {
      if (debug) {
        console.log('game', state)
      }
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
      case 'gameover':
        return GameOver(state, actions)
      default:
        actions.location.go('/')
        break
    }
  })())
}
