import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getClusterOverviewApi,
  getClusterResourcesApi,
  getClusterNodesApi,
  getAPIServerMetricsApi,
  getEtcdMetricsApi,
  getSchedulerMetricsApi,
  getControllerManagerMetricsApi,
  getClusterWorkloadsApi,
  getClusterNetworkApi,
  getClusterStorageApi,
  getClusterNamespacesApi,
  type ClusterOverview,
  type ClusterResourceMetrics,
  type ClusterNodeMetrics,
  type ClusterControlPlaneMetrics,
  type ClusterWorkloadMetrics,
  type ClusterNetworkMetrics,
  type ClusterStorageMetrics,
  type ClusterNamespaceMetrics,
  type EtcdMetrics,
  type BaseClusterQueryParams,
  type GetClusterStorageParams
} from '@/api/console/cluster-monitor'

/**
 * 集群监控数据管理 Composable
 */
export function useClusterMonitor() {
  // ==================== 数据状态 ====================
  const overviewData = ref<ClusterOverview>()
  const overviewLoading = ref(false)

  const resourceData = ref<ClusterResourceMetrics>()
  const resourceLoading = ref(false)

  const nodeData = ref<ClusterNodeMetrics>()
  const nodeLoading = ref(false)

  const controlPlaneData = ref<ClusterControlPlaneMetrics>()
  const controlPlaneLoading = ref(false)

  const workloadData = ref<ClusterWorkloadMetrics>()
  const workloadLoading = ref(false)

  const networkData = ref<ClusterNetworkMetrics>()
  const networkLoading = ref(false)

  const storageData = ref<ClusterStorageMetrics>()
  const storageLoading = ref(false)

  const namespaceData = ref<ClusterNamespaceMetrics>()
  const namespaceLoading = ref(false)

  // ✅ 新增：独立的 etcd 数据状态
  const etcdData = ref<EtcdMetrics>()
  const etcdLoading = ref(false)

  // ==================== 工具函数 ====================

  /**
   * 统一的错误处理
   */
  const handleError = (error: any, message: string) => {
    console.error(`${message}:`, error)
    const errorMsg = error?.response?.data?.message || error?.message || message
  }

  /**
   * 数据验证：检查返回数据是否有效
   */
  const validateData = <T>(data: T | undefined, dataName: string): boolean => {
    if (!data) {
      console.warn(`${dataName} 数据为空`)
      return false
    }
    return true
  }

  // ==================== 加载概览数据 ====================
  const loadOverviewData = async (params: BaseClusterQueryParams) => {
    try {
      overviewLoading.value = true
      const response = await getClusterOverviewApi(params)

      if (validateData(response.data, '集群概览')) {
        overviewData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载集群概览数据失败')
    } finally {
      overviewLoading.value = false
    }
  }

  // ==================== 加载资源数据 ====================
  const loadResourceData = async (params: BaseClusterQueryParams) => {
    try {
      resourceLoading.value = true
      const response = await getClusterResourcesApi(params)

      if (validateData(response.data, '集群资源')) {
        resourceData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载集群资源数据失败')
    } finally {
      resourceLoading.value = false
    }
  }

  // ==================== 加载节点数据 ====================
  const loadNodeData = async (params: BaseClusterQueryParams) => {
    try {
      nodeLoading.value = true
      const response = await getClusterNodesApi(params)

      if (validateData(response.data, '节点数据')) {
        nodeData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载节点数据失败')
    } finally {
      nodeLoading.value = false
    }
  }

  // ==================== 加载控制平面数据（不包括 etcd）====================
  const loadControlPlaneData = async (params: BaseClusterQueryParams) => {
    try {
      controlPlaneLoading.value = true

      const [apiServerRes, schedulerRes, controllerRes] = await Promise.allSettled([
        getAPIServerMetricsApi(params),
        getSchedulerMetricsApi(params),
        getControllerManagerMetricsApi(params)
      ])

      const controlPlane: Partial<ClusterControlPlaneMetrics> = {}

      if (
        apiServerRes.status === 'fulfilled' &&
        validateData(apiServerRes.value.data, 'API Server')
      ) {
        controlPlane.apiServer = apiServerRes.value.data
      }

      if (
        schedulerRes.status === 'fulfilled' &&
        validateData(schedulerRes.value.data, 'Scheduler')
      ) {
        controlPlane.scheduler = schedulerRes.value.data
      }

      if (
        controllerRes.status === 'fulfilled' &&
        validateData(controllerRes.value.data, 'Controller Manager')
      ) {
        controlPlane.controllerManager = controllerRes.value.data
      }

      if (Object.keys(controlPlane).length > 0) {
        controlPlaneData.value = controlPlane as ClusterControlPlaneMetrics
      }
    } catch (error: any) {
      handleError(error, '加载控制平面数据失败')
    } finally {
      controlPlaneLoading.value = false
    }
  }

  // ==================== 加载 Etcd 数据（独立）====================
  const loadEtcdData = async (params: BaseClusterQueryParams) => {
    try {
      etcdLoading.value = true
      const response = await getEtcdMetricsApi(params)

      if (validateData(response.data, 'Etcd')) {
        etcdData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载 Etcd 数据失败')
    } finally {
      etcdLoading.value = false
    }
  }

  // ==================== 加载工作负载数据 ====================
  const loadWorkloadData = async (params: BaseClusterQueryParams) => {
    try {
      workloadLoading.value = true
      const response = await getClusterWorkloadsApi(params)

      if (validateData(response.data, '工作负载')) {
        workloadData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载工作负载数据失败')
    } finally {
      workloadLoading.value = false
    }
  }

  // ==================== 加载网络数据 ====================
  const loadNetworkData = async (params: BaseClusterQueryParams) => {
    try {
      networkLoading.value = true
      const response = await getClusterNetworkApi(params)

      if (validateData(response.data, '网络数据')) {
        networkData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载网络数据失败')
    } finally {
      networkLoading.value = false
    }
  }

  // ==================== 加载存储数据 ====================
  const loadStorageData = async (params: GetClusterStorageParams) => {
    try {
      storageLoading.value = true
      const response = await getClusterStorageApi(params)

      if (validateData(response.data, '存储数据')) {
        storageData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载存储数据失败')
    } finally {
      storageLoading.value = false
    }
  }

  // ==================== 加载 Namespace 数据 ====================
  const loadNamespaceData = async (params: BaseClusterQueryParams) => {
    try {
      namespaceLoading.value = true
      const response = await getClusterNamespacesApi(params)

      if (validateData(response.data, 'Namespace 数据')) {
        namespaceData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载 Namespace 数据失败')
    } finally {
      namespaceLoading.value = false
    }
  }

  // ==================== 重置所有数据 ====================
  const resetAllData = () => {
    overviewData.value = undefined
    resourceData.value = undefined
    nodeData.value = undefined
    controlPlaneData.value = undefined
    workloadData.value = undefined
    networkData.value = undefined
    storageData.value = undefined
    namespaceData.value = undefined
    etcdData.value = undefined
  }

  return {
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
    loadEtcdData,
    loadWorkloadData,
    loadNetworkData,
    loadStorageData,
    loadNamespaceData,
    resetAllData
  }
}
