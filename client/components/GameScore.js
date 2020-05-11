import { h } from 'hyperapp'

import { debug } from '../config'

const teamScore = (players, team) => players
  .reduce((acc, player) => {
    if (player.team === team) {
      acc += player.score
    }
    return acc
  }, 0)

export default (state, actions) => {
  const activePlayer = state.players.find(p => p.clientId === state.room.activePlayer)

  return h('div', {
    class: 'game-scores',
    oncreate: () => {
      if (debug) {
        console.log('gamescore', state)
      }
    }
  }, [
    h('div', { class: 'game__close-wrapper' }, [
      h('button', {
        class: 'game__close',
        onclick: async () => {
          await actions.leaveRoom()
          actions.location.go('/')
        }
      }, h('img', {
        class: 'game__close-image',
        src: '/images/close-black.svg'
      }))
    ]),
    h('div', { class: 'game__round caption' }, `Round ${state.room.activeRound}`),
    h('h4', { class: 'game__heading' }, state.games[state.room.activeRound].name),
    (() => {
      if (!state.player.endTime) {
        return h('div', { class: 'game-scores__scores' }, [
          h('div', { class: 'game-scores__wrapper' }, [
            h('div', { class: 'game__team--fire caption' }, [
              h('img', {
                src: '/images/fire.svg',
                class: 'game__team-logo'
              }),
              'Team fire'
            ]),
            h('div', { class: 'game-scores__score' }, teamScore(state.players, 'fire'))
          ]),
          h('div', { class: 'game-scores__wrapper' }, [
            h('div', { class: 'game__team--ice caption' }, [
              h('img', {
                src: '/images/ice.svg',
                class: 'game__team-logo'
              }),
              'Team ice'
            ]),
            h('div', { class: 'game-scores__score' }, teamScore(state.players, 'ice'))
          ])
        ])
      }
    })(),
    activePlayer
      ? [
        h('div', { class: 'game__player-wrapper' }, [
          h('img', {
            src: `/images/${activePlayer.team}.svg`,
            class: 'game__current-team-logo'
          }),
          h('h3', {
            class: `game-scores__current-team-player game__current-team-player--${activePlayer.team}`
          }, `${activePlayer.name}`)
        ]),
        (() => {
          return state.clientId === state.room.activePlayer
            ? [
              h('div', { class: 'game-score__ready' }, 'Are you ready?'),
              h('button', {
                class: 'button button--orange game-scores__start-turn',
                onclick: async () => {
                  if (debug) {
                    console.log('starting turn')
                  }
                  await actions.broadcast('setTimer')
                  await actions.updatePlayer({
                    gameState: 'round'
                  })
                }
              }, 'Start your turn')
            ]
            : h('div', {}, 'Is up next')
        })()
      ]
      : ''
  ])
}
