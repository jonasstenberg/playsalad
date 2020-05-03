import { h } from 'hyperapp'
import names from '../data/names'

const playerNotes = []

export default (state, actions) => h('div', {
  class: 'throw-names flex',
  oncreate: () => {
    const randomNames = []
    for (let step = 0; step < 5; step++) {
      randomNames.push(names[Math.floor(Math.random() * names.length)])
    }
    actions.setRandomNames(randomNames)
  }
}, [
  h('h3', { class: 'throw-names__heading lang' }, 'Throw in five names each'),
  h('p', { class: 'throw-names__text caption lang' }, 'They might be a name of a famous person, a city to visit, a movie, or even a favorite food. All submissions go in to the virtual salad bowl.'),
  h('ol', { class: 'throw-names__list' },
    state.randomNames ? state.randomNames.map((name, index) => {
      return h('li', { class: 'throw-names__name' }, h('input', {
        class: 'throw-names__input input',
        placeholder: name,
        oncreate: () => (playerNotes[index] = name),
        oninput: evt => {
          if (evt.target.value) {
            playerNotes[index] = evt.target.value
          } else {
            playerNotes[index] = name
          }
        }
      }))
    }) : ''),
  h('button', {
    class: 'button button--orange',
    onclick: async () => {
      await actions.updatePlayer({
        name: state.playerName,
        notes: playerNotes
      })

      actions.location.go('/lobby/player-list/')
    }
  }, 'Into the salad bowl!')
])
