import { h } from 'hyperapp'

import { timeout } from '../config'

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
      console.log('gameround', state)
    }
  }, [
    h('div', { class: 'game-round__round caption' }, `Round ${state.room.activeRound}`),
    h('h4', { class: 'game-round__heading' }, `Round ${state.games[state.room.activeRound].name}`),
    (() => {
      if (!state.room.endTime) {
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
        state.room.endTime
          ? h('span', { class: `game-round__word ${state.clientId !== state.room.activePlayer ? ' game-round__word--blurred' : ''}` }, state.room.activeWord)
          : '',
        state.clientId === state.room.activePlayer && state.room.endTime
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
            class: `game-round__current-team-logo ${state.room.endTime ? 'game-round__current-team-logo--small' : ''}`
          }),
          h('div', { class: `game-round__current-team-player game-round__current-team-player--${activePlayer.team} ${state.room.endTime ? 'game-round__current-team-player--small' : ''}` }, `${activePlayer.name}`)
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
          ? state.clientId === state.room.activePlayer
            ? [
              h('div', { class: 'game-round__ready' }, 'Are you ready?'),
              h('button', {
                class: 'button button--orange',
                onclick: async () => {
                  console.log('starting turn')
                  const endTime = new Date()
                  endTime.setSeconds(endTime.getSeconds() + timeout)

                  await actions.updateRoom({
                    saladBowl: state.room.saladBowl,
                    endTime,
                    gameState: state.room.gameState
                  })
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
