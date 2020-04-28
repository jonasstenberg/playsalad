import { h } from 'hyperapp'

import { timeout } from '../config'

const teamScore = (players, team) => Object.keys(players)
  .reduce((acc, playerId) => {
    if (players[playerId].team === team) {
      acc += players[playerId].score
    }
    return acc
  }, 0)

const formatTimeRemaining = (timeRemaining) => {
  const minutes = Math.floor(timeRemaining / 60)
  let seconds = timeRemaining - minutes * 60
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  return `${minutes}:${seconds}`
}

export default (state, actions) => {
  return h('div', {
    class: 'game-round',
    oncreate: () => {
      console.log('gameround', state)
    }
  }, [
    h('div', { class: 'game-round__round caption' }, `Round ${state.room.activeRound}`),
    h('h4', { class: 'game-round__heading' }, `Round ${state.games[state.room.activeRound].name}`),
    !state.room.endTime
      ? h('div', { class: 'game-round__scores' }, [
        h('div', { class: 'game-round__score-wrapper' }, [
          h('div', { class: 'game-round__team--fire caption' }, [
            h('img', {
              src: '/images/fire.svg',
              class: 'game-round__team-logo'
            }),
            'Team fire'
          ]),
          h('div', { class: 'game-round__score' }, teamScore(state.room.players, 'fire'))
        ]),
        h('div', { class: 'game-round__score-wrapper' }, [
          h('div', { class: 'game-round__team--ice caption' }, [
            h('img', {
              src: '/images/ice.svg',
              class: 'game-round__team-logo'
            }),
            'Team ice'
          ]),
          h('div', { class: 'game-round__score' }, teamScore(state.room.players, 'ice'))
        ])
      ])
      : '',
    Object.keys(state.room.players).includes(state.room.activePlayer)
      ? [
        state.room.endTime
          ? h('span', { class: `game-round__word ${state.playerId !== state.room.activePlayer ? ' game-round__word--blurred' : ''}` }, state.room.activeWord)
          : '',
        state.playerId === state.room.activePlayer && state.room.endTime
          ? h('button', {
            class: 'button button--orange',
            onclick: async () => {
              await actions.correctGuess({
                playerId: state.room.activePlayer,
                roomId: state.room.roomId,
                skip: false
              })
            }
          }, 'Correct!')
          : '',
        h('div', { class: 'game-round__player-wrapper' }, [
          h('img', {
            src: `/images/${state.room.players[state.room.activePlayer].team}.svg`,
            class: `game-round__current-team-logo ${state.room.endTime ? 'game-round__current-team-logo--small' : ''}`
          }),
          h('div', { class: `game-round__current-team-player game-round__current-team-player--${state.room.players[state.room.activePlayer].team} ${state.room.endTime ? 'game-round__current-team-player--small' : ''}` }, `${state.room.players[state.room.activePlayer].name}`)
        ]),
        state.room.endTime
          ? state.timeRemaining >= 0
            ? h('div', {
              oncreate: () => {
                console.log('oncreate')
              }
            }, `${formatTimeRemaining(state.timeRemaining)}`)
            : ''
          : h('div', { class: 'game-round__zero' }, '00:00'),
        !state.room.endTime
          ? state.playerId === state.room.activePlayer
            ? [
              h('div', { class: 'game-round__ready' }, 'Are you ready?'),
              h('button', {
                class: 'button button--orange',
                onclick: async () => {
                  console.log('starting turn')
                  const endTime = new Date()
                  endTime.setSeconds(endTime.getSeconds() + timeout)

                  await actions.updateRoom({
                    name: state.room.players[state.playerId].name,
                    salladBowl: state.room.salladBowl,
                    endTime,
                    gameState: state.room.gameState
                  })
                }
              }, 'Start your turn')
            ]
            : h('div', {}, `${state.room.players[state.room.activePlayer].name} is up next`)
          : state.playerId === state.room.activePlayer
            ? h('span', {
              onclick: async () => {
                if (state.room.skips > 0) {
                  await actions.correctGuess({
                    playerId: state.room.activePlayer,
                    roomId: state.room.roomId,
                    skip: true
                  })
                }
              }
            }, `Skip ${state.room.skips}`)
            : ''
      ]
      : ''
  ])
}
