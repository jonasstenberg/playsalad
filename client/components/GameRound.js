import { h } from 'hyperapp'

const teamScore = (players, team) => Object.keys(players).reduce((acc, playerId) => {
  if (players[playerId].team === team) {
    acc += players[playerId].score
  }
  return acc
}, 0)

export default (state, actions) => {
  return h('div', {
    class: 'game',
    oncreate: () => {
      console.log('gameround', state)
    }
  }, [
    h('span', {}, `Round ${state.room.activeRound}`),
    h('h4', {}, `Round ${state.games[state.room.activeRound].name}`),
    h('span', {}, `Team fire: ${teamScore(state.room.players, 'fire')}`),
    h('span', {}, `Team ice: ${teamScore(state.room.players, 'ice')}`),
    state.room.endTime
      ? h('span', { class: `active--word ${state.playerId !== state.room.activePlayer ? ' blurred' : ''}` }, state.room.activeWord)
      : '',
    state.playerId === state.room.activePlayer && state.room.endTime
      ? h('button', {}, 'Correct!')
      : '',
    h('span', {}, `${state.room.players[state.room.activePlayer].team}`),
    h('span', {}, `${state.room.players[state.room.activePlayer].name}`),
    state.room.endTime
      ? h('span', {
        oncreate: () => {
          console.log('oncreate')
        }
      }, `started ${state.timeRemaining}`)
      : h('span', {}, '01:00'),
    !state.room.endTime
      ? state.playerId === state.room.activePlayer
        ? [
          h('button', {
            class: 'button button--orange',
            onclick: async () => {
              console.log('starting turn')
              const endTime = new Date()
              endTime.setSeconds(endTime.getSeconds() + 60)

              await actions.updateRoom({
                playerId: state.playerId,
                roomId: state.room.roomId,
                name: state.room.players[state.playerId].name,
                salladBowl: state.room.salladBowl,
                endTime
              })
            }
          }, 'Start your turn')
        ]
        : h('span', {}, `${state.room.players[state.room.activePlayer].name} is up next`)
      : ''
  ])
}
