import { location } from '@hyperapp/router'
import fetch from '../utils/pseudo-fetch'

import { backendBaseUrl } from '../config'

export default {
  location: location.actions,

  setRoomInput: roomInput => ({ roomInput }),

  setPlayerName: playerName => ({ playerName }),

  setClientId: clientId => ({ clientId }),

  setErrorText: errorText => ({ errorText }),

  setRoom: room => ({ room }),

  setPlayers: players => (state, actions) => {
    const player = players.find(player => player.clientId === state.clientId)
    if (player) {
      actions.setPlayer(player)
    }

    return {
      players
    }
  },

  setPlayer: player => ({ player }),

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

  createRoom: (clientId) => async (_, actions) => {
    const res = await fetch(`${backendBaseUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: clientId
      })
    })
    const json = await res.json()
    actions.setRoom(json.room)
    actions.setPlayers(json.players)
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

  leaveRoom: () => async (state) => {
    await fetch(`${backendBaseUrl}/rooms/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: state.clientId,
        roomId: state.room.roomId
      })
    })
  },

  updatePlayer: (player) => async (state) => {
    await fetch(`${backendBaseUrl}/players`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: state.clientId,
        roomId: state.room.roomId,
        ...player
      })
    })
  },

  updateRoom: (room) => async (state) => {
    await fetch(`${backendBaseUrl}/rooms`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: state.clientId,
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

  correctGuess: async ({ clientId, roomId, skip }) => {
    await fetch(`${backendBaseUrl}/correctGuess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId,
        roomId,
        skip
      })
    })
  },

  timesUp: () => async (state) => {
    if (state.clientId === state.room.activePlayer) {
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
  },

  resetGame: () => async (state) => {
    await fetch(`${backendBaseUrl}/resetGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: state.clientId,
        roomId: state.room.roomId
      })
    })
  }
}
