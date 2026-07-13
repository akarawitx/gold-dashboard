const router = require('express').Router()
const { getCandlesWithCache } = require('../services/candleCache')

router.get('/', async (req, res) => {
  const { symbol = 'XAU/USD', interval = '1h' } = req.query
  try {
    const candles = await getCandlesWithCache(symbol, interval)
    res.json({ status: 'ok', values: candles, count: candles.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router