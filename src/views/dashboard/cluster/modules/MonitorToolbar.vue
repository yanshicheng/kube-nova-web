<template>
  <div class="monitor-toolbar">
    <div class="toolbar-section">
      <div class="section-label">
        <img src="@/assets/img/monitoring/cluster.png" class="label-icon" alt="集群" />
        选择集群
      </div>
      <ElSelect
        v-model="localSelectedCluster"
        placeholder="选择集群"
        style="width: 240px"
        filterable
        @change="handleClusterChange"
      >
        <ElOption
          v-for="cluster in clusters"
          :key="cluster.uuid"
          :label="cluster.name"
          :value="cluster.uuid"
        >
          <span class="cluster-option">
            <span class="cluster-avatar">
              <img v-if="cluster.avatar" :src="cluster.avatar" alt="" />
              <img
                v-else
                src="@/assets/img/monitoring/cluster.png"
                class="cluster-icon"
                alt="集群"
              />
            </span>
            <span class="cluster-info">
              <span class="cluster-name">{{ cluster.name }}</span>
            </span>
            <ElTag :type="getStatusType(cluster.status)" size="small">
              {{ getStatusLabel(cluster.status) }}
            </ElTag>
          </span>
        </ElOption>
      </ElSelect>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section">
      <div class="section-label">
        <ElIcon><Timer /></ElIcon>
        查询范围
      </div>
      <ElSelect
        v-model="selectedTimeRange"
        placeholder="选择时间范围"
        style="width: 160px"
        @change="handleTimeRangeChange"
      >
        <ElOption label="最近 5 分钟" value="5m" />
        <ElOption label="最近 15 分钟" value="15m" />
        <ElOption label="最近 30 分钟" value="30m" />
        <ElOption label="最近 1 小时" value="1h" />
        <ElOption label="最近 3 小时" value="3h" />
        <ElOption label="最近 6 小时" value="6h" />
        <ElOption label="最近 12 小时" value="12h" />
        <ElOption label="最近 1 天" value="24h" />
        <ElOption label="最近 7 天" value="7d" />
        <ElOption label="最近 15 天" value="15d" />
        <ElOption label="最近 31 天" value="31d" />
        <ElOption label="自定义范围" value="custom">
          <span class="option-content">
            <ElIcon><Calendar /></ElIcon>
            <span>自定义范围</span>
          </span>
        </ElOption>
      </ElSelect>

      <Transition name="slide-fade">
        <ElDatePicker
          v-if="selectedTimeRange === 'custom'"
          v-model="customTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss.000Z"
          style="width: 400px"
          @change="handleCustomTimeChange"
        />
      </Transition>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-actions">
      <div class="auto-refresh-control">
        <ElSwitch v-model="autoRefreshEnabled" size="small" @change="handleAutoRefreshToggle" />
        <span class="control-label">自动刷新</span>
        <Transition name="slide-fade">
          <ElSelect
            v-if="autoRefreshEnabled"
            v-model="refreshInterval"
            size="small"
            style="width: 120px; margin-left: 8px"
            @change="handleRefreshIntervalChange"
          >
            <ElOption label="实时监控" :value="3">
              <span class="option-content">
                <span class="realtime-indicator">🔴</span>
                <span>实时监控</span>
              </span>
            </ElOption>
            <ElOption label="5秒" :value="5" />
            <ElOption label="15秒" :value="15" />
            <ElOption label="30秒" :value="30" />
            <ElOption label="1分钟" :value="60" />
            <ElOption label="5分钟" :value="300" />
          </ElSelect>
        </Transition>
        <Transition name="slide-fade">
          <span
            v-if="autoRefreshEnabled && refreshInterval !== 3 && nextRefreshTime > 0"
            class="next-refresh"
          >
            下次: {{ nextRefreshTime }}s
          </span>
        </Transition>
        <Transition name="slide-fade">
          <div v-if="autoRefreshEnabled && refreshInterval === 3" class="realtime-badge">
            <span class="realtime-dot"></span>
            <span class="realtime-text">实时</span>
          </div>
        </Transition>
      </div>

      <div class="action-buttons">
        <ElButton
          type="primary"
          :icon="RefreshRight"
          :loading="loading"
          @click="handleManualRefresh"
        >
          刷新数据
        </ElButton>
        <ElButton :icon="Download" @click="handleExport">导出</ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
  import { RefreshRight, Download, Timer, Calendar } from '@element-plus/icons-vue'
  import type { Cluster } from '@/api/manager/cluster'

  interface Props {
    loading?: boolean
    clusters?: Cluster[]
    selectedCluster?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    clusters: () => [],
    selectedCluster: ''
  })

  interface Emits {
    (e: 'refresh', start: string, end: string, silent?: boolean): void
    (e: 'export'): void
    (e: 'cluster-change', clusterUuid: string): void
  }

  const emit = defineEmits<Emits>()

  // 默认查询时间改为30分钟
  const selectedTimeRange = ref<string>('30m')
  const customTimeRange = ref<[string, string]>()
  const localSelectedCluster = ref<string>(props.selectedCluster)

  const autoRefreshEnabled = ref<boolean>(false)
  const refreshInterval = ref<number>(30)
  const nextRefreshTime = ref<number>(0)
  let refreshTimer: NodeJS.Timeout | null = null
  let countdownTimer: NodeJS.Timeout | null = null

  const hasClusters = computed(() => props.clusters && props.clusters.length > 0)

  const getEnvLabel = (env: string) => {
    const envMap: Record<string, string> = {
      development: '开发',
      testing: '测试',
      staging: '预发',
      production: '生产'
    }
    return envMap[env] || env
  }

  const getStatusType = (status: number) => {
    switch (status) {
      case 3:
        return 'success'
      case 2:
        return 'danger'
      case 1:
        return 'warning'
      default:
        return 'info'
    }
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 3:
        return '正常'
      case 2:
        return '异常'
      case 1:
        return '同步中'
      default:
        return '未知'
    }
  }

  const getTimeParams = () => {
    if (selectedTimeRange.value === 'custom' && customTimeRange.value) {
      return {
        start: customTimeRange.value[0],
        end: customTimeRange.value[1]
      }
    }

    const end = new Date()
    const start = new Date()

    const ranges: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '3h': 3 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '15d': 15 * 24 * 60 * 60 * 1000,
      '31d': 31 * 24 * 60 * 60 * 1000
    }

    start.setTime(start.getTime() - (ranges[selectedTimeRange.value] || ranges['30m']))

    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  /**
   * 触发刷新
   * @param silent 是否静默刷新（自动刷新/实时刷新=true，手动操作=false）
   */
  const triggerRefresh = (silent: boolean = false) => {
    const { start, end } = getTimeParams()
    emit('refresh', start, end, silent)
  }

  const handleTimeRangeChange = () => {
    if (selectedTimeRange.value !== 'custom') {
      // ✅ 用户主动修改时间范围，非静默刷新
      triggerRefresh(false)
    }
  }

  const handleCustomTimeChange = () => {
    if (customTimeRange.value) {
      // ✅ 用户主动修改自定义时间，非静默刷新
      triggerRefresh(false)
    }
  }

  const handleClusterChange = () => {
    emit('cluster-change', localSelectedCluster.value)
  }

  const handleManualRefresh = () => {
    // ✅ 手动刷新按钮，非静默刷新
    triggerRefresh(false)
    if (autoRefreshEnabled.value) {
      resetCountdown()
    }
  }

  const handleExport = () => {
    emit('export')
  }

  const handleAutoRefreshToggle = (enabled: boolean) => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  const handleRefreshIntervalChange = () => {
    if (autoRefreshEnabled.value) {
      stopAutoRefresh()
      startAutoRefresh()
    }
  }

  const startAutoRefresh = () => {
    stopAutoRefresh()
    resetCountdown()

    refreshTimer = setInterval(() => {
      // ✅ 自动刷新/实时刷新，静默刷新
      triggerRefresh(true)
      resetCountdown()
    }, refreshInterval.value * 1000)

    countdownTimer = setInterval(() => {
      if (nextRefreshTime.value > 0) {
        nextRefreshTime.value--
      }
    }, 1000)
  }

  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    nextRefreshTime.value = 0
  }

  const resetCountdown = () => {
    nextRefreshTime.value = refreshInterval.value
  }

  watch(
    () => props.selectedCluster,
    (newValue) => {
      localSelectedCluster.value = newValue
    }
  )

  onMounted(() => {
    // ✅ 首次加载，非静默刷新
    triggerRefresh(false)
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  defineExpose({
    refresh: triggerRefresh
  })
</script>

<style scoped lang="scss">
  .monitor-toolbar {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    gap: 16px;
    flex-wrap: wrap;
    position: relative;
    margin-bottom: 16px;

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .section-label {
        font-size: 13px;
        font-weight: 500;
        color: #606266;
        white-space: nowrap;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 6px;

        .label-icon {
          width: 16px;
          height: 16px;
          object-fit: contain;
        }
      }
    }

    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: #dcdfe6;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 16px;

      .auto-refresh-control {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 16px;
        border-left: 1px solid #dcdfe6;

        .control-label {
          font-size: 13px;
          color: #606266;
          white-space: nowrap;
          user-select: none;
        }

        .next-refresh {
          font-size: 12px;
          color: #909399;
          padding: 4px 8px;
          background: #f5f7fa;
          border-radius: 4px;
        }

        .realtime-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-radius: 20px;
          border: 1px solid #fca5a5;
          animation: pulse 2s ease-in-out infinite;

          .realtime-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ef4444;
            animation: blink 1.5s ease-in-out infinite;
          }

          .realtime-text {
            font-size: 12px;
            font-weight: 600;
            color: #991b1b;
          }
        }
      }

      .action-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }

  // ==================== 🔥 修复下拉选项遮挡问题 ====================
  :deep(.el-select-dropdown) {
    .el-select-dropdown__item {
      height: auto !important;
      min-height: 56px !important;
      padding: 8px 12px !important;
      line-height: normal !important;
      overflow: visible !important;
    }

    .el-select-dropdown__item.selected {
      font-weight: normal;
    }

    .el-select-dropdown__item.hover,
    .el-select-dropdown__item:hover {
      background-color: #f5f7fa;
    }
  }

  // 🔥🔥🔥 强制垂直居中 - 使用 :deep 穿透
  :deep(.cluster-option) {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    width: 100%;
    min-height: 40px;

    .cluster-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      overflow: hidden;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 4px;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
    }

    .cluster-info {
      flex: 1;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      gap: 2px;
      min-width: 0;

      .cluster-name {
        font-weight: 500;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.5;
      }

      .cluster-env {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
        line-height: 1.5;
      }
    }

    .el-tag {
      flex-shrink: 0;
      align-self: center !important;
    }
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    .realtime-indicator {
      animation: blink 1.5s ease-in-out infinite;
    }
  }

  .slide-fade-enter-active {
    transition: all 0.3s ease;
  }

  .slide-fade-leave-active {
    transition: all 0.2s ease;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(-10px);
    opacity: 0;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  @media (max-width: 1400px) {
    .monitor-toolbar {
      .toolbar-spacer {
        display: none;
      }

      .toolbar-actions {
        width: 100%;
        justify-content: space-between;
        padding-top: 8px;
        border-top: 1px solid #ebeef5;

        .auto-refresh-control {
          border-left: none;
          padding-left: 0;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .monitor-toolbar {
      padding: 12px 16px;
      gap: 12px;

      .toolbar-section {
        width: 100%;
        flex-wrap: wrap;

        .section-label {
          width: 100%;
          margin-bottom: 4px;
        }
      }

      .toolbar-divider {
        display: none;
      }

      .toolbar-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        .auto-refresh-control {
          border-left: none;
          padding: 0;
          justify-content: space-between;
        }

        .action-buttons {
          width: 100%;

          button {
            flex: 1;
          }
        }
      }
    }
  }
</style>
