import { location } from '@hyperapp/router'

export default {
  location: location.actions,

  setGroupName: groupName => ({ groupName }),

  setRoomId: roomId => ({ roomId }),

  setPlayerId: playerId => ({ playerId }),

  setPlayers: players => ({ players })
}
