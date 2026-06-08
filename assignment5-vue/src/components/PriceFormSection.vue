<template>
  <section class="input-section">
    <h2>📝 記錄價格</h2>
    <form @submit.prevent="$emit('submit')" id="priceForm">
      <div class="form-group">
        <label for="date">日期：</label>
        <input type="date" v-model="form.date" id="date" required />
      </div>
      <div class="form-group">
        <label for="productName">商品名稱：</label>
        <input type="text" id="productName" v-model="form.productName" readonly />
      </div>
      <div class="form-group">
        <label for="price">價格 (NT$)：</label>
        <input type="number" id="price" v-model.number="form.price" step="0.01" required />
      </div>
      <button type="submit" class="btn btn-add">+ 新增記錄</button>
    </form>
  </section>
</template>

<script setup>
defineProps({
  form: {
    type: Object,
    required: true
  }
})

defineEmits(['submit'])
</script>
