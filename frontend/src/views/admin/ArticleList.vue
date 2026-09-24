<template>
  <div class="article-list-admin">
    <div class="page-header">
      <h2 class="page-title">文章管理</h2>
      <el-button type="primary" @click="goToCreate">
        新建文章
      </el-button>
    </div>

    <el-card>
      <el-table :data="articles" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="tags" label="标签" width="250">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag" size="small" class="tag-cell">
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editArticle(row.id)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteArticle(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        v-model="pageModel"
        :total="pagination.total"
        :page-size="pagination.limit"
        @change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'
import Pagination from '../../components/Pagination.vue'
import { useAdminArticlesStore } from '../../stores/articles'

const router = useRouter()
const store = useAdminArticlesStore()

const { articles, loading, pagination } = storeToRefs(store)

// Bridge the controlled Pagination (v-model) to the shared store's page.
const pageModel = computed({
  get: () => store.page,
  set: (value) => { store.page = value }
})

// Every (re)entry refetches the current shared page, so rows/total never carry
// stale data after deleting, tagging in the editor, or returning to this view.
onMounted(() => {
  store.fetchList()
})

function handlePageChange(page) {
  store.changePage(page)
}

function goToCreate() {
  router.push('/admin/articles/new')
}

function editArticle(id) {
  router.push(`/admin/articles/${id}/edit`)
}

async function deleteArticle(article) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章「${article.title}」吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await api.delete(`/articles/${article.id}`)
    ElMessage.success('文章已删除')
    // Single place that updates rows, total and page after a delete.
    await store.articleDeleted(article.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete article:', error)
      ElMessage.error('删除文章失败')
    }
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.article-list-admin {
  padding-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.tag-cell {
  margin-right: 4px;
}
</style>
