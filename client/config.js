if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  module.exports = {
    websocketUrl: 'ws://localhost:8080/ws',
    backendBaseUrl: 'http://localhost:8080/api',
    timeout: 60,
    debug: true
  }
} else {
  module.exports = {
    websocketUrl: `wss://${window.location.hostname}/ws`,
    backendBaseUrl: '/api',
    timeout: 60,
    debug: false
  }
}
