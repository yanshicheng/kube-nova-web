<template>
  <div class="namespace-monitor-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <span class="icon">📦</span>
          Namespace 监控
        </h2>
        <div class="breadcrumb">
          <span class="breadcrumb-item">集群: {{ clusterId }}</span>
          <span class="breadcrumb-divider">/</span>
          <span class="breadcrumb-item current">{{ namespace }}</span>
        </div>
      </div>
      <div class="header-right">
        <ElTag v-if="namespaceStatus" :type="getStatusType(namespaceStatus)" size="large">
          {{ namespaceStatus }}
        </ElTag>
        <div
          v-if="healthScore !== null"
          class="health-score"
          :class="getHealthScoreClass(healthScore)"
        >
          <span class="label">健康分数</span>
          <span class="value">{{ healthScore }}</span>
        </div>
        <span v-if="lastUpdateTime" class="update-time">
          <ElIcon><Clock /></ElIcon>
          {{ formatUpdateTime(lastUpdateTime) }}
        </span>
      </div>
    </div>

    <!-- 工具栏 -->
    <MonitorToolbar
      :loading="refreshing && !isSilentRefresh"
      @refresh="handleToolbarRefresh"
      @export="handleExport"
    />

    <!-- Tabs 布局 -->
    <div class="monitor-tabs-container">
      <ElTabs v-model="activeTab">
        <!-- 资源监控 -->
        <ElTabPane name="resource">
          <template #label>
            <span class="tab-label">
              <ElIcon><Monitor /></ElIcon>
              <span>资源监控</span>
            </span>
          </template>
          <div v-loading="tabLoading" class="tab-content">
            <!-- 监控概览 -->
            <MonitorOverview
              :overview-data="metricsData"
              :loading="!isSilentRefresh && metricsLoading"
            />

            <div class="metrics-container">
              <!-- CPU 使用 -->
              <ResourceUsageMonitor
                resource-type="cpu"
                :resource-data="cpuData"
                :loading="!isSilentRefresh && cpuLoading"
              />

              <!-- 内存使用 -->
              <ResourceUsageMonitor
                resource-type="memory"
                :resource-data="memoryData"
                :loading="!isSilentRefresh && memoryLoading"
              />

              <!-- 网络使用 -->
              <NetworkMonitor
                :network-data="networkData"
                :loading="!isSilentRefresh && networkLoading"
              />
            </div>
          </div>
        </ElTabPane>

        <!-- 配额监控 -->
        <ElTabPane name="quota">
          <template #label>
            <span class="tab-label">
              <ElIcon><DataAnalysis /></ElIcon>
              <span>配额监控</span>
            </span>
          </template>
          <div v-loading="tabLoading" class="tab-content">
            <div class="metrics-container">
              <!-- 资源配额 -->
              <ResourceQuotaMonitor
                :quota-data="quotaData"
                :loading="!isSilentRefresh && quotaLoading"
              />

              <!-- 存储统计 -->
              <StorageMonitor
                :storage-data="storageData"
                :loading="!isSilentRefresh && storageLoading"
              />
            </div>
          </div>
        </ElTabPane>

        <!-- 指标监控 -->
        <ElTabPane name="metrics">
          <template #label>
            <span class="tab-label">
              <ElIcon><TrendCharts /></ElIcon>
              <span>指标监控</span>
            </span>
          </template>
          <div v-loading="tabLoading" class="tab-content">
            <div class="metrics-container">
              <!-- Pod 指标 -->
              <PodMetrics :pod-data="podData" :loading="!isSilentRefresh && podLoading" />

              <!-- 工作负载统计 -->
              <WorkloadMetrics
                :workload-data="workloadData"
                :loading="!isSilentRefresh && workloadLoading"
              />
            </div>
          </div>
        </ElTabPane>

        <!-- Pod资源Top榜 -->
        <ElTabPane name="top">
          <template #label>
            <span class="tab-label">
              <ElIcon><Trophy /></ElIcon>
              <span>Pod资源Top榜</span>
            </span>
          </template>
          <div v-loading="tabLoading" class="tab-content">
            <div class="metrics-container">
              <!-- Top Pods -->
              <TopPodsMonitor
                :topCPUPods="topCPUPods"
                :topMemoryPods="topMemoryPods"
                :topNetworkPods="topNetworkPods"
                :loading="!isSilentRefresh && topPodsLoading"
              />
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
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
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Clock,
    RefreshRight,
    Monitor,
    DataAnalysis,
    TrendCharts,
    Trophy
  } from '@element-plus/icons-vue'
  import MonitorToolbar from './modules/MonitorToolbar.vue'
  import MonitorOverview from './modules/MonitorOverview.vue'
  import ResourceQuotaMonitor from './modules/ResourceQuotaMonitor.vue'
  import ResourceUsageMonitor from './modules/ResourceUsageMonitor.vue'
  import NetworkMonitor from './modules/NetworkMonitor.vue'
  import StorageMonitor from './modules/StorageMonitor.vue'
  import PodMetrics from './modules/PodMetrics.vue'
  import WorkloadMetrics from './modules/WorkloadMetrics.vue'
  import TopPodsMonitor from './modules/TopPodsMonitor.vue'
  import { useNamespaceMonitor } from './composables/useNamespaceMonitor'

  defineOptions({ name: 'NamespaceMonitor' })

  const route = useRoute()
  const router = useRouter()

  // ==================== 路由参数验证 ====================
  const clusterUuid = ref(route.query.clusterUuid as string)
  const namespace = ref(route.query.namespace as string)
  const clusterId = ref(route.query.clusterId as string)

  // 验证必需参数
  if (!clusterUuid.value || !namespace.value || !clusterId.value) {
    ElMessageBox.alert(
      '缺少必需的参数（clusterUuid, namespace, clusterId），页面无法正常显示',
      '参数错误',
      {
        type: 'error',
        confirmButtonText: '返回',
        callback: () => {
          router.back()
        }
      }
    )
  }

  // ==================== 状态管理 ====================
  const activeTab = ref<'resource' | 'quota' | 'metrics' | 'top'>('resource')
  const refreshing = ref(false)
  const isSilentRefresh = ref(false)
  const tabLoading = ref(false) // Tab 切换的 loading 状态
  const lastUpdateTime = ref<Date>()
  const hasInitialized = ref(false)

  // 当前时间参数
  const currentStart = ref<string>()
  const currentEnd = ref<string>()

  // ==================== 使用监控数据 ====================
  const {
    metricsData,
    metricsLoading,
    quotaData,
    quotaLoading,
    cpuData,
    cpuLoading,
    memoryData,
    memoryLoading,
    networkData,
    networkLoading,
    storageData,
    storageLoading,
    podData,
    podLoading,
    workloadData,
    workloadLoading,
    topCPUPods,
    topMemoryPods,
    topNetworkPods,
    topPodsLoading,
    loadMetricsData,
    loadQuotaData,
    loadCPUData,
    loadMemoryData,
    loadNetworkData,
    loadStorageData,
    loadPodData,
    loadWorkloadData,
    loadTopPodsData
  } = useNamespaceMonitor()

  // ==================== 计算属性 ====================

  /** Namespace 状态 */
  const namespaceStatus = computed(() => {
    return 'Active'
  })

  /** 健康分数 - 简单计算 */
  const healthScore = computed(() => {
    if (!metricsData.value) return null

    // 简单的健康分数计算逻辑
    let score = 100
    const cpuPercent = metricsData.value.resources?.cpu?.current?.usagePercent || 0
    const memoryPercent = metricsData.value.resources?.memory?.current?.usagePercent || 0
    const podsFailed = metricsData.value.workloads?.pods?.failed || 0

    // CPU 使用率影响
    if (cpuPercent > 90) score -= 30
    else if (cpuPercent > 70) score -= 15
    else if (cpuPercent > 50) score -= 5

    // 内存使用率影响
    if (memoryPercent > 90) score -= 30
    else if (memoryPercent > 70) score -= 15
    else if (memoryPercent > 50) score -= 5

    // 失败的 Pod 影响
    score -= podsFailed * 10

    return Math.max(0, Math.min(100, score))
  })

  /** 是否显示空状态 */
  const showEmptyState = computed(() => {
    return (
      hasInitialized.value &&
      !metricsLoading.value &&
      !quotaLoading.value &&
      !cpuLoading.value &&
      !memoryLoading.value &&
      !metricsData.value
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

  /** 获取健康分数样式类 */
  const getHealthScoreClass = (score: number) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'warning'
    return 'critical'
  }

  /** 获取状态类型 */
  const getStatusType = (status: string) => {
    return status === 'Active' ? 'success' : 'danger'
  }

  // ==================== 数据加载 ====================

  /**
   * 根据当前 tab 加载对应的数据（每次切换都重新加载）
   */
  const loadCurrentTabData = async (
    tab: 'resource' | 'quota' | 'metrics' | 'top',
    start: string,
    end: string,
    silent: boolean = false
  ) => {
    const baseParams = {
      clusterUuid: clusterUuid.value,
      namespace: namespace.value
    }

    const timeParams = {
      ...baseParams,
      start,
      end
    }

    try {
      currentStart.value = start
      currentEnd.value = end
      isSilentRefresh.value = silent

      if (!silent) {
        tabLoading.value = true // 显示 tab 的 loading
      }

      // 根据传入的 tab 参数加载对应数据
      let loadPromises: Promise<any>[] = []

      switch (tab) {
        case 'resource':
          // 资源监控：概览 + CPU + 内存 + 网络
          loadPromises = [
            loadMetricsData(timeParams),
            loadCPUData(timeParams),
            loadMemoryData(timeParams),
            loadNetworkData(timeParams)
          ]
          break

        case 'quota':
          // 配额监控：配额 + 存储
          loadPromises = [loadQuotaData(baseParams), loadStorageData(baseParams)]
          break

        case 'metrics':
          // 指标监控：Pod + 工作负载
          loadPromises = [loadPodData(timeParams), loadWorkloadData(timeParams)]
          break

        case 'top':
          // Top榜
          loadPromises = [loadTopPodsData({ ...timeParams, limit: 10 })]
          break
      }

      const loadResults = await Promise.allSettled(loadPromises)

      const failedLoads = loadResults.filter((r) => r.status === 'rejected')
      if (failedLoads.length > 0 && !silent) {
        console.warn(`⚠️  有 ${failedLoads.length} 个数据源加载失败`, failedLoads)
      }

      lastUpdateTime.value = new Date()
      hasInitialized.value = true

      if (!silent) {
      }
    } catch (error) {
      console.error('❌ 数据加载失败:', error)
      if (!silent) {
      }
    } finally {
      if (!silent) {
        tabLoading.value = false // 隐藏 loading
      }
      isSilentRefresh.value = false
    }
  }

  // ==================== 监听 Tab 切换 ====================

  /**
   * 监听 activeTab 变化，自动重新加载数据
   * 关键：使用 watch 而不是 @tab-click，确保 activeTab 已更新
   */
  watch(activeTab, async (newTab, oldTab) => {
    // 如果 tab 没变化，跳过（但不跳过初始化）
    if (newTab === oldTab) {
      return
    }

    // 如果没有时间参数，跳过（等待工具栏设置）
    if (!currentStart.value || !currentEnd.value) {
      console.warn('⚠️  时间参数未设置，跳过数据加载')
      return
    }

    // 加载新 tab 的数据
    await loadCurrentTabData(newTab, currentStart.value, currentEnd.value, false)
  })

  // ==================== 事件处理 ====================

  /**
   * 处理工具栏刷新事件
   */
  const handleToolbarRefresh = async (start: string, end: string, silent: boolean = false) => {
    try {
      if (silent) {
      } else {
        refreshing.value = true
      }
      await loadCurrentTabData(activeTab.value, start, end, silent)
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
   * 导出数据
   */
  const handleExport = () => {
    try {
      const exportData = {
        metadata: {
          exportTime: new Date().toISOString(),
          exportVersion: '1.0.0',
          clusterId: clusterId.value,
          clusterUuid: clusterUuid.value,
          namespace: namespace.value,
          healthScore: healthScore.value,
          activeTab: activeTab.value,
          timeRange: {
            start: currentStart.value,
            end: currentEnd.value
          }
        },
        metrics: {
          overview: metricsData.value,
          quota: quotaData.value,
          cpu: cpuData.value,
          memory: memoryData.value,
          network: networkData.value,
          storage: storageData.value,
          pods: podData.value,
          workloads: workloadData.value,
          topPods: {
            cpu: topCPUPods.value,
            memory: topMemoryPods.value,
            network: topNetworkPods.value
          }
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      a.download = `namespace-monitor_${namespace.value}_${timestamp}.json`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      ElMessage.success('数据导出成功')
    } catch (error) {
      console.error('❌ 导出失败:', error)
    }
  }

  // ==================== 生命周期 ====================
  onMounted(() => {})

  onUnmounted(() => {})
</script>

<style lang="scss" scoped>
  .namespace-monitor-page {
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
        gap: 8px;

        .breadcrumb-item {
          &.current {
            color: #409eff;
            font-weight: 500;
            padding: 4px 8px;
            background: #ecf5ff;
            border-radius: 4px;
          }
        }

        .breadcrumb-divider {
          color: #dcdfe6;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .health-score {
        padding: 8px 16px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;

        .label {
          font-size: 12px;
          opacity: 0.8;
        }

        .value {
          font-size: 24px;
          font-weight: 700;
          margin-top: 4px;
        }

        &.excellent {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
        }

        &.good {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
        }

        &.warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
        }

        &.critical {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #991b1b;
        }
      }

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

  .monitor-tabs-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    margin-bottom: 16px;

    :deep(.el-tabs) {
      .el-tabs__header {
        margin: 0;
        padding: 16px 20px 0;
        background: #fafbfc;
        border-bottom: 2px solid #e4e7ed;

        .el-tabs__nav-wrap {
          &::after {
            display: none;
          }
        }

        .el-tabs__item {
          height: 48px;
          font-size: 15px;
          font-weight: 500;
          color: #606266;
          padding: 0 24px;
          margin-bottom: 0;
          display: flex;
          align-items: center;

          &:hover {
            color: #409eff;
          }

          &.is-active {
            color: #409eff;
            font-weight: 600;
          }
        }

        .el-tabs__active-bar {
          height: 3px;
          background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
          bottom: 0;
        }
      }

      .el-tabs__content {
        padding: 0;
      }
    }

    .tab-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 100%;

      .el-icon {
        font-size: 16px;
      }

      span {
        line-height: 1;
      }
    }
  }

  .tab-content {
    padding: 20px;
    min-height: 400px;
    animation: fadeIn 0.3s ease-in;
  }

  .metrics-container {
    display: flex;
    flex-direction: column;
    gap: 16px;

    > * {
      animation: fadeInUp 0.5s ease-out;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
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

  @media (max-width: 768px) {
    .namespace-monitor-page {
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

    .monitor-tabs-container {
      :deep(.el-tabs) {
        .el-tabs__header {
          padding: 12px 12px 0;

          .el-tabs__item {
            padding: 0 16px;
            font-size: 14px;
          }
        }
      }
    }

    .tab-content {
      padding: 12px;
    }
  }
</style>
