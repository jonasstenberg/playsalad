import { h } from 'hyperapp'

import { debug } from '../config'

export default (state, actions) => h('div', {
  class: 'create-join flex',
  oncreate: () => {
    actions.setRoom({
      roomId: ''
    })
    actions.setErrorText('')
  }
}, [
  h('div', { class: 'create-join__join' }, [
    h('img', { src: '/images/logo-orange.svg' }),
    h('p', { class: 'create-join__brag caption' }, 'Millions of games played worldwide'),
    h('input', {
      class: 'create-join__input input input--orange',
      placeholder: 'Game PIN',
      oninput: evt => {
        if (evt.target.value.length <= 4) {
          actions.setRoom({
            roomId: evt.target.value.toUpperCase()
          })
        }
      }
    }),
    state.errorText ? h('span', {}, state.errorText) : '',
    h('button', {
      class: 'button button--orange',
      onclick: async () => {
        try {
          await actions.joinRoom({
            clientId: state.clientId,
            roomId: state.room.roomId
          })

          actions.location.go('/lobby/choose-name')
        } catch (err) {
          if (debug) {
            console.log('no room with that id')
          }
          actions.setErrorText('No Game with that PIN')
        }
      }
    }, 'Enter')
  ]),
  h('div', { class: 'create-join__create' },
    h('button', {
      class: 'button button--blue',
      onclick: async () => {
        await actions.createRoom(state.clientId)

        actions.location.go('/lobby/choose-name')
      }
    }, 'Create new')
  ),
  h('div', {
    class: 'create-join__rules',
    onclick: () => {
      actions.location.go('/rules')
    }
  }, [
    h('img', { src: '/images/rule-book.svg' }),
    h('span', { class: 'create-join__rules-text' }, 'Game rules'),
    h('img', {
      src: '/images/arrow-right.svg',
      class: 'create-join__rules-arrow'
    })
  ])
])
