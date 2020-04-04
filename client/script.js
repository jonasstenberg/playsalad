/* global WebSocket */

const url = 'ws://localhost:8080'
const connection = new WebSocket(url)

const player = {}

connection.onopen = () => {
  connection.send(JSON.stringify({
    action: 'createUser'
  }))
  connection.send(JSON.stringify({
    action: 'createGroup'
  }))
}

connection.onerror = (error) => {
  console.log(`WebSocket error: ${error}`)
}

connection.onmessage = (e) => {
  const message = JSON.parse(e.data)
  if (!message.type) {
    console.log('No type in message')
    return
  }

  switch (message.type) {
    case 'newUser':
      player.userId = message.userId
      console.log(player)
      break
    case 'newGroup':
      player.groupId = message.groupId
      console.log(player)

      connection.send(JSON.stringify({
        action: 'joinGroup',
        groupId: player.groupId
      }))
      break
  }
}
