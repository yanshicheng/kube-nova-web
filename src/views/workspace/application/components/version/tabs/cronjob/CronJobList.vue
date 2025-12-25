<template>
  <div class="cronjob-list-tab">
    <ElCard>
      <template #header>
        <div class="header-wrapper">
          <div class="header-left">
            <Database :size="16" />
            <span class="header-title">Job 列表</span>
            <ElTag v-if="jobs.length > 0" size="small" type="info"> {{ jobs.length }} 个 </ElTag>
          </div>
          <div class="header-actions">
            <ElButton size="default" :icon="Clock" @click="showNextScheduleTime" v-ripple>
              下次执行时间
            </ElButton>
            <ElButton
              size="default"
              :icon="RefreshCw"
              :loading="refreshing"
              @click="handleRefresh"
              v-ripple
            >
              刷新
            </ElButton>
            <ElButton
              type="primary"
              size="default"
              :icon="Play"
              :loading="triggering"
              @click="handleTrigger"
              v-ripple
            >
              手动触发
            </ElButton>
          </div>
        </div>
      </template>

      <div class="table-container">
        <ElTable
          :data="jobs"
          v-loading="loading"
          stripe
          :header-cell-style="{ background: '#fafafa', color: '#606266' }"
        >
          <ElTableColumn prop="name" label="Job 名称" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="job-name-cell">
                <Package :size="14" style="color: #409eff" />
                <span>{{ row.name }}</span>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="status" label="状态" width="120" align="center">
            <template #default="{ row }">
              <ElTag :type="getJobStatusType(row.status)" size="default">
                <component :is="getJobStatusIcon(row.status)" :size="12" />
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="completions" label="完成进度" width="140" align="center">
            <template #default="{ row }">
              <div class="progress-cell">
                <span class="progress-text">{{ row.succeeded }}/{{ row.completions }}</span>
                <ElProgress
                  :percentage="getCompletionPercentage(row)"
                  :status="getProgressStatus(row)"
                  :show-text="false"
                />
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="active" label="运行中" width="100" align="center">
            <template #default="{ row }">
              <ElTag v-if="row.active > 0" type="primary" size="small">{{ row.active }}</ElTag>
              <span v-else class="text-placeholder">-</span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="failed" label="失败数" width="100" align="center">
            <template #default="{ row }">
              <ElTag v-if="row.failed > 0" type="danger" size="small">{{ row.failed }}</ElTag>
              <span v-else class="text-placeholder">-</span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="duration" label="持续时间" width="120" align="center">
            <template #default="{ row }">
              <div class="info-cell">
                <Clock :size="14" class="icon-muted" />
                <span>{{ row.duration || '-' }}</span>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="creationTimestamp" label="创建时间" width="160" align="center">
            <template #default="{ row }">
              <div class="info-cell">
                <Calendar :size="14" class="icon-muted" />
                <span>{{ formatTime(row.creationTimestamp) }}</span>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="操作" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <ElButton
                  size="small"
                  type="primary"
                  text
                  :loading="detailLoading === row.name"
                  @click="handleViewJobDetail(row)"
                >
                  <FileText :size="14" />
                  详情
                </ElButton>
                <ElButton
                  size="small"
                  type="danger"
                  text
                  :loading="deleteLoading === row.name"
                  @click="handleDeleteJob(row)"
                >
                  <Trash2 :size="14" />
                  删除
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty v-if="!loading && jobs.length === 0" :image-size="120">
          <template #description>
            <div class="empty-content">
              <Package :size="48" class="empty-icon" />
              <p class="empty-title">暂无 Job 记录</p>
              <p class="empty-hint"
                >该 CronJob 还没有执行过任何任务，点击"手动触发"按钮创建第一个 Job</p
              >
            </div>
          </template>
        </ElEmpty>
      </div>
    </ElCard>

    <!-- Job 详情对话框 -->
    <ElDialog
      v-model="detailDialogVisible"
      :title="`Job 详情 - ${selectedJob?.name}`"
      width="85%"
      top="5vh"
      class="job-detail-dialog"
    >
      <div v-loading="detailDialogLoading" class="dialog-content">
        <YamlEditorPro
          v-if="jobDetailYaml"
          v-model="jobDetailYaml"
          height="650px"
          :readonly="true"
          :show-status-bar="true"
          :validate-on-change="true"
          :filename="`${selectedJob?.name || 'job'}.yaml`"
        />
        <ElEmpty v-else description="暂无数据" :image-size="100" />
      </div>
    </ElDialog>

    <!-- 下次执行时间对话框 -->
    <ElDialog
      v-model="nextScheduleDialogVisible"
      title="下次执行时间"
      width="520px"
      class="schedule-dialog"
    >
      <div v-loading="loadingNextSchedule" class="schedule-content">
        <ElDescriptions :column="1" border size="large">
          <ElDescriptionsItem label="Cron 表达式" label-align="right" width="140px">
            <code class="cron-expression">{{ nextScheduleInfo.schedule }}</code>
          </ElDescriptionsItem>

          <ElDescriptionsItem label="时区" label-align="right" width="140px">
            <span>{{ nextScheduleInfo.timezone || 'UTC' }}</span>
          </ElDescriptionsItem>

          <ElDescriptionsItem label="当前状态" label-align="right" width="140px">
            <ElTag :type="nextScheduleInfo.isSuspended ? 'danger' : 'success'" size="default">
              {{ nextScheduleInfo.isSuspended ? '已暂停' : '运行中' }}
            </ElTag>
          </ElDescriptionsItem>

          <ElDescriptionsItem label="当前时间" label-align="right" width="140px">
            <span>{{ formatScheduleTime(nextScheduleInfo.currentTime) }}</span>
          </ElDescriptionsItem>

          <ElDescriptionsItem label="下次执行时间" label-align="right" width="140px">
            <div v-if="nextScheduleInfo.isSuspended" class="text-muted"> 已暂停，不会执行 </div>
            <div v-else-if="nextScheduleInfo.nextScheduleTime" class="next-time-info">
              <ElText type="primary" class="next-time">
                {{ formatScheduleTime(nextScheduleInfo.nextScheduleTime) }}
              </ElText>
              <div class="time-distance">
                距离现在: {{ getTimeDistance(nextScheduleInfo.nextScheduleTime) }}
              </div>
            </div>
            <span v-else class="text-muted">无</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Play,
    Package,
    Clock,
    Calendar,
    FileText,
    Trash2,
    Database,
    CheckCircle,
    XCircle,
    Loader,
    AlertCircle,
    RefreshCw
  } from 'lucide-vue-next'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'
  import {
    getCronJobHistoryApi,
    triggerCronJobApi,
    getCronJobJobDetailsApi,
    deleteCronJobJobApi,
    getNextScheduleTimeApi,
    type CronJobHistoryItem,
    type OnecProjectVersion,
    type NextScheduleTimeResponse
  } from '@/api'
  import dayjs from 'dayjs'

  interface Props {
    version: OnecProjectVersion
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  // 状态管理
  const loading = ref(false)
  const triggering = ref(false)
  const refreshing = ref(false)
  const detailLoading = ref<string>('')
  const deleteLoading = ref<string>('')

  // 对话框
  const detailDialogVisible = ref(false)
  const detailDialogLoading = ref(false)
  const selectedJob = ref<CronJobHistoryItem | null>(null)
  const jobDetailYaml = ref('')

  // 下次执行时间对话框
  const nextScheduleDialogVisible = ref(false)
  const loadingNextSchedule = ref(false)
  const nextScheduleInfo = reactive<Partial<NextScheduleTimeResponse>>({
    schedule: '',
    timezone: '',
    isSuspended: false,
    currentTime: 0,
    nextScheduleTime: 0
  })

  // Job 列表
  const jobs = ref<CronJobHistoryItem[]>([])

  // 时间更新相关
  const loadTime = ref(0)
  const elapsedSeconds = ref(0)
  let timeUpdateTimer: number | null = null

  // 格式化时间（Job列表用）
  const formatTime = (timestamp: number) => {
    return dayjs(timestamp * 1000).format('MM-DD HH:mm')
  }

  // 格式化时间（调度时间用）
  const formatScheduleTime = (timestamp: number) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  // 计算时间距离（使用服务器时间）
  const getTimeDistance = (timestamp: number) => {
    if (!timestamp) return '-'

    // 使用服务器返回的 currentTime + 已过去的秒数
    const serverNow = nextScheduleInfo.currentTime! + elapsedSeconds.value * 1000
    const diff = timestamp - serverNow

    if (diff < 0) return '已过期'

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} 天 ${hours % 24} 小时`
    if (hours > 0) return `${hours} 小时 ${minutes % 60} 分钟`
    if (minutes > 0) return `${minutes} 分钟 ${seconds % 60} 秒`
    return `${seconds} 秒`
  }

  // 启动时间更新定时器
  const startTimeUpdate = () => {
    if (timeUpdateTimer) return

    loadTime.value = Date.now()
    elapsedSeconds.value = 0

    timeUpdateTimer = window.setInterval(() => {
      elapsedSeconds.value = Math.floor((Date.now() - loadTime.value) / 1000)
    }, 1000)
  }

  // 停止时间更新定时器
  const stopTimeUpdate = () => {
    if (timeUpdateTimer) {
      clearInterval(timeUpdateTimer)
      timeUpdateTimer = null
    }
    elapsedSeconds.value = 0
  }

  // 获取 Job 状态类型
  const getJobStatusType = (status: string) => {
    const typeMap: Record<string, any> = {
      Completed: 'success',
      Failed: 'danger',
      Running: 'primary',
      Suspended: 'warning'
    }
    return typeMap[status] || 'info'
  }

  // 获取 Job 状态图标
  const getJobStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      Completed: CheckCircle,
      Failed: XCircle,
      Running: Loader,
      Suspended: AlertCircle
    }
    return iconMap[status] || Package
  }

  // 计算完成百分比
  const getCompletionPercentage = (job: CronJobHistoryItem) => {
    if (job.completions === 0) return 0
    return Math.round((job.succeeded / job.completions) * 100)
  }

  // 获取进度条状态
  const getProgressStatus = (job: CronJobHistoryItem) => {
    if (job.status === 'Failed') return 'exception'
    if (job.status === 'Completed') return 'success'
    return undefined
  }

  // 加载 Job 列表
  const loadJobs = async () => {
    if (!props.version?.id) {
      console.warn('[CronJobList] 版本ID不存在，跳过加载')
      return
    }

    loading.value = true

    try {
      const response = await getCronJobHistoryApi(props.version.id)
      jobs.value = response?.jobs || []
    } catch (error) {
      console.error('[CronJobList] 加载Job列表失败:', error)
      jobs.value = []
    } finally {
      loading.value = false
    }
  }

  // 刷新列表
  const handleRefresh = () => {
    refreshing.value = true

    loadJobs().finally(() => {
      refreshing.value = false
    })
  }

  // 手动触发 Job
  const handleTrigger = async () => {
    if (!props.version?.id) {
      return
    }

    triggering.value = true

    try {
      await triggerCronJobApi(props.version.id)
      ElMessage.success('手动触发成功，Job 将在几秒后创建')

      // 延迟刷新，等待 Job 创建完成
      setTimeout(() => {
        loadJobs()
      }, 2000)
    } catch (error) {
      console.error('[CronJobList] 手动触发失败:', error)
    } finally {
      triggering.value = false
    }
  }

  // 显示下次执行时间
  const showNextScheduleTime = async () => {
    if (!props.version?.id) {
      return
    }

    nextScheduleDialogVisible.value = true
    loadingNextSchedule.value = true

    try {
      const data = await getNextScheduleTimeApi(props.version.id)
      Object.assign(nextScheduleInfo, data)

      // 启动倒计时
      startTimeUpdate()
    } catch (error) {
      console.error('[CronJobList] 获取下次执行时间失败', error)
    } finally {
      loadingNextSchedule.value = false
    }
  }

  // 查看 Job 详情
  const handleViewJobDetail = async (job: CronJobHistoryItem) => {
    if (!props.version?.id) {
      return
    }

    selectedJob.value = job
    detailDialogVisible.value = true
    detailDialogLoading.value = true
    detailLoading.value = job.name
    jobDetailYaml.value = ''

    try {
      const yaml = await getCronJobJobDetailsApi(props.version.id, job.name)
      jobDetailYaml.value = yaml || '# 获取失败'
    } catch (error) {
      console.error('[CronJobList] 获取Job详情失败:', error)
      jobDetailYaml.value = '# 获取失败'
    } finally {
      detailDialogLoading.value = false
      detailLoading.value = ''
    }
  }

  // 删除 Job
  const handleDeleteJob = async (job: CronJobHistoryItem) => {
    if (!props.version?.id) {
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除 Job "${job.name}" 吗？删除后将无法恢复。`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消'
        }
      )

      deleteLoading.value = job.name

      await deleteCronJobJobApi(props.version.id, job.name)
      ElMessage.success('删除成功')

      // 直接刷新当前列表
      loadJobs()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[CronJobList] 删除Job失败:', error)
      }
    } finally {
      deleteLoading.value = ''
    }
  }

  // 监听刷新触发
  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        loadJobs()
      }
    }
  )

  // 监听对话框关闭
  watch(nextScheduleDialogVisible, (visible) => {
    if (!visible) {
      stopTimeUpdate()
    }
  })

  // 组件挂载时加载
  onMounted(() => {
    loadJobs()
  })

  // 组件卸载时清理定时器
  onUnmounted(() => {
    stopTimeUpdate()
  })
</script>

<style lang="scss" scoped>
  .cronjob-list-tab {
    // 卡片头部
    .header-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;

        .header-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
    }

    // 表格容器
    .table-container {
      margin: -20px;
      padding: 20px;
    }

    // 表格单元格
    .job-name-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .progress-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .progress-text {
        font-size: 12px;
        color: #606266;
      }
    }

    .info-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 13px;
      color: #606266;
    }

    .icon-muted {
      color: #909399;
      flex-shrink: 0;
    }

    .text-placeholder {
      color: #909399;
    }

    .text-muted {
      color: #909399;
    }

    // 操作按钮
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 8px;

      :deep(.el-button) {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }

    // 空状态
    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;

      .empty-icon {
        color: #c0c4cc;
        margin-bottom: 16px;
      }

      .empty-title {
        margin: 0 0 8px 0;
        font-size: 15px;
        font-weight: 500;
        color: #606266;
      }

      .empty-hint {
        margin: 0;
        font-size: 13px;
        color: #909399;
        line-height: 1.6;
      }
    }

    // 进度条样式
    :deep(.el-progress) {
      width: 100%;
      max-width: 100px;

      .el-progress-bar__outer {
        background-color: #f0f0f0;
      }
    }

    // Tag 样式
    :deep(.el-tag) {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    // 隐藏表格空文本
    :deep(.el-table) {
      .el-table__empty-text {
        display: none;
      }
    }
  }

  // Job 详情对话框
  .job-detail-dialog {
    .dialog-content {
      min-height: 200px;
      padding: 0;
    }

    :deep(.el-dialog__body) {
      padding: 20px;
    }
  }

  // 下次执行时间对话框
  .schedule-dialog {
    .schedule-content {
      min-height: 200px;
      padding: 4px 0;
    }

    .cron-expression {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      padding: 4px 8px;
      background: #f5f7fa;
      border-radius: 4px;
      color: #409eff;
    }

    .next-time-info {
      .next-time {
        font-weight: 600;
        font-size: 14px;
      }

      .time-distance {
        margin-top: 6px;
        font-size: 12px;
        color: #909399;
        line-height: 1.4;
      }
    }

    :deep(.el-descriptions) {
      .el-descriptions__label {
        font-weight: 500;
        background-color: #fafafa !important;
      }

      .el-descriptions__content {
        padding: 12px 16px;
      }
    }

    :deep(.el-dialog__body) {
      padding: 20px 24px;
    }
  }
</style>
