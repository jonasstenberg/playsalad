const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./state.db')

const { snakeToCamelCaseObject } = require('./converters')

db.run('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.log(err)
  }
})

const convertAttributes = row => {
  if ('id' in row) {
    delete row.id
  }

  return snakeToCamelCaseObject(row)
}

module.exports = {
  run: (query, params) => {
    if (!params) {
      params = []
    }
    return new Promise((resolve, reject) => {
      db.run(query, params, (err, row) => {
        if (err) {
          console.log(query, params)
          reject(new Error('SQLite error: ' + err))
        } else {
          resolve(row)
        }
      })
    })
  },

  get: (query, params) => {
    if (!params) {
      params = []
    }
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) {
          console.log(query, params)
          reject(new Error('SQLite error: ' + err))
        } else {
          if (row) {
            resolve(convertAttributes(row))
          } else {
            resolve(row)
          }
        }
      })
    })
  },

  all: (query, params) => {
    if (!params) {
      params = []
    }
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.log(query, params)
          reject(new Error('SQLite error: ' + err))
        } else {
          if (rows) {
            resolve(rows.map(row => convertAttributes(row)))
          } else {
            resolve(rows)
          }
        }
      })
    })
  }
}
