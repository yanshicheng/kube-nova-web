<template>
  <div class="monitor-toolbar">
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
        <ElOption label="最近 1 天" value="30m" />
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

      <!-- 自定义时间范围选择器 -->
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

    <div class="toolbar-divider"></div>

    <div class="toolbar-section">
      <div class="section-label">
        <ElIcon><Box /></ElIcon>
        监控容器
      </div>
      <ElSelect
        v-model="localSelectedContainer"
        placeholder="选择容器"
        style="width: 200px"
        @change="handleContainerChange"
      >
        <ElOption label="Pod (全部容器)" value="all">
          <span class="container-option">
            <span class="container-icon">📦</span>
            <span class="container-name">Pod</span>
            <ElTag size="small" type="info">全部</ElTag>
          </span>
        </ElOption>
        <ElOption
          v-for="container in containers"
          :key="container.name"
          :label="container.name"
          :value="container.name"
        >
          <span class="container-option">
            <span class="container-icon">🔹</span>
            <span class="container-name">{{ container.name }}</span>
            <ElTag size="small" :type="container.ready ? 'success' : 'warning'">
              {{ container.state }}
            </ElTag>
          </span>
        </ElOption>
      </ElSelect>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-actions">
      <!-- 自动刷新 -->
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
        <!-- 倒计时显示 - 只在非实时监控时显示 -->
        <Transition name="slide-fade">
          <span
            v-if="autoRefreshEnabled && refreshInterval !== 3 && nextRefreshTime > 0"
            class="next-refresh"
          >
            下次: {{ nextRefreshTime }}s
          </span>
        </Transition>
        <!-- 实时监控指示器 -->
        <Transition name="slide-fade">
          <div v-if="autoRefreshEnabled && refreshInterval === 3" class="realtime-badge">
            <span class="realtime-dot"></span>
            <span class="realtime-text">实时</span>
          </div>
        </Transition>
      </div>

      <!-- 操作按钮组 -->
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
  import { RefreshRight, Download, Timer, Box, Calendar } from '@element-plus/icons-vue'
  import type { ContainerInfo } from '../composables/usePodMonitor'

  interface Props {
    loading?: boolean
    containers?: ContainerInfo[]
    selectedContainer?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    containers: () => [],
    selectedContainer: 'all'
  })

  interface Emits {
    (e: 'refresh', start: string, end: string, silent?: boolean): void
    (e: 'export'): void
    (e: 'container-change', container: string): void
  }

  const emit = defineEmits<Emits>()

  // ==================== 状态 ====================
  const selectedTimeRange = ref<string>('24h') // 默认1天
  const customTimeRange = ref<[string, string]>()
  const localSelectedContainer = ref<string>(props.selectedContainer)

  // 自动刷新
  const autoRefreshEnabled = ref<boolean>(false) // 默认关闭
  const refreshInterval = ref<number>(30) // 默认30秒
  const nextRefreshTime = ref<number>(0)
  let refreshTimer: NodeJS.Timeout | null = null
  let countdownTimer: NodeJS.Timeout | null = null

  // ==================== 计算属性 ====================
  const hasContainers = computed(() => props.containers && props.containers.length > 0)

  // ==================== 工具函数 ====================

  /**
   * 计算时间范围
   */
  const getTimeParams = () => {
    // 自定义时间范围
    if (selectedTimeRange.value === 'custom' && customTimeRange.value) {
      return {
        start: customTimeRange.value[0],
        end: customTimeRange.value[1]
      }
    }

    // 预设时间范围
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

    start.setTime(start.getTime() - (ranges[selectedTimeRange.value] || ranges['24h']))

    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  /**
   * 触发刷新
   */
  const triggerRefresh = (silent: boolean = false) => {
    const { start, end } = getTimeParams()
    emit('refresh', start, end, silent)
  }

  // ==================== 事件处理 ====================

  const handleTimeRangeChange = () => {
    if (selectedTimeRange.value !== 'custom') {
      triggerRefresh(false) // 显示loading
    }
  }

  const handleCustomTimeChange = () => {
    if (customTimeRange.value) {
      triggerRefresh(false) // 显示loading
    }
  }

  const handleContainerChange = () => {
    emit('container-change', localSelectedContainer.value)
  }

  const handleManualRefresh = () => {
    triggerRefresh(false) // 手动刷新显示loading
    // 重置倒计时
    if (autoRefreshEnabled.value) {
      resetCountdown()
    }
  }

  const handleExport = () => {
    emit('export')
  }

  // ==================== 自动刷新 ====================

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
      triggerRefresh(true) // 自动刷新时静默更新
      resetCountdown()
    }, refreshInterval.value * 1000)

    // 启动倒计时
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

  // ==================== 监听 ====================

  // 同步外部的 selectedContainer
  watch(
    () => props.selectedContainer,
    (newValue) => {
      localSelectedContainer.value = newValue
    }
  )

  // ==================== 生命周期 ====================
  onMounted(() => {
    // 初始加载数据
    triggerRefresh(false)
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  // 暴露方法给父组件
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

        // 实时监控标识
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

  // 容器选项样式
  .container-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    .container-icon {
      font-size: 16px;
    }

    .container-name {
      flex: 1;
      font-weight: 500;
    }
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    .option-hint {
      font-size: 12px;
      color: #909399;
      margin-left: auto;
    }

    .realtime-indicator {
      animation: blink 1.5s ease-in-out infinite;
    }
  }

  // 动画
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

  // 响应式布局
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
