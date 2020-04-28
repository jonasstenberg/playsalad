import { h } from 'hyperapp'

export default (state, actions) => h('div', {
  class: 'times-up flex'
}, [
  h('div', { class: 'times-up__header' }, [
    h('img', { src: 'images/bomb.svg' }),
    h('h1', { class: 'times-up__heading' }, 'Time’s up!')
  ]),
  h('div', { class: 'times-up__time' }, '0.00')
])
