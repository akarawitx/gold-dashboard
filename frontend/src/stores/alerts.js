import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api'

export const useAlertStore = defineStore('alerts', () => {
  const alerts  = ref([])
  const loading = ref(false)

  async function fetchAlerts() {
    loading.value = true
    try {
      const { data } = await axios.get(`${API}/alerts`)
      alerts.value = data
    } finally {
      loading.value = false
    }
  }

  async function createAlert(payload) {
    const { data } = await axios.post(`${API}/alerts`, payload)
    alerts.value.unshift(data)
    return data
  }

  async function toggleAlert(id) {
    const { data } = await axios.post(`${API}/alerts/${id}/toggle`)
    const idx = alerts.value.findIndex(a => a.id === id)
    if (idx !== -1) alerts.value[idx] = data
  }

  async function deleteAlert(id) {
    await axios.delete(`${API}/alerts/${id}`)
    alerts.value = alerts.value.filter(a => a.id !== id)
  }

  return { alerts, loading, fetchAlerts, createAlert, toggleAlert, deleteAlert }
})