import { h } from 'hyperapp'

import Player from './Player'

const startGameEnabled = (players) => {
  if (!players) {
    return false
  }
  const allHasThrownNotes = players.every(player => player.notes && player.notes.length)

  return allHasThrownNotes && Object.keys(players).length > 3
}

export default (state, actions) => h('div', { class: 'player-list flex' }, [
  h('div', {
    class: 'player-list__teams'
  }, [
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--fire caption' }, [
        h('img', {
          src: '/images/fire.svg',
          class: 'player-list__team-logo'
        }),
        'Team fire'
      ]),
      h('ul', { class: 'player-list__players' }, [
        state.players && state.players.length
          ? state.players.filter(player => player.team === 'fire').map((player) => Player(state, actions, player))
          : null
      ])
    ]),
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--ice caption' }, [
        h('img', {
          src: '/images/ice.svg',
          class: 'player-list__team-logo'
        }),
        'Team ice'
      ]),
      h('ul', { class: 'player-list__players' }, [
        state.players && state.players.length
          ? state.players.filter(player => player.team === 'ice').map((player) => Player(state, actions, player))
          : null
      ])
    ])
  ]),
  h('div', { class: 'player-list__waiting caption' }, 'waiting for other players to join...'),
  h('button', {
    class: `button button--blue ${state.player && state.player.notes ? 'button--disabled' : ''}`,
    disabled: state.player && state.player.notes ? state.player.notes : false,
    onclick: () => actions.location.go('/lobby/throw-names')
  }, 'Throw in names'),
  state.clientId === state.room.ownerId
    ? h('button', {
      class: `button button--orange ${state.players && startGameEnabled(state.players) ? '' : 'button--disabled'}`,
      disabled: state.players && !startGameEnabled(state.players),
      onclick: () => {
        actions.startGame({
          clientId: state.clientId,
          roomId: state.room.roomId
        })
      }
    }, 'Start game')
    : null
])
