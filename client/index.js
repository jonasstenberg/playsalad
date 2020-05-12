/* global sessionStorage */

import { app } from 'hyperapp'
import { location } from '@hyperapp/router'
import { v4 as uuidv4 } from 'uuid'

import state from './state'
import actions from './actions'
import { debug, websocketUrl } from './config'

import App from './components/App'

import wsc from './utils/ws'

require('@babel/polyfill')

const wiredActions = app(
  state,
  actions,
  App,
  document.getElementById('app')
)

let uid
if (sessionStorage.getItem('wsToken')) {
  uid = sessionStorage.getItem('wsToken')
  wiredActions.setClientId(uid)
} else {
  uid = uuidv4()
}

wsc.open(`${websocketUrl}?token=${uid}`)
wsc.onopen = (e) => {
  if (debug) {
    console.log('WebSocketClient connected:', e)
  }
}

wsc.onclose = (e) => {
  if (debug) {
    console.log('WebSocketClient closed:', e)
  }
}

sessionStorage.setItem('wsToken', uid)

location.subscribe(wiredActions.location)

const calculateRemainingTime = (endTime, callback) => {
  const end = new Date(endTime)
  const now = new Date().getTime()
  const distance = end.getTime() - now

  callback(Math.floor((distance % (1000 * 60)) / 1000))
}

let timerId

wsc.onmessage = async (e) => {
  const message = JSON.parse(e.data)

  const clientId = message.clientId
  const action = message.action
  const room = message.room
  const players = message.players

  let myPlayer

  if (room) {
    if (debug) {
      console.log('updating room')
      console.log(room)
    }
    wiredActions.setRoom(room)
  }
  if (players) {
    if (debug) {
      console.log('updating player')
      console.log(players)
    }
    wiredActions.setPlayers(players)
    myPlayer = players.find(p => p.clientId === uid)
  }
  switch (action) {
    case 'user':
      wiredActions.setClientId(clientId)
      break
    case 'rejoin':
      if (room.gameState) {
        clearInterval(timerId)
        if (myPlayer && myPlayer.endTime) {
          timerId = setInterval(() => calculateRemainingTime(myPlayer.endTime, async (distance) => {
            wiredActions.setTimeRemaining(distance)

            if (distance < 0) {
              clearInterval(timerId)
              await wiredActions.endTurn({
                action: 'timesup',
                gameState: 'timesup'
              })
              return
            }
            wiredActions.setTimeRemaining(distance)
          }), 1000)
        }

        actions.location.go('/game')
      } else {
        actions.location.go('/lobby/player-list')
      }
      break
    case 'leaving':
      actions.location.go('/lobby/player-list')
      break
    case 'setTimer':
      await wiredActions.setTimer()
      if (room.activePlayer === myPlayer.clientId) {
        await wiredActions.updateRoom({
          action: 'startTurn',
          gameState: 'round'
        })
      }
      break
    case 'startGame':
      actions.location.go('/game')
      break
    case 'startTurn':
      clearInterval(timerId)
      if (myPlayer && myPlayer.endTime) {
        timerId = setInterval(() => calculateRemainingTime(myPlayer.endTime, async (distance) => {
          wiredActions.setTimeRemaining(distance)

          if (distance < 0) {
            clearInterval(timerId)
            await wiredActions.endTurn({
              action: 'timesup',
              gameState: 'timesup'
            })
            return
          }
          wiredActions.setTimeRemaining(distance)
        }), 1000)
      }
      break
    case 'timesup':
      clearInterval(timerId)
      setTimeout(async () => {
        if (debug) {
          console.log('setting round')
        }
        await wiredActions.updateRoom({
          gameState: 'score',
          broadcastUpdate: room.activePlayer === myPlayer.clientId
        })
      }, 3000)
      break
    case 'done':
      clearInterval(timerId)
      setTimeout(async () => {
        await wiredActions.updateRoom({
          gameState: 'intro',
          broadcastUpdate: room.activePlayer === myPlayer.clientId
        })
      }, 3000)
      break
    case 'gameover':
      clearInterval(timerId)
      break
    case 'resetGame':
      if (debug) {
        console.log('reseting game')
      }
      actions.location.go('/lobby/player-list')
      break
  }
}

wsc.onerror = (error) => {
  if (debug) {
    console.log(`WebSocket error: ${error}`)
  }
}
