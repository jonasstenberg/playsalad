import { h } from 'hyperapp'

import { debug } from '../config'

const teamScore = (players, team) => players
  .reduce((acc, player) => {
    if (player.team === team) {
      acc += player.score
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
  const activePlayer = state.players.find(p => p.clientId === state.room.activePlayer)

  return h('div', {
    class: 'game-round',
    oncreate: () => {
      if (debug) {
        console.log('gameround', state)
      }
    }
  }, [
    h('div', { class: 'game-round__round caption' }, `Round ${state.room.activeRound}`),
    h('h4', { class: 'game-round__heading' }, `Round ${state.games[state.room.activeRound].name}`),
    (() => {
      if (!state.player.endTime) {
        return h('div', { class: 'game-round__scores' }, [
          h('div', { class: 'game-round__score-wrapper' }, [
            h('div', { class: 'game-round__team--fire caption' }, [
              h('img', {
                src: '/images/fire.svg',
                class: 'game-round__team-logo'
              }),
              'Team fire'
            ]),
            h('div', { class: 'game-round__score' }, teamScore(state.players, 'fire'))
          ]),
          h('div', { class: 'game-round__score-wrapper' }, [
            h('div', { class: 'game-round__team--ice caption' }, [
              h('img', {
                src: '/images/ice.svg',
                class: 'game-round__team-logo'
              }),
              'Team ice'
            ]),
            h('div', { class: 'game-round__score' }, teamScore(state.players, 'ice'))
          ])
        ])
      }
    })(),
    activePlayer
      ? [
        state.player.endTime
          ? h('span', { class: `game-round__word ${state.clientId !== state.room.activePlayer ? ' game-round__word--blurred' : ''}` }, state.room.activeWord)
          : '',
        state.clientId === state.room.activePlayer && state.player.endTime
          ? h('button', {
            class: 'button button--orange',
            onclick: async () => {
              await actions.correctGuess({
                clientId: state.room.activePlayer,
                roomId: state.room.roomId,
                skip: false
              })
            }
          }, 'Correct!')
          : '',
        h('div', { class: 'game-round__player-wrapper' }, [
          h('img', {
            src: `/images/${activePlayer.team}.svg`,
            class: `game-round__current-team-logo ${state.player.endTime ? 'game-round__current-team-logo--small' : ''}`
          }),
          h('div', { class: `game-round__current-team-player game-round__current-team-player--${activePlayer.team} ${state.room.endTime ? 'game-round__current-team-player--small' : ''}` }, `${activePlayer.name}`)
        ]),
        state.player.endTime
          ? state.timeRemaining >= 0
            ? h('div', {
              oncreate: () => {
                if (debug) {
                  console.log('oncreate')
                }
              }
            }, `${formatTimeRemaining(state.timeRemaining)}`)
            : ''
          : h('div', { class: 'game-round__zero' }, '1:00'),
        !state.player.endTime
          ? state.clientId === state.room.activePlayer
            ? [
              h('div', { class: 'game-round__ready' }, 'Are you ready?'),
              h('button', {
                class: 'button button--orange',
                onclick: async () => {
                  if (debug) {
                    console.log('starting turn')
                  }
                  await actions.broadcast('setTimer')
                }
              }, 'Start your turn')
            ]
            : h('div', {}, `${activePlayer.name} is up next`)
          : state.clientId === state.room.activePlayer
            ? h('span', {
              onclick: async () => {
                if (state.room.skips > 0) {
                  await actions.correctGuess({
                    clientId: state.room.activePlayer,
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
