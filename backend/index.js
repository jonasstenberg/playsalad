const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const http = require('http')
const HttpStatus = require('http-status-codes')
const morgan = require('morgan')
const WebSocket = require('ws')

const db = require('./utils/db')
const { camelToSnakeCase } = require('./utils/converters')
const app = express()

const server = http.createServer(app)
const wss = new WebSocket.Server({ server, path: '/ws' })

const isProduction = process.env.NODE_ENV === 'production'
const logFormat = isProduction ? 'tiny' : 'dev'

app.use(cors())
app.use(bodyParser.json())
app.use(morgan(logFormat))

const state = require('./state')

const broadcast = (room, players, action) => {
  if (players) {
    players.forEach(player => {
      if (state.connectedClients && state.connectedClients[player.clientId]) {
        if (typeof room.saladBowl !== 'object') {
          room.saladBowl = JSON.parse(room.saladBowl)
        }
        if (typeof room.playersPlayed !== 'object') {
          room.playersPlayed = JSON.parse(room.playersPlayed)
        }
        state.connectedClients[player.clientId].send(JSON.stringify({
          room,
          players,
          action
        }))
      }
    })
  }
}

wss.on('connection', async function connection (ws, req) {
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
        broadcast(room, players, 'rejoin')
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

        broadcast(r, p, 'disconnect')
      }

      console.log(`Deleted user: ${ws.uuid}`)
    }
  })
})

setInterval(() => {
  Object.keys(state.connectedClients).forEach((id) => {
    if (!state.connectedClients[id].isAlive) {
      console.log('terminated connection to client')
      return state.connectedClients[id].terminate()
    }

    state.connectedClients[id].isAlive = false
    if (state.connectedClients[id]) {
      state.connectedClients[id].ping(null, false, true)
    }
  })
}, 5000)

app.get('/api/rooms', (req, res) => {
  res.status(HttpStatus.OK).json({
    numberOfRooms: state.rooms.length
  })
})

app.post('/api/rooms', async (req, res) => {
  const { clientId } = req.body

  try {
    if (!clientId) {
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const randomString = Math.random().toString(36)
    const roomId = randomString.substring(randomString.length - 4).replace(/0/g, 'o').toUpperCase()

    let room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    if (!room) {
      await db.run('INSERT INTO rooms (room_id, owner_id) VALUES (?, ?)', [roomId, clientId])
    }

    const playerParams = {
      $clientId: clientId,
      $roomId: roomId,
      $score: 0,
      $team: 'fire'
    }

    let player = await db.get('SELECT * FROM players WHERE client_id = ?', [clientId])

    if (player) {
      await db.run('UPDATE players SET room_id = $roomId, score = $score, team = $team, deleted_at = null WHERE client_id = $clientId', playerParams)
    } else {
      await db.run('INSERT INTO players (client_id, room_id, score, team) VALUES ($clientId, $roomId, $score, $team)', playerParams)
    }

    room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    player = await db.get('SELECT * FROM players WHERE client_id = ?', [clientId])

    res.status(HttpStatus.OK).json({
      room,
      players: [player]
    })
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/rooms/join', async (req, res) => {
  const { clientId, roomId } = req.body

  try {
    if (!clientId) {
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    if (!room) {
      console.log('No room found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const teamCount = await db.get(`
      SELECT
        SUM(CASE WHEN p.team = 'fire' THEN 1 ELSE 0 END) AS fire,
        SUM(CASE WHEN p.team = 'ice' THEN 1 ELSE 0 END) AS ice
      FROM
        players p
      WHERE
        room_id = ?
    `, [roomId])

    const playerParams = {
      $clientId: clientId,
      $roomId: roomId,
      $score: 0,
      $team: teamCount.fire > teamCount.ice ? 'ice' : 'fire'
    }

    const player = await db.get('SELECT * FROM players WHERE client_id = ?', [clientId])

    if (player) {
      await db.run('UPDATE players SET room_id = $roomId, score = $score, team = $team, deleted_at = null WHERE client_id = $clientId', playerParams)
    } else {
      await db.run('INSERT INTO players (client_id, room_id, score, team) VALUES ($clientId, $roomId, $score, $team)', playerParams)
    }

    const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    broadcast(room, players, 'joining')

    res.sendStatus(HttpStatus.OK)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/rooms/leave', async (req, res) => {
  const { clientId, roomId } = req.body

  try {
    if (!clientId) {
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    if (!room) {
      console.log('No room found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    await db.run('DELETE FROM players WHERE client_id = ?', [clientId])

    const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    if (!players.length) {
      await db.run('DELETE FROM rooms WHERE room_id = ?', [roomId])
    }

    broadcast(room, players, 'leaving')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.put('/api/rooms', async (req, res) => {
  const { roomId, saladBowl, endTime, gameState } = req.body

  try {
    const roomCheck = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    if (!roomCheck) {
      console.log(`No room found with that id: ${roomId}`)
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const params = {}

    if (saladBowl) {
      params.$saladBowl = JSON.stringify(saladBowl)
    }

    if (endTime) {
      params.$endTime = endTime
    }

    if (gameState) {
      params.$gameState = gameState
    }

    if (!Object.keys(params).length) {
      console.log('Nothing to update')
      res.sendStatus(HttpStatus.NO_CONTENT)
      return
    }

    const sets = Object.keys(params).map(key => `${camelToSnakeCase(key.replace('$', ''))} = ${key}`)

    params.$roomId = roomId

    await db.run(`
      UPDATE
        rooms
      SET
        ${sets.join(', ')}
      WHERE
        room_id = $roomId
    `, params)

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    // TODO fix startTurn/updateRoom
    broadcast(room, players, endTime ? 'startTurn' : 'updateRoom')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.put('/api/players', async (req, res) => {
  const { clientId, roomId, name, notes, team } = req.body

  try {
    const player = await db.get('SELECT * FROM players WHERE client_id = ?', [clientId])

    if (!player) {
      console.log(`No player found with that id: ${clientId}`)
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const params = {}

    if (name) {
      params.$name = name
    }

    if (notes) {
      params.$notes = JSON.stringify(notes)
    }

    if (team) {
      params.$team = team
    }

    if (!Object.keys(params).length) {
      console.log('Nothing to update')
      res.sendStatus(HttpStatus.NO_CONTENT)
      return
    }

    const sets = Object.keys(params).map(key => `${camelToSnakeCase(key.replace('$', ''))} = ${key}`)

    params.$clientId = clientId

    await db.run(`
      UPDATE
        players
      SET
        ${sets.join(', ')}
      WHERE
        client_id = $clientId
    `, params)

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    broadcast(room, players, 'updatePlayer')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/startGame', async (req, res) => {
  const { roomId } = req.body

  try {
    const players = await db.all('SELECT * FROM players WHERE room_id = ?', [roomId])

    const saladBowl = players.reduce((acc, player) => {
      const notes = JSON.parse(player.notes)
      if (notes) {
        acc.push(...notes)
      }
      return acc
    }, [])
    const gameState = 'intro'

    const randomPlayer = players[Math.floor(Math.random() * players.length)]
    const activePlayer = randomPlayer.clientId
    const playersPlayed = [randomPlayer.clientId]
    const activeTeam = randomPlayer.team
    const activeWord = saladBowl.splice(Math.floor(Math.random() * saladBowl.length), 1)[0]
    const skips = state.skipsPerTurn

    const params = {
      $roomId: roomId,
      $saladBowl: JSON.stringify(saladBowl),
      $gameState: gameState,
      $activePlayer: activePlayer,
      $playersPlayed: JSON.stringify(playersPlayed),
      $activeTeam: activeTeam,
      $activeWord: activeWord,
      $skips: skips
    }

    await db.run(`
    UPDATE
      rooms
    SET
      game_state = $gameState,
      salad_bowl = $saladBowl,
      active_player = $activePlayer,
      active_team = $activeTeam,
      active_word = $activeWord,
      players_played = $playersPlayed,
      skips = $skips
    WHERE
      room_id = $roomId
    `, params)

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    broadcast(room, players, 'startGame')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/correctGuess', async (req, res) => {
  const { clientId, roomId, skip } = req.body

  try {
    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const players = await db.all('SELECT * FROM players WHERE room_id = ?', [roomId])

    if (!skip) {
      await db.run('UPDATE players SET score = score + 1 WHERE client_id = ?', [clientId])
    }

    let saladBowl = JSON.parse(room.saladBowl)
    let playersPlayed = JSON.parse(room.playersPlayed)
    const params = {}

    let broadcastAction

    if (!saladBowl || !saladBowl.length) {
      if (room.activeRound === 3) {
        params.$gameState = 'gameover'
        params.$endTime = null

        broadcastAction = 'gameover'
      } else {
        saladBowl = players.reduce((acc, player) => {
          const notes = JSON.parse(player.notes)
          if (notes) {
            acc.push(...notes)
          }
          return acc
        }, [])
        params.$activeRound = room.activeRound + 1
        params.$gameState = 'done'
        // TODO replace with config
        params.$skips = state.skipsPerTurn

        if (playersPlayed.length === players.length) {
          playersPlayed = []
        }

        const filteredPlayers = players.filter(p => !playersPlayed.includes(p.clientId))
        const randomPlayer = filteredPlayers[Math.floor(Math.random() * filteredPlayers.length)]
        playersPlayed.push(randomPlayer.clientId)
        const activeWord = saladBowl.splice(Math.floor(Math.random() * saladBowl.length), 1)[0]

        params.$activePlayer = randomPlayer.clientId
        params.$playersPlayed = JSON.stringify(playersPlayed)
        params.$activeTeam = randomPlayer.team
        params.$activeWord = activeWord
        params.$saladBowl = JSON.stringify(saladBowl)
        params.$endTime = null

        broadcastAction = 'done'
      }
    } else {
      if (skip) {
        saladBowl.push(room.activeWord)
      }

      const activeWord = saladBowl.splice(Math.floor(Math.random() * saladBowl.length), 1)[0]
      params.$activeWord = activeWord
      params.$saladBowl = JSON.stringify(saladBowl)

      if (!skip) {
        broadcastAction = 'correctGuess'
      } else {
        params.$skips = room.skips - 1
        broadcastAction = 'skip'
      }
    }

    const sets = Object.keys(params).map(key => `${camelToSnakeCase(key.replace('$', ''))} = ${key}`)

    params.$roomId = roomId

    await db.run(`
    UPDATE
      rooms
    SET
      ${sets.join(', ')}
    WHERE
      room_id = $roomId
    `, params)

    const r = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const p = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    broadcast(r, p, broadcastAction)

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/timesUp', async (req, res) => {
  const { roomId } = req.body

  try {
    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const players = await db.all('SELECT * FROM players WHERE room_id = ?', [roomId])

    const saladBowl = JSON.parse(room.saladBowl)
    let playersPlayed = JSON.parse(room.playersPlayed)

    if (playersPlayed.length === players.length) {
      playersPlayed = []
    }

    const filteredPlayers = players.filter(p => !playersPlayed.includes(p.clientId))
    const randomPlayer = filteredPlayers[Math.floor(Math.random() * filteredPlayers.length)]

    playersPlayed.push(randomPlayer.clientId)
    saladBowl.push(room.activeWord)

    const activeWord = saladBowl.splice(Math.floor(Math.random() * saladBowl.length), 1)[0]

    const params = {
      $activeWord: activeWord,
      $saladBowl: JSON.stringify(saladBowl),
      $activePlayer: randomPlayer.clientId,
      $playersPlayed: JSON.stringify(playersPlayed),
      $activeTeam: randomPlayer.team,
      $endTime: null,
      $gameState: 'timesup',
      $skips: state.skipsPerTurn
    }

    const sets = Object.keys(params).map(key => `${camelToSnakeCase(key.replace('$', ''))} = ${key}`)

    params.$roomId = roomId

    await db.run(`
    UPDATE
      rooms
    SET
      ${sets.join(', ')}
    WHERE
      room_id = $roomId
    `, params)

    const r = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const p = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    broadcast(r, p, 'timesup')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/resetGame', async (req, res) => {
  const { roomId } = req.body

  try {
    await db.run(`
    UPDATE
      rooms
    SET
      game_state = null,
      salad_bowl = null,
      active_player = null,
      active_team = null,
      active_word = null,
      players_played = null,
      end_time = null,
      skips = 1,
      active_round = 1
    WHERE
      room_id = ?
    `, [roomId])

    await db.run('UPDATE players SET score = 0, notes = null WHERE room_id = ?', [roomId])

    const r = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const p = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    broadcast(r, p, 'resetGame')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server started on port ${server.address().port}`)
})

process.on('SIGINT', () => {
  db.close()
  server.close()
})
