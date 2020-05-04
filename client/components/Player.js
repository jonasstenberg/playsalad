import { h } from 'hyperapp'

export default (state, actions, player) => h('li', {
  class: `player-list__player
    ${player.clientId === state.clientId ? ' player-list__player--current' : ''}
    ${player.clientId === state.room.ownerId ? ' player-list__player--host' : ''}`
}, [
  player.notes ? h('img', {
    src: '/images/checkmark.svg',
    class: 'player-list__player--check'
  }) : '',
  h('span', {}, player.name),
  player.clientId === state.room.ownerId
    ? h('img', { src: '/images/chef.svg', class: 'player-list__host-image' })
    : null,
  state.clientId === state.room.ownerId
    ? h('button', {
      class: 'player-list__switch',
      onclick: async () => {
        await actions.updatePlayer({
          clientId: player.clientId,
          team: player.team === 'fire' ? 'ice' : 'fire'
        })
      }
    }, h('img', { src: '/images/switch.svg', class: 'player-list__switch-image' }))
    : null
])
