<template>
  <div v-loading="loading" class="message-detail">
    <!-- ✅ 固定工具栏 -->
    <div class="detail-header">
      <div class="header-left">
        <el-button-group>
          <el-button :icon="ArrowLeft" size="small" @click="emit('prev')">上一条</el-button>
          <el-button size="small" @click="emit('next')">
            下一条
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" circle size="small" @click="emit('refresh')" />
        <el-button :icon="Delete" circle size="small" type="danger" @click="emit('delete')" />
      </div>
    </div>

    <!-- ✅ 内容区可滚动 -->
    <el-scrollbar class="detail-scrollbar">
      <div class="detail-body">
        <!-- 标题区 -->
        <div class="message-title-section">
          <h2 class="message-title">{{ message?.title || '' }}</h2>
          <div class="message-badges">
            <el-tag :type="severityTagType" size="large">
              {{ severityName }}
            </el-tag>
            <el-tag type="info" size="large" effect="plain">平台通知</el-tag>
          </div>
        </div>

        <!-- 元信息 -->
        <div class="message-meta">
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>发送时间：{{ formattedCreatedAt }}</span>
          </div>
          <div v-if="message?.readAt" class="meta-item">
            <el-icon><View /></el-icon>
            <span>阅读时间：{{ formattedReadAt }}</span>
          </div>
          <div v-if="message?.expireAt" class="meta-item">
            <el-icon><Calendar /></el-icon>
            <span>过期时间：{{ formattedExpireAt }}</span>
            <el-tag v-if="isExpired" type="warning" size="small">已过期</el-tag>
          </div>
        </div>

        <!-- 分割线 -->
        <el-divider />

        <!-- 消息内容 -->
        <div class="message-content">
          <div class="content-label">
            <el-icon><Document /></el-icon>
            消息内容
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="content-body markdown-body" v-html="renderedContent" />
        </div>

        <!-- 扩展数据 -->
        <div v-if="hasExtraData" class="message-extra">
          <div class="content-label">
            <el-icon><DataAnalysis /></el-icon>
            扩展信息
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item
              v-for="(value, key) in extraData"
              :key="String(key)"
              :label="String(key)"
            >
              {{ formatValue(value) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 操作按钮 -->
        <div v-if="message?.actionUrl && message?.actionText" class="message-actions">
          <el-button type="primary" :icon="Link" @click="handleAction">
            {{ message.actionText }}
          </el-button>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import {
    ArrowLeft,
    ArrowRight,
    Refresh,
    Delete,
    Clock,
    View,
    Calendar,
    Document,
    DataAnalysis,
    Link
  } from '@element-plus/icons-vue'
  import type { SiteMessages } from '@/api/portal/site-messages'
  import {
    MessageSeverity,
    MessageSeverityNames,
    formatMessageTimestamp,
    formatExtraData,
    isMessageExpired,
    getMessageSeverityTagType
  } from '@/api/portal/site-messages'
  import { batchReadSiteMessagesApi } from '@/api/portal/site-messages'

  interface Props {
    message?: SiteMessages
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    refresh: []
    delete: []
    next: []
    prev: []
    read: []
  }>()

  const loading = ref(false)

  // 解析扩展数据
  const extraData = computed(() => {
    if (!props.message?.extraData) return {}
    return formatExtraData(props.message.extraData)
  })

  const hasExtraData = computed(() => {
    return Object.keys(extraData.value).length > 0
  })

  // 渲染 Markdown 内容
  const renderedContent = computed(() => {
    if (!props.message?.content) return ''
    const html = marked.parse(props.message.content) as string
    return DOMPurify.sanitize(html)
  })

  // 格式化时间
  const formattedCreatedAt = computed(() => {
    if (!props.message?.createdAt) return '-'
    return formatMessageTimestamp(props.message.createdAt)
  })

  const formattedReadAt = computed(() => {
    if (!props.message?.readAt) return '-'
    return formatMessageTimestamp(props.message.readAt)
  })

  const formattedExpireAt = computed(() => {
    if (!props.message?.expireAt) return '-'
    return formatMessageTimestamp(props.message.expireAt)
  })

  // 是否过期
  const isExpired = computed(() => {
    if (!props.message?.expireAt) return false
    return isMessageExpired(props.message.expireAt)
  })

  // 严重级别
  const severityTagType = computed(() => {
    if (!props.message?.severity) return 'info'
    return getMessageSeverityTagType(props.message.severity)
  })

  const severityName = computed(() => {
    if (!props.message?.severity) return ''
    return MessageSeverityNames[props.message.severity as MessageSeverity] || props.message.severity
  })

  // 格式化值
  const formatValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  // 处理操作按钮点击
  const handleAction = () => {
    if (props.message?.actionUrl) {
      window.open(props.message.actionUrl, '_blank')
    }
  }

  // 标记为已读
  const markAsRead = async () => {
    if (!props.message || props.message.isRead) return

    try {
      await batchReadSiteMessagesApi({ ids: [props.message.id] })
      // 通知父组件刷新未读数
      emit('read')
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 监听消息变化，自动标记已读
  watch(
    () => props.message?.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        markAsRead()
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .message-detail {
    height: 800px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .detail-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid #ebeef5;
    background: #fff;

    .header-right {
      display: flex;
      gap: 8px;
    }
  }

  // ✅ 内容区滚动
  .detail-scrollbar {
    flex: 1;
    min-height: 0;
  }

  .detail-body {
    padding: 24px;

    .message-title-section {
      margin-bottom: 24px;

      .message-title {
        margin: 0 0 16px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
      }

      .message-badges {
        display: flex;
        gap: 12px;
      }
    }

    .message-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 6px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #606266;

        .el-icon {
          color: #909399;
        }
      }
    }

    .message-content {
      margin-top: 24px;

      .content-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;

        .el-icon {
          color: #409eff;
        }
      }

      .content-body {
        padding: 20px;
        background: #fafafa;
        border-radius: 6px;
        border: 1px solid #ebeef5;
        line-height: 1.8;
        color: #606266;

        &.markdown-body {
          :deep(h1),
          :deep(h2),
          :deep(h3),
          :deep(h4),
          :deep(h5),
          :deep(h6) {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
            color: #303133;
          }

          :deep(h1) {
            font-size: 28px;
            border-bottom: 1px solid #ebeef5;
            padding-bottom: 8px;
          }

          :deep(h2) {
            font-size: 24px;
          }

          :deep(h3) {
            font-size: 20px;
          }

          :deep(p) {
            margin-bottom: 16px;
          }

          :deep(ul),
          :deep(ol) {
            padding-left: 24px;
            margin-bottom: 16px;

            li {
              margin-bottom: 8px;
            }
          }

          :deep(code) {
            padding: 2px 6px;
            background: #f0f2f5;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
          }

          :deep(pre) {
            padding: 16px;
            background: #282c34;
            border-radius: 6px;
            overflow-x: auto;

            code {
              background: none;
              color: #abb2bf;
              padding: 0;
            }
          }

          :deep(blockquote) {
            padding: 12px 20px;
            margin: 16px 0;
            border-left: 4px solid #409eff;
            background: #ecf5ff;
            color: #606266;
          }

          :deep(table) {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;

            th,
            td {
              padding: 12px;
              border: 1px solid #ebeef5;
              text-align: left;
            }

            th {
              background: #f5f7fa;
              font-weight: 600;
            }

            tr:nth-child(even) {
              background: #fafafa;
            }
          }
        }
      }
    }

    .message-extra {
      margin-top: 24px;

      .content-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;

        .el-icon {
          color: #409eff;
        }
      }
    }

    .message-actions {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;
      text-align: center;
    }
  }
</style>