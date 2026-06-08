<template>
  <div class="container">
    <AppHeader />

    <PriceFormSection :form="form" @submit="addPrice" />

    <SearchSection
      v-model:searchDate="searchDate"
      @search="searchByDate"
      @reset="loadAllPrices"
    />

    <ScraperSection
      :status-class="scraperStatusClass"
      :message="scraperMessage"
      @scrape="scrapeTea"
      @scrape-save="scrapeAndSave"
    />

    <StatisticsSection :stats="stats" />

    <PriceTable :prices="prices" @delete="deletePrice" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppHeader from './AppHeader.vue'
import PriceFormSection from './PriceFormSection.vue'
import SearchSection from './SearchSection.vue'
import ScraperSection from './ScraperSection.vue'
import StatisticsSection from './StatisticsSection.vue'
import PriceTable from './PriceTable.vue'

const API_BASE = ''

const form = reactive({
  date: '',
  productName: '清心福全珍珠奶茶',
  price: null
})

const prices = ref([])
const searchDate = ref('')
const scraperMessage = ref('')
const scraperStatusClass = ref('')

const stats = reactive({
  maxPrice: null,
  minPrice: null,
  avgPrice: null,
  totalRecords: 0,
  get maxPriceText() {
    return this.maxPrice ? `NT$ ${this.maxPrice.toFixed(2)}` : '-'
  },
  get minPriceText() {
    return this.minPrice ? `NT$ ${this.minPrice.toFixed(2)}` : '-'
  },
  get avgPriceText() {
    return this.avgPrice ? `NT$ ${this.avgPrice.toFixed(2)}` : '-'
  }
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-Hant-TW')
}

async function loadAllPrices() {
  try {
    const res = await fetch(`${API_BASE}/api/prices`)
    const data = await res.json()
    prices.value = data
  } catch (e) {
    console.error(e)
  }
}

async function addPrice() {
  try {
    const res = await fetch(`${API_BASE}/api/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date,
        productName: form.productName,
        price: form.price
      })
    })

    if (res.ok) {
      alert('✅ 記錄已新增！')
      form.price = null
      const today = new Date().toISOString().split('T')[0]
      form.date = today
      await loadAllPrices()
      await loadStatistics()
    } else {
      alert('❌ 新增失敗')
    }
  } catch (e) {
    console.error(e)
    alert('❌ 無法連接伺服器')
  }
}

async function searchByDate() {
  if (!searchDate.value) {
    alert('❌ 請選擇日期')
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/prices/search?date=${searchDate.value}`)
    const data = await res.json()
    prices.value = data
  } catch (e) {
    console.error(e)
  }
}

async function deletePrice(id) {
  if (!confirm('確定要刪除此記錄嗎？')) return

  try {
    const res = await fetch(`${API_BASE}/api/prices/${id}`, { method: 'DELETE' })
    if (res.ok) {
      alert('✅ 記錄已刪除！')
      await loadAllPrices()
      await loadStatistics()
    } else {
      alert('❌ 刪除失敗')
    }
  } catch (e) {
    console.error(e)
  }
}

async function loadStatistics() {
  try {
    const res = await fetch(`${API_BASE}/api/statistics`)
    const s = await res.json()
    stats.maxPrice = s.maxPrice
    stats.minPrice = s.minPrice
    stats.avgPrice = s.avgPrice
    stats.totalRecords = s.totalRecords || 0
  } catch (e) {
    console.error(e)
  }
}

async function scrapeTea() {
  scraperStatusClass.value = 'loading'
  scraperMessage.value = '⏳ 正在爬取清心福全茶飲價格...請稍候...'

  try {
    const res = await fetch(`${API_BASE}/api/scrape/tea`, { method: 'POST' })
    const contentType = res.headers.get('content-type') || ''

    if (!contentType.includes('application/json')) {
      throw new Error('伺服器返回非 JSON')
    }

    const result = await res.json()

    if (res.ok && result.success) {
      scraperStatusClass.value = 'success'
      scraperMessage.value = `✅ <strong>爬取成功！</strong><br>取得 ${result.count} 筆數據${
        result.data?.slice(0, 3).map((d) => `<br>📅 ${d.date} - NT$ ${d.price}`).join('') || ''
      }`
    } else {
      scraperStatusClass.value = 'error'
      scraperMessage.value = `⚠️ 提示: ${result.error || result.message || '爬取失敗'}<br>系統將使用模擬數據`
    }
  } catch (e) {
    console.error(e)
    scraperStatusClass.value = 'error'
    scraperMessage.value = `⚠️ 提示: ${e.message}<br>📊 系統已改用模擬數據進行演示`
  }
}

async function scrapeAndSave() {
  scraperStatusClass.value = 'loading'
  scraperMessage.value = '⏳ 正在爬取並存儲數據...請稍候...'

  try {
    const res = await fetch(`${API_BASE}/api/scrape-and-save`, { method: 'POST' })
    const result = await res.json()

    if (res.ok && result.success) {
      scraperStatusClass.value = 'success'
      scraperMessage.value = `✅ <strong>爬取並存儲成功！</strong><br>爬取: ${result.total} 筆 | 存儲: ${result.saved} 筆 | 失敗: ${result.errors} 筆`
      setTimeout(() => {
        loadAllPrices()
        loadStatistics()
      }, 1000)
    } else {
      scraperStatusClass.value = 'error'
      scraperMessage.value = `❌ 操作失敗: ${result.error || result.message}`
    }
  } catch (e) {
    console.error(e)
    scraperStatusClass.value = 'error'
    scraperMessage.value = `❌ 無法連接伺服器: ${e.message}`
  }
}

onMounted(() => {
  const today = new Date().toISOString().split('T')[0]
  form.date = today
  loadAllPrices()
  loadStatistics()
})
</script>
