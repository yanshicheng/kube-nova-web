<template>
  <div class="site-messages-container">
    <!-- 顶部工具栏 -->
    <div class="messages-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Bell /></el-icon>
          站内消息
        </h2>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="unread-badge">
          <el-button text>未读消息</el-button>
        </el-badge>
      </div>
      <div class="header-right">
        <el-button :icon="Check" :disabled="unreadCount === 0" @click="handleMarkAllRead">
          全部标记已读
        </el-button>
        <el-button
          :icon="Delete"
          type="danger"
          plain
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <!-- 筛选器 -->
    <MessageFilters
      :filters="filters"
      @update:filters="handleFilterUpdate"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 主内容区 -->
    <div class="messages-content">
      <!-- 左侧列表 -->
      <div class="messages-left">
        <MessageList
          :messages="messages"
          :loading="loading"
          :current-id="currentMessageId"
          :selected-ids="selectedIds"
          :total="pagination.total"
          :page="pagination.page"
          :page-size="pagination.pageSize"
          @select="handleSelectMessage"
          @select-change="handleSelectionChange"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>

      <!-- 右侧详情 -->
      <div class="messages-right">
        <template v-if="currentMessage">
          <!-- 平台通知详情 -->
          <MessageDetail
            v-if="currentMessage.category === 'system'"
            :message="currentMessage"
            @refresh="handleRefreshCurrent"
            @delete="handleDeleteCurrent"
            @next="handleNextMessage"
            @prev="handlePrevMessage"
            @read="handleMessageRead"
          />
          <!-- 告警详情 -->
          <AlertDetail
            v-else-if="currentMessage.category === 'prometheus'"
            :message="currentMessage"
            @refresh="handleRefreshCurrent"
            @delete="handleDeleteCurrent"
            @next="handleNextMessage"
            @prev="handlePrevMessage"
            @read="handleMessageRead"
          />
          <!-- 其他类型消息 -->
          <MessageDetail
            v-else
            :message="currentMessage"
            @refresh="handleRefreshCurrent"
            @delete="handleDeleteCurrent"
            @next="handleNextMessage"
            @prev="handlePrevMessage"
            @read="handleMessageRead"
          />
        </template>
        <MessageEmpty v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Bell, Check, Delete } from '@element-plus/icons-vue'
  import MessageList from './components/MessageList.vue'
  import MessageDetail from './components/MessageDetail.vue'
  import AlertDetail from './components/AlertDetail.vue'
  import MessageFilters from './components/MessageFilters.vue'
  import MessageEmpty from './components/MessageEmpty.vue'
  import { useMessages } from './composables/useMessages'
  import type { MessageFilters as FilterType } from './types'

  const route = useRoute()

  const {
    messages,
    loading,
    currentMessage,
    unreadCount,
    selectedIds,
    filters,
    pagination,
    loadMessages,
    loadUnreadCount,
    selectMessage,
    selectMessageFromRoute,
    clearCurrentMessage,
    markAllRead,
    batchDelete,
    deleteMessage,
    updateFilters,
    resetFilters,
    updateSelectedIds,
    getNextMessageId,
    getPrevMessageId,
    handlePageChange,
    handleSizeChange
  } = useMessages()

  const currentMessageId = computed(() => currentMessage.value?.id ?? null)

  // 更新筛选条件
  const handleFilterUpdate = (newFilters: Partial<FilterType>) => {
    updateFilters({ ...filters.value, ...newFilters })
  }

  // 搜索
  const handleSearch = () => {
    loadMessages(1)
  }

  // 重置筛选
  const handleReset = () => {
    resetFilters()
    loadMessages(1)
  }

  // 选择消息（普通点击列表）
  const handleSelectMessage = (id: number) => {
    selectMessage(id)
  }

  // 多选变化
  const handleSelectionChange = (ids: number[]) => {
    updateSelectedIds(ids)
  }

  // 消息已读事件
  const handleMessageRead = () => {
    loadUnreadCount()
  }

  // 全部标记已读
  const handleMarkAllRead = async () => {
    try {
      await ElMessageBox.confirm('确定将所有未读消息标记为已读吗？', '提示', {
        type: 'warning'
      })
      await markAllRead()
      ElMessage.success('已全部标记为已读')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('操作失败')
      }
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条消息吗？`, '提示', {
        type: 'warning'
      })
      await batchDelete(selectedIds.value)
      ElMessage.success('删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  // 刷新当前消息
  const handleRefreshCurrent = () => {
    if (currentMessage.value) {
      selectMessage(currentMessage.value.id)
    }
  }

  // 删除当前消息
  const handleDeleteCurrent = async () => {
    if (!currentMessage.value) return

    const currentId = currentMessage.value.id
    const nextId = getNextMessageId()
    const prevId = getPrevMessageId()

    try {
      await ElMessageBox.confirm('确定删除这条消息吗？', '提示', {
        type: 'warning'
      })
      await deleteMessage(currentId)
      ElMessage.success('删除成功')

      // 选择下一条或上一条消息
      if (nextId) {
        selectMessage(nextId)
      } else if (prevId) {
        selectMessage(prevId)
      } else {
        clearCurrentMessage()
      }
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  // 上一条消息
  const handlePrevMessage = () => {
    const prevId = getPrevMessageId()
    if (prevId) {
      selectMessage(prevId)
    }
  }

  // 下一条消息
  const handleNextMessage = () => {
    const nextId = getNextMessageId()
    if (nextId) {
      selectMessage(nextId)
    }
  }

  const handleRouteQuery = async () => {
    const messageId = route.query.id

    if (messageId) {
      const id = Number(messageId)
      if (!isNaN(id) && id > 0) {
        await selectMessageFromRoute(id)
      }
    }
  }

  watch(
    () => route.query.id,
    async (newId) => {
      if (newId) {
        const id = Number(newId)
        if (!isNaN(id) && id > 0) {
          await selectMessageFromRoute(id)
        }
      }
    }
  )

  // 初始化
  onMounted(async () => {
    const messageId = route.query.id
    const hasRouteId = messageId && !isNaN(Number(messageId)) && Number(messageId) > 0

    if (hasRouteId) {
      await loadMessages(1, true) // skipAutoSelect = true
      await loadUnreadCount()
      await handleRouteQuery()
    } else {
      // 正常加载
      await loadMessages(1)
      await loadUnreadCount()
    }
  })
</script>

<style scoped lang="scss">
  .site-messages-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;
    padding: 20px;
    box-sizing: border-box;
  }

  .messages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .page-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon {
          font-size: 24px;
          color: #409eff;
        }
      }

      .unread-badge {
        :deep(.el-badge__content) {
          font-weight: 600;
        }
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .messages-content {
    flex: 1;
    display: flex;
    gap: 20px;
    min-height: 0;
    overflow: hidden;
  }

  .messages-left {
    width: 420px;
    flex-shrink: 0;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }

  .messages-right {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
</style>