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

wsc.onmessage = (e) => {
  const message = JSON.parse(e.data)
  let ownPlayer

  if (message.room) {
    if (debug) {
      console.log('updating room')
      console.log(message.room)
    }
    wiredActions.setRoom(message.room)
  }
  if (message.players) {
    if (debug) {
      console.log('updating player')
      console.log(message.players)
    }
    wiredActions.setPlayers(message.players)
    ownPlayer = message.players.find(p => p.clientId === uid)
  }
  switch (message.action) {
    case 'user':
      wiredActions.setClientId(message.clientId)
      break
    case 'rejoin':
      if (message.room.gameState) {
        clearInterval(timerId)
        if (ownPlayer && ownPlayer.endTime) {
          timerId = setInterval(() => calculateRemainingTime(ownPlayer.endTime, (distance) => {
            wiredActions.setTimeRemaining(distance)

            if (distance < 0) {
              clearInterval(timerId)
              wiredActions.timesUp()
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
    case 'setTimer':
      wiredActions.setTimer()
      if (message.room.activePlayer === ownPlayer.clientId) {
        wiredActions.updateRoom({
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
      if (ownPlayer && ownPlayer.endTime) {
        timerId = setInterval(() => calculateRemainingTime(ownPlayer.endTime, (distance) => {
          wiredActions.setTimeRemaining(distance)

          if (distance < 0) {
            clearInterval(timerId)
            wiredActions.timesUp()
            return
          }
          wiredActions.setTimeRemaining(distance)
        }), 1000)
      }
      break
    case 'timesup':
      clearInterval(timerId)
      setTimeout(() => {
        if (debug) {
          console.log('setting round')
        }
        wiredActions.updateRoom({
          gameState: 'round'
        })
      }, 3000)
      break
    case 'done':
      clearInterval(timerId)
      setTimeout(() => {
        wiredActions.updateRoom({
          gameState: 'intro'
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
