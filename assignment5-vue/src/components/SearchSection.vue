<template>
  <section class="search-section">
    <h2>🔍 簡易查詢</h2>
    <div class="search-group">
      <input type="date" v-model="searchDateModel" />
      <button class="btn btn-search" @click="$emit('search')">搜尋</button>
      <button class="btn btn-reset" @click="$emit('reset')">全部顯示</button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  searchDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:searchDate', 'search', 'reset'])

const searchDateModel = computed({
  get() {
    return props.searchDate
  },
  set(value) {
    emit('update:searchDate', value)
  }
})
</script>
