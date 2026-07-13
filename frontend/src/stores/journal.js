import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API = 'http://localhost:3001/api'

export const useJournalStore = defineStore('journal', () => {
  const entries  = ref([])
  const pending  = ref([])
  const stats    = ref(null)
  const loading  = ref(false)

  async function fetchEntries() {
    loading.value = true
    try {
      const { data } = await axios.get(`${API}/journal`)
      entries.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchPending() {
    const { data } = await axios.get(`${API}/journal/pending`)
    pending.value = data
  }

  async function fetchStats() {
    const { data } = await axios.get(`${API}/journal/stats`)
    stats.value = data
  }

  async function addEntry(payload) {
    const { data } = await axios.post(`${API}/journal`, payload)
    entries.value.unshift(data)
    await fetchStats()
    await fetchPending()
    return data
  }

  function exportCSV() {
    window.open(`${API}/journal/export`, '_blank')
  }

  return { entries, pending, stats, loading, fetchEntries, fetchPending, fetchStats, addEntry, exportCSV }
})