# XAU/USD Gold Trading Dashboard

เว็บไซต์ส่วนตัวสำหรับดูกราฟราคาทองคำ (XAU/USD) แบบ realtime พร้อมระบบ indicator, แจ้งเตือนผ่าน Telegram + อีเมล และบันทึก Win Rate

## Live Demo

| ส่วน | URL |
|------|-----|
| Frontend | https://gold-dashboard-smoky.vercel.app |
| Backend API | https://gold-dashboard-ev6t.onrender.com |

---

## Features

### กราฟ (Chart Module)
- กราฟแท่งเทียน XAU/USD แบบ realtime ผ่าน WebSocket
- เปลี่ยน Timeframe ได้ 7 ระดับ: M1, M5, M15, M30, H1, H4, D1
- ระบบ Historical Data Caching เก็บแท่งเทียนลง Database สะสมไปเรื่อยๆ ยิ่งใช้นานยิ่งมีข้อมูลเยอะ
- Zoom / Pan ได้อิสระ พร้อม Crosshair แสดง OHLC

### Indicator (toggle เปิด/ปิดได้ทุกตัว)
- **EMA 20 / 50 / 200** — เส้นแนวโน้ม
- **Bollinger Bands** — upper/middle/lower บนกราฟหลัก
- **RSI 14** — panel แยกด้านล่าง พร้อมเส้น 30/70
- **MACD** — histogram + signal line panel แยก
- **Stochastic %K/%D** — panel แยก พร้อมเส้น 20/80
- **ATR 14** — แสดงตัวเลขใน header

### Alert System
- ตั้งเงื่อนไขได้หลายรูปแบบ เช่น RSI < 30, MACD > 0
- cron job ตรวจทุก 1 นาทีตลอด 24 ชั่วโมง
- แจ้งเตือนผ่าน **Telegram Bot** ทันที ไม่มีปัญหา spam
- แจ้งเตือนผ่าน **อีเมล** (SendGrid) พร้อมคำแนะนำ Buy/Sell
- ระบบ Cooldown ป้องกัน spam
- เปิด/ปิด alert แต่ละตัวได้

### Journal & Win Rate
- บันทึกผลแต่ละสัญญาณ: Win / Loss / Skip
- ระบุ Entry Price, Exit Price, P&L
- คำนวณ Win Rate % อัตโนมัติแยกต่อ indicator
- ดูประวัติการเทรดย้อนหลัง
- Export ข้อมูลเป็น CSV

---

## Tech Stack

### Frontend
| เทคโนโลยี | ใช้ทำอะไร |
|-----------|----------|
| Vue 3 + Vite | Framework หลัก, build tool |
| Pinia | State management |
| Tailwind CSS | Styling |
| Lightweight Charts (TradingView) | กราฟแท่งเทียน |
| Axios | HTTP client ดึงข้อมูล API |

### Backend
| เทคโนโลยี | ใช้ทำอะไร |
|-----------|----------|
| Node.js + Express | API server |
| node-cron | ตรวจ alert ทุก 1 นาที |
| @sendgrid/mail | ส่งอีเมลผ่าน SendGrid API |
| Axios (Telegram) | ส่งแจ้งเตือนผ่าน Telegram Bot API |
| ws (WebSocket) | รับ tick จาก Finnhub + ส่งให้ Frontend |
| pg (node-postgres) | เชื่อมต่อ PostgreSQL |
| dotenv | จัดการ environment variables |

### Database
| เทคโนโลยี | ใช้ทำอะไร |
|-----------|----------|
| PostgreSQL | Database หลัก |
| Docker (local) | รัน PostgreSQL บนเครื่อง |
| Neon (production) | PostgreSQL cloud, free tier, ไม่ sleep |

### Data Sources (ฟรีทั้งหมด)
| API | ใช้ทำอะไร |
|-----|----------|
| Twelve Data | ดึง OHLC candle data ย้อนหลัง (800 req/วัน) |
| Finnhub WebSocket | รับราคา tick realtime |

### Notification
| ช่องทาง | Service | หมายเหตุ |
|---------|---------|---------|
| Telegram | Telegram Bot API | แนะนำ — ไม่มี spam, รับทันที |
| Email | SendGrid (100 อีเมล/วัน ฟรี) | สำรอง |

### Deployment
| ส่วน | Platform |
|------|----------|
| Frontend | Vercel (free) |
| Backend | Render.com (free) |
| Database | Neon PostgreSQL (free, 0.5GB) |
| Keep-alive | UptimeRobot ping ทุก 5 นาที |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      External APIs                          │
│   Twelve Data REST API        Finnhub WebSocket             │
│   (OHLC historical candles)   (realtime tick price)         │
└──────────────┬────────────────────────┬────────────────────┘
               │                        │
               ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                        │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │ candleCache │  │ finnhub.js   │  │  alertEngine.js  │  │
│   │ (sync DB)   │  │ (WS client)  │  │  (cron 1 min)    │  │
│   └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
│          │                │                    │            │
│   ┌──────▼────────────────▼────────────────────▼─────────┐  │
│   │              Express REST API + WS Server             │  │
│   │  /api/candles   /api/alerts   /api/journal            │  │
│   └──────────────────────────┬────────────────────────────┘  │
│                              │                              │
│   ┌───────────────────────────▼──────────────────────────┐  │
│   │              PostgreSQL Database                      │  │
│   │  candles | alerts | alert_logs | journal | settings  │  │
│   └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST + WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3)                         │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │  ChartView  │  │  AlertPanel  │  │  JournalPanel    │  │
│   │  (LW Chart) │  │  (CRUD)      │  │  (Win Rate)      │  │
│   └─────────────┘  └──────────────┘  └──────────────────┘  │
│   ┌──────────────────────────────────────────────────────┐  │
│   │           Pinia Stores (chart, alerts, journal)      │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
           ┌──────────────┐     ┌──────────────────┐
           │  Telegram    │     │  SendGrid Email  │
           │  Bot API     │     │  (Backup)        │
           └──────────────┘     └──────────────────┘
```

---

## Data Flow

### 1. โหลดกราฟ
```
User เปิดเว็บ
  → Frontend ส่ง GET /api/candles?interval=1h
  → Backend เช็ค DB ก่อน (candleCache)
  → ถ้ามีใน DB → ส่งกลับทันที (เร็ว, ไม่เปลือง API)
  → ถ้าไม่มี → ดึงจาก Twelve Data API → เก็บลง DB → ส่งกลับ
  → Frontend วาดกราฟด้วย Lightweight Charts
  → คำนวณ indicator (EMA, RSI, MACD, BB, Stoch, ATR)
```

### 2. ราคา Realtime
```
Finnhub WebSocket → Backend (finnhub.js)
  → Backend รับ tick price
  → ส่งต่อผ่าน WebSocket Server ไปยัง Frontend
  → Frontend อัปเดตราคาใน header และแท่งสุดท้ายบนกราฟ
```

### 3. ระบบแจ้งเตือน
```
node-cron ทุก 1 นาที
  → alertEngine.js ดึง active alerts จาก DB
  → ดึง candle data มาคำนวณ indicator
  → เช็ค cooldown แต่ละ alert
  → ถ้าตรงเงื่อนไข → บันทึก alert_log
    → ส่ง Telegram Bot (หลัก)
    → ส่ง Email SendGrid (สำรอง)
```

### 4. Historical Caching
```
Backend เริ่มต้น
  → sync ทุก timeframe (1min, 5min, 15min, 30min, 1h, 4h, 1day)
  → ถ้าไม่มีข้อมูล → ดึง 5000 แท่งแรก
  → ถ้ามีแล้ว → ดึงเฉพาะแท่งใหม่ที่ขาด
  → cron ทุก 1 ชั่วโมง → sync อัตโนมัติ
  → ยิ่งใช้นาน ข้อมูลสะสมมากขึ้น ดูย้อนหลังได้มากขึ้น
```

---

## Database Schema

```sql
-- เก็บแท่งเทียน (Historical Caching)
CREATE TABLE candles (
  id        SERIAL PRIMARY KEY,
  symbol    VARCHAR(20)  NOT NULL DEFAULT 'XAU/USD',
  timeframe VARCHAR(10)  NOT NULL,
  time      BIGINT       NOT NULL,
  open      NUMERIC      NOT NULL,
  high      NUMERIC      NOT NULL,
  low       NUMERIC      NOT NULL,
  close     NUMERIC      NOT NULL,
  UNIQUE(symbol, timeframe, time)
);

-- เก็บเงื่อนไขแจ้งเตือน
CREATE TABLE alerts (
  id                SERIAL PRIMARY KEY,
  indicator         VARCHAR(20)  NOT NULL,
  operator          VARCHAR(20)  NOT NULL,
  threshold         NUMERIC      NOT NULL,
  timeframe         VARCHAR(10)  NOT NULL DEFAULT '1h',
  is_active         BOOLEAN      NOT NULL DEFAULT true,
  cooldown_minutes  INTEGER      NOT NULL DEFAULT 60,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ
);

-- ประวัติการแจ้งเตือน
CREATE TABLE alert_logs (
  id               SERIAL PRIMARY KEY,
  alert_id         INTEGER      REFERENCES alerts(id) ON DELETE CASCADE,
  triggered_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  indicator_value  NUMERIC,
  price_at_trigger NUMERIC,
  email_sent       BOOLEAN      NOT NULL DEFAULT false
);

-- บันทึก Win/Loss
CREATE TABLE journal (
  id           SERIAL PRIMARY KEY,
  alert_log_id INTEGER      REFERENCES alert_logs(id) ON DELETE SET NULL,
  result       VARCHAR(10)  CHECK(result IN ('win','loss','skip')),
  entry_price  NUMERIC,
  exit_price   NUMERIC,
  pnl          NUMERIC,
  note         TEXT,
  recorded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ค่าตั้งต่างๆ
CREATE TABLE settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## API Endpoints

### Candles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candles?symbol=XAU/USD&interval=1h` | ดึงข้อมูลแท่งเทียน (จาก DB cache) |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | ดึง alert ทั้งหมด |
| POST | `/api/alerts` | สร้าง alert ใหม่ |
| POST | `/api/alerts/:id/toggle` | เปิด/ปิด alert |
| DELETE | `/api/alerts/:id` | ลบ alert |

### Journal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journal` | ดึงรายการทั้งหมด |
| POST | `/api/journal` | บันทึก Win/Loss/Skip |
| GET | `/api/journal/stats` | Win Rate สรุป + แยกต่อ indicator |
| GET | `/api/journal/pending` | alert logs ที่ยังไม่ได้บันทึก |
| GET | `/api/journal/export` | Export CSV |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | เช็คสถานะ backend |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `tick` | Server → Client | ราคา realtime |
| `candle_update` | Server → Client | แท่งล่าสุดอัปเดต |
| `alert_triggered` | Server → Client | แจ้งเตือน |

---

## Project Structure

```
gold-dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChartView.vue       # กราฟหลัก + indicator
│   │   │   ├── AlertPanel.vue      # UI ตั้งค่าแจ้งเตือน
│   │   │   └── JournalPanel.vue    # UI บันทึก Win/Loss
│   │   ├── stores/
│   │   │   ├── chart.js            # Pinia store สำหรับกราฟ
│   │   │   ├── alerts.js           # Pinia store สำหรับ alert
│   │   │   └── journal.js          # Pinia store สำหรับ journal
│   │   ├── composables/
│   │   │   ├── useIndicators.js    # คำนวณ EMA, RSI, MACD, BB, Stoch, ATR
│   │   │   └── useWebSocket.js     # WebSocket client
│   │   └── App.vue                 # Root component
│   ├── .env                        # Local env
│   └── .env.production             # Production env
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── candles.js          # API ดึงข้อมูลกราฟ
│   │   │   ├── alerts.js           # CRUD alerts
│   │   │   └── journal.js          # CRUD journal + stats
│   │   ├── services/
│   │   │   ├── twelvedata.js       # ดึง candle จาก Twelve Data
│   │   │   ├── finnhub.js          # WebSocket client Finnhub
│   │   │   ├── candleCache.js      # Historical caching logic
│   │   │   ├── mailer.js           # ส่งอีเมลผ่าน SendGrid
│   │   │   └── telegram.js         # ส่งแจ้งเตือนผ่าน Telegram Bot
│   │   ├── engine/
│   │   │   ├── indicators.js       # คำนวณ indicator ฝั่ง server
│   │   │   └── alertEngine.js      # cron ตรวจเงื่อนไขทุก 1 นาที
│   │   ├── ws/
│   │   │   └── wsServer.js         # WebSocket server
│   │   ├── db.js                   # PostgreSQL connection pool
│   │   ├── migrate.js              # สร้าง tables
│   │   └── index.js                # Entry point
│   ├── .env                        # Local env
│   └── .env.production             # Production env
│
├── docker-compose.yml              # PostgreSQL local
├── start.bat                       # เปิดทุกอย่างคลิกเดียว (Windows)
└── README.md
```

---

## การติดตั้งและรันงาน (Local)

### สิ่งที่ต้องมีก่อน
- Node.js v18+
- Docker Desktop
- API Keys: Twelve Data, Finnhub
- SendGrid API Key (ส่งอีเมล)
- Telegram Bot Token + Chat ID

### 1. Clone Repository
```bash
git clone https://github.com/akarawitx/gold-dashboard.git
cd gold-dashboard
```

### 2. ตั้งค่า Environment Variables

**backend/.env**
```
PORT=3001

# Database (Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=golddashboard
DB_USER=postgres
DB_PASSWORD=postgres123

# API Keys
TWELVE_DATA_KEY=your_key
FINNHUB_KEY=your_key

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxx
GMAIL_USER=sender@gmail.com
ALERT_EMAIL_TO=receiver@gmail.com

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 3. รัน PostgreSQL
```bash
docker-compose up -d
```

### 4. รัน Migration
```bash
cd backend
npm install
node src/migrate.js
```

### 5. รัน Backend
```bash
npm run dev
```

### 6. รัน Frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 7. เปิดเว็บ
```
http://localhost:5173
```

### หรือใช้ Batch File (Windows)
ดับเบิลคลิก `start.bat` เปิดทุกอย่างในคลิกเดียว

---

## การตั้งค่า Telegram Bot

1. เปิด Telegram ค้นหา `@BotFather`
2. พิมพ์ `/newbot` แล้วตั้งชื่อ Bot
3. Copy **Bot Token** ที่ได้รับ
4. เปิด Chat กับ Bot แล้วพิมพ์ `/start`
5. เปิด URL นี้เพื่อหา Chat ID:
```
https://api.telegram.org/bot{TOKEN}/getUpdates
```
6. ใส่ `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID` ใน `.env`

---

## Alert Operators

| Operator | ความหมาย | ตัวอย่าง |
|----------|----------|--------|
| `>` | มากกว่า | RSI > 70 |
| `<` | น้อยกว่า | RSI < 30 |
| `>=` | มากกว่าหรือเท่ากับ | RSI >= 70 |
| `<=` | น้อยกว่าหรือเท่ากับ | RSI <= 30 |
| `cross_above` | ข้ามขึ้นเหนือ | MACD cross above 0 |
| `cross_below` | ข้ามลงต่ำกว่า | MACD cross below 0 |

---

## Indicators ที่ใช้

| Indicator | ประเภท | สัญญาณ | Cooldown แนะนำ |
|-----------|--------|--------|---------------|
| RSI 14 | Momentum | < 30 = Buy, > 70 = Sell | H1: 60 นาที, H4: 240 นาที |
| EMA 20/50/200 | Trend | ราคาเหนือ EMA = Bullish | H1: 120 นาที |
| MACD | Momentum | > 0 = Buy, < 0 = Sell | H1: 240 นาที |
| MACD Histogram | Momentum | > 0 = Buy momentum | H4: 480 นาที |
| Bollinger Bands | Volatility | แตะ Lower = Buy, Upper = Sell | H1: 60 นาที |
| ATR 14 | Volatility | ใช้กำหนด Stop Loss | — |
| Stochastic | Momentum | < 20 = Oversold, > 80 = Overbought | H1: 60 นาที |

---

## ชุด Alert แนะนำ

| Indicator | เงื่อนไข | ค่า | Timeframe | Cooldown | ความหมาย |
|-----------|---------|-----|-----------|---------|---------|
| RSI | < | 20 | H1 | 120 | Oversold รุนแรง Buy |
| RSI | < | 30 | H1 | 60 | Oversold Buy |
| RSI | > | 70 | H1 | 60 | Overbought Sell |
| RSI | < | 30 | H4 | 240 | Oversold Buy แรง |
| RSI | > | 70 | H4 | 240 | Overbought Sell แรง |
| RSI | > | 50 | H4 | 240 | Trend ขาขึ้น |
| RSI | < | 50 | H4 | 240 | Trend ขาลง |
| MACD | > | 0 | H1 | 240 | Momentum ขาขึ้น |
| MACD | < | 0 | H1 | 240 | Momentum ขาลง |
| MACD Histogram | < | 0 | H4 | 480 | Momentum ขาลงระยะกลาง |

---

## ข้อจำกัด Free Tier

| Service | Limit |
|---------|-------|
| Twelve Data | 800 req/วัน, 5000 แท่ง/request |
| Finnhub | 60 req/นาที, WebSocket ≤ 50 symbols |
| SendGrid | 100 อีเมล/วัน ฟรีตลอดชีพ |
| Telegram | ไม่จำกัด ฟรี |
| Render | Sleep หลังไม่มีการใช้งาน (แก้ด้วย UptimeRobot) |
| Neon | 0.5GB storage, scale to zero 5 นาที (wake อัตโนมัติ) |
| Vercel | ไม่มี limit สำหรับ static frontend |
| UptimeRobot | Ping ทุก 5 นาที ฟรี |

---

## คำเตือน

ระบบนี้สร้างขึ้นเพื่อการศึกษาและใช้งานส่วนตัว สัญญาณ indicator เป็นเพียงข้อมูลประกอบการตัดสินใจเท่านั้น ไม่ใช่คำแนะนำทางการเงิน การเทรด Forex มีความเสี่ยงสูง ควรศึกษาและทำความเข้าใจก่อนตัดสินใจลงทุนทุกครั้ง