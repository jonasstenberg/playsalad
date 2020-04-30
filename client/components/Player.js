import { h } from 'hyperapp'

export default (state, playerId) => h('li', {
  class: `player-list__player
    ${playerId === state.playerId ? ' player-list__player--current' : ''}
    ${playerId === state.room.ownerId ? ' player-list__player--host' : ''}`
}, [
  state.room.players[playerId].notes ? h('img', {
    src: '/images/checkmark.svg',
    class: 'player-list__player--check'
  }) : '',
  h('span', {}, state.room.players[playerId].name),
  playerId === state.room.ownerId
    ? h('img', { src: '/images/chef.svg', class: 'player-list__host-image' })
    : null
])
