import { h } from 'hyperapp'
import fetch from '../utils/pseudo-fetch'

import { backendBaseUrl } from '../config'

export default (state, actions) => h('div', {
  class: 'flex',
  oncreate: async () => {
    const res = await fetch(`${backendBaseUrl}/player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const json = await res.json()
    actions.setPlayerId(json.playerId)

    state.wsConnection.send(JSON.stringify({
      playerId: json.playerId
    }))
  }
}, [
  h('input', {
    class: 'input input--orange',
    oninput: evt => {
      actions.setGroupName(evt.target.value)
    }
  }),
  h('button', { class: 'button button--orange' }, 'Enter'),
  h('button', {
    class: 'button button--blue',
    onclick: async () => {
      const res = await fetch(`${backendBaseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: state.playerId
        })
      })
      const json = await res.json()
      console.log(json)
      actions.setRoomId(json.roomId)
      actions.location.go('/lobby/choose-name')
    }
  }, 'Create new')
])
