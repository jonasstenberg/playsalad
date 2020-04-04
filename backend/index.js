const bodyParser = require('body-parser')
const express = require('express')
const http = require('http')
const morgan = require('morgan')
const { v4: uuidv4 } = require('uuid')
const WebSocket = require('ws')

const app = express()

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const webSockets = {}

const isProduction = process.env.NODE_ENV === 'production'
const logFormat = isProduction ? 'tiny' : 'dev'

app.use(bodyParser.json())
app.use(morgan(logFormat))

wss.on('connection', function connection (ws, req) {
  const userId = uuidv4()
  webSockets[userId] = ws

  ws.isAlive = true

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', function incoming (message) {
    const data = JSON.parse(message)
    switch (data.action) {
      case 'createUser':
        ws.send(JSON.stringify({
          type: 'newUser',
          userId
        }))
        break
      case 'createGroup':
        var r = Math.random().toString(36)
        var groupId = r.substring(r.length - 4).replace(/0/g, 'o').toUpperCase()
        ws.send(JSON.stringify({
          type: 'newGroup',
          groupId
        }))
        console.log(`Creating group: ${groupId} for user ${userId}`)
        break
    }
  })

  ws.on('close', function () {
    delete webSockets[userId]
    console.log(`Deleted user: ${userId}`)
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

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server started on port ${server.address().port}`)
})
