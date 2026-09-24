import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const PAGE_SIZE = 10

// Single source of truth for the admin article list. It outlives the
// ArticleList component, so navigating to the editor/detail and back keeps the
// current page, while every (re)entry still refetches authoritative data.
export const useAdminArticlesStore = defineStore('admin-articles', () => {
  const articles = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(PAGE_SIZE)
  const loading = ref(false)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

  // Shape kept compatible with the backend pagination payload / existing views.
  const pagination = computed(() => ({
    total: total.value,
    page: page.value,
    limit: limit.value,
    totalPages: totalPages.value
  }))

  // Monotonic token: a slow, older response must never overwrite a newer one.
  let requestSeq = 0

  async function fetchList() {
    const seq = ++requestSeq
    loading.value = true
    try {
      const { data } = await api.get('/articles', {
        params: { page: page.value, limit: limit.value }
      })
      // A newer request (page change / delete / re-entry) superseded this one.
      if (seq !== requestSeq) return

      const serverTotalPages = data.pagination.totalPages || 1
      // Current page no longer exists (e.g. its last row was deleted):
      // fall back to the last valid page and fetch again.
      if (page.value > serverTotalPages) {
        page.value = serverTotalPages
        loading.value = false
        return fetchList()
      }

      articles.value = data.articles
      total.value = data.pagination.total
      page.value = data.pagination.page
      limit.value = data.pagination.limit
    } catch (error) {
      // Only surface the error for the latest in-flight request.
      if (seq === requestSeq) {
        console.error('Failed to fetch articles:', error)
        ElMessage.error('获取文章列表失败')
      }
    } finally {
      if (seq === requestSeq) {
        loading.value = false
      }
    }
  }

  function changePage(target) {
    if (target === page.value) return
    page.value = target
    fetchList()
  }

  // Reconcile state after a successful DELETE. The row and total are updated
  // immediately for responsive feedback, then refetched on a valid page so the
  // rows, total and detail entries always match the server.
  async function articleDeleted(id) {
    articles.value = articles.value.filter(article => article.id !== id)
    total.value = Math.max(0, total.value - 1)

    const lastPage = Math.max(1, Math.ceil(total.value / limit.value))
    if (page.value > lastPage) {
      page.value = lastPage
    }

    await fetchList()
  }

  return {
    articles,
    total,
    page,
    limit,
    loading,
    totalPages,
    pagination,
    fetchList,
    changePage,
    articleDeleted
  }
})
