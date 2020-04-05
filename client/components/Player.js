import { h } from 'hyperapp'

export default (state, playerId) => h('li', {
  class: `player-list__player${playerId === state.playerId ? ' player-list__player--current' : ''}`
}, [
  state.room.players[playerId].notes ? h('img', {
    src: '/images/checkmark.svg',
    class: 'player-list__player--check'
  }) : '',
  h('span', {}, state.room.players[playerId].name)
])
