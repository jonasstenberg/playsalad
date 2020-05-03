module.exports = {
  snakeToCamelCaseObject: (obj) => Object.keys(obj).reduce((acc, curr) => {
    if (curr.indexOf('_') > -1) {
      acc[curr.replace(/(_\w)/g, w => w[1].toUpperCase())] = obj[curr]
    } else {
      acc[curr] = obj[curr]
    }
    return acc
  }, {}),

  camelToSnakeCaseObject: (obj) => Object.keys(obj).reduce((acc, curr) => {
    if (curr.test(/[A-Z]/g)) {
      acc[curr.replace(/[A-Z]/g, w => `_${w.toLowerCase()}`)] = obj[curr]
    } else {
      acc[curr] = obj[curr]
    }
    return acc
  }, {}),

  camelToSnakeCase: (str) => str.replace(/[A-Z]/g, w => `_${w.toLowerCase()}`)
}
