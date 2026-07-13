const router = require('express').Router()

router.get('/', (req, res) => {
  res.json({ message: 'journal route ok' })
})

module.exports = router