<template>
  <div
    class="notification-panel"
    :style="{
      transform: show ? 'scaleY(1)' : 'scaleY(0.9)',
      opacity: show ? 1 : 0
    }"
    v-show="visible"
    @click.stop
  >
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-left">
        <span class="header-title">通知</span>
        <ElBadge v-if="unreadCount > 0" :value="unreadCount" :max="99" />
      </div>
      <div class="header-actions">
        <ElTooltip content="全部已读" placement="bottom">
          <button class="action-btn" @click="handleMarkAllRead">
            <ElIcon><Check /></ElIcon>
          </button>
        </ElTooltip>
        <ElTooltip content="查看全部" placement="bottom">
          <button class="action-btn" @click="handleViewAll">
            <ElIcon><List /></ElIcon>
          </button>
        </ElTooltip>
      </div>
    </div>

    <!-- 标签栏 -->
    <div class="tabs">
      <div
        v-for="(item, index) in categoryList"
        :key="index"
        class="tab-item"
        :class="{ active: activeCategoryIndex === index }"
        @click="activeCategoryIndex = index"
      >
        <span>{{ item.name }}</span>
        <span v-if="item.count > 0" class="tab-count">({{ item.count }})</span>
        <ElBadge v-if="item.unreadCount > 0" :value="item.unreadCount" :max="99" type="danger" />
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-container">
      <!-- 加载中 -->
      <div v-if="loading" class="state-box">
        <ElIcon class="is-loading"><Loading /></ElIcon>
        <span>加载中...</span>
      </div>

      <!-- 消息列表 -->
      <div v-else-if="currentMessages.length > 0" class="message-list">
        <div
          v-for="item in currentMessages"
          :key="item.id"
          class="message-item"
          :class="{ unread: !item.isRead }"
          @click="handleMessageClick(item)"
        >
          <!-- 图标 -->
          <div class="msg-icon" :class="getIconClass(item)">
            <ElIcon v-if="item.severity === 'critical'"><WarningFilled /></ElIcon>
            <ElIcon v-else-if="item.severity === 'warning'"><Warning /></ElIcon>
            <ElIcon v-else><Bell /></ElIcon>
          </div>

          <!-- 内容 -->
          <div class="msg-content">
            <div class="msg-header">
              <span class="msg-title">{{ item.title }}</span>
              <ElTag v-if="item.severity" :type="getSeverityType(item.severity)" size="small">
                {{ getSeverityText(item.severity) }}
              </ElTag>
            </div>
            <p v-if="item.content" class="msg-desc">{{ getPreview(item.content) }}</p>
            <div class="msg-footer">
              <span class="msg-time">{{ getRelativeTime(item.createdAt) }}</span>
              <span v-if="!item.isRead" class="msg-unread">未读</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="state-box">
        <ElIcon><Message /></ElIcon>
        <span>暂无消息</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted, onUnmounted, h } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElNotification, ElButton } from 'element-plus'
  import {
    Check,
    List,
    Loading,
    WarningFilled,
    Warning,
    Bell,
    Message
  } from '@element-plus/icons-vue'
  import {
    type SiteMessages,
    batchReadSiteMessagesApi,
    setAllReadApi,
    getUnreadCountApi,
    createSiteMessageWS,
    closeSiteMessageWS,
    type WSMessage,
    type InitialDataMessage,
    WSSiteMessageType,
    getRelativeTime
  } from '@/api/portal/site-messages'

  defineOptions({ name: 'ArtNotification' })

  const router = useRouter()

  const props = defineProps<{
    value: boolean
  }>()

  const emit = defineEmits<{
    'update:value': [value: boolean]
    'unread-count-change': [count: number]
  }>()

  // 状态
  const show = ref(false)
  const visible = ref(false)
  const loading = ref(false)
  const activeCategoryIndex = ref(0)
  const alertMessages = ref<SiteMessages[]>([])
  const systemMessages = ref<SiteMessages[]>([])
  const unreadCount = ref(0)

  let wsInstance: WebSocket | null = null

  // 分类列表
  const categoryList = computed(() => [
    {
      name: '集群告警',
      category: 'prometheus',
      count: alertMessages.value.length,
      unreadCount: alertMessages.value.filter((m) => !m.isRead).length
    },
    {
      name: '平台通知',
      category: 'system',
      count: systemMessages.value.length,
      unreadCount: systemMessages.value.filter((m) => !m.isRead).length
    }
  ])

  // 当前消息
  const currentMessages = computed(() => {
    return activeCategoryIndex.value === 0 ? alertMessages.value : systemMessages.value
  })

  // WebSocket连接
  const connectWebSocket = () => {
    try {
      wsInstance = createSiteMessageWS(handleWSMessage, handleWSError, handleWSClose, handleWSOpen)
    } catch (error) {
      console.error('WebSocket连接失败:', error)
    }
  }

  const handleWSOpen = () => {}

  const handleWSMessage = (message: WSMessage) => {
    switch (message.type) {
      case WSSiteMessageType.INITIAL:
        handleInitialData(message.data as InitialDataMessage)
        break
      case WSSiteMessageType.NEW_MESSAGE:
        handleNewMessage(message.data as SiteMessages)
        break
      case WSSiteMessageType.GLOBAL_MESSAGE:
        ElMessage.info(message.data?.message || '收到新消息')
        break
      case WSSiteMessageType.PONG:
        break
    }
  }

  const handleWSError = (error: Event) => {
    console.error('WebSocket错误:', error)
  }

  const handleWSClose = (event: CloseEvent) => {
    if (event.code !== 1000 && event.code !== 1001) {
      setTimeout(connectWebSocket, 5000)
    }
  }

  // 处理初始数据
  const handleInitialData = (data: InitialDataMessage) => {
    const alerts: SiteMessages[] = []
    const systems: SiteMessages[] = []

    data.messages.forEach((msg) => {
      if (msg.category === 'prometheus') {
        alerts.push(msg)
      } else if (msg.category === 'system') {
        systems.push(msg)
      }
    })

    alertMessages.value = alerts
    systemMessages.value = systems
    unreadCount.value = data.count || 0
    emit('unread-count-change', unreadCount.value)
  }

  // 处理新消息
  const handleNewMessage = (message: SiteMessages) => {
    if (message.category === 'prometheus') {
      alertMessages.value.unshift(message)
    } else if (message.category === 'system') {
      systemMessages.value.unshift(message)
    }

    if (!message.isRead) {
      unreadCount.value++
      emit('unread-count-change', unreadCount.value)
    }

    showNotificationPopup(message)
  }

  // 点击消息
  const handleMessageClick = async (message: SiteMessages) => {
    if (!message.isRead && message.id && message.id > 0) {
      try {
        await batchReadSiteMessagesApi({ ids: [message.id] })
        message.isRead = 1
        message.readAt = Math.floor(Date.now() / 1000)
        unreadCount.value = Math.max(0, unreadCount.value - 1)
        emit('unread-count-change', unreadCount.value)
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    } else if (!message.isRead) {
      message.isRead = 1
      message.readAt = Math.floor(Date.now() / 1000)
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      emit('unread-count-change', unreadCount.value)
    }

    emit('update:value', false)

    // 跳转
    try {
      if (message.id && message.id > 0) {
        await router.push({ path: '/system/site-messages', query: { id: message.id.toString() } })
      } else if (message.uuid) {
        await router.push({ path: '/system/site-messages', query: { uuid: message.uuid } })
      } else {
        await router.push({ path: '/system/site-messages' })
      }
    } catch (error) {
      console.error('路由跳转失败:', error)
    }
  }

  // 跳转详情
  const goToMessageDetail = async (message: SiteMessages) => {
    emit('update:value', false)
    await handleMessageClick(message)
  }

  // 全部已读
  const handleMarkAllRead = async () => {
    try {
      await setAllReadApi()

      alertMessages.value.forEach((msg) => {
        msg.isRead = 1
        msg.readAt = Math.floor(Date.now() / 1000)
      })
      systemMessages.value.forEach((msg) => {
        msg.isRead = 1
        msg.readAt = Math.floor(Date.now() / 1000)
      })

      unreadCount.value = 0
      emit('unread-count-change', 0)
      ElMessage.success('已全部标记为已读')
    } catch (error) {
      console.error('标记全部已读失败:', error)
      ElMessage.error('标记失败，请重试')
    }
  }

  // 查看全部
  const handleViewAll = () => {
    emit('update:value', false)
    router.push({ path: '/system/site-messages' })
  }

  // 获取图标样式
  const getIconClass = (message: SiteMessages): string => {
    if (message.category === 'prometheus') {
      switch (message.severity) {
        case 'critical':
          return 'icon-critical'
        case 'warning':
          return 'icon-warning'
        default:
          return 'icon-info'
      }
    }
    return 'icon-system'
  }

  // 获取严重级别类型
  const getSeverityType = (severity: string): 'success' | 'info' | 'warning' | 'danger' => {
    switch (severity) {
      case 'critical':
        return 'danger'
      case 'warning':
        return 'warning'
      default:
        return 'info'
    }
  }

  // 获取严重级别文本
  const getSeverityText = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '严重'
      case 'warning':
        return '警告'
      case 'info':
        return '提示'
      default:
        return severity
    }
  }

  // 获取内容预览
  const getPreview = (content: string): string => {
    if (!content) return ''
    return content.replace(/[#*`\[\]]/g, '').substring(0, 100)
  }

  // 显示新消息弹窗
  const showNotificationPopup = (message: SiteMessages) => {
    const isAlert = message.category === 'prometheus'
    const type = isAlert
      ? message.severity === 'critical'
        ? 'error'
        : message.severity === 'warning'
          ? 'warning'
          : 'info'
      : 'info'

    const notification = ElNotification({
      title: isAlert ? '新集群告警' : '新平台通知',
      message: h(
        'div',
        { style: 'display:flex;align-items:center;justify-content:space-between;gap:12px;' },
        [
          h(
            'span',
            { style: 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' },
            message.title
          ),
          h(
            ElButton,
            {
              type: 'primary',
              size: 'small',
              onClick: (e: Event) => {
                e.stopPropagation()
                notification.close()
                goToMessageDetail(message)
              }
            },
            { default: () => '查看' }
          )
        ]
      ),
      type: type as 'success' | 'warning' | 'info' | 'error',
      duration: 5000,
      position: 'top-right',
      offset: 60,
      onClick: () => {
        notification.close()
        goToMessageDetail(message)
      }
    })
  }

  // 动画控制
  const showNotice = (open: boolean) => {
    if (open) {
      visible.value = true
      setTimeout(() => {
        show.value = true
      }, 5)
    } else {
      show.value = false
      setTimeout(() => {
        visible.value = false
      }, 350)
    }
  }

  // 生命周期
  onMounted(() => {
    connectWebSocket()
    getUnreadCountApi().then((res) => {
      unreadCount.value = res.count || 0
      emit('unread-count-change', unreadCount.value)
    })
  })

  onUnmounted(() => {
    if (wsInstance) {
      closeSiteMessageWS(wsInstance)
      wsInstance = null
    }
  })

  watch(
    () => props.value,
    (newValue) => {
      showNotice(newValue)
    }
  )

  defineExpose({
    refreshUnreadCount: async () => {
      const res = await getUnreadCountApi()
      unreadCount.value = res.count || 0
      emit('unread-count-change', unreadCount.value)
    }
  })
</script>

<style scoped lang="scss">
  /* 通知面板 - 使用 fixed 定位固定在视口右上角 */
  .notification-panel {
    position: fixed;
    top: 60px;
    right: 20px;
    width: 400px;
    height: 560px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    transition: all 0.3s ease;
    transform-origin: top;
    z-index: 99999;

    @media (max-width: 640px) {
      top: 60px;
      right: 0;
      width: 100%;
      height: 80vh;
      border-radius: 0;
    }
  }

  /* 头部 */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .header-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: #f5f7fa;
        color: #606266;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
        }
      }
    }
  }

  /* 标签栏 */
  .tabs {
    display: flex;
    padding: 0 20px;
    border-bottom: 1px solid #ebeef5;

    .tab-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 0;
      margin-right: 24px;
      font-size: 14px;
      color: #606266;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;

      .tab-count {
        color: #909399;
        font-size: 12px;
      }

      &:hover {
        color: var(--el-color-primary);
      }

      &.active {
        color: var(--el-color-primary);
        font-weight: 500;
        border-bottom-color: var(--el-color-primary);
      }
    }
  }

  /* 消息容器 */
  .message-container {
    height: calc(100% - 110px);
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  /* 状态框 */
  .state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
    gap: 12px;

    .el-icon {
      font-size: 48px;
    }
  }

  /* 消息列表 */
  .message-list {
    padding: 8px 0;

    .message-item {
      display: flex;
      gap: 12px;
      padding: 14px 20px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f5f7fa;
      }

      &.unread {
        background: #ecf5ff;

        &:hover {
          background: #d9ecff;
        }
      }

      .msg-icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        font-size: 18px;

        &.icon-critical {
          background: #fef0f0;
          color: #f56c6c;
        }

        &.icon-warning {
          background: #fdf6ec;
          color: #e6a23c;
        }

        &.icon-info {
          background: #f4f4f5;
          color: #909399;
        }

        &.icon-system {
          background: #ecf5ff;
          color: #409eff;
        }
      }

      .msg-content {
        flex: 1;
        min-width: 0;

        .msg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;

          .msg-title {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .msg-desc {
          margin: 0 0 8px;
          font-size: 13px;
          color: #606266;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .msg-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #909399;

          .msg-unread {
            color: var(--el-color-primary);
            font-weight: 500;
          }
        }
      }
    }
  }

  /* 暗黑模式 */
  .dark {
    .notification-panel {
      background: #1d1e1f;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .panel-header {
      border-color: #363637;

      .header-title {
        color: #e5eaf3;
      }

      .action-btn {
        background: #363637;
        color: #a3a6ad;

        &:hover {
          background: #409eff33;
          color: #409eff;
        }
      }
    }

    .tabs {
      border-color: #363637;

      .tab-item {
        color: #a3a6ad;

        &.active {
          color: #409eff;
        }
      }
    }

    .message-item {
      border-color: #363637;

      &:hover {
        background: #262727;
      }

      &.unread {
        background: #409eff1a;

        &:hover {
          background: #409eff33;
        }
      }

      .msg-title {
        color: #e5eaf3;
      }

      .msg-desc {
        color: #a3a6ad;
      }
    }
  }
</style>
