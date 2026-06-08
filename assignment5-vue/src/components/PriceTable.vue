<template>
  <section class="table-section">
    <h2>📋 價格記錄清單</h2>
    <table class="price-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>商品名稱</th>
          <th>價格 (NT$)</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="prices.length === 0">
          <td colspan="4" class="empty-message">暫無記錄，請新增</td>
        </tr>
        <tr v-for="p in prices" :key="p.id">
          <td>{{ formatDate(p.date) }}</td>
          <td>{{ p.productName }}</td>
          <td>NT$ {{ p.price.toFixed(2) }}</td>
          <td>
            <button class="btn btn-delete" @click="$emit('delete', p.id)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
defineProps({
  prices: {
    type: Array,
    required: true
  }
})

defineEmits(['delete'])

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-Hant-TW')
}
</script>
