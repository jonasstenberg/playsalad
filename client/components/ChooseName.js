import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'choose-name flex' }, [
  h('input', {
    class: 'choose-name__input input',
    placeholder: 'Cucumber'
  }),
  h('button', {
    class: 'button button--orange',
    onclick: () => actions.location.go('/lobby/player-list/')
  }, 'Join')
])
