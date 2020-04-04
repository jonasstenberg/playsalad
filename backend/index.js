const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const http = require('http')
const HttpStatus = require('http-status-codes')
const morgan = require('morgan')
const WebSocket = require('ws')

const app = express()

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

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

  console.log(playerId)

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
    delete state.players[playerId]
    state.rooms.map(room => {
      if (room.players[playerId]) {
        delete room.players[playerId]

        Object.keys(room.players).forEach(p => {
          state.players[p].send(JSON.stringify(room))
        })
      }
      return room
    })
    console.log(`Deleted user: ${playerId}`)
  })
})

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('terminated connection to client')
      return ws.terminate()
    }

    ws.isAlive = false
    ws.ping(null, false, true)
  })
}, 5000)

app.post('/rooms', (req, res) => {
  const { playerId } = req.body

  try {
    const r = Math.random().toString(36)
    const roomId = r.substring(r.length - 4).replace(/0/g, 'o').toUpperCase()

    const room = {
      roomId,
      ownerId: playerId,
      players: {
        [playerId]: ''
      }
    }

    state.rooms.push(room)
    res.status(HttpStatus.OK).json(room)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.post('/rooms/join', (req, res) => {
  const { playerId, roomId } = req.body

  console.log(playerId, roomId)

  try {
    const room = state.rooms.find(r => r.roomId === roomId)
    if (!room) {
      console.log('no room found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    room.players[playerId] = ''

    res.status(HttpStatus.OK).json(room)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

app.put('/player', (req, res) => {
  const { playerId, playerName, roomId } = req.body
  console.log(roomId)

  try {
    const room = state.rooms.find(r => r.roomId === roomId)

    if (!room) {
      console.log('no room found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    room.players[playerId] = playerName

    Object.keys(room.players).forEach(playerId => {
      state.players[playerId].send(JSON.stringify(room))
    })

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server started on port ${server.address().port}`)
})
