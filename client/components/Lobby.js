import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import ChooseName from './ChooseName'
import PlayerList from './PlayerList'
import ThrowNames from './ThrowNames'

export default (state, actions) => h('div', {
  class: 'lobby flex',
  oncreate: () => {
    if (!state.room || !state.room.roomId) {
      actions.location.go('/')
    }
  }
}, [
  h('div', { class: 'lobby__header' }, [
    h('div', { class: 'lobby__heading caption' }, 'Game Room'),
    h('h1', { class: 'lobby__heading' }, state.room && state.room.roomId ? state.room.roomId : null)
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
  state.room && state.room.players && state.room.players[state.playerId] && !state.room.players[state.playerId].notes
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
