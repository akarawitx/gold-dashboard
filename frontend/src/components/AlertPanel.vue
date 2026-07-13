<template>
  <div style="height:100%;display:flex;flex-direction:column;background:#111827;color:#f3f4f6">

    <!-- Header -->
    <div style="padding:16px 20px;border-bottom:1px solid #374151;background:#1f2937;flex-shrink:0">
      <h2 style="margin:0;font-size:15px;font-weight:600;color:#facc15">🔔 ตั้งค่าแจ้งเตือน</h2>
    </div>

    <!-- Form สร้าง Alert -->
    <div style="padding:16px;border-bottom:1px solid #374151;flex-shrink:0">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">

        <!-- Indicator -->
        <div>
          <label style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px">Indicator</label>
          <select v-model="form.indicator"
            style="width:100%;background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:6px 8px;border-radius:6px;font-size:13px">
            <option value="rsi">RSI 14</option>
            <option value="ema20">EMA 20</option>
            <option value="ema50">EMA 50</option>
            <option value="ema200">EMA 200</option>
            <option value="macd">MACD</option>
            <option value="macdHist">MACD Histogram</option>
            <option value="bbUpper">BB Upper</option>
            <option value="bbLower">BB Lower</option>
            <option value="price">ราคา</option>
          </select>
        </div>

        <!-- Operator -->
        <div>
          <label style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px">เงื่อนไข</label>
          <select v-model="form.operator"
            style="width:100%;background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:6px 8px;border-radius:6px;font-size:13px">
            <option value=">">มากกว่า (&gt;)</option>
            <option value="<">น้อยกว่า (&lt;)</option>
            <option value=">=">มากกว่าเท่ากับ (&gt;=)</option>
            <option value="<=">น้อยกว่าเท่ากับ (&lt;=)</option>
            <option value="cross_above">ข้ามขึ้น</option>
            <option value="cross_below">ข้ามลง</option>
          </select>
        </div>

        <!-- Threshold -->
        <div>
          <label style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px">ค่า</label>
          <input
            v-model.number="form.threshold"
            type="number"
            placeholder="เช่น 30"
            style="width:100%;background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:6px 8px;border-radius:6px;font-size:13px"
          />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <!-- Timeframe -->
        <div>
          <label style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px">Timeframe</label>
          <select v-model="form.timeframe"
            style="width:100%;background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:6px 8px;border-radius:6px;font-size:13px">
            <option value="1min">M1</option>
            <option value="5min">M5</option>
            <option value="15min">M15</option>
            <option value="1h">H1</option>
            <option value="4h">H4</option>
            <option value="1day">D1</option>
          </select>
        </div>

        <!-- Cooldown -->
        <div>
          <label style="font-size:11px;color:#9CA3AF;display:block;margin-bottom:4px">Cooldown (นาที)</label>
          <input
            v-model.number="form.cooldown_minutes"
            type="number"
            style="width:100%;background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:6px 8px;border-radius:6px;font-size:13px"
          />
        </div>
      </div>

      <button
        @click="handleCreate"
        :disabled="!form.threshold"
        style="width:100%;padding:8px;background:#facc15;color:#111827;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">
        + เพิ่ม Alert
      </button>
    </div>

    <!-- Alert List -->
    <div style="flex:1;overflow-y:auto;padding:12px">
      <div v-if="store.loading" style="text-align:center;color:#9CA3AF;padding:20px">
        กำลังโหลด...
      </div>

      <div v-else-if="store.alerts.length === 0"
        style="text-align:center;color:#6B7280;padding:20px;font-size:13px">
        ยังไม่มี Alert — เพิ่มด้านบนได้เลย
      </div>

      <div v-for="alert in store.alerts" :key="alert.id"
        style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:12px;margin-bottom:8px">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:500;color:#f3f4f6">
            {{ alert.indicator.toUpperCase() }}
            <span style="color:#9CA3AF;font-weight:400"> {{ alert.operator }} </span>
            <span style="color:#facc15">{{ alert.threshold }}</span>
          </span>

          <div style="display:flex;gap:6px;align-items:center">
            <!-- Active toggle -->
            <button @click="store.toggleAlert(alert.id)"
              :style="{
                padding: '3px 10px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                background: alert.is_active ? '#166534' : '#374151',
                color: alert.is_active ? '#86efac' : '#9CA3AF',
              }">
              {{ alert.is_active ? 'เปิด' : 'ปิด' }}
            </button>

            <!-- Delete -->
            <button @click="store.deleteAlert(alert.id)"
              style="padding:3px 8px;background:#7f1d1d;color:#fca5a5;border:none;border-radius:4px;cursor:pointer;font-size:11px">
              ลบ
            </button>
          </div>
        </div>

        <div style="font-size:11px;color:#6B7280;display:flex;gap:12px">
          <span>⏱ {{ alert.timeframe }}</span>
          <span>🕐 Cooldown {{ alert.cooldown_minutes }} นาที</span>
          <span v-if="alert.last_triggered_at">
            ล่าสุด: {{ new Date(alert.last_triggered_at).toLocaleString('th-TH') }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useAlertStore } from '../stores/alerts'

const store = useAlertStore()

const form = reactive({
  indicator:       'rsi',
  operator:        '<',
  threshold:       30,
  timeframe:       '1h',
  cooldown_minutes: 60,
})

async function handleCreate() {
  if (!form.threshold && form.threshold !== 0) return
  await store.createAlert({ ...form })
}

onMounted(() => store.fetchAlerts())
</script>