const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const http = require('http')
const HttpStatus = require('http-status-codes')
const morgan = require('morgan')
const WebSocket = require('ws')

const isProduction = process.env.NODE_ENV === 'production'
const logFormat = isProduction ? 'tiny' : 'dev'

const db = require('./utils/db')
const { broadcast, connection } = require('./utils/ws')
const state = require('./state')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server, path: '/ws' })

wss.on('connection', connection)

app.use(cors())
app.use(bodyParser.json())
app.use(morgan(logFormat))

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

app.use((req, res, next) => {
  res.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self'; media-src 'self'; frame-src 'none'; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' ws: wss:; style-src 'self'")
  next()
})

app.use('/api/rooms', require('./routes/rooms'))
app.use('/api/players', require('./routes/players'))
app.use('/api/games', require('./routes/games'))

app.post('/api/broadcast', async (req, res) => {
  const { roomId, action } = req.body

  const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
  const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

  broadcast(action, players, { room, players })

  res.sendStatus(HttpStatus.NO_CONTENT)
})

server.listen(process.env.PORT || 8081, () => {
  console.log(`Server started on port ${server.address().port}`)
})

process.on('SIGINT', () => {
  db.close()
  server.close()
})
