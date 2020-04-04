import { h } from 'hyperapp'
import names from '../data/names'

const randomNames = () => {
  const randomNames = []
  for (let step = 0; step < 5; step++) {
    randomNames.push(names[Math.floor(Math.random() * names.length)])
  }
  return randomNames
}

export default (state, actions) => h('div', { class: 'throw-names flex' }, [
  h('ol', { class: 'throw-names__list' },
    randomNames().map((name) => {
      return h('li', { class: 'throw-names__name' }, h('input', {
        class: 'throw-names__input input',
        placeholder: name
      }))
    })),
  h('button', { class: 'button button--orange' }, 'Submit names')
])
