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
import AppHeader from './components/AppHeader.vue'
import PriceFormSection from './components/PriceFormSection.vue'
import SearchSection from './components/SearchSection.vue'
import ScraperSection from './components/ScraperSection.vue'
import StatisticsSection from './components/StatisticsSection.vue'
import PriceTable from './components/PriceTable.vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const STORAGE_KEY = 'tea-price-tracker-prices'

let nextLocalId = Date.now()
const backendAvailable = ref(true)

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
    return this.maxPrice !== null && this.maxPrice !== undefined ? `NT$ ${this.maxPrice.toFixed(2)}` : '-'
  },
  get minPriceText() {
    return this.minPrice !== null && this.minPrice !== undefined ? `NT$ ${this.minPrice.toFixed(2)}` : '-'
  },
  get avgPriceText() {
    return this.avgPrice !== null && this.avgPrice !== undefined ? `NT$ ${this.avgPrice.toFixed(2)}` : '-'
  }
})

function isBackendUnavailableError(error) {
  const message = error?.message || ''
  return message === 'BACKEND_UNAVAILABLE' || message.includes('Failed to fetch') || message.includes('NetworkError')
}

function normalizePriceRecord(record) {
  return {
    id: Number(record.id) || nextLocalId++,
    date: record.date,
    productName: record.productName || '清心福全珍珠奶茶',
    price: Number(record.price),
    createdAt: record.createdAt || new Date().toISOString()
  }
}

function sortPrices(list) {
  return [...list].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) {
      return dateDiff
    }

    const createdDiff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    if (createdDiff !== 0) {
      return createdDiff
    }

    return Number(b.id) - Number(a.id)
  })
}

function readLocalPrices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return sortPrices(parsed.map(normalizePriceRecord))
  } catch (error) {
    console.error('讀取本地資料失敗:', error)
    return []
  }
}

function writeLocalPrices(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function updateStatisticsFromList(list) {
  if (list.length === 0) {
    stats.maxPrice = null
    stats.minPrice = null
    stats.avgPrice = null
    stats.totalRecords = 0
    return
  }

  const values = list.map((item) => Number(item.price)).filter((value) => Number.isFinite(value))

  if (values.length === 0) {
    stats.maxPrice = null
    stats.minPrice = null
    stats.avgPrice = null
    stats.totalRecords = list.length
    return
  }

  stats.maxPrice = Math.max(...values)
  stats.minPrice = Math.min(...values)
  stats.avgPrice = values.reduce((sum, value) => sum + value, 0) / values.length
  stats.totalRecords = list.length
}

function setLocalPrices(list) {
  const normalized = sortPrices(list.map(normalizePriceRecord))
  prices.value = normalized
  writeLocalPrices(normalized)
  updateStatisticsFromList(normalized)
}

async function parseJsonResponse(res) {
  const contentType = res.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('BACKEND_UNAVAILABLE')
  }

  return res.json()
}

async function loadAllPrices() {
  try {
    if (!backendAvailable.value) {
      throw new Error('BACKEND_UNAVAILABLE')
    }

    const res = await fetch(`${API_BASE}/api/prices`)
    const data = await parseJsonResponse(res)

    if (!res.ok) {
      throw new Error(data.error || '讀取價格失敗')
    }

    const normalized = sortPrices(data.map(normalizePriceRecord))
    prices.value = normalized
    writeLocalPrices(normalized)
    return
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      backendAvailable.value = false
    } else {
      console.error(error)
    }

    const localPrices = readLocalPrices()
    prices.value = localPrices
    updateStatisticsFromList(localPrices)
  }
}

async function addPrice() {
  const payload = {
    date: form.date,
    productName: form.productName,
    price: Number(form.price)
  }

  try {
    if (!backendAvailable.value) {
      throw new Error('BACKEND_UNAVAILABLE')
    }

    const res = await fetch(`${API_BASE}/api/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await parseJsonResponse(res)

    if (!res.ok) {
      alert(`❌ ${data.error || '新增失敗'}`)
      return
    }

    alert('✅ 記錄已新增！')
    form.price = null
    form.date = new Date().toISOString().split('T')[0]
    await loadAllPrices()
    await loadStatistics()
    return
  } catch (error) {
    if (!isBackendUnavailableError(error)) {
      console.error(error)
      alert(`❌ ${error.message || '無法連接伺服器'}`)
      return
    }

    backendAvailable.value = false
  }

  const localPrices = readLocalPrices()
  const newRecord = {
    id: nextLocalId++,
    ...payload,
    createdAt: new Date().toISOString()
  }

  setLocalPrices([newRecord, ...localPrices])
  alert('✅ 記錄已新增！')
  form.price = null
  form.date = new Date().toISOString().split('T')[0]
}

async function searchByDate() {
  if (!searchDate.value) {
    alert('❌ 請選擇日期')
    return
  }

  try {
    if (!backendAvailable.value) {
      throw new Error('BACKEND_UNAVAILABLE')
    }

    const res = await fetch(`${API_BASE}/api/prices/search?date=${searchDate.value}`)
    const data = await parseJsonResponse(res)

    if (!res.ok) {
      throw new Error(data.error || '搜尋失敗')
    }

    prices.value = sortPrices(data.map(normalizePriceRecord))
    return
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      backendAvailable.value = false
    } else {
      console.error(error)
    }
  }

  prices.value = readLocalPrices().filter((item) => item.date === searchDate.value)
}

async function deletePrice(id) {
  if (!confirm('確定要刪除此記錄嗎？')) return

  try {
    if (!backendAvailable.value) {
      throw new Error('BACKEND_UNAVAILABLE')
    }

    const res = await fetch(`${API_BASE}/api/prices/${id}`, { method: 'DELETE' })
    const data = await parseJsonResponse(res)

    if (!res.ok) {
      throw new Error(data.error || '刪除失敗')
    }

    alert('✅ 記錄已刪除！')
    await loadAllPrices()
    await loadStatistics()
    return
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      backendAvailable.value = false
    } else {
      console.error(error)
      alert(`❌ ${error.message || '刪除失敗'}`)
      return
    }
  }

  const nextPrices = readLocalPrices().filter((item) => item.id !== id)
  setLocalPrices(nextPrices)
  prices.value = nextPrices
  alert('✅ 記錄已刪除！')
}

async function loadStatistics() {
  try {
    if (!backendAvailable.value) {
      throw new Error('BACKEND_UNAVAILABLE')
    }

    const res = await fetch(`${API_BASE}/api/statistics`)
    const s = await parseJsonResponse(res)

    if (!res.ok) {
      throw new Error(s.error || '讀取統計失敗')
    }

    stats.maxPrice = s.maxPrice
    stats.minPrice = s.minPrice
    stats.avgPrice = s.avgPrice
    stats.totalRecords = s.totalRecords || 0
    return
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      backendAvailable.value = false
    } else {
      console.error(error)
    }
  }

  updateStatisticsFromList(readLocalPrices())
}

async function scrapeTea() {
  if (!backendAvailable.value) {
    scraperStatusClass.value = 'error'
    scraperMessage.value = '⚠️ 目前是純前端模式，爬蟲功能需要後端服務。'
    return
  }

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
  } catch (error) {
    console.error(error)
    scraperStatusClass.value = 'error'
    scraperMessage.value = `⚠️ 提示: ${error.message}<br>📊 系統已改用模擬數據進行演示`
  }
}

async function scrapeAndSave() {
  if (!backendAvailable.value) {
    scraperStatusClass.value = 'error'
    scraperMessage.value = '⚠️ 目前是純前端模式，無法把爬取結果存入後端資料庫。'
    return
  }

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
  } catch (error) {
    console.error(error)
    scraperStatusClass.value = 'error'
    scraperMessage.value = `❌ 無法連接伺服器: ${error.message}`
  }
}

onMounted(async () => {
  const today = new Date().toISOString().split('T')[0]
  form.date = today
  await loadAllPrices()
  await loadStatistics()
})
</script>
