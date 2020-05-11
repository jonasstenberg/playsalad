const express = require('express')
const HttpStatus = require('http-status-codes')

const db = require('../utils/db')
const { camelToSnakeCase } = require('../utils/converters')

const { broadcast } = require('../utils/ws')

const router = express.Router()

router.get('/', async (req, res) => {
  const rooms = await db.all('SELECT * FROM rooms')
  res.status(HttpStatus.OK).json({
    numberOfRooms: rooms.length
  })
})

router.post('/', async (req, res) => {
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

router.put('/', async (req, res) => {
  const { roomId, action = 'updateRoom', broadcastUpdate, saladBowl, gameState } = req.body

  try {
    const roomCheck = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    if (!roomCheck) {
      console.log(`No room found with that id: ${roomId}`)
      throw new Error('Not found')
    }

    const params = {}

    if (saladBowl) {
      params.$saladBowl = JSON.stringify(saladBowl)
    }

    if (gameState) {
      params.$gameState = gameState
    }

    const sets = Object.keys(params).map(key => `${camelToSnakeCase(key.replace('$', ''))} = ${key}`)

    params.$roomId = roomId

    if (sets.length) {
      await db.run(`
        UPDATE
          rooms
        SET
          ${sets.join(', ')}
        WHERE
          room_id = $roomId
      `, params)
    }

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    if (broadcastUpdate) {
      broadcast(action, players, { room, players })
    }

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

module.exports = router
