# XAU/USD Gold Trading Dashboard

เว็บไซต์ส่วนตัวสำหรับดูกราฟราคาทองคำ (XAU/USD) แบบ realtime พร้อมระบบ indicator, แจ้งเตือนทางอีเมล และบันทึก Win Rate

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
- ระบบ Historical Data Caching เก็บแท่งเทียนลง Database สะสมไปเรื่อยๆ
- Zoom / Pan ได้อิสระ พร้อม Crosshair แสดง OHLC

### Indicator (toggle เปิด/ปิดได้ทุกตัว)
- **EMA 20 / 50 / 200** — เส้นแนวโน้ม
- **Bollinger Bands** — upper/middle/lower บนกราฟหลัก
- **RSI 14** — panel แยกด้านล่าง พร้อมเส้น 30/70
- **MACD** — histogram + signal line panel แยก
- **Stochastic %K/%D** — panel แยก พร้อมเส้น 20/80
- **ATR 14** — แสดงตัวเลขใน header

### Alert System
- ตั้งเงื่อนไขได้หลายรูปแบบ เช่น RSI < 30, EMA cross
- cron job ตรวจทุก 1 นาทีตลอด 24 ชั่วโมง
- ส่งอีเมลแจ้งเตือนพร้อมคำแนะนำ Buy/Sell อัตโนมัติ
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
| Nodemailer | ส่งอีเมลผ่าน Gmail SMTP |
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
                               ▼
                    ┌──────────────────┐
                    │   Gmail SMTP     │
                    │ (Email Alerts)   │
                    └──────────────────┘
```

---

## Data Flow

### 1. โหลดกราฟ
```
User เปิดเว็บ
  → Frontend ส่ง GET /api/candles?interval=1h
  → Backend เช็ค DB ก่อน (candleCache)
  → ถ้ามีใน DB → ส่งกลับทันที (เร็ว)
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
  → ถ้าตรงเงื่อนไข → บันทึก alert_log → ส่งอีเมลผ่าน Gmail SMTP
  → อีเมลมีราคา, ค่า indicator, คำแนะนำ Buy/Sell
```

### 4. Historical Caching
```
Backend เริ่มต้น
  → sync ทุก timeframe (15min, 30min, 1h, 4h, 1day)
  → ถ้าไม่มีข้อมูล → ดึง 5000 แท่งแรก
  → ถ้ามีแล้ว → ดึงเฉพาะแท่งใหม่ที่ขาด
  → cron ทุก 1 ชั่วโมง → sync อัตโนมัติ
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
| GET | `/api/candles?symbol=XAU/USD&interval=1h` | ดึงข้อมูลแท่งเทียน |

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
│   │   │   └── mailer.js           # ส่งอีเมลผ่าน Gmail
│   │   ├── engine/
│   │   │   ├── indicators.js       # คำนวณ indicator ฝั่ง server
│   │   │   ├── alertEngine.js      # cron ตรวจเงื่อนไขทุก 1 นาที
│   │   │   └── cronJob.js          # cron jobs ต่างๆ
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
- Gmail + App Password

### 1. Clone Repository
```bash
git clone https://github.com/akarawitx/gold-dashboard.git
cd gold-dashboard
```

### 2. ตั้งค่า Environment Variables

**backend/.env**
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=golddashboard
DB_USER=postgres
DB_PASSWORD=postgres123
TWELVE_DATA_KEY=your_key
FINNHUB_KEY=your_key
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

**frontend/.env**
```
VITE_TWELVE_DATA_KEY=your_key
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

## Indicators ที่ใช้

| Indicator | ประเภท | ใช้ทำอะไร | สัญญาณ |
|-----------|--------|----------|--------|
| EMA 20/50/200 | Trend | ทิศทาง trend หลัก | ราคาเหนือ EMA = Bullish |
| RSI 14 | Momentum | Overbought/Oversold | < 30 = Oversold (Buy), > 70 = Overbought (Sell) |
| MACD | Momentum | Signal crossover | MACD ตัด Signal ขึ้น = Buy |
| Bollinger Bands | Volatility | ช่วงราคา + Squeeze | แตะ Lower = Buy, แตะ Upper = Sell |
| ATR 14 | Volatility | ขนาด Stop Loss | ค่ายิ่งสูง ยิ่งผันผวน |
| Stochastic | Momentum | จุดกลับตัว | < 20 = Oversold, > 80 = Overbought |

---

## Alert Operators

| Operator | ความหมาย | ตัวอย่าง |
|----------|----------|--------|
| `>` | มากกว่า | RSI > 70 |
| `<` | น้อยกว่า | RSI < 30 |
| `>=` | มากกว่าหรือเท่ากับ | RSI >= 70 |
| `<=` | น้อยกว่าหรือเท่ากับ | RSI <= 30 |
| `cross_above` | ข้ามขึ้นเหนือ | MACD cross above Signal |
| `cross_below` | ข้ามลงต่ำกว่า | MACD cross below Signal |

---

## ข้อจำกัด Free Tier

| Service | Limit |
|---------|-------|
| Twelve Data | 800 req/วัน, 5000 แท่ง/request |
| Finnhub | 60 req/นาที, WebSocket ≤ 50 symbols |
| Render | Sleep หลังไม่มีการใช้งาน (แก้ด้วย UptimeRobot) |
| Neon | 0.5GB storage, scale to zero 5 นาที (wake อัตโนมัติ) |
| Vercel | ไม่มี limit สำหรับ static frontend |

---

## คำเตือน

ระบบนี้สร้างขึ้นเพื่อการศึกษาและใช้งานส่วนตัว สัญญาณ indicator เป็นเพียงข้อมูลประกอบการตัดสินใจเท่านั้น ไม่ใช่คำแนะนำทางการเงิน การเทรด Forex มีความเสี่ยงสูง ควรศึกษาและทำความเข้าใจก่อนตัดสินใจลงทุนทุกครั้ง