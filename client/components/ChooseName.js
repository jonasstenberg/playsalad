import { h } from 'hyperapp'
import fetch from '../utils/pseudo-fetch'

import { backendBaseUrl } from '../config'

export default (state, actions) => h('div', { class: 'choose-name flex' }, [
  h('h3', {
    class: 'choose-name__heading'
  }, 'What may we call you?'),
  h('input', {
    class: 'choose-name__input input',
    placeholder: 'Cucumber',
    oninput: evt => {
      actions.setPlayerName(evt.target.value)
    }
  }),
  h('button', {
    class: 'button button--orange',
    onclick: async () => {
      await fetch(`${backendBaseUrl}/player`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: state.playerId,
          playerName: state.playerName,
          roomId: state.room.roomId
        })
      })

      actions.location.go('/lobby/player-list/')
    }
  }, 'Join')
])
