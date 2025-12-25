<template>
  <ElDialog
    v-model="visible"
    :title="null"
    width="1100px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    custom-class="alert-detail-dialog"
    destroy-on-close
  >
    <template #header="{ close }">
      <div class="dialog-header">
        <div class="header-left">
          <ElIcon class="header-icon" :size="20">
            <BellFilled />
          </ElIcon>
          <div class="header-info">
            <h3>告警详情</h3>
            <span class="header-subtitle" v-if="alertData">
              ID: {{ alertData.id }} | {{ alertData.alertName }}
            </span>
          </div>
        </div>
        <ElButton
          class="close-button"
          :icon="Close"
          circle
          @click="close"
          :disabled="loading"
          size="small"
        />
      </div>
    </template>

    <div v-loading="loading" class="dialog-content" element-loading-text="加载中...">
      <template v-if="!loading && alertData">
        <!-- 核心状态卡片 + 时间轴 -->
        <div class="main-section">
          <!-- 左侧：状态卡片 -->
          <div class="status-cards">
            <div class="status-card severity" :class="`severity-${alertData.severity}`">
              <ElIcon :size="20">
                <component :is="getSeverityIcon(alertData.severity)" />
              </ElIcon>
              <div class="card-info">
                <span class="card-label">严重级别</span>
                <span class="card-value">
                  {{ AlertInstanceSeverityNames[alertData.severity] || alertData.severity }}
                </span>
              </div>
            </div>

            <div class="status-card status" :class="`status-${alertData.status}`">
              <ElIcon :size="20">
                <component :is="getStatusIcon(alertData.status)" />
              </ElIcon>
              <div class="card-info">
                <span class="card-label">告警状态</span>
                <span class="card-value">
                  {{ AlertStatusNames[alertData.status] || alertData.status }}
                </span>
              </div>
            </div>

            <div class="status-card metric">
              <ElIcon :size="20"><Clock /></ElIcon>
              <div class="card-info">
                <span class="card-label">持续时长</span>
                <span class="card-value">{{ formatDuration(alertData.duration) }}</span>
              </div>
            </div>

            <div class="status-card metric">
              <ElIcon :size="20"><Refresh /></ElIcon>
              <div class="card-info">
                <span class="card-label">重复次数</span>
                <span class="card-value">{{ alertData.repeatCount || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：时间轴 -->
          <div class="timeline-section">
            <div class="section-title">
              <ElIcon :size="16"><Timer /></ElIcon>
              时间轴
            </div>
            <div class="timeline">
              <div class="timeline-item" :class="{ active: alertData.startsAt }">
                <div class="timeline-dot"></div>
                <div class="timeline-info">
                  <span class="timeline-label">告警开始</span>
                  <span class="timeline-time">{{ formatTimestamp(alertData.startsAt) }}</span>
                </div>
              </div>

              <div class="timeline-item" :class="{ active: alertData.endsAt }">
                <div class="timeline-dot"></div>
                <div class="timeline-info">
                  <span class="timeline-label">告警结束</span>
                  <span class="timeline-time">{{ formatTimestamp(alertData.endsAt) }}</span>
                </div>
              </div>

              <div class="timeline-item" :class="{ active: alertData.resolvedAt }">
                <div class="timeline-dot success"></div>
                <div class="timeline-info">
                  <span class="timeline-label">告警恢复</span>
                  <span class="timeline-time">{{ formatTimestamp(alertData.resolvedAt) }}</span>
                </div>
              </div>

              <div class="timeline-item" :class="{ active: alertData.lastNotifiedAt }">
                <div class="timeline-dot info"></div>
                <div class="timeline-info">
                  <span class="timeline-label">最后通知</span>
                  <span class="timeline-time">{{ formatTimestamp(alertData.lastNotifiedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 告警概要 -->
        <div class="content-section summary-section" v-if="hasSummaryInfo">
          <div class="section-header">
            <ElIcon :size="16"><DocumentChecked /></ElIcon>
            <span>告警概要</span>
          </div>

          <div class="summary-content">
            <div class="summary-item" v-if="parsedAnnotations.summary">
              <div class="summary-label">
                <ElIcon :size="14"><Reading /></ElIcon>
                概要说明
              </div>
              <div class="summary-text">{{ parsedAnnotations.summary }}</div>
            </div>

            <div class="summary-item" v-if="parsedAnnotations.description">
              <div class="summary-label">
                <ElIcon :size="14"><Document /></ElIcon>
                详细描述
              </div>
              <div class="summary-text">{{ parsedAnnotations.description }}</div>
            </div>

            <div class="summary-item highlight" v-if="parsedAnnotations.value">
              <div class="summary-label">
                <ElIcon :size="14"><TrendCharts /></ElIcon>
                触发值
              </div>
              <div class="summary-text trigger">{{ parsedAnnotations.value }}</div>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="content-section">
          <div class="section-header">
            <ElIcon :size="16"><InfoFilled /></ElIcon>
            <span>基本信息</span>
          </div>

          <div class="info-items">
            <div class="info-row">
              <div class="info-label">
                <ElIcon :size="14"><Files /></ElIcon>
                告警实例
              </div>
              <div class="info-value copyable" @click="copyToClipboard(alertData.instance)">
                {{ alertData.instance }}
                <ElIcon class="copy-icon" :size="13"><CopyDocument /></ElIcon>
              </div>
            </div>

            <div class="info-row">
              <div class="info-label">
                <ElIcon :size="14"><Collection /></ElIcon>
                告警指纹
              </div>
              <div class="info-value copyable" @click="copyToClipboard(alertData.fingerprint)">
                {{ alertData.fingerprint }}
                <ElIcon class="copy-icon" :size="13"><CopyDocument /></ElIcon>
              </div>
            </div>

            <!-- 生成器URL - 可展开 -->
            <div class="info-row expandable-row">
              <div class="info-label clickable" @click="showGeneratorUrl = !showGeneratorUrl">
                <ElIcon :size="14"><Link /></ElIcon>
                生成器URL
                <ElIcon class="expand-icon" :class="{ expanded: showGeneratorUrl }" :size="12">
                  <ArrowDown />
                </ElIcon>
              </div>
              <transition name="expand">
                <div v-show="showGeneratorUrl" class="info-value">
                  <a
                    v-if="alertData.generatorUrl"
                    :href="alertData.generatorUrl"
                    target="_blank"
                    class="link"
                  >
                    {{ alertData.generatorUrl }}
                    <ElIcon :size="12"><TopRight /></ElIcon>
                  </a>
                  <span v-else class="empty">-</span>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- 关联资源 -->
        <div class="content-section">
          <div class="section-header">
            <ElIcon :size="16"><Grid /></ElIcon>
            <span>关联资源</span>
          </div>

          <div class="resource-list">
            <div class="resource-item">
              <ElIcon :size="14"><Platform /></ElIcon>
              <span class="resource-type">集群</span>
              <ElTag type="primary" effect="plain" size="small">{{ alertData.clusterName }}</ElTag>
              <span class="resource-uuid">{{ alertData.clusterUuid }}</span>
            </div>

            <div class="resource-item">
              <ElIcon :size="14"><FolderOpened /></ElIcon>
              <span class="resource-type">项目</span>
              <ElTag type="success" effect="plain" size="small">{{ alertData.projectName }}</ElTag>
              <span class="resource-uuid">ID: {{ alertData.projectId }}</span>
            </div>

            <div class="resource-item">
              <ElIcon :size="14"><Box /></ElIcon>
              <span class="resource-type">工作空间</span>
              <ElTag type="info" effect="plain" size="small">{{ alertData.workspaceName }}</ElTag>
              <span class="resource-uuid">ID: {{ alertData.workspaceId }}</span>
            </div>
          </div>
        </div>

        <!-- 通知信息 -->
        <div class="content-section" v-if="alertData.notificationCount > 0">
          <div class="section-header">
            <ElIcon :size="16"><Message /></ElIcon>
            <span>通知信息</span>
          </div>

          <div class="notification-info">
            <div class="notification-stat">
              <ElIcon :size="18"><ChatDotRound /></ElIcon>
              <span>通知次数</span>
              <strong>{{ alertData.notificationCount }}</strong>
            </div>
            <div class="notification-groups" v-if="notifiedGroupIds.length > 0">
              <span class="groups-label">已通知告警组：</span>
              <ElTag
                v-for="groupId in notifiedGroupIds"
                :key="groupId"
                type="warning"
                effect="plain"
                size="small"
              >
                组 {{ groupId }}
              </ElTag>
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div class="content-section" v-if="Object.keys(filteredLabels).length > 0">
          <div class="section-header">
            <ElIcon :size="16"><PriceTag /></ElIcon>
            <span>标签</span>
            <ElTag type="info" effect="plain" size="small" round class="count-badge">
              {{ Object.keys(filteredLabels).length }}
            </ElTag>
          </div>

          <div class="labels-grid">
            <div v-for="(value, key) in filteredLabels" :key="key" class="label-tag">
              <span class="tag-key">{{ key }}</span>
              <span class="tag-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- 其他注解 -->
        <div class="content-section" v-if="Object.keys(otherAnnotations).length > 0">
          <div class="section-header">
            <ElIcon :size="16"><Document /></ElIcon>
            <span>其他注解</span>
          </div>

          <div class="annotations-list">
            <div v-for="(value, key) in otherAnnotations" :key="key" class="annotation-item">
              <div class="annotation-key">{{ key }}</div>
              <div class="annotation-value">{{ value }}</div>
            </div>
          </div>
        </div>

        <!-- 元数据 -->
        <div class="metadata-footer">
          <div class="metadata-item">
            <ElIcon :size="13"><User /></ElIcon>
            创建：{{ alertData.createdBy || '-' }}
            <span class="time">{{ formatTimestamp(alertData.createdAt) }}</span>
          </div>
          <div class="metadata-item">
            <ElIcon :size="13"><EditPen /></ElIcon>
            更新：{{ alertData.updatedBy || '-' }}
            <span class="time">{{ formatTimestamp(alertData.updatedAt) }}</span>
          </div>
        </div>
      </template>

      <ElEmpty v-else-if="!loading && !alertData" description="未找到告警数据" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading" v-ripple> 关闭 </ElButton>
        <ElButton
          type="danger"
          @click="handleDelete"
          :loading="deleteLoading"
          :disabled="loading"
          v-ripple
        >
          <ElIcon><Delete /></ElIcon>
          删除告警
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useClipboard } from '@vueuse/core'
  import {
    BellFilled,
    Close,
    InfoFilled,
    Files,
    Collection,
    Link,
    TopRight,
    Grid,
    Platform,
    FolderOpened,
    Box,
    Timer,
    Clock,
    Refresh,
    Message,
    ChatDotRound,
    PriceTag,
    Document,
    Delete,
    CopyDocument,
    WarningFilled,
    CircleCheckFilled,
    WarnTriangleFilled,
    ArrowDown,
    DocumentChecked,
    Reading,
    TrendCharts,
    User,
    EditPen
  } from '@element-plus/icons-vue'
  import {
    getAlertInstanceByIdApi,
    deleteAlertInstanceApi,
    formatTimestamp,
    formatDuration,
    formatLabels,
    formatAnnotations,
    getNotifiedGroupIds,
    AlertInstanceSeverityNames,
    AlertStatusNames,
    type AlertInstance
  } from '@/api/portal/alert'

  interface Props {
    modelValue: boolean
    alertId?: number
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'refresh'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    alertId: undefined
  })

  const emit = defineEmits<Emits>()
  const { copy } = useClipboard()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const loading = ref(false)
  const deleteLoading = ref(false)
  const alertData = ref<AlertInstance | null>(null)
  const showGeneratorUrl = ref(false)

  const parsedLabels = computed(() => {
    if (!alertData.value?.labels) return {}
    return formatLabels(alertData.value.labels)
  })

  const filteredLabels = computed(() => {
    const labels = parsedLabels.value
    const filtered: Record<string, string> = {}
    const excludeKeys = ['__name__', 'job', 'instance']

    for (const [key, value] of Object.entries(labels)) {
      if (!excludeKeys.includes(key)) {
        filtered[key] = value
      }
    }
    return filtered
  })

  const parsedAnnotations = computed(() => {
    if (!alertData.value?.annotations) return {}
    return formatAnnotations(alertData.value.annotations)
  })

  const hasSummaryInfo = computed(() => {
    const annotations = parsedAnnotations.value
    return !!(annotations.summary || annotations.description || annotations.value)
  })

  const otherAnnotations = computed(() => {
    const annotations = parsedAnnotations.value
    const other: Record<string, string> = {}
    const keyFields = ['summary', 'description', 'value']

    for (const [key, value] of Object.entries(annotations)) {
      if (!keyFields.includes(key)) {
        other[key] = value
      }
    }
    return other
  })

  const notifiedGroupIds = computed(() => {
    if (!alertData.value?.notifiedGroups) return []
    return getNotifiedGroupIds(alertData.value.notifiedGroups)
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return WarningFilled
      case 'warning':
        return WarnTriangleFilled
      default:
        return InfoFilled
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'firing':
        return BellFilled
      case 'resolved':
        return CircleCheckFilled
      default:
        return InfoFilled
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await copy(text)
      ElMessage.success('已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }

  const loadAlertDetail = async () => {
    if (!props.alertId) return
    try {
      loading.value = true
      const response = await getAlertInstanceByIdApi(props.alertId)
      alertData.value = response
    } catch (error) {
      console.error('加载告警详情失败:', error)
      ElMessage.error('加载告警详情失败')
    } finally {
      loading.value = false
    }
  }

  const handleDelete = async () => {
    if (!alertData.value) return
    try {
      await ElMessageBox.confirm(
        `确定要删除告警"${alertData.value.alertName}"吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'error',
          autofocus: false
        }
      )
      deleteLoading.value = true
      await deleteAlertInstanceApi(alertData.value.id)
      ElMessage.success('删除成功')
      emit('refresh')
      handleClose()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoading.value = false
    }
  }

  const handleClose = () => {
    if (loading.value || deleteLoading.value) return
    visible.value = false
    alertData.value = null
    showGeneratorUrl.value = false
  }

  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && props.alertId) {
        loadAlertDetail()
      }
    }
  )
</script>

<style lang="scss" scoped>
  :deep(.alert-detail-dialog) {
    border-radius: 12px;
    overflow: hidden;

    .el-dialog__header {
      padding: 0;
      margin: 0;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      padding: 12px 20px;
      border-top: 1px solid var(--el-border-color-lighter);
      background: var(--el-fill-color-lighter);
    }
  }

  // 对话框头部 - 紧凑设计
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-dark-2) 100%
    );
    color: white;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .header-icon {
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
      min-width: 0;

      h3 {
        margin: 0 0 2px 0;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.3;
      }

      .header-subtitle {
        font-size: 12px;
        opacity: 0.9;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      }
    }

    .close-button {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  // 对话框内容
  .dialog-content {
    padding: 16px 20px;
    max-height: 70vh;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
    }
  }

  // 主要状态区域
  .main-section {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  // 状态卡片 - 紧凑垂直布局
  .status-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .status-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: var(--el-bg-color);
      border: 1.5px solid var(--el-border-color-lighter);
      border-radius: 8px;
      transition: all 0.2s;

      &:hover {
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .el-icon {
        flex-shrink: 0;
      }

      .card-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;

        .card-label {
          font-size: 11px;
          color: var(--el-text-color-secondary);
        }

        .card-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &.severity-critical {
        border-color: var(--el-color-danger);
        background: linear-gradient(135deg, rgba(245, 108, 108, 0.04) 0%, transparent 100%);
        .el-icon {
          color: var(--el-color-danger);
        }
      }

      &.severity-warning {
        border-color: var(--el-color-warning);
        background: linear-gradient(135deg, rgba(230, 162, 60, 0.04) 0%, transparent 100%);
        .el-icon {
          color: var(--el-color-warning);
        }
      }

      &.severity-info {
        border-color: var(--el-color-info);
        background: linear-gradient(135deg, rgba(144, 147, 153, 0.04) 0%, transparent 100%);
        .el-icon {
          color: var(--el-color-info);
        }
      }

      &.status-firing {
        border-color: var(--el-color-danger);
        .el-icon {
          color: var(--el-color-danger);
          animation: pulse 2s ease-in-out infinite;
        }
      }

      &.status-resolved {
        border-color: var(--el-color-success);
        .el-icon {
          color: var(--el-color-success);
        }
      }

      &.metric {
        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  // 时间轴 - 紧凑设计
  .timeline-section {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 14px 16px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 14px;

      .timeline-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        opacity: 0.4;
        transition: opacity 0.2s;

        &.active {
          opacity: 1;
        }

        .timeline-dot {
          position: relative;
          width: 10px;
          height: 10px;
          margin-top: 3px;
          border-radius: 50%;
          background: var(--el-border-color);
          flex-shrink: 0;

          &::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 50%;
            width: 2px;
            height: 18px;
            background: var(--el-border-color-lighter);
            transform: translateX(-50%);
          }

          &.success {
            background: var(--el-color-success);
          }
          &.info {
            background: var(--el-color-info);
          }
        }

        &:last-child .timeline-dot::before {
          display: none;
        }

        .timeline-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;

          .timeline-label {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }

          .timeline-time {
            font-size: 13px;
            color: var(--el-text-color-primary);
            font-weight: 500;
          }
        }
      }
    }
  }

  // 内容区域 - 统一样式
  .content-section {
    margin-bottom: 12px;
    padding: 12px 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    &.summary-section {
      background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, transparent 100%);
      border-color: var(--el-color-primary-light-7);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }

      .count-badge {
        margin-left: auto;
      }
    }
  }

  // 告警概要
  .summary-content {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .summary-item {
      padding: 10px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid var(--el-border-color-lighter);

      &.highlight {
        border-color: var(--el-color-warning-light-5);
        background: var(--el-color-warning-light-9);
      }

      .summary-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
        margin-bottom: 6px;

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      .summary-text {
        font-size: 13px;
        color: var(--el-text-color-primary);
        line-height: 1.5;
        word-break: break-word;

        &.trigger {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-color-warning);
        }
      }
    }
  }

  // 基本信息
  .info-items {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.expandable-row .info-value {
        margin-left: 20px;
      }

      .info-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        &.clickable {
          cursor: pointer;
          user-select: none;
          padding: 4px 8px;
          background: var(--el-fill-color-light);
          border-radius: 4px;
          width: fit-content;
          transition: all 0.2s;

          &:hover {
            background: var(--el-fill-color);
          }

          .expand-icon {
            margin-left: 4px;
            transition: transform 0.2s;

            &.expanded {
              transform: rotate(180deg);
            }
          }
        }

        .el-icon {
          flex-shrink: 0;
        }
      }

      .info-value {
        font-size: 12px;
        color: var(--el-text-color-primary);
        word-break: break-all;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;

        &.copyable {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px 10px;
          background: var(--el-fill-color-light);
          border-radius: 4px;
          transition: all 0.2s;

          &:hover {
            background: var(--el-fill-color);
            .copy-icon {
              opacity: 1;
            }
          }

          .copy-icon {
            opacity: 0.4;
            transition: opacity 0.2s;
            flex-shrink: 0;
          }
        }

        .link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--el-color-primary);
          text-decoration: none;
          word-break: break-all;

          &:hover {
            opacity: 0.8;
          }
        }

        .empty {
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }

  // 展开动画
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s ease;
    max-height: 200px;
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    opacity: 0;
    max-height: 0;
  }

  // 关联资源
  .resource-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .resource-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-radius: 6px;
      font-size: 12px;

      .el-icon {
        color: var(--el-text-color-secondary);
        flex-shrink: 0;
      }

      .resource-type {
        color: var(--el-text-color-secondary);
        font-weight: 500;
      }

      .resource-uuid {
        margin-left: auto;
        color: var(--el-text-color-placeholder);
        font-size: 11px;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      }
    }
  }

  // 通知信息
  .notification-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .notification-stat {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--el-color-warning-light-9);
      border-radius: 6px;
      font-size: 12px;

      .el-icon {
        color: var(--el-color-warning);
      }

      strong {
        font-size: 15px;
        font-weight: 700;
        color: var(--el-color-warning);
      }
    }

    .notification-groups {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;

      .groups-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  // 标签网格
  .labels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 6px;

    .label-tag {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
      font-size: 11px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
      }

      .tag-key {
        color: var(--el-color-primary);
        font-weight: 600;
        margin-right: 4px;
        flex-shrink: 0;
      }

      .tag-value {
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  // 其他注解
  .annotations-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .annotation-item {
      padding: 10px 12px;
      background: var(--el-fill-color-light);
      border-left: 2px solid var(--el-color-primary);
      border-radius: 4px;

      .annotation-key {
        font-size: 11px;
        font-weight: 600;
        color: var(--el-color-primary);
        margin-bottom: 4px;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      }

      .annotation-value {
        font-size: 12px;
        color: var(--el-text-color-primary);
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }
  }

  // 元数据底部栏
  .metadata-footer {
    display: flex;
    gap: 16px;
    padding: 10px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    flex-wrap: wrap;

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .time {
        margin-left: 4px;
        color: var(--el-text-color-placeholder);
      }
    }
  }

  // 对话框底部
  .dialog-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  // 响应式
  @media (max-width: 768px) {
    .dialog-content {
      padding: 12px 16px;
    }

    .labels-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
