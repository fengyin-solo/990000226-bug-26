<template>
  <div class="pagination-wrapper" v-if="total > 0">
    <el-pagination
      :current-page="modelValue"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next, total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  total: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  modelValue: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Fully controlled: the parent owns the current page, so the pager can never
// disagree with the list it paginates (e.g. after a delete or on re-entry).
function handlePageChange(page) {
  if (page === props.modelValue) return
  emit('update:modelValue', page)
  emit('change', page)
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}
</style>
