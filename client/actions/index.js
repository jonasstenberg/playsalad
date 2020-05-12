import { location } from '@hyperapp/router'
import fetch from '../utils/pseudo-fetch'

import { backendBaseUrl, debug } from '../config'

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
    if (debug) {
      console.log(gameState)
    }
    return {
      room: {
        ...state.room,
        gameState
      }
    }
  },

  setTimeRemaining: timeRemaining => ({ timeRemaining }),

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
    const res = await fetch(`${backendBaseUrl}/players/join`, {
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
    await fetch(`${backendBaseUrl}/players/leave`, {
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
        broadcastUpdate: true,
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
        broadcastUpdate: true,
        ...room
      })
    })
  },

  startGame: async (room) => {
    await fetch(`${backendBaseUrl}/games/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(room)
    })
  },

  broadcast: (action) => async (state) => {
    await fetch(`${backendBaseUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomId: state.room.roomId,
        action
      })
    })
  },

  setTimer: () => async (state, actions) => {
    const endTime = new Date()
    endTime.setSeconds(endTime.getSeconds() + 60)

    await actions.updatePlayer({
      endTime,
      broadcastUpdate: false
    })

    actions.setPlayer({
      ...state.player,
      endTime
    })
  },

  correctGuess: async ({ clientId, roomId, skip }) => {
    await fetch(`${backendBaseUrl}/games/correctGuess`, {
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

  endTurn: ({ action, gameState }) => async (state) => {
    if (state.clientId === state.room.activePlayer) {
      if (debug) {
        console.log('calling times up')
      }
      await fetch(`${backendBaseUrl}/games/endTurn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: state.room.roomId,
          action,
          gameState
        })
      })
    }
  },

  resetGame: () => async (state) => {
    await fetch(`${backendBaseUrl}/games/reset`, {
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
