const express = require('express')
const HttpStatus = require('http-status-codes')

const db = require('../utils/db')
const { camelToSnakeCase } = require('../utils/converters')

const { broadcast } = require('../utils/ws')

const router = express.Router()

router.put('/', async (req, res) => {
  const { clientId, roomId, broadcastUpdate, name, notes, team, endTime } = req.body

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

    if (endTime) {
      params.$endTime = endTime
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

    const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    if (broadcastUpdate) {
      broadcast('updatePlayer', players, { players })
    }

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

router.post('/join', async (req, res) => {
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

    broadcast('joining', players, { players })

    res.sendStatus(HttpStatus.OK)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

router.post('/leave', async (req, res) => {
  const { clientId, roomId } = req.body

  try {
    if (!clientId) {
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    const roomCheck = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    if (!roomCheck) {
      console.log('No room found with that id')
      res.sendStatus(HttpStatus.NOT_FOUND)
      return
    }

    await db.run('DELETE FROM players WHERE client_id = ?', [clientId])

    const players = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    if (!players.length) {
      await db.run('DELETE FROM rooms WHERE room_id = ?', [roomId])
    }

    if (roomCheck.ownerId === clientId) {
      await db.run('UPDATE rooms SET owner_id = ? WHERE room_id = ?', [players[0].clientId, roomId])
    }

    if (roomCheck.activePlayer === clientId) {
      await db.run('UPDATE rooms SET game_state = "score" WHERE room_id = ?', [roomId])
    }

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])

    broadcast('leaving', players, { room, players })

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

module.exports = router
