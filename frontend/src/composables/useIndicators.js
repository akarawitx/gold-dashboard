// คำนวณ EMA (Exponential Moving Average)
export function calcEMA(candles, period) {
  if (candles.length < period) return []

  const k = 2 / (period + 1)
  const result = []

  // หา SMA แรกก่อน
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += candles[i].close
  }
  let ema = sum / period
  result.push({ time: candles[period - 1].time, value: ema })

  // คำนวณ EMA ที่เหลือ
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k)
    result.push({ time: candles[i].time, value: ema })
  }

  return result
}

// คำนวณ RSI
export function calcRSI(candles, period = 14) {
  if (candles.length < period + 1) return []

  const result = []
  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close
    if (diff >= 0) gains += diff
    else losses -= diff
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  result.push({ time: candles[period].time, value: 100 - 100 / (1 + rs) })

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    const rs2 = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push({ time: candles[i].time, value: 100 - 100 / (1 + rs2) })
  }

  return result
}

// คำนวณ Bollinger Bands
export function calcBB(candles, period = 20, multiplier = 2) {
  if (candles.length < period) return []

  const result = []

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1)
    const mean = slice.reduce((s, c) => s + c.close, 0) / period
    const variance = slice.reduce((s, c) => s + Math.pow(c.close - mean, 2), 0) / period
    const std = Math.sqrt(variance)

    result.push({
      time:   candles[i].time,
      upper:  mean + multiplier * std,
      middle: mean,
      lower:  mean - multiplier * std,
    })
  }

  return result
}

// คำนวณ MACD
export function calcMACD(candles, fast = 12, slow = 26, signal = 9) {
  if (candles.length < slow + signal) return []

  const emaFast = calcEMA(candles, fast)
  const emaSlow = calcEMA(candles, slow)

  // หาจุดที่ทั้งคู่มีข้อมูลพร้อมกัน
  const slowTimes = new Map(emaSlow.map(d => [d.time, d.value]))
  const fastTimes = new Map(emaFast.map(d => [d.time, d.value]))

  const macdLine = []
  for (const [time, slowVal] of slowTimes) {
    if (fastTimes.has(time)) {
      macdLine.push({ time, value: fastTimes.get(time) - slowVal })
    }
  }
  macdLine.sort((a, b) => a.time - b.time)

  // คำนวณ Signal line (EMA ของ MACD)
  const k = 2 / (signal + 1)
  let sigVal = macdLine.slice(0, signal).reduce((s, d) => s + d.value, 0) / signal

  const result = []
  result.push({
    time:      macdLine[signal - 1].time,
    macd:      macdLine[signal - 1].value,
    signal:    sigVal,
    histogram: macdLine[signal - 1].value - sigVal,
  })

  for (let i = signal; i < macdLine.length; i++) {
    sigVal = macdLine[i].value * k + sigVal * (1 - k)
    result.push({
      time:      macdLine[i].time,
      macd:      macdLine[i].value,
      signal:    sigVal,
      histogram: macdLine[i].value - sigVal,
    })
  }

  return result
}

// คำนวณ ATR (Average True Range)
export function calcATR(candles, period = 14) {
  if (candles.length < period + 1) return []

  const trueRanges = []
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high
    const low  = candles[i].low
    const prevClose = candles[i - 1].close
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low  - prevClose)
    )
    trueRanges.push(tr)
  }

  // ATR แรก = average ของ TR period แรก
  let atr = trueRanges.slice(0, period).reduce((s, v) => s + v, 0) / period
  const result = [{ time: candles[period].time, value: atr }]

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period
    result.push({ time: candles[i + 1].time, value: atr })
  }

  return result
}

// คำนวณ Stochastic %K และ %D
export function calcStochastic(candles, kPeriod = 14, dPeriod = 3) {
  if (candles.length < kPeriod) return []

  const kValues = []

  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1)
    const highestHigh = Math.max(...slice.map(c => c.high))
    const lowestLow   = Math.min(...slice.map(c => c.low))
    const k = highestHigh === lowestLow
      ? 0
      : ((candles[i].close - lowestLow) / (highestHigh - lowestLow)) * 100
    kValues.push({ time: candles[i].time, k })
  }

  // %D = SMA 3 ของ %K
  const result = []
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const d = kValues.slice(i - dPeriod + 1, i + 1).reduce((s, v) => s + v.k, 0) / dPeriod
    result.push({ time: kValues[i].time, k: kValues[i].k, d })
  }

  return result
}