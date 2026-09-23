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
defineProps({
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

// 完全受控：当前页只由父级的 modelValue 决定，不在此组件内另存一份，
// 避免父级程序化改页（如删除后页码回退）时分页器显示与实际页脱节。
function handlePageChange(page) {
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
