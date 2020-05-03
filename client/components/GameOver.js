import { h } from 'hyperapp'

const calculateScore = (players) => {
  if (!players) {
    return null
  }
  const teamScore = (players, team) => players
    .reduce((acc, player) => {
      if (player.team === team) {
        acc += player.score
      }
      return acc
    }, 0)

  const teamFire = teamScore(players, 'fire')
  const teamIce = teamScore(players, 'ice')

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
  const teamScores = calculateScore(state.players)

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
    state.clientId === state.room.ownerId
      ? h('button', {
        class: 'button button--orange',
        onclick: async () => {
          await actions.resetGame()
        }
      }, 'Play again')
      : 'Waiting for owner of game to do something'
  ])
}
