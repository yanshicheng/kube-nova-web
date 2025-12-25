<template>
  <div
    class="art-notification-panel art-card-sm !shadow-xl"
    :style="{
      transform: show ? 'scaleY(1)' : 'scaleY(0.9)',
      opacity: show ? 1 : 0
    }"
    v-show="visible"
    @click.stop
  >
    <div class="notification-header">
      <div class="header-left">
        <div class="header-title">
          <ArtSvgIcon icon="ri:notification-3-fill" class="title-icon" />
          <span class="title-text">{{ $t('notice.title') }}</span>
        </div>
        <ElBadge v-if="unreadCount > 0" :value="unreadCount" :max="99" class="unread-badge" />
      </div>

      <div class="header-actions">
        <ElTooltip content="全部标记已读" placement="bottom" :show-after="300">
          <button class="action-btn action-btn-primary" @click="handleMarkAllRead">
            <ArtSvgIcon icon="ri:check-double-line" class="action-icon" />
          </button>
        </ElTooltip>
        <ElTooltip content="查看全部消息" placement="bottom" :show-after="300">
          <button class="action-btn action-btn-secondary" @click="handleViewAll">
            <ArtSvgIcon icon="ri:list-check-2" class="action-icon" />
          </button>
        </ElTooltip>
      </div>
    </div>

    <!-- 标签栏 -->
    <ul class="category-tabs">
      <li
        v-for="(item, index) in categoryList"
        :key="index"
        class="category-tab"
        :class="{ 'tab-active': activeCategoryIndex === index }"
        @click="changeCategory(index)"
      >
        <span class="tab-name">{{ item.name }}</span>
        <span v-if="item.count > 0" class="tab-count">({{ item.count }})</span>
        <ElBadge
          v-if="item.unreadCount > 0"
          :value="item.unreadCount"
          :max="99"
          type="danger"
          class="tab-badge"
        />
      </li>
    </ul>

    <!-- 消息列表 -->
    <div class="message-list-container">
      <div class="message-list-scroll">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <ElIcon class="is-loading loading-icon">
            <ElIconLoading />
          </ElIcon>
          <p class="loading-text">加载中...</p>
        </div>

        <!-- 消息列表 -->
        <ul v-else-if="currentMessages.length > 0" class="message-list">
          <li
            v-for="item in currentMessages"
            :key="item.id"
            class="message-item"
            :class="{ 'is-unread': !item.isRead }"
            @click="handleMessageClick(item)"
          >
            <div class="message-content">
              <!-- 消息图标 -->
              <div class="message-icon" :class="getMessageIconClass(item)">
                <ArtSvgIcon :icon="getMessageIcon(item)" />
              </div>

              <!-- 消息信息 -->
              <div class="message-info">
                <div class="message-header">
                  <h4 class="message-title">{{ item.title }}</h4>
                  <ElTag
                    v-if="item.severity"
                    :type="getSeverityTagType(item.severity)"
                    size="small"
                    effect="plain"
                    class="severity-tag"
                  >
                    {{ getSeverityText(item.severity) }}
                  </ElTag>
                </div>

                <!-- 消息摘要 -->
                <p v-if="item.content" class="message-preview" v-html="getContentPreview(item.content)"></p>

                <!-- 消息元信息 -->
                <div class="message-meta">
                  <span class="meta-time">{{ getRelativeTime(item.createdAt) }}</span>
                  <div class="meta-badges">
                    <!-- 未读标记 -->
                    <span v-if="!item.isRead" class="unread-indicator">
                      <ArtSvgIcon icon="ri:mail-line" />
                      <span>未读</span>
                    </span>
                    <!-- 标星标记 -->
                    <ArtSvgIcon
                      v-if="item.isStarred"
                      icon="ri:star-fill"
                      class="star-icon"
                    />
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <ArtSvgIcon icon="system-uicons:inbox" class="empty-icon" />
          <p class="empty-text">暂无{{ categoryList[activeCategoryIndex]?.name }}消息</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted, onUnmounted, h } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElNotification, ElButton } from 'element-plus'
  import {
    type SiteMessages,
    searchSiteMessagesApi,
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

  const { t } = useI18n()
  const router = useRouter()

  const props = defineProps<{
    value: boolean
  }>()

  const emit = defineEmits<{
    'update:value': [value: boolean]
    'unread-count-change': [count: number]
  }>()

  // ========== 状态管理 ==========
  const show = ref(false)
  const visible = ref(false)
  const loading = ref(false)
  const activeCategoryIndex = ref(0)

  // 消息数据
  const alertMessages = ref<SiteMessages[]>([]) // 集群告警
  const systemMessages = ref<SiteMessages[]>([]) // 平台通知
  const unreadCount = ref(0)

  // WebSocket 实例
  let wsInstance: WebSocket | null = null

  // ========== 消息分类配置 ==========
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

  // 当前显示的消息列表
  const currentMessages = computed(() => {
    return activeCategoryIndex.value === 0 ? alertMessages.value : systemMessages.value
  })

  // ========== WebSocket 管理 ==========
  const connectWebSocket = () => {
    try {
      wsInstance = createSiteMessageWS(handleWSMessage, handleWSError, handleWSClose, handleWSOpen)
    } catch (error) {
      console.error('[通知组件] WebSocket 连接失败:', error)
    }
  }

  const handleWSOpen = () => {
  }

  const handleWSMessage = (message: WSMessage) => {

    switch (message.type) {
      case WSSiteMessageType.INITIAL:
        handleInitialData(message.data as InitialDataMessage)
        break
      case WSSiteMessageType.NEW_MESSAGE:
        handleNewMessage(message.data as SiteMessages)
        break
      case WSSiteMessageType.GLOBAL_MESSAGE:
        handleGlobalMessage(message.data)
        break
      case WSSiteMessageType.PONG:
        // 心跳响应
        break
      default:
    }
  }

  const handleWSError = (error: Event) => {
    console.error('[通知组件] WebSocket 错误:', error)
  }

  const handleWSClose = (event: CloseEvent) => {
    // 如果不是正常关闭，尝试重连
    if (event.code !== 1000 && event.code !== 1001) {
      setTimeout(() => {
        connectWebSocket()
      }, 5000)
    }
  }

  // 处理初始数据
  const handleInitialData = (data: InitialDataMessage) => {

    // 分类消息
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

    // 通知父组件更新未读数量
    emit('unread-count-change', unreadCount.value)
  }

  // 处理新消息推送
  const handleNewMessage = (message: SiteMessages) => {

    // 添加到对应分类
    if (message.category === 'prometheus') {
      alertMessages.value.unshift(message)
    } else if (message.category === 'system') {
      systemMessages.value.unshift(message)
    }

    // 更新未读数量
    if (!message.isRead) {
      unreadCount.value++
      emit('unread-count-change', unreadCount.value)
    }

    // 显示通知提示
    showNewMessageNotification(message)
  }

  // 处理全局消息
  const handleGlobalMessage = (data: any) => {
    ElMessage.info(data.message || '收到新消息')
  }

  // ========== 消息操作 ==========

  // 点击消息 - 优化跳转逻辑
  const handleMessageClick = async (message: SiteMessages) => {
    // 修复：只有当消息未读且 id 有效时才调用已读接口
    if (!message.isRead && message.id && message.id > 0) {
      try {
        await batchReadSiteMessagesApi({ ids: [message.id] })
        message.isRead = 1
        message.readAt = Math.floor(Date.now() / 1000)
        unreadCount.value = Math.max(0, unreadCount.value - 1)
        emit('unread-count-change', unreadCount.value)
      } catch (error) {
        console.error('[通知组件] 标记已读失败:', error)
      }
    } else if (!message.isRead) {
      // 如果没有有效 id，只更新本地状态
      message.isRead = 1
      message.readAt = Math.floor(Date.now() / 1000)
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      emit('unread-count-change', unreadCount.value)
    }

    // 关闭通知面板
    emit('update:value', false)

    // 跳转到消息详情页并传递消息ID
    try {
      // 修复：如果有有效 id 则跳转到详情，否则只跳转到列表
      if (message.id && message.id > 0) {
        await router.push({
          path: '/system/site-messages',
          query: { id: message.id.toString() }
        })
      } else if (message.uuid) {
        // 使用 uuid 作为备选
        await router.push({
          path: '/system/site-messages',
          query: { uuid: message.uuid }
        })
      } else {
        await router.push({ path: '/system/site-messages' })
      }
    } catch (error) {
      console.error('[通知组件] 路由跳转失败:', error)
    }
  }

  // 跳转到消息详情（供通知弹窗使用）
  const goToMessageDetail = async (message: SiteMessages) => {
    // 关闭通知面板
    emit('update:value', false)

    // 标记已读并跳转
    await handleMessageClick(message)
  }

  // 全部已读
  const handleMarkAllRead = async () => {
    try {
      await setAllReadApi()

      // 更新本地状态
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
      console.error('[通知组件] 标记全部已读失败:', error)
      ElMessage.error('标记失败，请重试')
    }
  }

  // 查看全部
  const handleViewAll = () => {
    emit('update:value', false)
    router.push({ path: '/system/site-messages' })
  }

  // 切换分类
  const changeCategory = (index: number) => {
    activeCategoryIndex.value = index
  }

  // ========== 辅助函数 ==========

  // 获取消息图标
  const getMessageIcon = (message: SiteMessages): string => {
    if (message.category === 'prometheus') {
      // 集群告警图标
      switch (message.severity) {
        case 'critical':
          return 'ri:alarm-warning-line'
        case 'warning':
          return 'ri:error-warning-line'
        default:
          return 'ri:information-line'
      }
    } else {
      // 平台通知图标
      return 'ri:notification-3-line'
    }
  }

  // 获取消息图标样式类
  const getMessageIconClass = (message: SiteMessages): string => {
    if (message.category === 'prometheus') {
      switch (message.severity) {
        case 'critical':
          return 'icon-critical'
        case 'warning':
          return 'icon-warning'
        default:
          return 'icon-info'
      }
    } else {
      return 'icon-system'
    }
  }

  // 获取严重级别标签类型
  const getSeverityTagType = (severity: string): 'success' | 'info' | 'warning' | 'danger' => {
    switch (severity) {
      case 'critical':
        return 'danger'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
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
  const getContentPreview = (content: string): string => {
    if (!content) return ''
    // 移除 Markdown 标记，只保留纯文本
    return content.replace(/[#*`\[\]]/g, '').substring(0, 100)
  }

  // 显示新消息通知 - 简洁紧凑的弹窗样式
  const showNewMessageNotification = (message: SiteMessages) => {
    // 根据消息类型设置
    const isAlert = message.category === 'prometheus'
    const icon = isAlert ? '🚨' : '📢'

    // 根据严重级别设置通知类型
    const notificationType = isAlert
      ? (message.severity === 'critical' ? 'error' : message.severity === 'warning' ? 'warning' : 'info')
      : 'info'

    // 获取严重级别标签
    const severityLabel = isAlert ? getSeverityText(message.severity || 'info') : ''

    // 简洁紧凑的通知内容：标题 + 立即查看按钮
    const notificationContent = h('div', {
      style: 'display: flex; align-items: center; justify-content: space-between; gap: 12px;'
    }, [
      // 左侧：消息标题 + 严重级别标签
      h('div', { style: 'flex: 1; min-width: 0;' }, [
        // 消息标题
        h('div', {
          style: 'font-size: 13px; font-weight: 500; color: #303133; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
        }, message.title),
        // 严重级别标签（仅告警显示）
        isAlert && message.severity ? h('span', {
          style: `
            display: inline-block;
            margin-top: 4px;
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
            ${message.severity === 'critical' ? 'background: #fef0f0; color: #f56c6c;' : ''}
            ${message.severity === 'warning' ? 'background: #fdf6ec; color: #e6a23c;' : ''}
            ${message.severity === 'info' ? 'background: #f4f4f5; color: #909399;' : ''}
          `
        }, severityLabel) : null
      ]),

      // 右侧：立即查看按钮
      h(ElButton, {
        type: 'primary',
        size: 'small',
        onClick: (e: Event) => {
          e.stopPropagation()
          notification.close()
          goToMessageDetail(message)
        }
      }, { default: () => '查看' })
    ])

    // 创建通知实例
    const notification = ElNotification({
      title: `${icon} ${isAlert ? '新集群告警' : '新平台通知'}`,
      message: notificationContent,
      type: notificationType as 'success' | 'warning' | 'info' | 'error',
      duration: 5000,
      position: 'top-right',
      showClose: true,
      customClass: 'site-message-notification-compact',
      offset: 60,
      onClick: () => {
        notification.close()
        goToMessageDetail(message)
      }
    })
  }

  // ========== 动画管理 ==========
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

  // ========== 生命周期 ==========
  onMounted(() => {
    // 建立 WebSocket 连接
    connectWebSocket()

    // 获取初始未读数量
    getUnreadCountApi().then((res) => {
      unreadCount.value = res.count || 0
      emit('unread-count-change', unreadCount.value)
    })
  })

  onUnmounted(() => {
    // 断开 WebSocket
    if (wsInstance) {
      closeSiteMessageWS(wsInstance)
      wsInstance = null
    }
  })

  // 监听属性变化
  watch(
    () => props.value,
    (newValue) => {
      showNotice(newValue)
    }
  )

  // 暴露方法供父组件调用
  defineExpose({
    refreshUnreadCount: async () => {
      const res = await getUnreadCountApi()
      unreadCount.value = res.count || 0
      emit('unread-count-change', unreadCount.value)
    }
  })
</script>

<style scoped lang="scss">
  /* ========== 容器样式 ========== */
  .art-notification-panel {
    position: absolute;
    top: 60px;
    right: 20px;
    width: 420px;
    height: 600px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top;
    will-change: transform, opacity;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

    @media (max-width: 640px) {
      top: 65px;
      right: 0;
      width: 100%;
      height: 85vh;
      border-radius: 0;
    }
  }

  /* ========== ✅ 优化后的头部样式 ========== */
  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--art-card-border);
    background: linear-gradient(to bottom, #fafbfc, #ffffff);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .title-icon {
          font-size: 20px;
          color: var(--theme-color);
          animation: pulse 2s ease-in-out infinite;
        }

        .title-text {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          letter-spacing: 0.5px;
        }
      }

      .unread-badge {
        :deep(.el-badge__content) {
          font-weight: 600;
          font-size: 11px;
          height: 18px;
          line-height: 18px;
          padding: 0 6px;
          border-radius: 9px;
        }
      }
    }

    /* ✅ 优化后的操作按钮 */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        .action-icon {
          font-size: 16px;
          position: relative;
          z-index: 1;
          transition: transform 0.2s;
        }

        /* 按钮背景渐变效果 */
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: opacity 0.2s;
        }

        /* 主要按钮样式 */
        &.action-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

          .action-icon {
            color: #ffffff;
          }

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

            .action-icon {
              transform: scale(1.1);
            }
          }

          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          }
        }

        /* 次要按钮样式 */
        &.action-btn-secondary {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

          .action-icon {
            color: #ffffff;
          }

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);

            .action-icon {
              transform: scale(1.1) rotate(-5deg);
            }
          }

          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
          }
        }

        /* 点击波纹效果 */
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        &:active::after {
          width: 100px;
          height: 100px;
        }
      }
    }
  }

  /* ========== 标签栏样式 ========== */
  .category-tabs {
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: 52px;
    padding: 0 20px;
    margin: 0;
    list-style: none;
    border-bottom: 1px solid var(--art-card-border);
    background: #ffffff;

    .category-tab {
      display: flex;
      align-items: center;
      height: 48px;
      padding: 0 4px;
      margin-right: 24px;
      font-size: 14px;
      color: #606266;
      cursor: pointer;
      user-select: none;
      position: relative;
      transition: all 0.3s;

      .tab-name {
        font-weight: 500;
      }

      .tab-count {
        margin-left: 6px;
        font-size: 12px;
        color: #909399;
      }

      .tab-badge {
        margin-left: 6px;
      }

      /* 底部指示条 */
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--theme-color);
        transform: scaleX(0);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &:hover {
        color: var(--theme-color);

        &::after {
          transform: scaleX(0.5);
        }
      }

      &.tab-active {
        color: var(--theme-color);
        font-weight: 600;

        &::after {
          transform: scaleX(1);
        }
      }
    }
  }

  /* ========== 消息列表容器 ========== */
  .message-list-container {
    width: 100%;
    height: calc(100% - 124px);
    overflow: hidden;
  }

  .message-list-scroll {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
      transition: background 0.2s;

      &:hover {
        background: #9ca3af;
      }
    }
  }

  /* ========== 加载状态 ========== */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;

    .loading-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .loading-text {
      font-size: 14px;
      margin: 0;
    }
  }

  /* ========== 消息列表 ========== */
  .message-list {
    margin: 0;
    padding: 0 0 16px;
    list-style: none;

    .message-item {
      padding: 14px 20px;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 1px solid var(--art-card-border);
      position: relative;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: linear-gradient(to right, #f7f9fc, transparent);
      }

      &.is-unread {
        background: linear-gradient(to right, #ecf5ff, transparent);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--theme-color);
        }
      }

      .message-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        /* 消息图标 */
        .message-icon {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 20px;
          transition: transform 0.2s;

          &.icon-critical {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
          }

          &.icon-warning {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            color: #e6a23c;
            box-shadow: 0 2px 8px rgba(230, 162, 60, 0.2);
          }

          &.icon-info {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            color: #909399;
            box-shadow: 0 2px 8px rgba(144, 147, 153, 0.2);
          }

          &.icon-system {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          }
        }

        /* 消息信息 */
        .message-info {
          flex: 1;
          min-width: 0;

          .message-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;

            .message-title {
              flex: 1;
              margin: 0;
              font-size: 14px;
              font-weight: 500;
              color: #303133;
              line-height: 1.4;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .severity-tag {
              flex-shrink: 0;
            }
          }

          .message-preview {
            margin: 0 0 8px;
            font-size: 13px;
            color: #606266;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .message-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #909399;

            .meta-time {
              flex-shrink: 0;
            }

            .meta-badges {
              display: flex;
              align-items: center;
              gap: 8px;

              .unread-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                color: var(--theme-color);
                font-weight: 500;

                svg {
                  font-size: 12px;
                }
              }

              .star-icon {
                font-size: 14px;
                color: #f7ba2a;
              }
            }
          }
        }
      }

      /* Hover 时图标放大效果 */
      &:hover .message-icon {
        transform: scale(1.05);
      }
    }
  }

  /* ========== 空状态 ========== */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 14px;
      margin: 0;
    }
  }

  /* ========== 动画 ========== */
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  /* ========== 暗黑模式适配 ========== */
  .dark {
    .notification-header {
      background: linear-gradient(to bottom, #1a1a1a, #242424);
    }

    .category-tabs {
      background: #242424;
    }

    .message-item {
      &.is-unread {
        background: linear-gradient(to right, rgba(64, 158, 255, 0.1), transparent);
      }
    }

    .message-list-scroll {
      &::-webkit-scrollbar-thumb {
        background: #4b5563;

        &:hover {
          background: #6b7280;
        }
      }
    }
  }
</style>

<!-- 全局样式 - 紧凑型通知样式 -->
<style>
  .site-message-notification-compact {
    width: 340px !important;
    padding: 12px 14px !important;
    box-sizing: border-box !important;
  }

  .site-message-notification-compact .el-notification__group {
    width: 100%;
    margin: 0;
  }

  .site-message-notification-compact .el-notification__title {
    font-size: 13px !important;
    font-weight: 600 !important;
    line-height: 1.3 !important;
  }

  .site-message-notification-compact .el-notification__content {
    margin-top: 8px !important;
    margin-left: 0 !important;
  }

  .site-message-notification-compact .el-notification__icon {
    width: 18px !important;
    height: 18px !important;
  }

  .site-message-notification-compact .el-notification__closeBtn {
    top: 10px !important;
    right: 10px !important;
  }
</style>