import { h } from 'hyperapp'

import { debug } from '../config'

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
    h('div', { class: 'game__close-wrapper' }, [
      state.clientId === state.room.activePlayer
        ? h('button', {
          class: 'game__end-turn',
          onclick: async () => {
            await actions.endTurn({
              action: 'endturn',
              gameState: 'score'
            })
          }
        }, [
          h('img', {
            class: 'game__end-turn-image',
            src: '/images/end-turn.svg'
          }),
          h('span', {}, 'End turn')
        ])
        : '',
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
    activePlayer
      ? [
        h('span', {
          class: `game-round__word ${state.clientId !== state.room.activePlayer ? ' game-round__word--blurred' : ''}`
        }, state.room.activeWord),
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
        h('div', { class: 'game__player-wrapper' }, [
          h('img', {
            src: `/images/${activePlayer.team}.svg`,
            class: 'game__current-team-logo game__current-team-logo--small'
          }),
          h('h3', {
            class: `game-round__current-team-player game-round__current-team-player--${activePlayer.team} ${state.room.endTime ? 'game-round__current-team-player--small' : ''}`
          }, `${activePlayer.name}`)
        ]),
        (() => {
          return [
            h('h2', {
              class: 'game-round__time-remaining',
              oncreate: () => {
                if (debug) {
                  console.log('oncreate')
                }
              }
            }, state.timeRemaining >= 0 && state.player.endTime ? `${formatTimeRemaining(state.timeRemaining)}` : '0:00'),
            state.clientId === state.room.activePlayer
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
              }, [
                h('img', {
                  src: '/images/skip.svg',
                  class: 'game-round__skip-image'
                }),
                `Skip (${state.room.skips})`
              ])
              : ''
          ]
        })()
      ]
      : ''
  ])
}
