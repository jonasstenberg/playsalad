import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import ChooseName from './ChooseName'
import PlayerList from './PlayerList'
import ThrowNames from './ThrowNames'

export default (state, actions) => h('div', {
  class: 'lobby flex',
  oncreate: () => {
    if (!state.room || !state.room.roomId) {
      console.log('redirecting')
      actions.location.go('/')
    }
  }
}, [
  h('div', { class: 'lobby__header' }, [
    h('div', { class: 'lobby__heading caption' }, 'Game Room'),
    h('h1', { class: 'lobby__heading' }, state.room && state.room.roomId ? state.room.roomId : null),
    h('button', {
      class: 'lobby__close',
      onclick: async () => {
        await actions.leaveRoom()
        actions.location.go('/')
      }
    }, [
      h('img', {
        class: 'lobby__close-image',
        src: '/images/close.svg'
      }),
      h('div', { class: 'lobby__close-text' }, 'exit')
    ])
  ]),
  h(Route, {
    path: '/lobby/choose-name',
    render: () => ChooseName(state, actions)
  }),
  h(Route, {
    path: '/lobby/player-list',
    render: () => PlayerList(state, actions)
  }),
  h(Route, {
    path: '/lobby/throw-names',
    render: () => ThrowNames(state, actions)
  }),
  state.player && !state.player.notes
    ? h('span', {
      class: 'return',
      onclick: () => {
        window.history.go(-1)
      }
    }, [
      h('img', { src: '/images/return.svg' }),
      'Return'
    ])
    : null
])
