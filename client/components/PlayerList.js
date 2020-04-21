import { h } from 'hyperapp'

import Player from './Player'

const startGameEnabled = (players) => {
  if (!players) {
    return false
  }
  const allHasThrownNotes = Object.keys(players).every(playerId => players[playerId].notes && players[playerId].notes.length)

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
        state.room && state.room.players && Object.keys(state.room.players).length
          ? Object.keys(state.room.players).filter(playerId => state.room.players[playerId].team === 'fire').map((playerId) => Player(state, playerId))
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
        state.room && state.room.players && Object.keys(state.room.players).length
          ? Object.keys(state.room.players).filter(playerId => state.room.players[playerId].team === 'ice').map((playerId) => Player(state, playerId))
          : null
      ])
    ])
  ]),
  h('div', { class: 'player-list__waiting caption' }, 'waiting for other players to join...'),
  h('button', {
    class: `button button--blue ${state.room && state.room.players && state.room.players[state.playerId] && state.room.players[state.playerId].notes ? 'button--disabled' : ''}`,
    disabled: state.room && state.room.players && state.room.players[state.playerId] && state.room.players[state.playerId].notes ? state.room.players[state.playerId].notes : false,
    onclick: () => actions.location.go('/lobby/throw-names')
  }, 'Throw in names'),
  state.playerId === state.room.ownerId
    ? h('button', {
      class: `button button--orange ${state.room && state.room.players && startGameEnabled(state.room.players) ? '' : 'button--disabled'}`,
      disabled: state.room && state.room.players && !startGameEnabled(state.room.players),
      oncreate: () => state.room && state.room.players ? console.log(Object.keys(state.room.players).length) : '',
      onclick: () => {
        actions.startGame({
          playerId: state.playerId,
          roomId: state.room.roomId
        })
      }
    }, 'Start game')
    : null
])
