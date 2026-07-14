<template>
  <div style="width:100%;height:100%;position:relative;display:flex;flex-direction:column">

    <div v-if="store.isLoading && !store.candles.length"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,0.8);z-index:10">
      <span style="color:#facc15;font-size:14px">กำลังโหลดข้อมูล...</span>
    </div>

    <div v-if="store.error"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,0.8);z-index:10">
      <span style="color:#f87171;font-size:14px">{{ store.error }}</span>
    </div>

    <!-- Main chart -->
    <div ref="chartContainer" style="width:100%;flex:7;min-height:0" />

    <!-- RSI panel -->
    <div v-show="activeIndicators.rsi" ref="rsiContainer"
      style="width:100%;flex:3;min-height:0;border-top:1px solid #374151" />

    <!-- MACD panel -->
    <div v-show="activeIndicators.macd" ref="macdContainer"
      style="width:100%;flex:3;min-height:0;border-top:1px solid #374151" />

    <!-- Stochastic panel -->
    <div v-show="activeIndicators.stoch" ref="stochContainer"
      style="width:100%;flex:3;min-height:0;border-top:1px solid #374151" />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts'
import { useChartStore } from '../stores/chart'
import { calcEMA, calcRSI, calcBB, calcMACD, calcATR, calcStochastic } from '../composables/useIndicators'

const props = defineProps({
  activeIndicators: { type: Object, required: true }
})

const emit = defineEmits(['atr-update'])

const store = useChartStore()
const chartContainer = ref(null)
const rsiContainer = ref(null)
const macdContainer = ref(null)
const stochContainer = ref(null)

let chart = null
let rsiChart = null
let macdChart = null

let candleSeries = null
let ema20Series = null
let ema50Series = null
let ema200Series = null
let bbUpperSeries = null
let bbMiddleSeries = null
let bbLowerSeries = null
let rsiSeries = null
let rsiUpperSeries = null
let rsiLowerSeries = null
let macdLineSeries = null
let macdSignalSeries = null
let macdHistSeries = null
let stochKSeries = null
let stochDSeries = null
let stochUpperSeries = null
let stochLowerSeries = null
let stochChart = null

function initChart() {
  const chartOpts = (el) => ({
    width: el.clientWidth,
    height: el.clientHeight,
    layout: { background: { color: '#111827' }, textColor: '#9CA3AF' },
    grid: { vertLines: { color: '#1F2937' }, horzLines: { color: '#1F2937' } },
    rightPriceScale: { borderColor: '#374151' },
    timeScale: { borderColor: '#374151', timeVisible: true, secondsVisible: false },
  })

  // Main chart
  chart = createChart(chartContainer.value, chartOpts(chartContainer.value))

  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#22C55E', downColor: '#EF4444',
    borderUpColor: '#22C55E', borderDownColor: '#EF4444',
    wickUpColor: '#22C55E', wickDownColor: '#EF4444',
  })
  ema20Series = chart.addSeries(LineSeries, { color: '#3B82F6', lineWidth: 1, title: 'EMA 20' })
  ema50Series = chart.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 1, title: 'EMA 50' })
  ema200Series = chart.addSeries(LineSeries, { color: '#EF4444', lineWidth: 1, title: 'EMA 200' })
  bbUpperSeries = chart.addSeries(LineSeries, { color: '#6366F1', lineWidth: 1, lineStyle: 2, title: 'BB Upper' })
  bbMiddleSeries = chart.addSeries(LineSeries, { color: '#A78BFA', lineWidth: 1, lineStyle: 2, title: 'BB Mid' })
  bbLowerSeries = chart.addSeries(LineSeries, { color: '#6366F1', lineWidth: 1, lineStyle: 2, title: 'BB Lower' })

  // RSI chart
  rsiChart = createChart(rsiContainer.value, chartOpts(rsiContainer.value))
  rsiSeries = rsiChart.addSeries(LineSeries, { color: '#A78BFA', lineWidth: 2, title: 'RSI 14' })
  rsiUpperSeries = rsiChart.addSeries(LineSeries, { color: '#EF4444', lineWidth: 1, lineStyle: 2, title: '70' })
  rsiLowerSeries = rsiChart.addSeries(LineSeries, { color: '#22C55E', lineWidth: 1, lineStyle: 2, title: '30' })

  // MACD chart
  macdChart = createChart(macdContainer.value, chartOpts(macdContainer.value))
  macdHistSeries = macdChart.addSeries(HistogramSeries, { title: 'Histogram' })
  macdLineSeries = macdChart.addSeries(LineSeries, { color: '#3B82F6', lineWidth: 1, title: 'MACD' })
  macdSignalSeries = macdChart.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 1, title: 'Signal' })

  // Stochastic chart
  stochChart = createChart(stochContainer.value, chartOpts(stochContainer.value))
  stochKSeries = stochChart.addSeries(LineSeries, { color: '#F472B6', lineWidth: 2, title: '%K' })
  stochDSeries = stochChart.addSeries(LineSeries, { color: '#FBBF24', lineWidth: 1, title: '%D' })
  stochUpperSeries = stochChart.addSeries(LineSeries, { color: '#EF4444', lineWidth: 1, lineStyle: 2, title: '80' })
  stochLowerSeries = stochChart.addSeries(LineSeries, { color: '#22C55E', lineWidth: 1, lineStyle: 2, title: '20' })

  // Sync timescales
  const charts = [chart, rsiChart, macdChart, stochChart]
  charts.forEach(c => {
    c.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (!range) return
      charts.forEach(other => {
        if (other !== c) other.timeScale().setVisibleLogicalRange(range)
      })
    })
  })
}

function updateIndicators(candles) {
  if (!candles.length) return

  // EMA
  ema20Series.setData(calcEMA(candles, 20))
  ema50Series.setData(calcEMA(candles, 50))
  ema200Series.setData(calcEMA(candles, 200))

  // BB
  const bbData = calcBB(candles, 20, 2)
  bbUpperSeries.setData(bbData.map(d => ({ time: d.time, value: d.upper })))
  bbMiddleSeries.setData(bbData.map(d => ({ time: d.time, value: d.middle })))
  bbLowerSeries.setData(bbData.map(d => ({ time: d.time, value: d.lower })))

  // RSI
  const rsiData = calcRSI(candles, 14)
  rsiSeries.setData(rsiData)
  rsiUpperSeries.setData(rsiData.map(d => ({ time: d.time, value: 70 })))
  rsiLowerSeries.setData(rsiData.map(d => ({ time: d.time, value: 30 })))
  rsiChart.timeScale().fitContent()

  // MACD
  const macdData = calcMACD(candles)
  macdLineSeries.setData(macdData.map(d => ({ time: d.time, value: d.macd })))
  macdSignalSeries.setData(macdData.map(d => ({ time: d.time, value: d.signal })))
  macdHistSeries.setData(macdData.map(d => ({
    time: d.time,
    value: d.histogram,
    color: d.histogram >= 0 ? '#22C55E' : '#EF4444',
  })))
  macdChart.timeScale().fitContent()

  // ATR — แสดงเป็นตัวเลขใน header
  const atrData = calcATR(candles, 14)
  if (atrData.length > 0) {
    emit('atr-update', atrData[atrData.length - 1].value.toFixed(2))
  }

  // Stochastic
  const stochData = calcStochastic(candles, 14, 3)
  stochKSeries.setData(stochData.map(d => ({ time: d.time, value: d.k })))
  stochDSeries.setData(stochData.map(d => ({ time: d.time, value: d.d })))
  stochUpperSeries.setData(stochData.map(d => ({ time: d.time, value: 80 })))
  stochLowerSeries.setData(stochData.map(d => ({ time: d.time, value: 20 })))
  stochChart.timeScale().fitContent()
}

// Toggle visibility
watch(() => props.activeIndicators.ema20, v => ema20Series?.applyOptions({ visible: v }))
watch(() => props.activeIndicators.ema50, v => ema50Series?.applyOptions({ visible: v }))
watch(() => props.activeIndicators.ema200, v => ema200Series?.applyOptions({ visible: v }))
watch(() => props.activeIndicators.bb, v => {
  bbUpperSeries?.applyOptions({ visible: v })
  bbMiddleSeries?.applyOptions({ visible: v })
  bbLowerSeries?.applyOptions({ visible: v })
})
watch(() => props.activeIndicators.macd, async () => {
  await nextTick()
  macdChart?.applyOptions({
    width: macdContainer.value.clientWidth,
    height: macdContainer.value.clientHeight,
  })
})
watch(() => props.activeIndicators.rsi, async (val) => {
  await nextTick()
  if (val && rsiContainer.value) {
    rsiChart?.applyOptions({
      width:  rsiContainer.value.clientWidth,
      height: rsiContainer.value.clientHeight,
    })
    rsiChart?.timeScale().fitContent()
  }
})

watch(() => store.candles, (newCandles) => {
  if (candleSeries && newCandles.length > 0) {
    candleSeries.setData(newCandles)
    updateIndicators(newCandles)
    chart.timeScale().fitContent()
  }
}, { deep: true })

watch(() => props.activeIndicators.stoch, async () => {
  await nextTick()
  stochChart?.applyOptions({
    width: stochContainer.value.clientWidth,
    height: stochContainer.value.clientHeight,
  })
})

function handleResize() {
  const pairs = [
    [chart, chartContainer],
    [rsiChart, rsiContainer],
    [macdChart, macdContainer],
    [stochChart, stochContainer],
  ]
  pairs.forEach(([c, el]) => {
    if (c && el.value) {
      c.applyOptions({ width: el.value.clientWidth, height: el.value.clientHeight })
    }
  })
}

onMounted(async () => {
  await nextTick()
  initChart()
  await store.fetchCandles()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
    ;[chart, rsiChart, macdChart, stochChart].forEach(c => c?.remove())
})
</script>