import { location } from '@hyperapp/router'

export default {
  location: location.state,
  backendUrl: 'http://localhost:8080',
  players: [],
  room: {
    activeRound: 1
  },
  timeRemaining: 60,
  games: {
    1: {
      name: 'Forbidden Word',
      description: [
        'Describe the word without naming it.',
        'Your team tries to guess the word.',
        'One point per correct guess.',
        'Continue until your 1 minute is up.'
      ]
    },
    2: {
      name: 'Charades',
      description: [
        'Act out the word without making sound.',
        'Your team tries to guess the word.',
        'One point per correct guess.',
        'Continue until your 1 minute is up.'
      ]
    },
    3: {
      name: 'Password',
      description: [
        'Give no more than a 1-word clue.',
        'Your team tries to guess the word.',
        'One point per correct guess.',
        'Continue until your 1 minute is up.'
      ]
    }
  }
}
