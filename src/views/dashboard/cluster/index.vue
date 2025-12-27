<template>
  <div class="cluster-monitor-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <span class="icon">🎯</span>
          集群监控
        </h2>
        <div class="breadcrumb">
          <span class="breadcrumb-item current">{{ selectedClusterName || '未选择集群' }}</span>
        </div>
      </div>
      <div class="header-right">
        <ElTag v-if="clusterHealth" :type="getHealthType(clusterHealth)" size="large">
          健康分数: {{ clusterHealth }}
        </ElTag>
        <span v-if="lastUpdateTime" class="update-time">
          <ElIcon><Clock /></ElIcon>
          {{ formatUpdateTime(lastUpdateTime) }}
        </span>
      </div>
    </div>

    <!-- 工具栏 - 包含集群选择、时间范围 -->
    <div class="toolbar-wrapper">
      <MonitorToolbar
        :loading="refreshing && !isSilentRefresh"
        :clusters="clusterList"
        :selected-cluster="selectedCluster"
        @refresh="handleToolbarRefresh"
        @export="handleExport"
        @cluster-change="handleClusterChange"
      />
    </div>

    <!-- Tabs 区域 -->
    <div class="tabs-container">
      <ElTabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Tab 1: 集群资源 -->
        <ElTabPane label="集群资源" name="resources">
          <template #label>
            <span class="tab-label">
              <img src="@/assets/img/monitoring/monitoring.png" class="tab-icon" alt="" />
              集群资源
            </span>
          </template>
          <div class="tab-content">
            <ResourceMonitor
              :resource-data="resourceData"
              :loading="resourceLoading && !isSilentRefresh"
            />
            <NetworkMonitor
              :network-data="networkData"
              :loading="networkLoading && !isSilentRefresh"
            />
            <StorageMonitor
              :storage-data="storageData"
              :loading="storageLoading && !isSilentRefresh"
            />
          </div>
        </ElTabPane>

        <!-- Tab 2: 控制平面 -->
        <ElTabPane label="控制平面" name="control-plane">
          <template #label>
            <span class="tab-label">
              <img src="@/assets/img/monitoring/server.png" class="tab-icon" alt="" />
              控制平面
            </span>
          </template>
          <div class="tab-content">
            <ControlPlaneMonitor
              :control-plane-data="controlPlaneDataForDisplay"
              :loading="controlPlaneLoading && !isSilentRefresh"
            />
          </div>
        </ElTabPane>

        <!-- Tab 3: Etcd -->
        <ElTabPane label="Etcd" name="etcd">
          <template #label>
            <span class="tab-label">
              <img src="@/assets/img/monitoring/disk.png" class="tab-icon" alt="" />
              Etcd
            </span>
          </template>
          <div class="tab-content">
            <EtcdMonitor :etcd-data="etcdData" :loading="etcdLoading && !isSilentRefresh" />
          </div>
        </ElTabPane>

        <!-- Tab 4: 节点 -->
        <ElTabPane label="节点" name="nodes">
          <template #label>
            <span class="tab-label">
              <img src="@/assets/img/monitoring/server.png" class="tab-icon" alt="" />
              节点
            </span>
          </template>
          <div class="tab-content">
            <NodeMonitor :node-data="nodeData" :loading="nodeLoading && !isSilentRefresh" />
          </div>
        </ElTabPane>

        <!-- Tab 5: 工作负载 -->
        <ElTabPane label="工作负载" name="workloads">
          <template #label>
            <span class="tab-label">
              <img src="@/assets/img/monitoring/pod.png" class="tab-icon" alt="" />
              工作负载
            </span>
          </template>
          <div class="tab-content">
            <WorkloadMonitor
              :workload-data="workloadData"
              :loading="workloadLoading && !isSilentRefresh"
            />
          </div>
        </ElTabPane>

        <!-- Tab 6: Pod & 命名空间 -->
        <ElTabPane label="Pod & 命名空间" name="pods">
          <template #label>
            <span class="tab-label">
              <img src="@/assets/img/monitoring/pod.png" class="tab-icon" alt="" />
              Pod & 命名空间
            </span>
          </template>
          <div class="tab-content">
            <ClusterOverview
              :overview-data="overviewData"
              :loading="overviewLoading && !isSilentRefresh"
            />
            <NamespaceMonitor
              :namespace-data="namespaceData"
              :loading="namespaceLoading && !isSilentRefresh"
            />
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <!-- 空状态 -->
    <ElEmpty
      v-if="showEmptyState"
      description="暂无监控数据，请选择集群或刷新重试"
      :image-size="200"
    >
      <ElButton v-if="!selectedCluster" type="primary" @click="handleSelectFirstCluster">
        <ElIcon><Select /></ElIcon>
        选择集群
      </ElButton>
      <ElButton v-else type="primary" @click="handleManualRefresh">
        <ElIcon><RefreshRight /></ElIcon>
        刷新数据
      </ElButton>
    </ElEmpty>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Clock, RefreshRight, Select } from '@element-plus/icons-vue'
  import { searchClusterApi, type Cluster } from '@/api/manager/cluster'
  import MonitorToolbar from './modules/MonitorToolbar.vue'
  import ClusterOverview from './modules/cluster-overview.vue'
  import ResourceMonitor from './modules/resource-monitor.vue'
  import NodeMonitor from './modules/node-monitor.vue'
  import ControlPlaneMonitor from './modules/control-plane-monitor.vue'
  import EtcdMonitor from './modules/etcd-monitor.vue'
  import WorkloadMonitor from './modules/workload-monitor.vue'
  import NetworkMonitor from './modules/network-monitor.vue'
  import StorageMonitor from './modules/storage-monitor.vue'
  import NamespaceMonitor from './modules/namespace-monitor.vue'
  import { useClusterMonitor } from './composables/useClusterMonitor'
  import { getClusterHealthScore } from '@/api/console/cluster-monitor'

  defineOptions({ name: 'ClusterMonitor' })

  // ==================== 状态管理 ====================
  const clusterList = ref<Cluster[]>([])
  const selectedCluster = ref<string>('')
  const selectedClusterName = ref<string>('')
  const refreshing = ref(false)
  const isSilentRefresh = ref(false)
  const lastUpdateTime = ref<Date>()
  const hasInitialized = ref(false)
  const activeTab = ref<string>('resources') // 当前激活的 tab

  // 当前时间参数
  const currentStart = ref<string>()
  const currentEnd = ref<string>()

  // ==================== 使用监控数据 ====================
  const {
    overviewData,
    overviewLoading,
    resourceData,
    resourceLoading,
    nodeData,
    nodeLoading,
    controlPlaneData,
    controlPlaneLoading,
    workloadData,
    workloadLoading,
    networkData,
    networkLoading,
    storageData,
    storageLoading,
    namespaceData,
    namespaceLoading,
    etcdData,
    etcdLoading,
    loadOverviewData,
    loadResourceData,
    loadNodeData,
    loadControlPlaneData,
    loadWorkloadData,
    loadNetworkData,
    loadStorageData,
    loadNamespaceData,
    loadEtcdData
  } = useClusterMonitor()

  // ==================== 计算属性 ====================

  /** 集群健康分数 */
  const clusterHealth = computed(() => {
    if (!overviewData.value) return null
    return Math.round(getClusterHealthScore(overviewData.value))
  })

  /** 控制平面数据（排除 etcd） */
  const controlPlaneDataForDisplay = computed(() => {
    if (!controlPlaneData.value) return undefined
    const { etcd, ...rest } = controlPlaneData.value
    return rest
  })

  /** 是否显示空状态 */
  const showEmptyState = computed(() => {
    return hasInitialized.value && !isAnyDataLoaded.value
  })

  /** 是否有任何数据已加载 */
  const isAnyDataLoaded = computed(() => {
    return !!(
      overviewData.value ||
      resourceData.value ||
      nodeData.value ||
      controlPlaneData.value ||
      workloadData.value ||
      networkData.value ||
      storageData.value ||
      namespaceData.value ||
      etcdData.value
    )
  })

  /** 是否有任何加载中 */
  const isAnyLoading = computed(() => {
    return (
      overviewLoading.value ||
      resourceLoading.value ||
      nodeLoading.value ||
      controlPlaneLoading.value ||
      workloadLoading.value ||
      networkLoading.value ||
      storageLoading.value ||
      namespaceLoading.value ||
      etcdLoading.value
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

  /** 获取健康状态类型 */
  const getHealthType = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'danger'
  }

  // ==================== 集群列表加载 ====================

  /**
   * 加载集群列表
   */
  const loadClusterList = async () => {
    try {
      const response = await searchClusterApi({
        page: 1,
        pageSize: 100
      })

      if (response.items && response.items.length > 0) {
        clusterList.value = response.items

        if (!selectedCluster.value) {
          const firstCluster = response.items[0]
          selectedCluster.value = firstCluster.uuid
          selectedClusterName.value = firstCluster.name
        }
      } else {
        console.warn('⚠️  未找到任何集群')
      }
    } catch (error) {
      console.error('❌ 加载集群列表失败:', error)
    }
  }

  // ==================== 数据加载 ====================

  /**
   * 根据当前激活的 tab 加载对应数据
   * @param start 开始时间
   * @param end 结束时间
   * @param silent 是否静默刷新
   */
  const loadTabData = async (start: string, end: string, silent: boolean = false) => {
    if (!selectedCluster.value) {
      console.warn('⚠️  未选择集群，跳过数据加载')
      return
    }

    const params = {
      clusterUuid: selectedCluster.value,
      start,
      end
    }

    try {
      currentStart.value = start
      currentEnd.value = end
      isSilentRefresh.value = silent

      // 根据当前 tab 加载对应数据
      switch (activeTab.value) {
        case 'resources':
          // 集群资源 Tab
          await Promise.allSettled([
            loadResourceData(params),
            loadNetworkData(params),
            loadStorageData({ clusterUuid: params.clusterUuid })
          ])
          break

        case 'control-plane':
          // 控制平面 Tab（不包括 etcd）
          await loadControlPlaneData(params)
          break

        case 'etcd':
          // Etcd Tab
          await loadEtcdData(params)
          break

        case 'nodes':
          // 节点 Tab
          await loadNodeData(params)
          break

        case 'workloads':
          // 工作负载 Tab
          await loadWorkloadData(params)
          break

        case 'pods':
          // Pod & 命名空间 Tab
          await Promise.allSettled([loadOverviewData(params), loadNamespaceData(params)])
          break
      }

      lastUpdateTime.value = new Date()
      hasInitialized.value = true

      if (!silent) {
      } else {
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
   * 处理 Tab 切换
   */
  const handleTabChange = async (tabName: string | number) => {
    if (currentStart.value && currentEnd.value) {
      // 切换 tab 时重新加载该 tab 的数据（非静默刷新）
      await loadTabData(currentStart.value, currentEnd.value, false)
    }
  }

  /**
   * 处理工具栏刷新事件
   * @param start 开始时间
   * @param end 结束时间
   * @param silent 是否静默刷新
   */
  const handleToolbarRefresh = async (start: string, end: string, silent: boolean = false) => {
    try {
      if (!silent) {
        refreshing.value = true
      }
      await loadTabData(start, end, silent)
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
   * 选择第一个集群
   */
  const handleSelectFirstCluster = () => {
    if (clusterList.value.length > 0) {
      const firstCluster = clusterList.value[0]
      handleClusterChange(firstCluster.uuid)
    }
  }

  /**
   * 处理集群切换
   * @param clusterUuid 集群 UUID
   */
  const handleClusterChange = async (clusterUuid: string) => {
    const previousCluster = selectedCluster.value

    selectedCluster.value = clusterUuid
    const cluster = clusterList.value.find((c) => c.uuid === clusterUuid)
    if (cluster) {
      selectedClusterName.value = cluster.name
    }

    if (currentStart.value && currentEnd.value) {
      await loadTabData(currentStart.value, currentEnd.value, false)
    }
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
          cluster: selectedCluster.value,
          clusterName: selectedClusterName.value,
          activeTab: activeTab.value,
          timeRange: {
            start: currentStart.value,
            end: currentEnd.value
          }
        },
        metrics: {
          overview: overviewData.value,
          resources: resourceData.value,
          nodes: nodeData.value,
          controlPlane: controlPlaneData.value,
          workloads: workloadData.value,
          network: networkData.value,
          storage: storageData.value,
          namespaces: namespaceData.value,
          etcd: etcdData.value
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      a.download = `cluster-monitor_${selectedClusterName.value}_${timestamp}.json`

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
  onMounted(async () => {
    await loadClusterList()

    if (selectedCluster.value) {
      await nextTick()

      const end = new Date()
      const start = new Date(end.getTime() - 30 * 60 * 1000)

      currentStart.value = start.toISOString()
      currentEnd.value = end.toISOString()

      // 只加载第一个 tab（集群资源）的数据
      await loadTabData(currentStart.value, currentEnd.value, false)
    }
  })

  onUnmounted(() => {})
</script>

<style lang="scss" scoped>
  .cluster-monitor-page {
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

  /* 工具栏包装器 - 解决下拉菜单被遮挡问题 */
  .toolbar-wrapper {
    position: relative;
    z-index: 10;
    margin-bottom: 20px;
  }

  .tabs-container {
    position: relative;
    z-index: 1;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    padding: 20px;
    margin-bottom: 20px;

    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }

    :deep(.el-tabs__nav-wrap) {
      padding: 0 10px;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
      font-weight: 500;
      padding: 0 20px;
      height: 48px;
      line-height: 48px;

      &.is-active {
        color: #409eff;
      }
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;

      .tab-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeIn 0.3s ease-out;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .cluster-monitor-page {
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

    .tabs-container {
      padding: 12px;

      :deep(.el-tabs__item) {
        font-size: 13px;
        padding: 0 12px;
        height: 40px;
        line-height: 40px;
      }

      .tab-label {
        .tab-icon {
          width: 16px;
          height: 16px;
        }
      }
    }
  }
</style>
