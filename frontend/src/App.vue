<template>
  <div style="height:100vh;display:flex;flex-direction:column;background:#111827;color:#f3f4f6">

    <!-- Header -->
    <header
      style="display:flex;align-items:center;gap:12px;padding:10px 20px;border-bottom:1px solid #374151;background:#1f2937;flex-shrink:0;flex-wrap:wrap;gap:8px">
      <h1 style="color:#facc15;font-weight:700;font-size:16px;margin:0">⚡ XAU/USD Gold Dashboard</h1>

      <!-- Timeframe -->
      <div style="display:flex;gap:4px;margin-left:8px">
        <button v-for="tf in timeframes" :key="tf.value" @click="store.setInterval(tf.value)" :style="{
          padding: '4px 10px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          background: store.currentInterval === tf.value ? '#facc15' : '#374151',
          color: store.currentInterval === tf.value ? '#111827' : '#d1d5db',
        }">{{ tf.label }}</button>
      </div>

      <!-- Divider -->
      <div style="width:1px;height:20px;background:#374151;margin:0 4px"></div>

      <!-- Alert Panel Toggle -->
      <button
        @click="showAlerts = !showAlerts"
        :style="{
          padding: '4px 12px',
          borderRadius: '4px',
          border: '1px solid #facc15',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          background: showAlerts ? '#facc15' : 'transparent',
          color: showAlerts ? '#111827' : '#facc15',
          marginLeft: '8px',
        }"
      >🔔 Alerts</button>

      <button
        @click="showJournal = !showJournal"
        :style="{
          padding: '4px 12px',
          borderRadius: '4px',
          border: '1px solid #A78BFA',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          background: showJournal ? '#A78BFA' : 'transparent',
          color: showJournal ? '#111827' : '#A78BFA',
          marginLeft: '4px',
        }"
      >📓 Journal</button>

      <!-- Indicator Toggles -->
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button v-for="ind in indicators" :key="ind.key" @click="toggleIndicator(ind.key)" :style="{
          padding: '4px 10px',
          borderRadius: '4px',
          border: `1px solid ${ind.color}`,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          background: activeIndicators[ind.key] ? ind.color : 'transparent',
          color: activeIndicators[ind.key] ? '#111827' : ind.color,
          transition: 'all 0.15s',
        }">{{ ind.label }}</button>
      </div>

      <!-- Realtime Price -->
      <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <div :style="{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: connected ? '#22C55E' : '#EF4444',
        }" />
        <span style="font-size:13px;color:#facc15;font-weight:600">
          {{ latestPrice ? latestPrice.price.toFixed(2) : '---' }}
        </span>
        <span style="font-size:11px;color:#6B7280">USD</span>
      </div>

      <!-- ATR Value display -->
      <div v-if="activeIndicators.atr && atrValue"
        style="margin-left:auto;font-size:12px;color:#34D399;background:#064e3b;padding:4px 10px;border-radius:4px">
        ATR 14: {{ atrValue }}
      </div>
    </header>

    <!-- Main Area -->
    <div style="flex:1;padding:12px;min-height:0;display:flex;gap:12px">

      <!-- Chart -->
      <div style="flex:1;min-width:0;border:1px solid #374151;border-radius:8px;overflow:hidden;position:relative">
        <ChartView :activeIndicators="activeIndicators" @atr-update="updateAtr" />
      </div>

      <!-- Alert Panel -->
      <div v-if="showAlerts"
        style="width:340px;flex-shrink:0;border:1px solid #374151;border-radius:8px;overflow:hidden">
        <AlertPanel />
      </div>

      <!-- Journal Panel -->
      <div v-if="showJournal"
        style="width:340px;flex-shrink:0;border:1px solid #374151;border-radius:8px;overflow:hidden">
        <JournalPanel />
      </div>

    </div>

  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useChartStore } from './stores/chart'
import ChartView from './components/ChartView.vue'
import AlertPanel from './components/AlertPanel.vue'
import JournalPanel from './components/JournalPanel.vue'
import { useWebSocket } from './composables/useWebSocket'

const store = useChartStore()
const { latestPrice, connected, connect } = useWebSocket()
onMounted(() => connect())

const timeframes = [
  { label: 'M1', value: '1min' },
  { label: 'M5', value: '5min' },
  { label: 'M15', value: '15min' },
  { label: 'M30', value: '30min' },
  { label: 'H1', value: '1h' },
  { label: 'H4', value: '4h' },
  { label: 'D1', value: '1day' },
]

const indicators = [
  { key: 'ema20', label: 'EMA 20', color: '#3B82F6' },
  { key: 'ema50', label: 'EMA 50', color: '#F59E0B' },
  { key: 'ema200', label: 'EMA 200', color: '#EF4444' },
  { key: 'bb', label: 'BB', color: '#6366F1' },
  { key: 'rsi', label: 'RSI', color: '#A78BFA' },
  { key: 'macd', label: 'MACD', color: '#22C55E' },
  { key: 'stoch', label: 'Stoch', color: '#F472B6' },
  { key: 'atr', label: 'ATR', color: '#34D399' },
]

const activeIndicators = reactive({
  ema20: true,
  ema50: true,
  ema200: true,
  bb: true,
  rsi: true,
  macd: false,
  stoch: false,
  atr: false,
})

const showAlerts = ref(false)
const showJournal = ref(false)
const atrValue = ref(null)

function updateAtr(val) {
  atrValue.value = val
}

function toggleIndicator(key) {
  activeIndicators[key] = !activeIndicators[key]
}
</script>