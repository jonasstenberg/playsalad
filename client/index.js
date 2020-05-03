/* global sessionStorage */

import { app } from 'hyperapp'
import { location } from '@hyperapp/router'
import { v4 as uuidv4 } from 'uuid'

import state from './state'
import actions from './actions'
import { websocketUrl } from './config'

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
  console.log('WebSocketClient connected:', e)
}

wsc.onclose = (e) => {
  console.log('WebSocketClient closed:', e)
}

sessionStorage.setItem('wsToken', uid)

location.subscribe(wiredActions.location)

const calculateRemainingTime = (endTime, callback) => {
  if (!endTime) {
    console.log('endtime not set')
    return 0
  }
  const now = new Date().getTime()
  const distance = new Date(endTime).getTime() - now

  callback(Math.floor((distance % (1000 * 60)) / 1000))
}

let timerId

wsc.onmessage = (e) => {
  const message = JSON.parse(e.data)

  if (message.room) {
    console.log('updating room')
    console.log(message.room)
    wiredActions.setRoom(message.room)
  }
  if (message.players) {
    console.log('updating player')
    console.log(message.players)
    wiredActions.setPlayers(message.players)
  }
  switch (message.action) {
    case 'user':
      wiredActions.setClientId(message.clientId)
      break
    case 'rejoin':
      if (message.room.gameState) {
        clearInterval(timerId)
        if (message.room.endTime) {
          timerId = setInterval(() => calculateRemainingTime(message.room.endTime, (distance) => {
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
    case 'startGame':
      actions.location.go('/game')
      break
    case 'startTurn':
      clearInterval(timerId)
      timerId = setInterval(() => calculateRemainingTime(message.room.endTime, (distance) => {
        wiredActions.setTimeRemaining(distance)

        if (distance < 0) {
          clearInterval(timerId)
          wiredActions.timesUp()
          return
        }
        wiredActions.setTimeRemaining(distance)
      }), 1000)
      break
    case 'timesup':
      clearInterval(timerId)
      setTimeout(() => {
        console.log('setting round')
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
      console.log('reseting game')
      actions.location.go('/lobby/player-list')
      break
  }
}

wsc.onerror = (error) => {
  console.log(`WebSocket error: ${error}`)
}
