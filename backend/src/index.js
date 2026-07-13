const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
const http    = require('http')

dotenv.config()

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT || 3001

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}))
app.use(express.json())

// Database
const pool = require('./db')
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Database connection failed:', err.message)
  else console.log('✅ Database connected:', res.rows[0].now)
})

// Routes
app.use('/api/candles', require('./routes/candles'))
app.use('/api/alerts',  require('./routes/alerts'))
app.use('/api/journal', require('./routes/journal'))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// WebSocket Server
const { initWsServer } = require('./ws/wsServer')
initWsServer(server)

// Finnhub realtime
const finnhub = require('./services/finnhub')
finnhub.connect()

// Alert Engine
const { startAlertEngine } = require('./engine/alertEngine')
startAlertEngine()

// Candle Cache — sync ตอนเริ่มระบบ
const { syncAllTimeframes } = require('./services/candleCache')
syncAllTimeframes()

// sync ทุก 1 ชั่วโมง
const cron = require('node-cron')
cron.schedule('0 * * * *', () => {
  console.log('[Cache] Auto sync...')
  syncAllTimeframes()
})

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

module.exports = app