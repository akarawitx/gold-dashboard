require('dotenv').config()
const pool = require('./db')

async function migrate() {
  const client = await pool.connect()

  try {
    console.log('Running migrations...')

    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id               SERIAL PRIMARY KEY,
        indicator        VARCHAR(20)  NOT NULL,
        operator         VARCHAR(20)  NOT NULL,
        threshold        NUMERIC      NOT NULL,
        timeframe        VARCHAR(10)  NOT NULL DEFAULT '1h',
        is_active        BOOLEAN      NOT NULL DEFAULT true,
        cooldown_minutes INTEGER      NOT NULL DEFAULT 60,
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        last_triggered_at TIMESTAMPTZ
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS alert_logs (
        id               SERIAL PRIMARY KEY,
        alert_id         INTEGER      NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
        triggered_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        indicator_value  NUMERIC,
        price_at_trigger NUMERIC,
        email_sent       BOOLEAN      NOT NULL DEFAULT false
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS journal (
        id              SERIAL PRIMARY KEY,
        alert_log_id    INTEGER      REFERENCES alert_logs(id) ON DELETE SET NULL,
        result          VARCHAR(10)  CHECK(result IN ('win','loss','skip')),
        entry_price     NUMERIC,
        exit_price      NUMERIC,
        pnl             NUMERIC,
        note            TEXT,
        recorded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS candles (
        id        SERIAL PRIMARY KEY,
        symbol    VARCHAR(20)  NOT NULL DEFAULT 'XAU/USD',
        timeframe VARCHAR(10)  NOT NULL,
        time      BIGINT       NOT NULL,
        open      NUMERIC      NOT NULL,
        high      NUMERIC      NOT NULL,
        low       NUMERIC      NOT NULL,
        close     NUMERIC      NOT NULL,
        UNIQUE(symbol, timeframe, time)
      )
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_candles_lookup
      ON candles(symbol, timeframe, time DESC)
    `)

    console.log('✅ Migration complete!')
  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()