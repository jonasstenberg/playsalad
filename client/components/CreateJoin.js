import { h } from 'hyperapp'
import fetch from '../utils/pseudo-fetch'

import { backendBaseUrl } from '../config'

export default (state, actions) => h('div', {
  class: 'create-join flex',
  oncreate: () => {
    actions.setRoom({
      roomId: ''
    })
    actions.setErrorText('')
  }
}, [
  h('img', { src: '/images/logo-orange.svg' }),
  h('input', {
    class: 'create-join__input input input--orange',
    placeholder: 'Game PIN',
    oninput: evt => {
      if (evt.target.value.length <= 4) {
        actions.setRoom({
          roomId: evt.target.value
        })
      }
    }
  }),
  state.errorText ? h('span', {}, state.errorText) : '',
  h('button', {
    class: 'button button--orange',
    onclick: async () => {
      const res = await fetch(`${backendBaseUrl}/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: state.room.roomId,
          playerId: state.playerId
        })
      })

      if (res.status === 404) {
        console.log('no room with that id')
        actions.setErrorText('No Game with that PIN')
        return
      }
      actions.location.go('/lobby/choose-name')
    }
  }, 'Enter'),
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
      actions.setRoom(json)
      actions.location.go('/lobby/choose-name')
    }
  }, 'Create new')
])
