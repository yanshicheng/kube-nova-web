<template>
  <div class="node-monitor-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <img src="@/assets/img/monitoring/server.png" alt="Node" class="header-icon" />
        <div class="header-info">
          <h2 class="page-title">Node 监控</h2>
          <div class="breadcrumb">
            <span class="breadcrumb-item">{{ clusterName }}</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item current">{{ nodeName }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <ElTag v-if="nodeReady !== null" :type="nodeReady ? 'success' : 'danger'" size="large">
          {{ nodeReady ? 'Ready' : 'NotReady' }}
        </ElTag>
        <span v-if="lastUpdateTime" class="update-time">
          <ElIcon><Clock /></ElIcon>
          {{ formatTimestamp(lastUpdateTime, 'YYYY-MM-DD HH:mm:ss') }}
        </span>
      </div>
    </div>

    <!-- 工具栏 -->
    <MonitorToolbar
      :loading="refreshing && !isSilentRefresh"
      @refresh="handleToolbarRefresh"
      @export="handleExport"
    />

    <!-- 监控概览 -->
    <MonitorOverview :overview-data="overviewData" :loading="overviewLoading && !isSilentRefresh" />

    <!-- 监控指标卡片 -->
    <div class="metrics-container">
      <!-- CPU 监控 -->
      <CPUMonitor :cpu-data="cpuData" :loading="cpuLoading && !isSilentRefresh" />

      <!-- 内存监控 -->
      <MemoryMonitor :memory-data="memoryData" :loading="memoryLoading && !isSilentRefresh" />

      <!-- 网络监控 -->
      <NetworkMonitor
        :network-data="networkData"
        :loading="networkLoading && !isSilentRefresh"
        :interfaces="interfaceList"
        :selected-interface="selectedInterface"
        @interface-change="handleInterfaceChange"
      />

      <!-- 磁盘监控 -->
      <DiskMonitor
        :disk-data="diskData"
        :loading="diskLoading && !isSilentRefresh"
        :filesystems="filesystemList"
        :devices="deviceList"
      />

      <!-- Node 状态 -->
      <NodeStatus :status-data="k8sStatusData" :loading="k8sStatusLoading && !isSilentRefresh" />

      <!-- 系统监控 -->
      <SystemMonitor :system-data="systemData" :loading="systemLoading && !isSilentRefresh" />

      <!-- Node 上的 Pod -->
      <PodsOnNode :pods-data="podsData" :loading="podsLoading && !isSilentRefresh" />
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
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Clock, RefreshRight } from '@element-plus/icons-vue'
  import { formatTimestamp } from '@/utils/format'
  import MonitorToolbar from './modules/MonitorToolbar.vue'
  import MonitorOverview from './modules/monitor-overview.vue'
  import CPUMonitor from './modules/cpu-monitor.vue'
  import MemoryMonitor from './modules/memory-monitor.vue'
  import NetworkMonitor from './modules/network-monitor.vue'
  import DiskMonitor from './modules/disk-monitor.vue'
  import NodeStatus from './modules/node-status.vue'
  import SystemMonitor from './modules/system-monitor.vue'
  import PodsOnNode from './modules/pods-on-node.vue'
  import { useNodeMonitor } from './composables/useNodeMonitor'

  defineOptions({ name: 'NodeMonitor' })

  const route = useRoute()

  // ==================== 路由参数验证 ====================
  const clusterUuid = ref(route.query.clusterUuid as string)
  const clusterId = ref(route.query.clusterId as string)
  const nodeName = ref(route.query.nodeName as string)
  const clusterName = ref((route.query.clusterName as string) || '集群')

  // 严格参数验证
  if (!clusterUuid.value || !clusterId.value || !nodeName.value) {
    ElMessageBox.alert(
      '缺少必需的参数 (clusterUuid, clusterId, nodeName)，无法加载监控数据',
      '参数错误',
      {
        type: 'error',
        confirmButtonText: '返回',
        callback: () => {
          window.history.back()
        }
      }
    )
  }

  // ==================== 状态管理 ====================
  const interfaceList = ref<string[]>([])
  const selectedInterface = ref<string>('')
  const filesystemList = ref<any[]>([])
  const deviceList = ref<any[]>([])
  const refreshing = ref(false)
  const isSilentRefresh = ref(false)
  const lastUpdateTime = ref<number>()
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
    k8sStatusData,
    k8sStatusLoading,
    systemData,
    systemLoading,
    podsData,
    podsLoading,
    loadOverviewData,
    loadCPUData,
    loadMemoryData,
    loadNetworkData,
    loadNetworkInterfaceData,
    loadDiskData,
    loadK8sStatusData,
    loadSystemData,
    loadPodsData
  } = useNodeMonitor()

  // ==================== 计算属性 ====================

  /** Node 是否 Ready */
  const nodeReady = computed(() => {
    if (!k8sStatusData.value?.conditions) return null
    const readyCondition = k8sStatusData.value.conditions.find((c) => c.type === 'Ready')
    return readyCondition?.status || false
  })

  /** 是否显示空状态 */
  const showEmptyState = computed(() => {
    return (
      hasInitialized.value &&
      !overviewLoading.value &&
      !cpuLoading.value &&
      !memoryLoading.value &&
      !networkLoading.value &&
      !diskLoading.value &&
      !k8sStatusLoading.value &&
      !systemLoading.value &&
      !podsLoading.value &&
      !overviewData.value &&
      !cpuData.value &&
      !memoryData.value
    )
  })

  // ==================== 数据加载 ====================

  /**
   * 加载网络数据（根据选择的网卡）
   */
  const loadNetworkDataByInterface = async () => {
    if (!currentStart.value || !currentEnd.value) {
      console.warn('⚠️  时间参数未设置，跳过加载网络数据')
      return
    }

    const params = {
      clusterUuid: clusterUuid.value,
      nodeName: nodeName.value,
      start: currentStart.value,
      end: currentEnd.value
    }

    try {
      if (selectedInterface.value && selectedInterface.value !== 'all') {
        await loadNetworkInterfaceData({
          ...params,
          interfaceName: selectedInterface.value
        })
      } else {
        await loadNetworkData(params)
      }
    } catch (error) {
      console.error('❌ 加载网络数据失败:', error)
      if (!isSilentRefresh.value) {
      }
    }
  }

  /**
   * 加载所有监控数据
   */
  const loadAllData = async (start: string, end: string, silent: boolean = false) => {
    const params = {
      clusterUuid: clusterUuid.value,
      nodeName: nodeName.value,
      start,
      end
    }

    try {
      currentStart.value = start
      currentEnd.value = end
      isSilentRefresh.value = silent

      if (!silent) {
      }

      // 并行加载所有数据
      const loadResults = await Promise.allSettled([
        loadOverviewData(params),
        loadCPUData(params),
        loadMemoryData(params),
        loadNetworkDataByInterface(),
        loadDiskData(params),
        loadK8sStatusData(params),
        loadSystemData(params),
        loadPodsData(params)
      ])

      // 提取网卡列表
      if (networkData.value?.interfaces) {
        interfaceList.value = networkData.value.interfaces.map((i) => i.interfaceName)
        if (!selectedInterface.value && interfaceList.value.length > 0) {
          selectedInterface.value = 'all'
        }
      }

      // 提取文件系统和磁盘设备列表
      if (diskData.value) {
        if (diskData.value.filesystems) {
          filesystemList.value = diskData.value.filesystems
        }
        if (diskData.value.devices) {
          deviceList.value = diskData.value.devices
        }
      }

      const failedLoads = loadResults.filter((r) => r.status === 'rejected')
      if (failedLoads.length > 0 && !silent) {
        console.warn(`⚠️  有 ${failedLoads.length} 个数据源加载失败`)
      }

      // 更新时间为当前 Unix 时间戳（秒）
      lastUpdateTime.value = Math.floor(Date.now() / 1000)
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
      // 只有非静默刷新才显示加载状态
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
   * 处理网卡切换
   */
  const handleInterfaceChange = async (interfaceName: string) => {
    selectedInterface.value = interfaceName
    await loadNetworkDataByInterface()
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
          cluster: {
            uuid: clusterUuid.value,
            id: clusterId.value,
            name: clusterName.value
          },
          node: nodeName.value,
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
          k8sStatus: k8sStatusData.value,
          system: systemData.value,
          pods: podsData.value
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      a.download = `node-monitor_${nodeName.value}_${timestamp}.json`

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
  .node-monitor-page {
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
      display: flex;
      align-items: center;
      gap: 16px;

      .header-icon {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }

      .header-info {
        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 8px 0;
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
            }
          }

          .breadcrumb-separator {
            color: #dcdfe6;
          }
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

  @media (max-width: 768px) {
    .node-monitor-page {
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
