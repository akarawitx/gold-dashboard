const router = require('express').Router()
const pool   = require('../db')

// ดึงรายการ journal ทั้งหมด พร้อมข้อมูล alert
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        j.*,
        al.triggered_at,
        al.indicator_value,
        al.price_at_trigger,
        a.indicator,
        a.operator,
        a.threshold,
        a.timeframe
      FROM journal j
      LEFT JOIN alert_logs al ON j.alert_log_id = al.id
      LEFT JOIN alerts a ON al.alert_id = a.id
      ORDER BY j.recorded_at DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// บันทึก Win/Loss/Skip
router.post('/', async (req, res) => {
  const { alert_log_id, result, entry_price, exit_price, pnl, note } = req.body
  try {
    const { rows } = await pool.query(`
      INSERT INTO journal (alert_log_id, result, entry_price, exit_price, pnl, note)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [alert_log_id || null, result, entry_price || null, exit_price || null, pnl || null, note || null]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ดึง Win Rate stats แยกต่อ indicator
router.get('/stats', async (req, res) => {
  try {
    // Win Rate รวม
    const { rows: overall } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE result = 'win')  as wins,
        COUNT(*) FILTER (WHERE result = 'loss') as losses,
        COUNT(*) FILTER (WHERE result = 'skip') as skips,
        COUNT(*) as total,
        ROUND(
          COUNT(*) FILTER (WHERE result = 'win') * 100.0 /
          NULLIF(COUNT(*) FILTER (WHERE result IN ('win','loss')), 0)
        , 1) as win_rate,
        COALESCE(SUM(pnl), 0) as total_pnl
      FROM journal
    `)

    // Win Rate แยกต่อ indicator
    const { rows: byIndicator } = await pool.query(`
      SELECT
        a.indicator,
        COUNT(*) FILTER (WHERE j.result = 'win')  as wins,
        COUNT(*) FILTER (WHERE j.result = 'loss') as losses,
        COUNT(*) FILTER (WHERE j.result = 'skip') as skips,
        COUNT(*) as total,
        ROUND(
          COUNT(*) FILTER (WHERE j.result = 'win') * 100.0 /
          NULLIF(COUNT(*) FILTER (WHERE j.result IN ('win','loss')), 0)
        , 1) as win_rate,
        COALESCE(SUM(j.pnl), 0) as total_pnl
      FROM journal j
      LEFT JOIN alert_logs al ON j.alert_log_id = al.id
      LEFT JOIN alerts a ON al.alert_id = a.id
      WHERE a.indicator IS NOT NULL
      GROUP BY a.indicator
      ORDER BY win_rate DESC NULLS LAST
    `)

    // Win Rate timeline (รายวัน)
    const { rows: timeline } = await pool.query(`
      SELECT
        DATE(recorded_at) as date,
        COUNT(*) FILTER (WHERE result = 'win')  as wins,
        COUNT(*) FILTER (WHERE result = 'loss') as losses,
        ROUND(
          COUNT(*) FILTER (WHERE result = 'win') * 100.0 /
          NULLIF(COUNT(*) FILTER (WHERE result IN ('win','loss')), 0)
        , 1) as win_rate
      FROM journal
      GROUP BY DATE(recorded_at)
      ORDER BY date ASC
    `)

    res.json({ overall: overall[0], byIndicator, timeline })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ดึง alert_logs ที่ยังไม่ได้บันทึก journal
router.get('/pending', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        al.id,
        al.triggered_at,
        al.indicator_value,
        al.price_at_trigger,
        a.indicator,
        a.operator,
        a.threshold,
        a.timeframe
      FROM alert_logs al
      LEFT JOIN alerts a ON al.alert_id = a.id
      LEFT JOIN journal j ON j.alert_log_id = al.id
      WHERE j.id IS NULL
      ORDER BY al.triggered_at DESC
      LIMIT 50
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Export CSV
router.get('/export', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        j.recorded_at,
        a.indicator,
        a.operator,
        a.threshold,
        al.indicator_value,
        al.price_at_trigger,
        j.result,
        j.entry_price,
        j.exit_price,
        j.pnl,
        j.note
      FROM journal j
      LEFT JOIN alert_logs al ON j.alert_log_id = al.id
      LEFT JOIN alerts a ON al.alert_id = a.id
      ORDER BY j.recorded_at DESC
    `)

    const header = 'date,indicator,operator,threshold,indicator_value,price,result,entry,exit,pnl,note'
    const csv = [header, ...rows.map(r =>
      [
        r.recorded_at, r.indicator, r.operator, r.threshold,
        r.indicator_value, r.price_at_trigger, r.result,
        r.entry_price, r.exit_price, r.pnl, r.note || ''
      ].join(',')
    )].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=journal.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router