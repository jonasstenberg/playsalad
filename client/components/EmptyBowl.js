import { h } from 'hyperapp'

export default (state, actions) => h('div', { class: 'empty-bowl flex' }, [
  h('img', { src: 'images/empty-bowl.svg' }),
  h('h1', { class: 'empty-bowl__heading' }, 'Done'),
  h('h3', { class: 'empty-bowl__text' }, 'There are no more names left in the salad bowl')
])
