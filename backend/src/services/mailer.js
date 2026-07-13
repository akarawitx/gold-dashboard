const nodemailer = require('nodemailer')

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    }
  })
}

function getSignalAdvice(indicator, operator, threshold, value) {
  const signals = []
  let action = ''
  let confidence = ''

  if (indicator === 'rsi') {
    if (value < 30) {
      action = '🟢 BUY / Long'
      confidence = 'ปานกลาง'
      signals.push('RSI ต่ำกว่า 30 → โซน Oversold → ราคามักกลับตัวขึ้น')
      signals.push('รอแท่งเทียนสีเขียวยืนยันก่อนเข้า')
      signals.push('วาง Stop Loss ใต้ Low ล่าสุด')
    } else if (value > 70) {
      action = '🔴 SELL / Short'
      confidence = 'ปานกลาง'
      signals.push('RSI สูงกว่า 70 → โซน Overbought → ราคามักกลับตัวลง')
      signals.push('รอแท่งเทียนสีแดงยืนยันก่อนเข้า')
      signals.push('วาง Stop Loss เหนือ High ล่าสุด')
    } else {
      action = '⚪ รอดูสถานการณ์'
      confidence = 'ต่ำ'
      signals.push('RSI อยู่ในโซนกลาง ยังไม่มีสัญญาณชัดเจน')
    }
  } else if (indicator === 'ema20' || indicator === 'ema50' || indicator === 'ema200') {
    if (operator === '>' || operator === 'cross_above') {
      action = '🟢 BUY / Long'
      confidence = 'ปานกลาง-สูง'
      signals.push(`ราคาอยู่เหนือ ${indicator.toUpperCase()} → แนวโน้มขาขึ้น`)
      signals.push('เข้า Buy เมื่อราคา pullback มาแตะเส้น EMA')
      signals.push('วาง Stop Loss ใต้เส้น EMA')
    } else {
      action = '🔴 SELL / Short'
      confidence = 'ปานกลาง-สูง'
      signals.push(`ราคาอยู่ใต้ ${indicator.toUpperCase()} → แนวโน้มขาลง`)
      signals.push('เข้า Sell เมื่อราคา pullback มาแตะเส้น EMA')
      signals.push('วาง Stop Loss เหนือเส้น EMA')
    }
  } else if (indicator === 'macd') {
    if (operator === '>' || operator === 'cross_above') {
      action = '🟢 BUY / Long'
      confidence = 'ปานกลาง'
      signals.push('MACD เป็นบวก → Momentum ขาขึ้น')
      signals.push('เข้า Buy เมื่อ MACD ตัดขึ้นเหนือ Signal line')
      signals.push('ใช้ร่วมกับ EMA เพื่อยืนยัน')
    } else {
      action = '🔴 SELL / Short'
      confidence = 'ปานกลาง'
      signals.push('MACD เป็นลบ → Momentum ขาลง')
      signals.push('เข้า Sell เมื่อ MACD ตัดลงใต้ Signal line')
      signals.push('ใช้ร่วมกับ EMA เพื่อยืนยัน')
    }
  } else if (indicator === 'bbUpper') {
    action = '🔴 SELL / Short'
    confidence = 'ปานกลาง'
    signals.push('ราคาแตะ Bollinger Band บน → โซน Overbought')
    signals.push('มักเกิด reversal กลับลงมา')
    signals.push('รอแท่งเทียนยืนยันก่อนเข้า Sell')
  } else if (indicator === 'bbLower') {
    action = '🟢 BUY / Long'
    confidence = 'ปานกลาง'
    signals.push('ราคาแตะ Bollinger Band ล่าง → โซน Oversold')
    signals.push('มักเกิด reversal กลับขึ้นไป')
    signals.push('รอแท่งเทียนยืนยันก่อนเข้า Buy')
  } else if (indicator === 'macdHist') {
    if (value > 0) {
      action = '🟢 BUY / Long'
      confidence = 'ปานกลาง'
      signals.push('MACD Histogram เป็นบวก → แรง Momentum ขาขึ้น')
      signals.push('ยิ่ง Histogram สูง ยิ่ง Momentum แรง')
    } else {
      action = '🔴 SELL / Short'
      confidence = 'ปานกลาง'
      signals.push('MACD Histogram เป็นลบ → แรง Momentum ขาลง')
      signals.push('ยิ่ง Histogram ต่ำ ยิ่ง Momentum แรง')
    }
  } else {
    if (operator === '>' || operator === 'cross_above' || operator === '>=') {
      action = '🟢 BUY / Long'
      confidence = 'ปานกลาง'
      signals.push(`${indicator.toUpperCase()} ผ่านเงื่อนไข ${operator} ${threshold}`)
    } else {
      action = '🔴 SELL / Short'
      confidence = 'ปานกลาง'
      signals.push(`${indicator.toUpperCase()} ผ่านเงื่อนไข ${operator} ${threshold}`)
    }
  }

  return { action, confidence, signals }
}

async function sendAlertEmail({ indicator, operator, threshold, value, price }) {
  const transporter = createTransporter()
  const { action, confidence, signals } = getSignalAdvice(indicator, operator, threshold, value)

  const operatorLabel = {
    '>':           'มากกว่า',
    '<':           'น้อยกว่า',
    '>=':          'มากกว่าหรือเท่ากับ',
    '<=':          'น้อยกว่าหรือเท่ากับ',
    'cross_above': 'ข้ามขึ้นเหนือ',
    'cross_below': 'ข้ามลงต่ำกว่า',
  }[operator] || operator

  const actionColor = action.includes('BUY') ? '#16a34a' : action.includes('SELL') ? '#dc2626' : '#6b7280'
  const subject = `${action.includes('BUY') ? '🟢' : action.includes('SELL') ? '🔴' : '⚪'} Gold Alert: ${indicator.toUpperCase()} ${operatorLabel} ${threshold}`

  const signalRows = signals.map(s => `
    <tr>
      <td style="padding:6px 8px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6">
        • ${s}
      </td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:12px">

      <div style="background:#111827;padding:16px 20px;border-radius:8px;margin-bottom:16px">
        <h2 style="color:#facc15;margin:0;font-size:18px">⚡ XAU/USD Gold Alert</h2>
        <p style="color:#9ca3af;margin:4px 0 0;font-size:13px">Gold Trading Dashboard</p>
      </div>

      <!-- Action Box -->
      <div style="background:${actionColor};padding:14px 20px;border-radius:8px;margin-bottom:16px;text-align:center">
        <div style="color:#fff;font-size:22px;font-weight:700">${action}</div>
        <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px">
          ความน่าเชื่อถือของสัญญาณ: ${confidence}
        </div>
      </div>

      <!-- Price & Indicator Info -->
      <div style="background:#fff;border-radius:8px;overflow:hidden;margin-bottom:16px;border:1px solid #e5e7eb">
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:#f3f4f6">
            <td style="padding:10px 16px;font-size:12px;color:#6b7280;width:40%">Indicator</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#111827">${indicator.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:12px;color:#6b7280">เงื่อนไข</td>
            <td style="padding:10px 16px;font-size:13px;color:#374151">${operatorLabel} ${threshold}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:10px 16px;font-size:12px;color:#6b7280">ค่าปัจจุบัน</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#2563eb">${parseFloat(value).toFixed(4)}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:12px;color:#6b7280">ราคาทอง</td>
            <td style="padding:10px 16px;font-size:16px;font-weight:700;color:#d97706">$${parseFloat(price).toFixed(2)}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:10px 16px;font-size:12px;color:#6b7280">เวลา</td>
            <td style="padding:10px 16px;font-size:13px;color:#374151">${new Date().toLocaleString('th-TH')}</td>
          </tr>
        </table>
      </div>

      <!-- Signal Analysis -->
      <div style="background:#fff;border-radius:8px;overflow:hidden;margin-bottom:16px;border:1px solid #e5e7eb">
        <div style="padding:10px 16px;background:#1e3a5f;color:#fff;font-size:13px;font-weight:600">
          📊 การวิเคราะห์สัญญาณ
        </div>
        <table style="width:100%;border-collapse:collapse">
          ${signalRows}
        </table>
      </div>

      <!-- Warning -->
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:12px">
        <p style="margin:0;font-size:12px;color:#92400e">
          ⚠️ <strong>คำเตือน:</strong> สัญญาณนี้เป็นเพียงข้อมูลประกอบการตัดสินใจเท่านั้น
          ควรดูกราฟและปัจจัยอื่นๆ ประกอบก่อนเข้าออร์เดอร์ทุกครั้ง
          การเทรด Forex มีความเสี่ยงสูง
        </p>
      </div>

      <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
        แจ้งเตือนจาก XAU/USD Gold Dashboard
      </p>
    </div>
  `

  await transporter.sendMail({
    from:    `"Gold Dashboard" <${process.env.GMAIL_USER}>`,
    to:      process.env.GMAIL_USER,
    subject,
    html,
  })
}

module.exports = { sendAlertEmail }