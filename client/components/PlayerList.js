import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'player-list flex' }, [
  h('div', { class: 'player-list__teams' }, [
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--red caption' }, 'Team red'),
      h('ul', { class: 'player-list__players' }, [
        state.room && state.room.players && Object.keys(state.room.players).length
          ? state.room.team1.map((playerId) => {
            return h('li', { class: `player-list__player${playerId === state.room.ownerId ? ' player-list__player-owner' : ''}` }, state.room.players[playerId])
          })
          : null
      ])
    ]),
    h('div', { class: 'player-list__team' }, [
      h('div', { class: 'player-list__team-name player-list__team-name--blue caption' }, 'Team blue'),
      h('ul', { class: 'player-list__players' }, [
        state.room && state.room.players && Object.keys(state.room.players).length
          ? state.room.team2.map((playerId) => {
            return h('li', { class: `player-list__player${playerId === state.room.ownerId ? ' player-list__player-owner' : ''}` }, state.room.players[playerId])
          })
          : null
      ])
    ])
  ]),
  h('div', { class: 'player-list__waiting caption' }, 'waiting for other players to join...'),
  h('button', {
    class: 'button button--blue',
    onclick: () => actions.location.go('/lobby/throw-names')
  }, 'Throw in names'),
  h('button', { class: 'button button--orange button--disabled', disabled: 'true' }, 'Start game')
])
