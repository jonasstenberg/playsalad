const getHostWithPath = (href) => {
  const link = document.createElement('a')
  link.href = href
  return link.hostname + link.pathname
}

/**
 * Minimal fetch-like polyfill from https://github.com/developit/unfetch
 *
 * The MIT License (MIT)
 * Copyright (c) 2017 Jason Miller
 *
 * @param {String} url
 * @param {Object} options
 * @returns {Promise.<Object>}
 */
export default (url, options = {}) => new Promise((resolve, reject) => {
  /* global XMLHttpRequest */
  const request = new XMLHttpRequest()
  const keys = []
  const all = []
  const headers = {}

  const response = () => ({
    ok: (request.status > 199 && request.status < 300),
    statusText: request.statusText,
    status: request.status,
    url: request.responseURL,
    text: () => Promise.resolve(request.responseText),
    json: () => Promise.resolve(JSON.parse(request.responseText)),
    clone: response,
    headers: {
      keys: () => keys,
      entries: () => all,
      get: n => headers[n.toLowerCase()],
      has: n => n.toLowerCase() in headers
    }
  })

  request.open(options.method || 'get', url, true)

  request.onload = () => {
    request.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, (m, key, value) => {
      // eslint-disable-next-line no-param-reassign
      keys.push(key = key.toLowerCase())
      all.push([key, value])
      headers[key] = headers[key] ? `${headers[key]},${value}` : value
    })
    if (!(request.status > 199 && request.status < 500)) {
      reject(new Error(`Error while fetching from ${getHostWithPath(url)}: ${request.status}`))
    }
    resolve(response())
  }

  request.addEventListener('error', () => {
    reject(new Error(`Error while fetching from ${getHostWithPath(url)}`))
  })

  request.addEventListener('abort', () => {
    reject(new Error(`Aborted while fetching from ${getHostWithPath(url)}`))
  })

  request.withCredentials = options.credentials === 'include'

  const reqHeaders = options.headers || {}
  Object.keys(reqHeaders).forEach((key) => {
    request.setRequestHeader(key, reqHeaders[key])
  })

  request.send(options.body || null)
})
