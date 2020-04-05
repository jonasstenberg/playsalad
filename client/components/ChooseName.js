import { h } from 'hyperapp'
import fetch from '../utils/pseudo-fetch'
import playerNameList from '../data/player-name-list'

import { backendBaseUrl } from '../config'

const randomName = playerNameList[Math.floor(Math.random() * playerNameList.length)]

export default (state, actions) => h('div', { class: 'choose-name flex' },
  state.room && state.room.roomId ? [
    h('h3', {
      class: 'choose-name__heading'
    }, 'What may we call you?'),
    h('input', {
      class: 'choose-name__input input',
      placeholder: randomName,
      oncreate: () => actions.setPlayerName(randomName),
      oninput: evt => {
        if (evt.target.value) {
          actions.setPlayerName(evt.target.value)
        } else {
          actions.setPlayerName(randomName)
        }
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
  ] : '')
