import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API = 'http://localhost:3001/api'

export const useChartStore = defineStore('chart', () => {
  const candles         = ref([])
  const currentSymbol   = ref('XAU/USD')
  const currentInterval = ref('1h')
  const isLoading       = ref(false)
  const error           = ref(null)

  async function fetchCandles(symbol = currentSymbol.value, interval = currentInterval.value) {
    isLoading.value = true
    error.value     = null

    try {
      const { data } = await axios.get(`${API}/candles`, {
        params: { symbol, interval }
      })
      candles.value = data.values
    } catch (err) {
      error.value = err.message || 'Failed to fetch candles'
      console.error('fetchCandles error:', err)
    } finally {
      isLoading.value = false
    }
  }

  function setInterval(interval) {
    currentInterval.value = interval
    fetchCandles()
  }

  return {
    candles,
    currentSymbol,
    currentInterval,
    isLoading,
    error,
    fetchCandles,
    setInterval,
  }
})