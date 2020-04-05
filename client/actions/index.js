import { location } from '@hyperapp/router'

export default {
  location: location.actions,

  setRoomInput: roomInput => ({ roomInput }),

  setPlayerName: playerName => ({ playerName }),

  setRoom: room => ({ room }),

  setPlayerId: playerId => ({ playerId }),

  setErrorText: errorText => ({ errorText })
}
