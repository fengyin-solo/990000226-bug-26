<template>
  <div class="article-list-admin">
    <div class="page-header">
      <h2 class="page-title">文章管理</h2>
      <el-button type="primary" @click="goToCreate">
        新建文章
      </el-button>
    </div>

    <el-card>
      <el-table :data="store.articles" v-loading="store.loading" style="width: 100%">
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
        :model-value="store.currentPage"
        :total="store.total"
        :page-size="store.pageSize"
        @change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useArticlesStore } from '../../stores/articles'
import Pagination from '../../components/Pagination.vue'

const router = useRouter()
const store = useArticlesStore()

onMounted(() => {
  // 每次进入（含从编辑/新建返回、浏览器前进后退）都以服务端为准重新拉取，
  // 确保删除、改标签等操作结果、总数与文章行一致，不残留已处理的文章。
  store.fetchArticles()
})

function handlePageChange(page) {
  store.setPage(page)
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
  } catch {
    // 用户点击“取消”，不做任何处理
    return
  }

  try {
    // 删除与随后的列表刷新在 store 内串行执行，并带页码修正
    await store.removeArticle(article.id)
    ElMessage.success('文章已删除')
  } catch (error) {
    console.error('Failed to delete article:', error)
    ElMessage.error('删除文章失败')
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
