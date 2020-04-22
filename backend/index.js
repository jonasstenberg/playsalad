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
  ws.isAlive = true

  const playerId = req.headers['sec-websocket-key']

  state.players[playerId] = ws

  console.log('New user connected:', playerId)

  ws.send(JSON.stringify({
    playerId
  }))

  // let room = state.rooms.find(r => r.roomId === 'ABCD')
  //
  // if (!room) {
  //   room = {
  //     roomId: 'ABCD',
  //     ownerId: playerId,
  //     players: {
  //       [playerId]: {
  //         name: 'Arne',
  //         score: 0,
  //         team: 'fire',
  //         notes: [
  //           'asdf',
  //           'fdsa',
  //           'gqreg',
  //           'hyterh',
  //           'ewrtwer'
  //         ]
  //       }
  //     }
  //   }
  //   state.rooms.push(room)
  // } else {
  //   room.players[playerId] = {
  //     name: `Weise ${playerId}`,
  //     score: 0,
  //     team: Object.keys(room.players).filter(p => room.players[p].team === 'fire').length > Object.keys(room.players).filter(p => room.players[p].team === 'ice').length ? 'ice' : 'fire',
  //     notes: [
  //       'asdf',
  //       'fdsa',
  //       'gqreg',
  //       'hyterh',
  //       'ewrtwer'
  //     ]
  //   }
  //
  //   broadcast(room, 'init')
  // }

  ws.send(JSON.stringify({
    playerId
  }))

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', function incoming (message) {
    const data = JSON.parse(message)
    console.log('recieved data', data)
  })

  ws.on('close', function () {
    if (state.players[playerId]) {
      delete state.players[playerId]
      // TODO remove this when done
      // const room = state.rooms.find(r => r.roomId === 'ABCD')
      // if (room && room.players && Object.keys(room.players).length >= 4) {
      //   state.rooms = []
      // } else {
      //   broadcast(room, 'removePlayer')
      // }
      state.rooms = state.rooms.map(room => {
        if (room.players[playerId]) {
          delete room.players[playerId]
        }

        Object.keys(room.players).forEach(p => {
          if (state.players && state.players[p]) {
            state.players[p].send(JSON.stringify(room))
          }
        })

        return room
      }).filter(room => Object.keys(room.players).length)
      console.log(`Deleted user: ${playerId}`)
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

    broadcast(room, 'startGame')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/api/correctGuess', (req, res) => {
  const { playerId, roomId } = req.body

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    room.players[playerId].score += 1

    if (!room.salladBowl.length) {
      room.salladBowl = Object.keys(room.players).reduce((acc, curr) => {
        if (room.players && room.players[curr] && room.players[curr].notes) {
          acc.push(...room.players[curr].notes)
        }
        return acc
      }, [])
      room.activeRound += 1
      room.gameState = 'done'

      room.activePlayer = Object.keys(room.players)[Math.floor(Math.random() * Object.keys(room.players).length)]
      room.playersPlayed = [room.activePlayer]
      room.activeTeam = room.players[room.activePlayer].team
      room.activeWord = room.salladBowl.splice(Math.floor(Math.random() * room.salladBowl.length), 1)[0]
      room.endTime = null

      broadcast(room, 'done')
    } else {
      room.activeWord = room.salladBowl.splice(Math.floor(Math.random() * room.salladBowl.length), 1)[0]

      broadcast(room, 'correctGuess')
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

    broadcast(room, 'timesup')

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server started on port ${server.address().port}`)
})
