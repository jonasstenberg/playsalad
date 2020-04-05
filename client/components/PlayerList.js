import { h } from 'hyperapp'

const startGameEnabled = (state) => {
  if (!state.room || !state.room.players) {
    return false
  }
  const allHasThrownNotes = Object.keys(state.room.players).every(playerId => state.room.players[playerId].notes && state.room.players[playerId].notes.length)

  return allHasThrownNotes && Object.keys(state.room.players).length > 1
}

export default (state, actions) => h('div', { class: 'player-list flex' }, [
  h('div', {
    class: 'player-list__teams'
  }, [
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--red caption' }, 'Team fire'),
      h('ul', { class: 'player-list__players' }, [
        state.room && state.room.players && Object.keys(state.room.players).length
          ? state.room.team1.map((playerId) => {
            return h('li', { class: `player-list__player${playerId === state.room.ownerId ? ' player-list__player-owner' : ''}` }, state.room.players[playerId].notes ? 'yes' : 'no', state.room.players[playerId].name)
          })
          : null
      ])
    ]),
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--blue caption' }, 'Team ice'),
      h('ul', { class: 'player-list__players' }, [
        state.room && state.room.players && Object.keys(state.room.players).length
          ? state.room.team2.map((playerId) => {
            return h('li', { class: `player-list__player${playerId === state.room.ownerId ? ' player-list__player-owner' : ''}` }, state.room.players[playerId].notes ? 'yes' : 'no', state.room.players[playerId].name)
          })
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
      class: `button button--orange ${startGameEnabled(state) ? '' : 'button--disabled'}`,
      disabled: !startGameEnabled(state),
      oncreate: () => state.room && state.room.players ? console.log(Object.keys(state.room.players).length) : ''
    }, 'Start game')
    : null
])
