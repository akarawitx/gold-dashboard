function calcEMA(candles, period) {
  if (candles.length < period) return []
  const k = 2 / (period + 1)
  let ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period
  const result = [{ time: candles[period - 1].time, value: ema }]
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k)
    result.push({ time: candles[i].time, value: ema })
  }
  return result
}

function calcRSI(candles, period = 14) {
  if (candles.length < period + 1) return []
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  const result = []
  result.push({ time: candles[period].time, value: 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss)) })
  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period
    result.push({ time: candles[i].time, value: 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss)) })
  }
  return result
}

function calcMACD(candles, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(candles, fast)
  const emaSlow = calcEMA(candles, slow)
  const slowMap = new Map(emaSlow.map(d => [d.time, d.value]))
  const fastMap = new Map(emaFast.map(d => [d.time, d.value]))
  const macdLine = []
  for (const [time, slowVal] of slowMap) {
    if (fastMap.has(time)) macdLine.push({ time, value: fastMap.get(time) - slowVal })
  }
  macdLine.sort((a, b) => a.time - b.time)
  if (macdLine.length < signal) return []
  const k = 2 / (signal + 1)
  let sig = macdLine.slice(0, signal).reduce((s, d) => s + d.value, 0) / signal
  const result = [{ time: macdLine[signal - 1].time, macd: macdLine[signal - 1].value, signal: sig, histogram: macdLine[signal - 1].value - sig }]
  for (let i = signal; i < macdLine.length; i++) {
    sig = macdLine[i].value * k + sig * (1 - k)
    result.push({ time: macdLine[i].time, macd: macdLine[i].value, signal: sig, histogram: macdLine[i].value - sig })
  }
  return result
}

function calcBB(candles, period = 20, mult = 2) {
  if (candles.length < period) return []
  const result = []
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1)
    const mean = slice.reduce((s, c) => s + c.close, 0) / period
    const std = Math.sqrt(slice.reduce((s, c) => s + Math.pow(c.close - mean, 2), 0) / period)
    result.push({ time: candles[i].time, upper: mean + mult * std, middle: mean, lower: mean - mult * std })
  }
  return result
}

// ดึงค่าล่าสุดของแต่ละ indicator
function getLatestValues(candles) {
  const ema20  = calcEMA(candles, 20)
  const ema50  = calcEMA(candles, 50)
  const ema200 = calcEMA(candles, 200)
  const rsi    = calcRSI(candles, 14)
  const macd   = calcMACD(candles)
  const bb     = calcBB(candles, 20, 2)

  return {
    ema20:     ema20.length  ? ema20[ema20.length - 1].value       : null,
    ema50:     ema50.length  ? ema50[ema50.length - 1].value       : null,
    ema200:    ema200.length ? ema200[ema200.length - 1].value     : null,
    rsi:       rsi.length    ? rsi[rsi.length - 1].value           : null,
    macd:      macd.length   ? macd[macd.length - 1].macd         : null,
    macdSignal:macd.length   ? macd[macd.length - 1].signal       : null,
    macdHist:  macd.length   ? macd[macd.length - 1].histogram    : null,
    bbUpper:   bb.length     ? bb[bb.length - 1].upper             : null,
    bbMiddle:  bb.length     ? bb[bb.length - 1].middle            : null,
    bbLower:   bb.length     ? bb[bb.length - 1].lower             : null,
    price:     candles.length ? candles[candles.length - 1].close  : null,
  }
}

// เช็คเงื่อนไข alert
function checkCondition(indicator, operator, threshold, values) {
  const val = values[indicator]
  if (val === null || val === undefined) return false
  switch (operator) {
    case '>':            return val > threshold
    case '<':            return val < threshold
    case '>=':           return val >= threshold
    case '<=':           return val <= threshold
    case 'cross_above':  return val > threshold
    case 'cross_below':  return val < threshold
    default:             return false
  }
}

module.exports = { getLatestValues, checkCondition }