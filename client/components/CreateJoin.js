import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'flex' }, [
  h('input', { class: 'input input--orange' }),
  h('button', { class: 'button button--orange' }, 'Enter'),
  h('button', {
    class: 'button button--blue',
    onclick: () => actions.location.go('/lobby/choose-name/')
  }, 'Create new')
])
