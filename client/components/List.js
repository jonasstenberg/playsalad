import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'flex' }, [
  h('input', { class: 'button button--orange' }, 'Join'),
  h('button', { class: 'button button--orange' }, 'Join')
])
