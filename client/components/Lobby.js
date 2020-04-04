import { h } from 'hyperapp'
import { Route } from '@hyperapp/router'

import ChooseName from './ChooseName'

export default (state, actions) => {
  return h('div', { class: 'lobby flex' }, [
    h('div', { class: 'lobby__header' }, [
      h('div', { class: 'caption' }, 'Game Room'),
      h('h1', { }, 'QXZ2D')
    ]),
    h(Route, {
      path: '/lobby/choose-name',
      render: () => ChooseName(state, actions)
    }),
    h(Route, {
      path: '/lobby/list',
      render: () => ChooseName(state, actions)
    })
  ])
}
