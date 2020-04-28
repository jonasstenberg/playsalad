const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const http = require('http')
const HttpStatus = require('http-status-codes')
const morgan = require('morgan')
const WebSocket = require('ws')

const app = express()

const server = http.createServer(app)
const wss = new WebSocket.Server({ server, path: '/ws' })

const isProduction = process.env.NODE_ENV === 'production'
const logFormat = isProduction ? 'tiny' : 'dev'

app.use(cors())
app.use(bodyParser.json())
app.use(morgan(logFormat))

const state = require('./state')

const broadcast = (room, action) => {
  if (room && room.players) {
    Object.keys(room.players).forEach(playerId => {
      if (state.players && state.players[playerId]) {
        state.players[playerId].send(JSON.stringify({
          ...room,
          action
        }))
      }
    })
  }
}

wss.on('connection', function connection (ws, req) {
  ws.uuid = req.url.replace('/?token=', '').split('=')[1]
  ws.isAlive = true

  state.players[ws.uuid] = ws
  console.log('New user connected:', ws.uuid)

  state.deletedRoomPlayers = state.deletedRoomPlayers.filter(p => {
    const endDate = new Date()
    endDate.setHours(endDate.getHours() + 1)

    return endDate > p.deletedAt
  })

  const deletedPlayer = state.deletedRoomPlayers.find(d => d.playerId === ws.uuid)

  if (deletedPlayer) {
    const deletedPlayerId = deletedPlayer.playerId
    const room = state.rooms.find(r => r.roomId === deletedPlayer.roomId)

    console.log('Restoring deleted player')

    if (room) {
      delete deletedPlayer.playerId
      delete deletedPlayer.roomId
      delete deletedPlayer.deletedAt

      room.players[deletedPlayerId] = deletedPlayer
      room.action = 'rejoin'

      console.log('Rejoining room', room.roomId)

      broadcast(room, 'rejoin')
    } else {
      console.log('No room found for deleted player, reconnecting')

      ws.send(JSON.stringify({
        playerId: ws.uuid
      }))
    }
  } else {
    ws.send(JSON.stringify({
      playerId: ws.uuid
    }))
  }

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', function incoming (message) {
    const data = JSON.parse(message)
    console.log('recieved data', data)
  })

  ws.on('close', function () {
    if (state.players[ws.uuid]) {
      delete state.players[ws.uuid]

      state.rooms = state.rooms.map(room => {
        if (room.players[ws.uuid]) {
          state.deletedRoomPlayers.push({
            playerId: ws.uuid,
            roomId: room.roomId,
            deletedAt: new Date(),
            ...room.players[ws.uuid]
          })
          delete room.players[ws.uuid]
        }

        Object.keys(room.players).forEach(p => {
          if (state.players && state.players[p]) {
            state.players[p].send(JSON.stringify(room))
          }
        })

        return room
      }).filter(room => Object.keys(room.players).length)
      console.log(`Deleted user: ${ws.uuid}`)
    }
  })
})

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('terminated connection to client')
      return ws.terminate()
    }

    ws.isAlive = false
    if (ws) {
      ws.ping(null, false, true)
    }
  })
}, 5000)

app.post('/api/rooms', (req, res) => {
  const { playerId } = req.body

  try {
    if (!playerId) {
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const r = Math.random().toString(36)
    const roomId = r.substring(r.length - 4).replace(/0/g, 'o').toUpperCase()

    const room = {
      roomId,
      ownerId: playerId,
      players: {
        [playerId]: {
          name: '',
          score: 0,
          team: 'fire'
        }
      }
    }

    state.rooms.push(room)
    res.status(HttpStatus.OK).json(room)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/rooms/join', (req, res) => {
  const { playerId, roomId } = req.body

  try {
    if (!playerId) {
      console.log('no player found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const room = state.rooms.find(r => r.roomId === roomId)

    if (!room) {
      console.log('no room found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    room.players[playerId] = {
      name: '',
      score: 0,
      team: Object.keys(room.players).filter(p => room.players[p].team === 'fire').length > Object.keys(room.players).filter(p => room.players[p].team === 'ice').length ? 'ice' : 'fire'
    }

    broadcast(room, 'joining')

    res.status(HttpStatus.OK).json(room)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.put('/api/rooms', (req, res) => {
  const { playerId, name, notes, roomId, salladBowl, endTime, gameState } = req.body

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    if (!room) {
      console.log(`no room found with that id: ${roomId}`)
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    if (salladBowl) {
      room.salladBowl = salladBowl
    }

    if (endTime) {
      room.endTime = endTime
    }

    if (gameState) {
      room.gameState = gameState
    }

    if (name) {
      room.players[playerId] = {
        ...room.players[playerId],
        name
      }
    }

    if (notes) {
      room.players[playerId] = {
        ...room.players[playerId],
        notes
      }
    }

    broadcast(room, endTime ? 'startTurn' : 'updateRoom')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/startGame', (req, res) => {
  const { roomId } = req.body

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    room.salladBowl = Object.keys(room.players).reduce((acc, curr) => {
      if (room.players && room.players[curr] && room.players[curr].notes) {
        acc.push(...room.players[curr].notes)
      }
      return acc
    }, [])
    room.activeRound = 1
    room.gameState = 'intro'

    room.activePlayer = Object.keys(room.players)[Math.floor(Math.random() * Object.keys(room.players).length)]
    room.playersPlayed = [room.activePlayer]
    room.activeTeam = room.players[room.activePlayer].team
    room.activeWord = room.salladBowl.splice(Math.floor(Math.random() * room.salladBowl.length), 1)[0]
    room.skips = state.skipsPerTurn

    broadcast(room, 'startGame')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/correctGuess', (req, res) => {
  const { playerId, roomId, skip } = req.body

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    if (!skip) {
      room.players[playerId].score += 1
    }

    if (!room.salladBowl.length) {
      if (room.activeRound === 3) {
        room.gameState = 'gameover'
        room.endTime = null
        broadcast(room, 'gameover')
      } else {
        room.salladBowl = Object.keys(room.players).reduce((acc, curr) => {
          if (room.players && room.players[curr] && room.players[curr].notes) {
            acc.push(...room.players[curr].notes)
          }
          return acc
        }, [])
        room.activeRound += 1
        room.gameState = 'done'
        room.skips = state.skipsPerTurn

        room.activePlayer = Object.keys(room.players)[Math.floor(Math.random() * Object.keys(room.players).length)]
        room.playersPlayed = [room.activePlayer]
        room.activeTeam = room.players[room.activePlayer].team
        room.activeWord = room.salladBowl.splice(Math.floor(Math.random() * room.salladBowl.length), 1)[0]
        room.endTime = null

        broadcast(room, 'done')
      }
    } else {
      room.activeWord = room.salladBowl.splice(Math.floor(Math.random() * room.salladBowl.length), 1)[0]

      if (!skip) {
        broadcast(room, 'correctGuess')
      } else {
        room.skips -= 1
        broadcast(room, 'skip')
      }
    }

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/timesUp', (req, res) => {
  const { roomId } = req.body

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    room.activeWord = room.salladBowl.splice(Math.floor(Math.random() * room.salladBowl.length), 1)[0]

    if (room.playersPlayed.length === Object.keys(room.players).length) {
      room.playersPlayed = []
    }

    const playerPool = Object.keys(room.players)
      .filter(playerId => room.players[playerId].team !== room.activeTeam && !room.playersPlayed.includes(playerId))
    room.activePlayer = playerPool[Math.floor(Math.random() * playerPool.length)]
    room.playersPlayed.push(room.activePlayer)

    room.activeTeam = room.players[room.activePlayer].team
    room.endTime = null
    room.gameState = 'timesup'
    room.skips = state.skipsPerTurn

    broadcast(room, 'timesup')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/resetGame', (req, res) => {
  const { roomId } = req.body

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    delete room.activeRound
    delete room.activeWord
    delete room.activePlayer
    delete room.activeTeam
    delete room.endTime
    delete room.gameState
    delete room.playersPlayed
    delete room.skips

    Object.keys(room.players).forEach(pid => {
      room.players[pid] = {
        name: room.players[pid].name,
        score: 0,
        team: room.players[pid].team
      }
    })

    broadcast(room, 'resetGame')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server started on port ${server.address().port}`)
})
