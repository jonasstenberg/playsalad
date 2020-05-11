const state = require('../state')
const db = require('./db')

const broadcast = (action, players, stuff) => {
  if (Object.keys(stuff).length) {
    players.forEach(player => {
      if (state.connectedClients && state.connectedClients[player.clientId]) {
        if (stuff.room) {
          if (typeof stuff.room.saladBowl !== 'object') {
            stuff.room.saladBowl = JSON.parse(stuff.room.saladBowl)
          }
          if (typeof stuff.room.playersPlayed !== 'object') {
            stuff.room.playersPlayed = JSON.parse(stuff.room.playersPlayed)
          }
        }
        state.connectedClients[player.clientId].send(JSON.stringify({
          ...stuff,
          action
        }))
      }
    })
  }
}

const connection = async (ws, req) => {
  ws.uuid = req.url.replace('/?token=', '').split('=')[1]
  ws.isAlive = true

  state.connectedClients[ws.uuid] = ws

  console.log('New user connected:', ws.uuid)

  const deletedPlayer = await db.get('SELECT * FROM players WHERE datetime(deleted_at) >= datetime("now", "-1 Hour") AND client_id = ?', [ws.uuid])

  if (deletedPlayer) {
    console.log('Restoring deleted player')
    await db.run('UPDATE players SET deleted_at = null WHERE client_id = ?', [ws.uuid])

    if (deletedPlayer.roomId) {
      const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [deletedPlayer.roomId])
      const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [deletedPlayer.roomId])

      if (room) {
        broadcast('rejoin', players, { room, players })
      }
    }

    ws.send(JSON.stringify({
      clientId: ws.uuid,
      action: 'user'
    }))
  } else {
    ws.send(JSON.stringify({
      clientId: ws.uuid,
      action: 'user'
    }))
  }

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', function incoming (message) {
    const data = JSON.parse(message)
    console.log('recieved data', data)
  })

  ws.on('close', async () => {
    if (state.connectedClients[ws.uuid]) {
      delete state.connectedClients[ws.uuid]

      await db.run('UPDATE players SET deleted_at = datetime("now", "localtime") WHERE client_id = ?', [ws.uuid])

      const room = await db.get(`
        SELECT
          r.room_id,
          GROUP_CONCAT(p.client_id) as c
        FROM
          rooms r
        LEFT JOIN
          players p
        ON
          r.room_id = p.room_id
        GROUP BY
          r.room_id
        HAVING
          c LIKE ?
        `, [`%${ws.uuid}%`])

      if (room && room.c) {
        const players = await db.all(`
          SELECT
            *
          FROM
            players
          WHERE
            client_id IN (${room.c.split(',').map(() => '?').join(',')})
        `, room.c.split(','))

        const deleteRoom = players.every(player => player.deletedAt)

        if (deleteRoom) {
          await db.run('DELETE FROM rooms WHERE room_id = ?', [room.roomId])
          await db.run('DELETE FROM players WHERE room_id = ?', [room.roomId])
        }

        const r = await db.get('SELECT * FROM rooms WHERE room_id = ?', [room.roomId])
        const p = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [room.roomId])

        broadcast('disconnect', players, { room: r, players: p })
      }

      console.log(`Deleted user: ${ws.uuid}`)
    }
  })
}

module.exports = {
  broadcast,
  connection
}
