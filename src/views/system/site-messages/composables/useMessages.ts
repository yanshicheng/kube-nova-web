import { ref, reactive } from 'vue'
import type { SiteMessages } from '@/api/portal/site-messages'
import {
  searchSiteMessagesApi,
  getUnreadCountApi,
  getSiteMessagesByIdApi,
  setAllReadApi,
  batchDelSiteMessagesApi,
  batchReadSiteMessagesApi,
  delSiteMessagesApi
} from '@/api/portal'
import type { MessageFilters } from '../types'

export function useMessages() {
  // 状态
  const messages = ref<SiteMessages[]>([])
  const currentMessage = ref<SiteMessages | null>(null)
  const loading = ref(false)
  const unreadCount = ref(0)
  const selectedIds = ref<number[]>([])

  // 分页参数
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 筛选条件
  const filters = ref<MessageFilters>({
    isRead: 3,
    category: '',
    severity: '',
    title: ''
  })

  /**
   * 更新筛选条件
   */
  const updateFilters = (newFilters: MessageFilters) => {
    filters.value = { ...newFilters }
  }

  /**
   * 重置筛选条件
   */
  const resetFilters = () => {
    filters.value = {
      isRead: 3,
      category: '',
      severity: '',
      title: ''
    }
  }

  /**
   * 加载消息列表
   * @param page 页码
   * @param skipAutoSelect 是否跳过自动选择第一条（用于路由跳转场景）
   */
  const loadMessages = async (page?: number, skipAutoSelect: boolean = false) => {
    if (loading.value) return

    // 如果传入了页码，更新当前页
    if (page !== undefined) {
      pagination.page = page
    }

    loading.value = true
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        orderStr: 'created_at',
        isAsc: false
      }

      // 只添加有效的筛选条件
      if (filters.value.isRead !== undefined) {
        params.isRead = filters.value.isRead
      }
      if (filters.value.category) {
        params.category = filters.value.category
      }
      if (filters.value.severity) {
        params.severity = filters.value.severity
      }
      if (filters.value.title) {
        params.title = filters.value.title
      }

      const response = await searchSiteMessagesApi(params)
      messages.value = response.items || []
      pagination.total = response.total || 0

      // 首次加载且有数据时，自动选择第一条（仅当没有当前选中消息时）
      if (!skipAutoSelect && pagination.page === 1 && messages.value.length > 0 && !currentMessage.value) {
        await selectMessage(messages.value[0].id)
      }
    } catch (error) {
      console.error('加载消息列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 分页变化
   */
  const handlePageChange = (page: number) => {
    pagination.page = page
    loadMessages()
  }

  /**
   * 每页条数变化
   */
  const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
    loadMessages()
  }

  /**
   * 加载未读消息数量
   */
  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCountApi()
      unreadCount.value = response.count || 0
    } catch (error) {
      console.error('加载未读数量失败:', error)
    }
  }

  /**
   * 选择消息（普通选择，不做分页定位）
   */
  const selectMessage = async (id: number) => {
    try {
      const response = await getSiteMessagesByIdApi(id)
      currentMessage.value = response.data

      // 更新列表中的已读状态
      const index = messages.value.findIndex((m) => m.id === id)
      if (index !== -1 && !messages.value[index].isRead) {
        messages.value[index] = {
          ...messages.value[index],
          isRead: 1,
          readAt: Math.floor(Date.now() / 1000)
        }
        // 重新加载未读数量
        await loadUnreadCount()
      }
    } catch (error) {
      console.error('加载消息详情失败:', error)
    }
  }

  /**
   * ✅ 从路由跳转选择消息（带分页定位功能）
   * 会自动定位到消息所在的页，确保左侧列表能够显示该消息
   */
  const selectMessageFromRoute = async (id: number) => {
    console.log('[useMessages] 从路由选择消息:', id)

    try {
      // 1. 先加载消息详情（右侧显示）
      const response = await getSiteMessagesByIdApi(id)
      if (!response.data) {
        console.warn('[useMessages] 消息不存在:', id)
        return
      }
      currentMessage.value = response.data

      // 2. 检查消息是否在当前列表中
      const existingIndex = messages.value.findIndex((m) => m.id === id)
      if (existingIndex !== -1) {
        console.log('[useMessages] 消息已在当前列表中，位置:', existingIndex)
        // 消息已在列表中，更新已读状态
        if (!messages.value[existingIndex].isRead) {
          messages.value[existingIndex] = {
            ...messages.value[existingIndex],
            isRead: 1,
            readAt: Math.floor(Date.now() / 1000)
          }
          await loadUnreadCount()
        }
        return
      }

      // 3. 消息不在当前列表，需要重新定位
      console.log('[useMessages] 消息不在当前列表，尝试定位...')

      // 清除筛选条件，确保能找到消息
      resetFilters()

      // 4. 查找消息在列表中的位置
      // 先查询不带筛选条件的完整列表
      const searchParams: Record<string, unknown> = {
        page: 1,
        pageSize: 100, // 获取足够多的数据
        orderStr: 'created_at',
        isAsc: false
      }

      const searchResponse = await searchSiteMessagesApi(searchParams)
      const allMessages = searchResponse.items || []

      // 查找消息索引
      const messageIndex = allMessages.findIndex((m) => m.id === id)
      if (messageIndex === -1) {
        console.warn('[useMessages] 无法在列表中找到消息:', id)
        // 即使找不到，也保持右侧详情显示
        // 重新加载第一页
        await loadMessages(1, true)
        return
      }

      // 5. 计算消息所在页码
      const targetPage = Math.floor(messageIndex / pagination.pageSize) + 1
      console.log('[useMessages] 消息位置:', messageIndex, '目标页:', targetPage)

      // 6. 加载目标页数据
      pagination.page = targetPage
      await loadMessages(targetPage, true) // skipAutoSelect = true，避免自动选择第一条

      // 7. 确保列表中该消息已读状态正确
      const newIndex = messages.value.findIndex((m) => m.id === id)
      if (newIndex !== -1 && !messages.value[newIndex].isRead) {
        messages.value[newIndex] = {
          ...messages.value[newIndex],
          isRead: 1,
          readAt: Math.floor(Date.now() / 1000)
        }
      }

      await loadUnreadCount()

    } catch (error) {
      console.error('[useMessages] 从路由选择消息失败:', error)
    }
  }

  /**
   * 清除当前选中
   */
  const clearCurrentMessage = () => {
    currentMessage.value = null
  }

  /**
   * 标记全部已读
   */
  const markAllRead = async () => {
    try {
      await setAllReadApi()

      // 更新本地状态
      const now = Math.floor(Date.now() / 1000)
      messages.value = messages.value.map((msg) => ({
        ...msg,
        isRead: 1,
        readAt: now
      }))

      // 重新加载未读数量
      await loadUnreadCount()
    } catch (error) {
      console.error('标记全部已读失败:', error)
      throw error
    }
  }

  /**
   * 批量删除
   */
  const batchDelete = async (ids: number[]) => {
    try {
      await batchDelSiteMessagesApi({ ids })

      // 如果当前消息被删除，清空选中
      if (currentMessage.value && ids.includes(currentMessage.value.id)) {
        currentMessage.value = null
      }

      // 清空选中项
      selectedIds.value = []

      // 重新加载列表和未读数量
      await loadMessages(1)
      await loadUnreadCount()
    } catch (error) {
      console.error('批量删除失败:', error)
      throw error
    }
  }

  /**
   * 批量标记已读
   */
  const batchRead = async (ids: number[]) => {
    try {
      await batchReadSiteMessagesApi({ ids })

      // 更新本地状态
      const now = Math.floor(Date.now() / 1000)
      messages.value = messages.value.map((msg) => {
        if (ids.includes(msg.id)) {
          return { ...msg, isRead: 1, readAt: now }
        }
        return msg
      })

      // 重新加载未读数量
      await loadUnreadCount()
    } catch (error) {
      console.error('批量标记已读失败:', error)
      throw error
    }
  }

  /**
   * 删除单个消息
   */
  const deleteMessage = async (id: number) => {
    try {
      await delSiteMessagesApi(id)

      // 重新加载列表和未读数量
      await loadMessages()
      await loadUnreadCount()
    } catch (error) {
      console.error('删除消息失败:', error)
      throw error
    }
  }

  /**
   * 更新选中的消息ID列表
   */
  const updateSelectedIds = (ids: number[]) => {
    selectedIds.value = [...ids]
  }

  /**
   * 获取下一条消息
   */
  const getNextMessageId = (): number | null => {
    if (!currentMessage.value || messages.value.length === 0) return null
    const currentIndex = messages.value.findIndex((m) => m.id === currentMessage.value!.id)
    if (currentIndex >= 0 && currentIndex < messages.value.length - 1) {
      return messages.value[currentIndex + 1].id
    }
    return null
  }

  /**
   * 获取上一条消息
   */
  const getPrevMessageId = (): number | null => {
    if (!currentMessage.value || messages.value.length === 0) return null
    const currentIndex = messages.value.findIndex((m) => m.id === currentMessage.value!.id)
    if (currentIndex > 0) {
      return messages.value[currentIndex - 1].id
    }
    return null
  }

  return {
    messages,
    currentMessage,
    loading,
    unreadCount,
    selectedIds,
    filters,
    pagination,
    loadMessages,
    loadUnreadCount,
    selectMessage,
    selectMessageFromRoute, // ✅ 新增：从路由跳转选择消息
    clearCurrentMessage,
    markAllRead,
    batchDelete,
    batchRead,
    deleteMessage,
    updateFilters,
    resetFilters,
    updateSelectedIds,
    getNextMessageId,
    getPrevMessageId,
    handlePageChange,
    handleSizeChange
  }
}