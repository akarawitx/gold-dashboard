const pool = require('../db')
const { getCandles } = require('./twelvedata')

const TIMEFRAMES = ['1min', '5min', '15min', '30min', '1h', '4h', '1day']
const SYMBOL = 'XAU/USD'

async function getCandlesFromDB(symbol, timeframe) {
  const { rows } = await pool.query(
    `SELECT time, open, high, low, close
     FROM candles
     WHERE symbol = $1 AND timeframe = $2
     ORDER BY time ASC`,
    [symbol, timeframe]
  )
  return rows.map(r => ({
    time:  parseInt(r.time),
    open:  parseFloat(r.open),
    high:  parseFloat(r.high),
    low:   parseFloat(r.low),
    close: parseFloat(r.close),
  }))
}

async function saveCandlesToDB(symbol, timeframe, candles) {
  if (!candles.length) return

  const values = candles.map(c =>
    `('${symbol}', '${timeframe}', ${c.time}, ${c.open}, ${c.high}, ${c.low}, ${c.close})`
  ).join(',')

  await pool.query(`
    INSERT INTO candles (symbol, timeframe, time, open, high, low, close)
    VALUES ${values}
    ON CONFLICT (symbol, timeframe, time) DO UPDATE SET
      open  = EXCLUDED.open,
      high  = EXCLUDED.high,
      low   = EXCLUDED.low,
      close = EXCLUDED.close
  `)
}

async function getLatestTimeInDB(symbol, timeframe) {
  const { rows } = await pool.query(
    `SELECT MAX(time) as latest FROM candles WHERE symbol = $1 AND timeframe = $2`,
    [symbol, timeframe]
  )
  return rows[0].latest ? parseInt(rows[0].latest) : null
}

async function syncCandles(symbol, timeframe) {
  try {
    const latestTime = await getLatestTimeInDB(symbol, timeframe)

    if (!latestTime) {
      console.log(`[Cache] ${timeframe} — ไม่มีข้อมูลใน DB ดึงครั้งแรก 5000 แท่ง`)
      const candles = await getCandles(symbol, timeframe, 5000)
      await saveCandlesToDB(symbol, timeframe, candles)
      console.log(`[Cache] ${timeframe} — บันทึก ${candles.length} แท่ง`)
    } else {
      const now = Math.floor(Date.now() / 1000)
      const diffMinutes = (now - latestTime) / 60

      const intervalMinutes = {
        '15min': 15, '30min': 30,
        '1h': 60, '4h': 240, '1day': 1440,
      }[timeframe] || 60

      const newBars = Math.ceil(diffMinutes / intervalMinutes)

      if (newBars <= 0) {
        console.log(`[Cache] ${timeframe} — ข้อมูลล่าสุดแล้ว ไม่ต้องดึงเพิ่ม`)
        return
      }

      const fetchSize = Math.min(newBars + 5, 100)
      console.log(`[Cache] ${timeframe} — ดึงเพิ่ม ${fetchSize} แท่ง`)
      const candles = await getCandles(symbol, timeframe, fetchSize)
      const newCandles = candles.filter(c => c.time > latestTime)

      if (newCandles.length > 0) {
        await saveCandlesToDB(symbol, timeframe, newCandles)
        console.log(`[Cache] ${timeframe} — บันทึกเพิ่ม ${newCandles.length} แท่งใหม่`)
      }
    }
  } catch (err) {
    console.error(`[Cache] ${timeframe} error:`, err.message)
  }
}

async function syncAllTimeframes() {
  console.log('[Cache] เริ่ม sync ทุก timeframe...')
  for (const tf of TIMEFRAMES) {
    await syncCandles(SYMBOL, tf)
    await new Promise(r => setTimeout(r, 1500))
  }
  console.log('[Cache] sync เสร็จ')
}

async function getCandlesWithCache(symbol, timeframe) {
  const dbCandles = await getCandlesFromDB(symbol, timeframe)

  if (dbCandles.length === 0) {
    console.log(`[Cache] ${timeframe} — ไม่มีใน DB ดึงจาก API`)
    const candles = await getCandles(symbol, timeframe, 5000)
    await saveCandlesToDB(symbol, timeframe, candles)
    return candles
  }

  console.log(`[Cache] ${timeframe} — ดึงจาก DB ${dbCandles.length} แท่ง`)
  return dbCandles
}

module.exports = { syncAllTimeframes, getCandlesWithCache }