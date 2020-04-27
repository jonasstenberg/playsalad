import { location } from '@hyperapp/router'
import fetch from '../utils/pseudo-fetch'

import { backendBaseUrl } from '../config'

export default {
  location: location.actions,

  setRoomInput: roomInput => ({ roomInput }),

  setPlayerName: playerName => ({ playerName }),

  setPlayerId: playerId => ({ playerId }),

  setErrorText: errorText => ({ errorText }),

  setRoom: room => ({ room }),

  setRandomNames: randomNames => ({ randomNames }),

  setGameState: (gameState) => (state) => {
    console.log(gameState)
    return {
      room: {
        ...state.room,
        gameState
      }
    }
  },

  createRoom: (playerId) => async (_, actions) => {
    const res = await fetch(`${backendBaseUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerId: playerId
      })
    })
    const json = await res.json()
    actions.setRoom(json)
  },

  joinRoom: async (room) => {
    const res = await fetch(`${backendBaseUrl}/rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(room)
    })

    if (res.status === 404) {
      throw new Error('No room with that id')
    }
  },

  updateRoom: (room) => async (state) => {
    await fetch(`${backendBaseUrl}/rooms`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerId: state.playerId,
        roomId: state.room.roomId,
        ...room
      })
    })
  },

  startGame: async (room) => {
    await fetch(`${backendBaseUrl}/startGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(room)
    })
  },

  setTimeRemaining: timeRemaining => ({ timeRemaining }),

  correctGuess: async ({ playerId, roomId }) => {
    await fetch(`${backendBaseUrl}/correctGuess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerId,
        roomId
      })
    })
  },

  timesUp: () => async (state) => {
    if (state.playerId === state.room.activePlayer) {
      console.log('calling times up')
      await fetch(`${backendBaseUrl}/timesUp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: state.room.roomId
        })
      })
    }
  }
}
