<template>
  <section class="scraper-section">
    <h2>🕷️ 自動爬蟲</h2>
    <p class="scraper-info">🌐 從食品中國網自動爬取最新茶飲價格</p>
    <div class="scraper-buttons">
      <button class="btn btn-scrape" @click="$emit('scrape')">🕷️ 爬取清心福全價格</button>
      <button class="btn btn-scrape-save" @click="$emit('scrape-save')">💾 爬取並儲存</button>
    </div>
    <div :class="['scraper-status', statusClass]" v-html="message"></div>
  </section>
</template>

<script setup>
defineProps({
  statusClass: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  }
})

defineEmits(['scrape', 'scrape-save'])
</script>
