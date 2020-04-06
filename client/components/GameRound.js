import { h } from 'hyperapp'

export default (state, actions) => h('div', {
  class: 'game',
  oncreate: () => {
    console.log('gameround', state)
  }
}, [
  h('div', {}, 'Game Round')
])
