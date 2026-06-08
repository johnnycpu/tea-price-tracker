<template>
  <section class="statistics-section">
    <h2>📊 統計資訊</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">最高價格</span>
        <span class="stat-value">{{ stats.maxPriceText }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">最低價格</span>
        <span class="stat-value">{{ stats.minPriceText }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">平均價格</span>
        <span class="stat-value">{{ stats.avgPriceText }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">記錄筆數</span>
        <span class="stat-value">{{ stats.totalRecords }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>
