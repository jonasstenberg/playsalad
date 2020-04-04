import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'player-list flex' }, [
  h('div', { class: 'player-list__teams' }, [
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--red' }, 'Team red'),
      h('ul', { class: 'player-list__players' }, [
        h('li', { class: 'player-list__player' }, 'Corona')
      ])
    ]),
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--blue' }, 'Team blue'),
      h('ul', { class: 'player-list__players' }, [
        h('li', { class: 'player-list__player' }, 'Tegnell')
      ])
    ])
  ]),
  h('div', { class: 'player-list__waiting' }, 'waiting for other players to join...'),
  h('button', { class: 'button button--blue' }, 'Throw in names'),
  h('button', { class: 'button button--orange' }, 'Start game')
])
