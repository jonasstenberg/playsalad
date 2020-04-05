import { h } from 'hyperapp'
// import fetch from '../utils/pseudo-fetch'

// import { backendBaseUrl } from '../config'

export default (state, actions) => h('div', {
  class: 'create-join flex',
  oncreate: () => console.log(state.room)
}, 'Sooon...')
