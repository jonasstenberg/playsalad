import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import ChooseName from './ChooseName'
import PlayerList from './PlayerList'

export default (state, actions) => {
  return h('div', { class: 'lobby flex' }, [
    h('div', { class: 'lobby__header' }, [
      h('div', { class: 'lobby__heading caption' }, 'Game Room'),
      h('h1', { class: 'lobby__heading' }, 'QXZ2D')
    ]),
    h(Route, {
      path: '/lobby/choose-name',
      render: () => ChooseName(state, actions)
    }),
    h(Route, {
      path: '/lobby/player-list',
      render: () => PlayerList(state, actions)
    })
  ])
}
