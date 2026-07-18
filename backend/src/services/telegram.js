const axios = require('axios')

async function sendTelegramAlert({ indicator, operator, threshold, value, price }) {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log('Telegram not configured')
    return
  }

  const operatorLabel = {
    '>':           'มากกว่า',
    '<':           'น้อยกว่า',
    '>=':          'มากกว่าเท่ากับ',
    '<=':          'น้อยกว่าเท่ากับ',
    'cross_above': 'ข้ามขึ้นเหนือ',
    'cross_below': 'ข้ามลงต่ำกว่า',
  }[operator] || operator

  let action = '⚪ รอดูสถานการณ์'
  let signals = []

  if (indicator === 'rsi') {
    if (value < 30) {
      action = '🟢 BUY / Long'
      signals = ['RSI ต่ำกว่า 30 → โซน Oversold', 'รอแท่งเทียนสีเขียวยืนยันก่อนเข้า', 'วาง Stop Loss ใต้ Low ล่าสุด']
    } else if (value > 70) {
      action = '🔴 SELL / Short'
      signals = ['RSI สูงกว่า 70 → โซน Overbought', 'รอแท่งเทียนสีแดงยืนยันก่อนเข้า', 'วาง Stop Loss เหนือ High ล่าสุด']
    } else if (value < 50) {
      action = '🔴 SELL / Short'
      signals = ['RSI ต่ำกว่า 50 → Momentum ขาลง', 'ใช้ร่วมกับ indicator อื่นยืนยัน']
    } else {
      action = '🟢 BUY / Long'
      signals = ['RSI สูงกว่า 50 → Momentum ขาขึ้น', 'ใช้ร่วมกับ indicator อื่นยืนยัน']
    }
  } else if (indicator === 'macd' || indicator === 'macdHist') {
    if (operator === '>' || operator === 'cross_above') {
      action = '🟢 BUY / Long'
      signals = ['MACD เป็นบวก → Momentum ขาขึ้น', 'เข้า Buy เมื่อ MACD ตัดขึ้นเหนือ Signal line']
    } else {
      action = '🔴 SELL / Short'
      signals = ['MACD เป็นลบ → Momentum ขาลง', 'เข้า Sell เมื่อ MACD ตัดลงใต้ Signal line']
    }
  } else if (indicator === 'bbUpper') {
    action = '🔴 SELL / Short'
    signals = ['ราคาแตะ BB Upper → Overbought', 'รอแท่งเทียนยืนยันก่อนเข้า Sell']
  } else if (indicator === 'bbLower') {
    action = '🟢 BUY / Long'
    signals = ['ราคาแตะ BB Lower → Oversold', 'รอแท่งเทียนยืนยันก่อนเข้า Buy']
  } else {
    action = operator === '>' || operator === '>=' ? '🟢 BUY / Long' : '🔴 SELL / Short'
    signals = [`${indicator.toUpperCase()} ผ่านเงื่อนไข ${operator} ${threshold}`]
  }

  const signalText = signals.map(s => `• ${s}`).join('\n')

  const message = `
⚡ *XAU/USD Gold Alert*

*${action}*

📊 *Indicator:* ${indicator.toUpperCase()}
📋 *เงื่อนไข:* ${operatorLabel} ${threshold}
🔢 *ค่าปัจจุบัน:* ${parseFloat(value).toFixed(4)}
💰 *ราคาทอง:* $${parseFloat(price).toFixed(2)}
🕐 *เวลา:* ${new Date().toLocaleString('th-TH')}

📈 *การวิเคราะห์:*
${signalText}

⚠️ ใช้ประกอบการตัดสินใจเท่านั้น
`.trim()

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id:    chatId,
    text:       message,
    parse_mode: 'Markdown',
  })

  console.log(`✅ Telegram alert sent: ${indicator} ${operator} ${threshold}`)
}

module.exports = { sendTelegramAlert }