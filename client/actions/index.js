import { location } from '@hyperapp/router'
import fetch from '../utils/pseudo-fetch'

import { backendBaseUrl } from '../config'

export default {
  location: location.actions,

  setRoomInput: roomInput => ({ roomInput }),

  setPlayerName: playerName => ({ playerName }),

  setRoom: room => ({ room }),

  setPlayerId: playerId => ({ playerId }),

  setErrorText: errorText => ({ errorText }),

  startGame: () => async (state) => {
    await fetch(`${backendBaseUrl}/startGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerId: state.playerId,
        roomId: state.room.roomId
      })
    })
  }
}
