<template>
  <div v-loading="loading" class="alert-detail">
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
        <el-button :icon="Refresh" circle size="small" @click="handleRefresh" />
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
              <el-icon><WarnTriangleFilled /></el-icon>
              {{ severityName }}
            </el-tag>
            <el-tag type="warning" size="large" effect="plain">集群告警</el-tag>
            <el-tag v-if="alertInstance" :type="alertStatusType" size="large">
              {{ alertStatusName }}
            </el-tag>
          </div>
        </div>

        <!-- 告警概要信息 -->
        <div class="alert-summary">
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="summary-card">
                <div class="card-label">告警规则</div>
                <div class="card-value">{{ alertInstance?.alertName || '-' }}</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="summary-card">
                <div class="card-label">集群名称</div>
                <div class="card-value">{{ alertInstance?.clusterName || '-' }}</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="summary-card">
                <div class="card-label">告警时间</div>
                <div class="card-value">{{ formattedStartsAt }}</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="summary-card">
                <div class="card-label">持续时长</div>
                <div class="card-value">{{ duration }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 分割线 -->
        <el-divider />

        <!-- 告警详情 -->
        <div v-if="alertInstance" class="alert-info">
          <!-- 告警标签 -->
          <div v-if="alertLabels.length > 0" class="info-section">
            <div class="content-label">
              <el-icon><PriceTag /></el-icon>
              告警标签
            </div>
            <div class="label-list">
              <el-tag v-for="label in alertLabels" :key="label.key" effect="plain" size="large">
                <strong>{{ label.key }}:</strong> {{ label.value }}
              </el-tag>
            </div>
          </div>

          <!-- 告警注解 -->
          <div v-if="alertAnnotations.length > 0" class="info-section">
            <div class="content-label">
              <el-icon><Memo /></el-icon>
              告警注解
            </div>
            <el-descriptions :column="1" border>
              <el-descriptions-item
                v-for="anno in alertAnnotations"
                :key="anno.key"
                :label="anno.key"
              >
                {{ anno.value }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 指纹信息 -->
          <div class="info-section">
            <div class="content-label">
              <el-icon><DataAnalysis /></el-icon>
              技术信息
            </div>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="告警指纹">
                <el-text type="info" size="small" style="font-family: monospace">
                  {{ alertInstance.fingerprint }}
                </el-text>
              </el-descriptions-item>
              <el-descriptions-item v-if="alertInstance.generatorURL" label="生成器 URL">
                <el-link :href="alertInstance.generatorURL" target="_blank" type="primary">
                  查看详情
                </el-link>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 当获取不到告警实例数据时显示告警描述 -->
        <div v-else-if="!loading && message?.content && showDescription" class="alert-info">
          <div class="info-section">
            <div class="content-label">
              <el-icon><Document /></el-icon>
              告警描述
            </div>
            <div
              class="content-body markdown-body"
              :class="{ 'is-expanded': isDescriptionExpanded }"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="content-inner" v-html="renderedDescription" />
            </div>
            <!-- 展开/收起按钮 -->
            <div v-if="showExpandButton" class="expand-toggle">
              <el-button type="primary" link size="small" @click="toggleDescription">
                {{ isDescriptionExpanded ? '收起' : '展开全部' }}
                <el-icon class="el-icon--right">
                  <ArrowUp v-if="isDescriptionExpanded" />
                  <ArrowDown v-else />
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 无关联告警实例提示 -->
        <el-alert
          v-else-if="!loading && message && !hasInstanceId && !message?.content"
          title="无关联告警实例"
          type="info"
          description="该消息未关联告警实例信息"
          :closable="false"
          show-icon
        />

        <!-- 加载失败提示 -->
        <el-alert
          v-else-if="!loading && message && loadError && !message?.content"
          title="无法加载告警详情"
          type="warning"
          description="告警实例信息可能已被删除或无权访问"
          :closable="false"
          show-icon
        />

        <!-- 操作按钮 -->
        <div class="message-actions">
          <el-button v-if="message?.actionUrl" type="primary" :icon="Link" @click="handleAction">
            {{ message?.actionText || '查看告警' }}
          </el-button>
          <el-button v-if="alertInstance?.generatorURL" :icon="Monitor" @click="openPrometheus">
            打开 Prometheus
          </el-button>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    Refresh,
    Delete,
    WarnTriangleFilled,
    Document,
    PriceTag,
    Memo,
    DataAnalysis,
    Link,
    Monitor
  } from '@element-plus/icons-vue'
  import type { SiteMessages } from '@/api/portal'
  import {
    MessageSeverity,
    MessageSeverityNames,
    formatMessageTimestamp,
    getMessageSeverityTagType
  } from '@/api/portal'
  import { batchReadSiteMessagesApi, getAlertInstanceByIdApi } from '@/api/portal'

  interface Props {
    message?: SiteMessages
  }

  interface AlertInstanceData {
    id: number
    fingerprint: string
    alertName: string
    clusterName: string
    status: string
    severity: string
    description: string
    startsAt: number
    endsAt: number
    labels: string
    annotations: string
    generatorURL: string
  }

  interface LabelItem {
    key: string
    value: string
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
  const loadError = ref(false)
  const alertInstance = ref<AlertInstanceData | null>(null)

  // 描述展开/收起状态
  const isDescriptionExpanded = ref(false)
  const showExpandButton = ref(false)

  // 检查 instanceId（告警实例ID）
  const hasInstanceId = computed(() => {
    return props.message?.instanceId && props.message.instanceId > 0
  })

  // 是否显示告警描述
  const showDescription = computed(() => {
    if (alertInstance.value) return false
    if (loading.value) return false
    if (hasInstanceId.value && loadError.value) return true
    if (!hasInstanceId.value) return true
    return false
  })

  // 渲染 Markdown 描述
  const renderedDescription = computed(() => {
    const content = props.message?.content || ''
    if (!content) return ''

    const html = marked.parse(content) as string
    return DOMPurify.sanitize(html)
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

  // 告警状态
  const alertStatusName = computed((): string => {
    if (!alertInstance.value) return ''
    const map: Record<string, string> = {
      firing: '告警中',
      resolved: '已恢复',
      pending: '待处理'
    }
    return map[alertInstance.value.status] || alertInstance.value.status
  })

  const alertStatusType = computed(() => {
    if (!alertInstance.value) return 'info'
    const map: Record<string, 'danger' | 'success' | 'warning' | 'info'> = {
      firing: 'danger',
      resolved: 'success',
      pending: 'warning'
    }
    return map[alertInstance.value.status] || 'info'
  })

  // 格式化时间
  const formattedStartsAt = computed(() => {
    if (!alertInstance.value?.startsAt) return '-'
    return formatMessageTimestamp(alertInstance.value.startsAt)
  })

  // 持续时长
  const duration = computed((): string => {
    if (!alertInstance.value?.startsAt) return '-'
    const start = alertInstance.value.startsAt
    const end = alertInstance.value.endsAt || Math.floor(Date.now() / 1000)
    const diff = end - start

    if (diff < 60) return `${diff} 秒`
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟`
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时`
    return `${Math.floor(diff / 86400)} 天`
  })

  // 解析告警标签
  const alertLabels = computed((): LabelItem[] => {
    if (!alertInstance.value?.labels) return []
    try {
      const labels = JSON.parse(alertInstance.value.labels) as Record<string, string>
      return Object.entries(labels).map(([key, value]) => ({ key, value: String(value) }))
    } catch {
      return []
    }
  })

  // 解析告警注解
  const alertAnnotations = computed((): LabelItem[] => {
    if (!alertInstance.value?.annotations) return []
    try {
      const annotations = JSON.parse(alertInstance.value.annotations) as Record<string, string>
      return Object.entries(annotations).map(([key, value]) => ({ key, value: String(value) }))
    } catch {
      return []
    }
  })

  // 切换描述展开/收起
  const toggleDescription = () => {
    isDescriptionExpanded.value = !isDescriptionExpanded.value
  }

  // 检查内容是否需要展开按钮
  const checkExpandButton = async () => {
    await nextTick()
    const contentEl = document.querySelector('.content-body .content-inner')
    if (contentEl) {
      showExpandButton.value = contentEl.scrollHeight > 200
    }
  }

  // 加载告警详情
  const loadAlertInstance = async () => {
    alertInstance.value = null
    loadError.value = false
    isDescriptionExpanded.value = false
    showExpandButton.value = false

    if (!props.message?.instanceId || props.message.instanceId <= 0) {
      if (props.message?.content) {
        checkExpandButton()
      }
      return
    }

    loading.value = true
    try {
      const response = await getAlertInstanceByIdApi(props.message.instanceId)
      alertInstance.value = response as AlertInstanceData
    } catch (error) {
      console.error('加载告警详情失败:', error)
      loadError.value = true
      if (props.message?.content) {
        checkExpandButton()
      }
    } finally {
      loading.value = false
    }
  }

  // 刷新
  const handleRefresh = () => {
    loadAlertInstance()
    emit('refresh')
  }

  // 处理操作按钮
  const handleAction = () => {
    if (props.message?.actionUrl) {
      window.open(props.message.actionUrl, '_blank')
    }
  }

  // 打开 Prometheus
  const openPrometheus = () => {
    if (alertInstance.value?.generatorURL) {
      window.open(alertInstance.value.generatorURL, '_blank')
    }
  }

  // 标记为已读
  const markAsRead = async () => {
    if (!props.message || props.message.isRead) return

    try {
      await batchReadSiteMessagesApi({ ids: [props.message.id] })
      emit('read')
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 监听消息变化
  watch(
    () => props.message?.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        loadAlertInstance()
        markAsRead()
      } else if (!newId) {
        alertInstance.value = null
        loadError.value = false
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .alert-detail {
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
        flex-wrap: wrap;

        .el-tag {
          .el-icon {
            margin-right: 4px;
          }
        }
      }
    }

    .alert-summary {
      margin-bottom: 24px;

      .summary-card {
        padding: 16px;
        background: #f5f7fa;
        border-radius: 6px;
        margin-bottom: 16px;

        .card-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .alert-info {
      .info-section {
        margin-bottom: 24px;

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
          max-height: 200px;
          overflow: hidden;
          position: relative;
          transition: max-height 0.3s ease;

          &.is-expanded {
            max-height: none;
          }

          &:not(.is-expanded)::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(to bottom, transparent, #fafafa);
            pointer-events: none;
          }

          .content-inner {
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

              &:first-child {
                margin-top: 0;
              }
            }

            :deep(h1) {
              font-size: 24px;
              border-bottom: 1px solid #ebeef5;
              padding-bottom: 8px;
            }

            :deep(h2) {
              font-size: 20px;
            }

            :deep(h3) {
              font-size: 18px;
            }

            :deep(p) {
              margin-bottom: 16px;

              &:last-child {
                margin-bottom: 0;
              }
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

            :deep(strong) {
              font-weight: 600;
              color: #303133;
            }

            :deep(em) {
              font-style: italic;
            }
          }
        }

        .expand-toggle {
          display: flex;
          justify-content: center;
          margin-top: 12px;
        }

        .label-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;

          .el-tag {
            strong {
              margin-right: 4px;
            }
          }
        }
      }
    }

    .message-actions {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;
      display: flex;
      justify-content: center;
      gap: 12px;
    }
  }
</style>