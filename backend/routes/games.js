const express = require('express')
const HttpStatus = require('http-status-codes')

const db = require('../utils/db')
const { camelToSnakeCase } = require('../utils/converters')
const state = require('../state')

const { broadcast } = require('../utils/ws')

const router = express.Router()

router.post('/start', async (req, res) => {
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

    broadcast('startGame', players, { room })

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

router.post('/correctGuess', async (req, res) => {
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

        await db.run('UPDATE players SET end_time = null WHERE room_id = ?', [roomId])

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

        await db.run('UPDATE players SET end_time = null WHERE room_id = ?', [roomId])

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

    broadcast(broadcastAction, p, { room: r, players: p })

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

router.post('/timesUp', async (req, res) => {
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

    await db.run(`
    UPDATE
      players
    SET
      end_time = null
    WHERE
      room_id = ?
    `, [roomId])

    const r = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const p = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    broadcast('timesup', p, { room: r, players: p })

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

router.post('/reset', async (req, res) => {
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
      skips = 1,
      active_round = 1
    WHERE
      room_id = ?
    `, [roomId])

    await db.run('UPDATE players SET score = 0, notes = null, end_time = null WHERE room_id = ?', [roomId])

    const r = await db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId])
    const p = await db.all('SELECT * FROM players WHERE room_id = ? AND deleted_at IS NULL', [roomId])

    broadcast('resetGame', p, { room: r, players: p })

    res.sendStatus(HttpStatus.NO_CONTENT)
  } catch (err) {
    console.log(err)
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

module.exports = router
