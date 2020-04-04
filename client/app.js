import { h, app } from 'hyperapp'
import state from './state/index'
import actions from './actions/index'

import Splash from './components/Splash.js'

app(() => state, actions,
  h('main', {}, [
    Splash(state, actions)
  ]),
  document.getElementById('app')
)
