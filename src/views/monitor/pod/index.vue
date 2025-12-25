<template>
  <div class="pod-monitor-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <span class="icon">📊</span>
          Pod 监控
        </h2>
        <div class="breadcrumb">
          <span class="breadcrumb-item">{{ namespace }}</span>
          <span class="separator">/</span>
          <span class="breadcrumb-item current">{{ podName }}</span>
        </div>
      </div>
      <div class="header-right">
        <ElTag v-if="podStatus" :type="getStatusType(podStatus)" size="large">
          {{ podStatus }}
        </ElTag>
        <span v-if="lastUpdateTime" class="update-time">
          <ElIcon><Clock /></ElIcon>
          {{ formatUpdateTime(lastUpdateTime) }}
        </span>
      </div>
    </div>

    <!-- 工具栏 - 包含时间范围、容器选择 -->
    <MonitorToolbar
      :loading="refreshing && !isSilentRefresh"
      :containers="containerList"
      :selected-container="selectedContainer"
      @refresh="handleToolbarRefresh"
      @export="handleExport"
      @container-change="handleContainerChange"
    />

    <!-- 监控概览 -->
    <MonitorOverview :overview-data="overviewData" :loading="overviewLoading && !isSilentRefresh" />

    <!-- 监控指标卡片 -->
    <div class="metrics-container">
      <!-- CPU 监控 -->
      <CPUMonitor
        :cpu-data="cpuData"
        :loading="(cpuLoading && !isSilentRefresh) || containerSwitching"
        :container-name="selectedContainer === 'all' ? undefined : selectedContainer"
      />

      <!-- 内存监控 -->
      <MemoryMonitor
        :memory-data="memoryData"
        :loading="(memoryLoading && !isSilentRefresh) || containerSwitching"
        :container-name="selectedContainer === 'all' ? undefined : selectedContainer"
      />

      <!-- 网络监控 -->
      <NetworkMonitor :network-data="networkData" :loading="networkLoading && !isSilentRefresh" />

      <!-- 磁盘监控 -->
      <DiskMonitor :disk-data="diskData" :loading="diskLoading && !isSilentRefresh" />

      <!-- Pod 状态 -->
      <PodStatus
        :status-data="statusData"
        :restart-data="restartData"
        :loading="statusLoading && !isSilentRefresh"
      />
    </div>

    <!-- 空状态 -->
    <ElEmpty v-if="showEmptyState" description="暂无监控数据，请刷新重试" :image-size="200">
      <ElButton type="primary" @click="handleManualRefresh">
        <ElIcon><RefreshRight /></ElIcon>
        刷新数据
      </ElButton>
    </ElEmpty>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Clock, RefreshRight } from '@element-plus/icons-vue'
  import MonitorToolbar from './modules/MonitorToolbar.vue'
  import MonitorOverview from './modules/monitor-overview.vue'
  import CPUMonitor from './modules/cpu-monitor.vue'
  import MemoryMonitor from './modules/memory-monitor.vue'
  import NetworkMonitor from './modules/network-monitor.vue'
  import DiskMonitor from './modules/disk-monitor.vue'
  import PodStatus from './modules/pod-status.vue'
  import { usePodMonitor, type ContainerInfo } from './composables/usePodMonitor'

  defineOptions({ name: 'PodMonitor' })

  const route = useRoute()

  // ==================== 路由参数 ====================
  const clusterUuid = ref(route.query.clusterUuid as string)
  const namespace = ref(route.query.namespace as string)
  const podName = ref(route.query.podName as string)

  // 参数验证
  if (!clusterUuid.value || !namespace.value || !podName.value) {
    ElMessageBox.alert('缺少必需的参数，请检查 URL 参数', '参数错误', {
      type: 'error',
      callback: () => {
        // 可以跳转回列表页
      }
    })
  }

  // ==================== 状态管理 ====================
  const containerList = ref<ContainerInfo[]>([])
  const selectedContainer = ref('all')
  const refreshing = ref(false)
  const isSilentRefresh = ref(false) // 是否为静默刷新
  const containerSwitching = ref(false) // 容器切换加载状态
  const lastUpdateTime = ref<Date>()
  const hasInitialized = ref(false)

  // 当前时间参数
  const currentStart = ref<string>()
  const currentEnd = ref<string>()

  // ==================== 使用监控数据 ====================
  const {
    overviewData,
    overviewLoading,
    cpuData,
    cpuLoading,
    memoryData,
    memoryLoading,
    networkData,
    networkLoading,
    diskData,
    diskLoading,
    statusData,
    restartData,
    statusLoading,
    loadOverviewData,
    loadCPUData,
    loadMemoryData,
    loadNetworkData,
    loadDiskData,
    loadStatusData,
    extractContainersFromStatus
  } = usePodMonitor()

  // ==================== 计算属性 ====================

  /** Pod 当前状态 */
  const podStatus = computed(() => statusData.value?.current?.phase)

  /** 是否显示空状态 */
  const showEmptyState = computed(() => {
    return (
      hasInitialized.value &&
      !overviewLoading.value &&
      !cpuLoading.value &&
      !memoryLoading.value &&
      !networkLoading.value &&
      !diskLoading.value &&
      !statusLoading.value &&
      !containerSwitching.value &&
      !overviewData.value &&
      !cpuData.value &&
      !memoryData.value
    )
  })

  /** 是否有任何加载中 */
  const isAnyLoading = computed(() => {
    return (
      overviewLoading.value ||
      cpuLoading.value ||
      memoryLoading.value ||
      networkLoading.value ||
      diskLoading.value ||
      statusLoading.value ||
      containerSwitching.value
    )
  })

  // ==================== 工具函数 ====================

  /** 格式化更新时间 */
  const formatUpdateTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /** 获取状态类型 */
  const getStatusType = (phase?: string) => {
    switch (phase) {
      case 'Running':
        return 'success'
      case 'Pending':
        return 'warning'
      case 'Failed':
        return 'danger'
      default:
        return 'info'
    }
  }

  // ==================== 数据加载 ====================

  /**
   * 加载 CPU 和内存数据（支持按容器查看）
   */
  const loadCPUAndMemoryData = async () => {
    if (!currentStart.value || !currentEnd.value) {
      console.warn('⚠️  时间参数未设置，跳过加载 CPU/内存数据')
      return
    }

    // 设置容器切换加载状态
    containerSwitching.value = true

    const params = {
      clusterUuid: clusterUuid.value,
      namespace: namespace.value,
      podName: podName.value,
      start: currentStart.value,
      end: currentEnd.value
    }

    try {
      if (selectedContainer.value === 'all') {
        // 加载 Pod 级别数据
        await Promise.all([loadCPUData(params), loadMemoryData(params)])
      } else {
        // 加载容器级别数据
        await Promise.all([
          loadCPUData({ ...params, containerName: selectedContainer.value }),
          loadMemoryData({ ...params, containerName: selectedContainer.value })
        ])
      }
    } catch (error) {
      console.error('❌ 加载 CPU/内存数据失败:', error)
    } finally {
      // 清除容器切换加载状态
      containerSwitching.value = false
    }
  }

  /**
   * 加载所有监控数据
   */
  const loadAllData = async (start: string, end: string, silent: boolean = false) => {
    const params = {
      clusterUuid: clusterUuid.value,
      namespace: namespace.value,
      podName: podName.value,
      start,
      end
    }

    try {
      // 保存当前时间参数
      currentStart.value = start
      currentEnd.value = end

      // 设置静默刷新标识
      isSilentRefresh.value = silent

      // 1️⃣ 先加载状态数据（用于获取容器列表）
      await loadStatusData(params)

      // 2️⃣ 从状态数据中提取容器列表
      const containers = extractContainersFromStatus()
      if (containers.length > 0) {
        containerList.value = containers
      } else if (!silent) {
        console.warn('⚠️  未找到容器信息')
      }

      // 3️⃣ 并行加载其他数据
      const loadResults = await Promise.allSettled([
        loadOverviewData(params),
        loadCPUAndMemoryData(),
        loadNetworkData(params),
        loadDiskData(params)
      ])

      // 检查加载结果
      const failedLoads = loadResults.filter((r) => r.status === 'rejected')
      if (failedLoads.length > 0 && !silent) {
        console.warn(`⚠️  有 ${failedLoads.length} 个数据源加载失败`)
      }

      // 4️⃣ 更新最后更新时间
      lastUpdateTime.value = new Date()
      hasInitialized.value = true

      if (!silent) {
      }
    } catch (error) {
      console.error('❌ 数据加载失败:', error)
      if (!silent) {
      }
    } finally {
      isSilentRefresh.value = false
    }
  }

  // ==================== 事件处理 ====================

  /**
   * 处理工具栏刷新事件
   */
  const handleToolbarRefresh = async (start: string, end: string, silent: boolean = false) => {
    try {
      if (!silent) {
        refreshing.value = true
      }
      await loadAllData(start, end, silent)
    } catch (error) {
      console.error('❌ 刷新失败:', error)
    } finally {
      if (!silent) {
        refreshing.value = false
      }
    }
  }

  /**
   * 手动刷新
   */
  const handleManualRefresh = async () => {
    if (!currentStart.value || !currentEnd.value) {
      return
    }
    await handleToolbarRefresh(currentStart.value, currentEnd.value, false)
  }

  /**
   * 处理容器切换
   */
  const handleContainerChange = async (container: string) => {
    const previousContainer = selectedContainer.value

    // 更新选中的容器
    selectedContainer.value = container

    // 显示切换提示（静默模式）
    if (container === 'all') {
    } else {
    }

    // 重新加载 CPU 和内存数据
    await loadCPUAndMemoryData()
  }

  /**
   * 导出数据
   */
  const handleExport = () => {
    try {
      const exportData = {
        metadata: {
          exportTime: new Date().toISOString(),
          exportVersion: '1.0.0',
          cluster: clusterUuid.value,
          namespace: namespace.value,
          pod: podName.value,
          container: selectedContainer.value,
          containerType: selectedContainer.value === 'all' ? 'Pod级别' : '容器级别',
          timeRange: {
            start: currentStart.value,
            end: currentEnd.value
          }
        },
        metrics: {
          overview: overviewData.value,
          cpu: cpuData.value,
          memory: memoryData.value,
          network: networkData.value,
          disk: diskData.value,
          status: statusData.value,
          restart: restartData.value
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // 生成更有意义的文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const containerSuffix = selectedContainer.value === 'all' ? 'pod' : selectedContainer.value
      a.download = `pod-monitor_${podName.value}_${containerSuffix}_${timestamp}.json`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      ElMessage.success('数据导出成功')
    } catch (error) {
      console.error('❌ 导出失败:', error)
    }
  }

  // ==================== 监听容器变化 ====================
  watch(
    () => containerList.value,
    (newList) => {
      // 如果当前选中的容器不在列表中，重置为 all
      if (
        selectedContainer.value !== 'all' &&
        !newList.find((c) => c.name === selectedContainer.value)
      ) {
        selectedContainer.value = 'all'
      }
    }
  )

  // ==================== 生命周期 ====================
  onMounted(() => {})

  onUnmounted(() => {})
</script>

<style lang="scss" scoped>
  .pod-monitor-page {
    max-width: 1800px;
    margin: 0 auto;
    min-height: calc(100vh - 100px);
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .header-left {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
        gap: 8px;

        .icon {
          font-size: 28px;
        }
      }

      .breadcrumb {
        font-size: 14px;
        color: #909399;
        display: flex;
        align-items: center;

        .breadcrumb-item {
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s;

          &.current {
            color: #409eff;
            font-weight: 500;
            background: #ecf5ff;
          }
        }

        .separator {
          margin: 0 8px;
          color: #dcdfe6;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .update-time {
        font-size: 13px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #f5f7fa;
        border-radius: 6px;
      }
    }
  }

  .metrics-container {
    display: flex;
    flex-direction: column;
    gap: 16px;

    > * {
      animation: fadeInUp 0.5s ease-out;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 响应式
  @media (max-width: 768px) {
    .pod-monitor-page {
      padding: 12px;
    }

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;

      .header-right {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
</style>
