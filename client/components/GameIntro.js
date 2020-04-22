import { h } from 'hyperapp'

export default (state, actions) => h('div', {
  class: 'game',
  oncreate: () => {
    console.log('gameintro', state)
  }
}, [
  h('h1', { class: 'game__heading' }, `Round ${state.room.activeRound}`),
  h('h3', { class: 'game__name' }, state.games[state.room.activeRound].name),
  state.games[state.room.activeRound].description.map(description =>
    h('div', { class: 'game__description' }, [
      h('img', { src: '/images/checkbox.svg' }),
      h('p', { class: 'game__description-paragraph' }, description)
    ])
  ),
  h('img', {
    src: '/images/remote-play.svg',
    class: 'game__remote-icon'
  }),
  h('span', {}, 'Remote play'),
  h('span', { class: 'game__remote-text' }, 'In case you are playing remote, make sure you can all see each other. Use your tool of choice for setting up a group video call.'),
  h('button', {
    class: 'button button--orange',
    onclick: () => {
      actions.setGameState('round')
    }
  }, 'OK!')
])
