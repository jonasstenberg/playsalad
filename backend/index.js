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
  //     name: 'Weise',
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
  //   Object.keys(room.players).forEach(playerId => {
  //     if (state.players && state.players[playerId]) {
  //       state.players[playerId].send(JSON.stringify(room))
  //     }
  //   })
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
      //   if (room && room.players) {
      //     Object.keys(room.players).forEach(p => {
      //       if (state.players && state.players[p]) {
      //         state.players[p].send(JSON.stringify(room))
      //       }
      //     })
      //   }
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
  const { playerId, name, notes, roomId, salladBowl, endTime } = req.body

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    if (!room) {
      console.log('no room found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    room.salladBowl = salladBowl
    room.endTime = endTime

    room.players[playerId] = {
      ...room.players[playerId],
      name,
      notes
    }

    Object.keys(room.players).forEach(playerId => {
      if (state.players && state.players[playerId]) {
        state.players[playerId].send(JSON.stringify({
          ...room,
          action: endTime ? 'startTurn' : 'updateRoom'
        }))
      }
    })

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
    room.round1 = room.salladBowl.slice(0)
    room.round2 = room.salladBowl.slice(0)
    room.round3 = room.salladBowl.slice(0)
    room.activeRound = 1

    room.playerPool = Object.keys(room.players)
    room.activePlayer = room.playerPool.splice(Math.floor(Math.random() * room.playerPool.length), 1)[0]
    room.activeWord = room.salladBowl.splice(Math.floor(Math.random() * room.salladBowl.length), 1)[0]

    Object.keys(room.players).forEach(playerId => {
      if (state.players && state.players[playerId]) {
        state.players[playerId].send(JSON.stringify({
          ...room,
          action: 'startGame'
        }))
      }
    })
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server started on port ${server.address().port}`)
})
