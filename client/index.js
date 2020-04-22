/* global WebSocket */

import { app } from 'hyperapp'
import { location } from '@hyperapp/router'

import state from './state'
import actions from './actions'
import { websocketUrl } from './config'

import App from './components/App'

require('@babel/polyfill')

const connection = new WebSocket(websocketUrl)
state.wsConnection = connection

const wiredActions = app(
  state,
  actions,
  App,
  document.getElementById('app')
)

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

connection.onmessage = (e) => {
  const message = JSON.parse(e.data)
  if (message.playerId) {
    wiredActions.setPlayerId(message.playerId)
    if (message.room) {
      wiredActions.setRoom(message.room)
      console.log(message.room)
      actions.location.go('/lobby/player-list')
    }
  } else {
    console.log('updating room')
    console.log(message)
    wiredActions.setRoom(message)
    switch (message.action) {
      case 'startGame':
        actions.location.go('/game')
        break
      case 'startTurn':
        calculateRemainingTime(message.endTime, (distance) => {
          wiredActions.setTimeRemaining(distance)
        })
        clearInterval(timerId)
        timerId = setInterval(() => calculateRemainingTime(message.endTime, (distance) => {
          console.log(`distance: ${distance} ${timerId}`)
          if (distance < 0) {
            clearInterval(timerId)
            wiredActions.timesUp()
            setTimeout(() => {
              wiredActions.setGameState('round')
            }, 3000)
            return
          }
          wiredActions.setTimeRemaining(distance)
        }), 1000)
        break
      case 'done':
        clearInterval(timerId)
        setTimeout(() => {
          wiredActions.setGameState('intro')
        }, 3000)
        break
    }
  }
}

connection.onerror = (error) => {
  console.log(`WebSocket error: ${error}`)
}
