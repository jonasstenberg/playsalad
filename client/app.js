/* global WebSocket */

import { h, app } from 'hyperapp'
import { Route, location } from '@hyperapp/router'

import state from './state'
import actions from './actions'
import CreateJoin from './components/CreateJoin'
import Lobby from './components/Lobby'
import { websocketUrl } from './config'

require('@babel/polyfill')

const connection = new WebSocket(websocketUrl)

state.wsConnection = connection

const wiredActions = app(
  state,
  actions,
  (state, actions) => h('div', {}, [
    h(Route, {
      path: '/',
      render: () => CreateJoin(state, actions)
    }),
    h(Route, {
      path: '/lobby/',
      parent: true,
      render: () => Lobby(state, actions)
    })
  ]),
  document.getElementById('app')
)

location.subscribe(wiredActions.location)

connection.onmessage = (e) => {
  const message = JSON.parse(e.data)
  console.log('broadcast', message)
  wiredActions.setRoom(message)
}

connection.onerror = (error) => {
  console.log(`WebSocket error: ${error}`)
}
