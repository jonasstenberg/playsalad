import { h } from 'hyperapp'

export default (state, actions) => h('div', {
  class: 'game-intro',
  oncreate: () => {
    console.log('gameintro', state)
  }
}, [
  h('h1', { class: 'game-intro__heading' }, `Round ${state.room.activeRound}`),
  h('h3', { class: 'game-intro__name' }, state.games[state.room.activeRound].name),
  state.games[state.room.activeRound].description.map(description =>
    h('div', { class: 'game-intro__description' }, [
      h('img', { src: '/images/checkbox.svg' }),
      h('p', { class: 'game-intro__description-paragraph' }, description)
    ])
  ),
  h('img', {
    src: '/images/remote-play.svg',
    class: 'game-intro__remote-icon'
  }),
  h('h4', { class: 'game-intro__remote-heading' }, 'Remote play'),
  h('p', { class: 'game-intro__remote-text' }, 'In case you are playing remote, make sure you can all see each other. Use your tool of choice for setting up a group video call.'),
  h('button', {
    class: 'button button--orange',
    onclick: () => {
      actions.setGameState('round')
    }
  }, 'OK!')
])
