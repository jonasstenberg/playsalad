const express = require('express')
const HttpStatus = require('http-status-codes')

const router = express.Router();

router.post('/', async (req, res) => {
  const { userId } = req.body
  try {
    res.sendStatus(HttpStatus.OK)
  } catch (err) {
    res.status(HttpStatus.NOT_FOUND).send(err)
  }
})

module.exports = router
