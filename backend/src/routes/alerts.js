const router = require('express').Router()
const pool   = require('../db')

// ดึง alert ทั้งหมด
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM alerts ORDER BY created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// สร้าง alert ใหม่
router.post('/', async (req, res) => {
  const { indicator, operator, threshold, timeframe, cooldown_minutes } = req.body
  try {
    const { rows } = await pool.query(
      `INSERT INTO alerts (indicator, operator, threshold, timeframe, cooldown_minutes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [indicator, operator, threshold, timeframe || '1h', cooldown_minutes || 60]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// toggle เปิด/ปิด alert
router.post('/:id/toggle', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE alerts SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
      [req.params.id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ลบ alert
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM alerts WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router