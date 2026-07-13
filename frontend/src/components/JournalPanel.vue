<template>
  <div style="height:100%;display:flex;flex-direction:column;background:#111827;color:#f3f4f6">

    <!-- Header -->
    <div style="padding:12px 16px;border-bottom:1px solid #374151;background:#1f2937;flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
      <h2 style="margin:0;font-size:15px;font-weight:600;color:#facc15">📓 Journal & Win Rate</h2>
      <button @click="store.exportCSV()"
        style="padding:4px 10px;background:transparent;border:1px solid #374151;color:#9CA3AF;border-radius:6px;cursor:pointer;font-size:11px">
        Export CSV
      </button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;border-bottom:1px solid #374151;flex-shrink:0">
      <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
        :style="{
          flex: 1,
          padding: '8px 0',
          fontSize: '12px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          color: activeTab === tab.key ? '#facc15' : '#6B7280',
          borderBottom: activeTab === tab.key ? '2px solid #facc15' : '2px solid transparent',
        }">
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Stats -->
    <div v-if="activeTab === 'stats'" style="flex:1;overflow-y:auto;padding:12px">
      <div v-if="!store.stats" style="text-align:center;color:#6B7280;padding:20px;font-size:13px">
        ยังไม่มีข้อมูล
      </div>
      <div v-else>
        <!-- Overall Stats -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
          <div style="background:#1f2937;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#22C55E">{{ store.stats.overall.wins }}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">Win</div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#EF4444">{{ store.stats.overall.losses }}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">Loss</div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#facc15">{{ store.stats.overall.win_rate ?? '-' }}%</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">Win Rate</div>
          </div>
        </div>

        <!-- PnL -->
        <div style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:#9CA3AF">กำไร/ขาดทุนรวม</span>
          <span :style="{fontSize:'14px',fontWeight:'600',color: store.stats.overall.total_pnl >= 0 ? '#22C55E' : '#EF4444'}">
            {{ store.stats.overall.total_pnl >= 0 ? '+' : '' }}{{ parseFloat(store.stats.overall.total_pnl).toFixed(2) }}
          </span>
        </div>

        <!-- Win Rate ต่อ Indicator -->
        <div style="font-size:12px;font-weight:500;color:#9CA3AF;margin-bottom:6px">Win Rate แยกต่อ Indicator</div>
        <div v-if="store.stats.byIndicator.length === 0"
          style="text-align:center;color:#6B7280;font-size:12px;padding:10px">
          ยังไม่มีข้อมูล
        </div>
        <div v-for="ind in store.stats.byIndicator" :key="ind.indicator"
          style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;font-weight:500">{{ ind.indicator?.toUpperCase() }}</span>
            <span style="font-size:13px;font-weight:600;color:#facc15">{{ ind.win_rate ?? '-' }}%</span>
          </div>
          <!-- Progress bar -->
          <div style="background:#374151;border-radius:4px;height:6px;overflow:hidden">
            <div :style="{
              width: (ind.win_rate || 0) + '%',
              height: '100%',
              background: ind.win_rate >= 50 ? '#22C55E' : '#EF4444',
              borderRadius: '4px',
              transition: 'width 0.3s',
            }"/>
          </div>
          <div style="display:flex;gap:10px;margin-top:4px;font-size:11px;color:#6B7280">
            <span>W: {{ ind.wins }}</span>
            <span>L: {{ ind.losses }}</span>
            <span>Total: {{ ind.total }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: บันทึก -->
    <div v-if="activeTab === 'record'" style="flex:1;overflow-y:auto;padding:12px">
      <div style="font-size:12px;font-weight:500;color:#9CA3AF;margin-bottom:8px">
        สัญญาณที่รอบันทึก ({{ store.pending.length }})
      </div>

      <div v-if="store.pending.length === 0"
        style="text-align:center;color:#6B7280;font-size:12px;padding:20px">
        ไม่มีสัญญาณรอบันทึก
      </div>

      <div v-for="item in store.pending" :key="item.id"
        style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;font-weight:500">
            {{ item.indicator?.toUpperCase() }} {{ item.operator }} {{ item.threshold }}
          </span>
          <span style="font-size:11px;color:#6B7280">
            {{ new Date(item.triggered_at).toLocaleString('th-TH') }}
          </span>
        </div>
        <div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;display:flex;gap:12px">
          <span>ค่า: <strong style="color:#A78BFA">{{ parseFloat(item.indicator_value).toFixed(2) }}</strong></span>
          <span>ราคา: <strong style="color:#facc15">${{ parseFloat(item.price_at_trigger).toFixed(2) }}</strong></span>
        </div>

        <!-- Form บันทึกผล -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
          <input v-model.number="forms[item.id].entry_price" type="number" placeholder="Entry price"
            style="background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:5px 8px;border-radius:6px;font-size:12px"/>
          <input v-model.number="forms[item.id].exit_price" type="number" placeholder="Exit price"
            style="background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:5px 8px;border-radius:6px;font-size:12px"/>
          <input v-model.number="forms[item.id].pnl" type="number" placeholder="P&L"
            style="background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:5px 8px;border-radius:6px;font-size:12px"/>
        </div>
        <input v-model="forms[item.id].note" type="text" placeholder="หมายเหตุ (ไม่บังคับ)"
          style="width:100%;background:#374151;border:1px solid #4B5563;color:#f3f4f6;padding:5px 8px;border-radius:6px;font-size:12px;margin-bottom:8px"/>

        <div style="display:flex;gap:6px">
          <button @click="handleRecord(item.id, 'win')"
            style="flex:1;padding:6px;background:#166534;color:#86efac;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500">
            ✓ Win
          </button>
          <button @click="handleRecord(item.id, 'loss')"
            style="flex:1;padding:6px;background:#7f1d1d;color:#fca5a5;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500">
            ✗ Loss
          </button>
          <button @click="handleRecord(item.id, 'skip')"
            style="flex:1;padding:6px;background:#374151;color:#9CA3AF;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500">
            Skip
          </button>
        </div>
      </div>
    </div>

    <!-- Tab: ประวัติ -->
    <div v-if="activeTab === 'history'" style="flex:1;overflow-y:auto;padding:12px">
      <div v-if="store.entries.length === 0"
        style="text-align:center;color:#6B7280;font-size:12px;padding:20px">
        ยังไม่มีประวัติ
      </div>

      <div v-for="entry in store.entries" :key="entry.id"
        style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
        <div :style="{
          width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: '700', flexShrink: 0,
          background: entry.result === 'win' ? '#166534' : entry.result === 'loss' ? '#7f1d1d' : '#374151',
          color: entry.result === 'win' ? '#86efac' : entry.result === 'loss' ? '#fca5a5' : '#9CA3AF',
        }">
          {{ entry.result === 'win' ? 'W' : entry.result === 'loss' ? 'L' : 'S' }}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500">
            {{ entry.indicator?.toUpperCase() ?? 'Manual' }}
            <span v-if="entry.pnl" :style="{color: entry.pnl >= 0 ? '#22C55E' : '#EF4444', marginLeft:'8px'}">
              {{ entry.pnl >= 0 ? '+' : '' }}{{ parseFloat(entry.pnl).toFixed(2) }}
            </span>
          </div>
          <div style="font-size:11px;color:#6B7280">
            {{ new Date(entry.recorded_at).toLocaleString('th-TH') }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useJournalStore } from '../stores/journal'

const store = useJournalStore()
const activeTab = ref('stats')

const tabs = [
  { key: 'stats',   label: 'Win Rate' },
  { key: 'record',  label: 'บันทึกผล' },
  { key: 'history', label: 'ประวัติ' },
]

const forms = reactive({})

watch(() => store.pending, (items) => {
  items.forEach(item => {
    if (!forms[item.id]) {
      forms[item.id] = { entry_price: null, exit_price: null, pnl: null, note: '' }
    }
  })
}, { immediate: true })

async function handleRecord(alertLogId, result) {
  const f = forms[alertLogId] || {}
  await store.addEntry({
    alert_log_id: alertLogId,
    result,
    entry_price:  f.entry_price  || null,
    exit_price:   f.exit_price   || null,
    pnl:          f.pnl          || null,
    note:         f.note         || null,
  })
  delete forms[alertLogId]
  activeTab.value = 'stats'
}

onMounted(() => {
  store.fetchEntries()
  store.fetchPending()
  store.fetchStats()
})
</script>