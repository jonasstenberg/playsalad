import { h } from 'hyperapp'

const calculateScore = (room) => {
  if (!room) {
    return null
  }
  const teamScore = (players, team) => Object.keys(players)
    .reduce((acc, playerId) => {
      if (players[playerId].team === team) {
        acc += players[playerId].score
      }
      return acc
    }, 0)

  const teamFire = teamScore(room.players, 'fire')
  const teamIce = teamScore(room.players, 'ice')

  if (teamFire === teamIce) {
    return {
      teamFire,
      teamIce,
      draw: true
    }
  }

  return {
    winner: {
      team: teamFire > teamIce ? 'Fire' : 'Ice',
      score: Math.max(teamFire, teamIce)
    },
    loser: {
      team: teamFire > teamIce ? 'Ice' : 'Fire',
      score: Math.min(teamFire, teamIce)
    },
    teamFire,
    teamIce,
    draw: false
  }
}

export default (state, actions) => {
  const teamScores = calculateScore(state.room)

  return h('div', { class: 'game-over flex' }, [
    h('div', { class: 'game-over__header' }, [
      h('h1', { class: 'game-over__heading' }, 'Game over'),
      (() => {
        if (teamScores.draw) {
          return [
            h('h3', { class: 'game-over__subheading' }, 'Draw!'),
            h('p', { class: 'game-over__team-score' }, `Team Fire ${teamScores.teamFire}`),
            h('p', { class: 'game-over__team-score' }, `Team Ice ${teamScores.teamIce}`)
          ]
        }

        return [
          h('h3', { class: 'game-over__subheading' }, 'Congratulations!'),
          h('p', { class: `game-over__winning-team game-over__winning-team--${teamScores.winner.team.toLowerCase()}` }, [
            h('img', {
              src: `/images/${teamScores.winner.team.toLowerCase()}.svg`,
              class: 'game-over__team-logo game-over__team-logo--winning'
            }),
            h('span', {}, `Team ${teamScores.winner.team}`)
          ]),
          h('p', { class: 'game-over__winning-team-score' }, teamScores.winner.score),
          h('p', { class: 'game-over__losing-team' }, [
            h('img', {
              src: `/images/${teamScores.loser.team.toLowerCase()}-gray.svg`,
              class: 'game-over__team-logo game-over__team-logo--losing'
            }),
            h('span', {}, `Team ${teamScores.loser.team}`)
          ]),
          h('p', { class: 'game-over__losing-team-score game-over__team-logo' }, teamScores.loser.score)
        ]
      })()
    ]),
    state.playerId === state.room.ownerId
      ? h('button', {
        class: 'button button--orange',
        onclick: async () => {
          await actions.resetGame()
        }
      }, 'Play again')
      : 'Waiting for owner of game to do something'
  ])
}
