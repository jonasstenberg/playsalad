import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'player-list flex' }, [
  h('div', { class: 'player-list__teams' }, [
    h('div', { class: 'player-list__team--red' }, [
      h('div', { class: 'player-list__waiting' }, 'Team red'),
      h('ul', { class: 'player-list__team' }, [
        h('li', { class: 'player-list__waiting' }, 'Corona')
      ])
    ]),
    h('div', { class: 'player-list__team--red' }, [
      h('div', { class: 'player-list__waiting' }, 'Team blue'),
      h('ul', { class: 'player-list__team' }, [
        h('li', { class: 'player-list__waiting' }, 'Tegnell')
      ])
    ])
  ]),
  h('div', { class: 'player-list__waiting' }, 'waiting for other players to join...'),
  h('button', { class: 'button button--blue' }, 'Submit names'),
  h('button', { class: 'button button--orange' }, 'Start game')
])
