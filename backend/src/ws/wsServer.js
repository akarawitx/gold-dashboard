const { WebSocketServer } = require('ws')
const finnhub = require('../services/finnhub')

function initWsServer(server) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (client) => {
    console.log('Frontend connected to WS')

    // ส่งราคาล่าสุดทันทีที่เชื่อมต่อ
    const latest = finnhub.getLatestPrice()
    if (latest) {
      client.send(JSON.stringify({ type: 'tick', data: latest }))
    }

    // subscribe รับราคาใหม่แล้วส่งต่อ
    const unsubscribe = finnhub.subscribe((tick) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'tick', data: tick }))
      }
    })

    client.on('close', () => {
      unsubscribe()
      console.log('Frontend disconnected from WS')
    })
  })

  return wss
}

module.exports = { initWsServer }