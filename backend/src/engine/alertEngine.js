const cron      = require('node-cron')
const pool      = require('../db')
const { getCandles }       = require('../services/twelvedata')
const { getLatestValues, checkCondition } = require('./indicators')
const { sendAlertEmail }   = require('../services/mailer')

async function runAlertCheck() {
  try {
    // ดึง alert ที่ active ทั้งหมด
    const { rows: alerts } = await pool.query(
      `SELECT * FROM alerts WHERE is_active = true`
    )
    if (!alerts.length) return

    // ดึง candle data มาคำนวณ
    const candles = await getCandles('XAU/USD', '1h', 500)
    const values  = getLatestValues(candles)

    console.log(`[Alert Engine] Checking ${alerts.length} alerts | Price: ${values.price} | RSI: ${values.rsi?.toFixed(2)}`)

    for (const alert of alerts) {
      // เช็ค cooldown
      if (alert.last_triggered_at) {
        const diffMin = (Date.now() - new Date(alert.last_triggered_at).getTime()) / 60000
        if (diffMin < alert.cooldown_minutes) continue
      }

      const triggered = checkCondition(alert.indicator, alert.operator, alert.threshold, values)

      if (triggered) {
        const indicatorVal = values[alert.indicator]

        // บันทึก log
        const { rows: logs } = await pool.query(
          `INSERT INTO alert_logs (alert_id, indicator_value, price_at_trigger, email_sent)
           VALUES ($1, $2, $3, false) RETURNING id`,
          [alert.id, indicatorVal, values.price]
        )

        // อัปเดต last_triggered_at
        await pool.query(
          `UPDATE alerts SET last_triggered_at = NOW() WHERE id = $1`,
          [alert.id]
        )

        // ส่งอีเมล
        try {
          await sendAlertEmail({
            indicator: alert.indicator,
            operator:  alert.operator,
            threshold: alert.threshold,
            value:     indicatorVal,
            price:     values.price,
          })
          await pool.query(
            `UPDATE alert_logs SET email_sent = true WHERE id = $1`,
            [logs[0].id]
          )
          console.log(`✅ Alert triggered: ${alert.indicator} ${alert.operator} ${alert.threshold}`)
        } catch (emailErr) {
          console.error('Email send error:', emailErr.message)
        }
      }
    }
  } catch (err) {
    console.error('[Alert Engine] Error:', err.message)
  }
}

function startAlertEngine() {
  console.log('🚀 Alert Engine started — checking every minute')
  cron.schedule('* * * * *', runAlertCheck)
}

module.exports = { startAlertEngine }