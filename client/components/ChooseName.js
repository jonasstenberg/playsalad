import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'choose-name flex' }, [
  h('input', { class: 'choose-name__input button--orange' }, 'Join'),
  h('button', { class: 'button button--orange' }, 'Join')
])
