const axios = require('axios')

async function getCandles(symbol = 'XAU/USD', interval = '1h', outputsize = 500) {
  const response = await axios.get('https://api.twelvedata.com/time_series', {
    params: {
      symbol,
      interval,
      outputsize,
      apikey: process.env.TWELVE_DATA_KEY,
    }
  })

  if (response.data.status === 'error') {
    throw new Error(response.data.message)
  }

  return response.data.values
    .map(v => ({
      time:  Math.floor(new Date(v.datetime.replace(' ', 'T') + 'Z').getTime() / 1000),
      open:  parseFloat(v.open),
      high:  parseFloat(v.high),
      low:   parseFloat(v.low),
      close: parseFloat(v.close),
    }))
    .sort((a, b) => a.time - b.time)
}

module.exports = { getCandles }