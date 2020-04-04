import { h, app } from 'hyperapp'
import state from './state/index'
import actions from './actions/index'

import CreateJoin from './components/CreateJoin.js'

app(() => state, actions, h('div', {}, [
  CreateJoin(state, actions)
]), document.getElementById('app')
)
