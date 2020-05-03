const db = require('./utils/db')

;(async () => {
  const team = await db.get(`
    SELECT
      SUM(CASE WHEN p.team = 'fire' THEN 1 ELSE 0 END) AS fire,
      SUM(CASE WHEN p.team = 'ice' THEN 1 ELSE 0 END) AS icice
    FROM
      players p
  `)

  console.log(team)
})()
