import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import ChooseName from './ChooseName'
import PlayerList from './PlayerList'

export default (state, actions) => {
  return h('div', { class: 'lobby flex' }, [
    h('div', { class: 'lobby__header' }, [
      h('div', { class: 'lobby__heading caption' }, 'Game Room'),
      h('h1', { class: 'lobby__heading' }, state.room.roomId)
    ]),
    h(Route, {
      path: '/lobby/choose-name',
      render: () => ChooseName(state, actions)
    }),
    h(Route, {
      path: '/lobby/player-list',
      render: () => PlayerList(state, actions)
    }),
    // TODO: Fix back link
    h('span', { class: 'return' }, 'Return')
  ])
}
