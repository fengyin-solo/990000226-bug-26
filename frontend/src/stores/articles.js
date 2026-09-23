import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const PAGE_SIZE = 10

/**
 * 文章管理列表的共用状态。
 *
 * 作为列表数据（行、总数、当前页、加载态）的单一数据源，保证：
 * - 删除 / 改标签等操作后，列表行与总数始终来自同一次（最新一次）响应；
 * - 删除导致最后一页变空时，自动把页码修正回有效页再拉取；
 * - 多个请求并发（翻页、删除后重拉、返回管理页重拉）时，只有最后一次
 *   请求的结果会被采纳，过期响应一律丢弃，避免旧数据覆盖新数据。
 */
export const useArticlesStore = defineStore('articles', () => {
  const articles = ref([])
  const currentPage = ref(1)
  const total = ref(0)
  const loading = ref(false)

  // 单调递增的请求序号，用于识别并丢弃过期响应（竞态保护）
  let latestRequestId = 0

  function pageCountFor(totalCount) {
    return Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  }

  // 按预期总数把可能越界的页码收回有效页（删除最后一页最后一篇时回退一页）
  function clampPage(expectedTotal) {
    const maxPage = pageCountFor(expectedTotal)
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
    if (currentPage.value < 1) {
      currentPage.value = 1
    }
  }

  async function fetchArticles() {
    clampPage(total.value)

    const requestId = ++latestRequestId
    loading.value = true
    try {
      const response = await api.get('/articles', {
        params: { page: currentPage.value, limit: PAGE_SIZE }
      })

      // 已有更新的请求发出，本次为过期响应，直接丢弃
      if (requestId !== latestRequestId) return

      const { articles: list, pagination } = response.data
      articles.value = list
      total.value = pagination.total
      currentPage.value = pagination.page
    } catch (error) {
      if (requestId !== latestRequestId) return
      console.error('Failed to fetch articles:', error)
      ElMessage.error('获取文章列表失败')
    } finally {
      if (requestId === latestRequestId) {
        loading.value = false
      }
    }
  }

  async function setPage(page) {
    if (page === currentPage.value) return
    currentPage.value = page
    await fetchArticles()
  }

  async function removeArticle(id) {
    await api.delete(`/articles/${id}`)

    // 以删除后的预期总数先修正页码，再以服务端响应为准重新拉取，
    // 保证行、页码、总数三者一致
    const remaining = Math.max(0, total.value - 1)
    clampPage(remaining)
    await fetchArticles()
  }

  return {
    articles,
    currentPage,
    total,
    loading,
    pageSize: PAGE_SIZE,
    fetchArticles,
    setPage,
    removeArticle
  }
})
