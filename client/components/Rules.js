import { h } from 'hyperapp'

export default (state, actions) => h('div', {
  class: 'rules'
}, [
  h('div', { class: 'rules__heading' }, [
    h('img', { src: '/images/rule-book-large.svg' }),
    h('h2', { class: 'rules__heading-text' }, 'Game Rules')
  ]),
  h('div', { class: 'rules__paragraphs' }, [
    h('h4', { class: 'rules__paragraph-topic' }, 'Submit five names each'),
    h('p', { class: 'rules__paragraph-text' }, 'Ask each player to join the game (using the game PIN) and submit five names. They might be a name of a famous person, a city to visit, a movie, or even a favorite food. All submissions go in to the virtual salad bowl.'),
    h('h4', { class: 'rules__paragraph-topic' }, 'Divide into two teams'),
    h('p', { class: 'rules__paragraph-text' }, 'There are three rounds in the game and each round is played in a similar way (see the rules for each round below). When you start the game, a random player is selected to begin. Only she gets shown a name from the salad bowl and her teammates try to guess the name. Once the word is guessed, the same player hits ‘correct’ and gets shown another word from the bowl for her teammates to guess. She continues with this until her 1 minute turn is up. The team receives 1 point for every correct word that was guessed. Once the first team finishes, the next team goes until all the words in the salad bowl are guessed. Each turn, the player gets one opportunity to skip a name when stuck.'),
    h('h4', { class: 'rules__paragraph-topic' }, 'Round one: Forbidden Word'),
    h('p', { class: 'rules__paragraph-text' }, 'The player gets shown a name from the bowl and describes it to her teammates without saying the actual word. Once the word is correctly guessed, she hits ‘correct’ and gets shown another word from the bowl for her teammates to guess. She continues this, describing each word for her teammates to guess, until her 1 minute turn is up.'),
    h('h4', { class: 'rules__paragraph-topic' }, 'Round two: Charades'),
    h('p', { class: 'rules__paragraph-text' }, 'In this next round, the player gets shown a word from the salad bowl and must act it out without making any sound. Once it’s guessed, she hits ‘correct’ and gets shown a new word and continues until her 1 minute turn is up.'),
    h('h4', { class: 'rules__paragraph-topic' }, 'Round three: Password'),
    h('p', { class: 'rules__paragraph-text' }, 'For this last round, a player gets shown a word from the bowl and gives no more than a 1-word clue to get her teammates to guess the correct word. '),
    h('h4', { class: 'rules__paragraph-topic' }, 'Conclusion'),
    h('p', { class: 'rules__paragraph-text' }, 'The team with the most points after all three rounds wins the game. Anything can happen until the last round is played.')
  ]),
  h('div', {
    class: 'rules__return',
    onclick: () => {
      actions.location.go('/')
    }
  }, [
    h('img', {
      src: '/images/arrow-left.svg',
      class: 'rules__return-arrow'
    }),
    h('span', {}, 'return')
  ])
])
