import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getNamespaceMetricsApi,
  getNamespaceQuotaApi,
  getNamespaceCPUApi,
  getNamespaceMemoryApi,
  getNamespaceNetworkApi,
  getNamespaceStorageApi,
  getNamespacePodsApi,
  getNamespaceWorkloadsApi,
  getNamespaceTopPodsByCPUApi,
  getNamespaceTopPodsByMemoryApi,
  getNamespaceTopPodsByNetworkApi,
  type NamespaceMetrics,
  type NamespaceQuotaMetrics,
  type NamespaceCPUMetrics,
  type NamespaceMemoryMetrics,
  type NamespaceNetworkMetrics,
  type NamespaceStorageMetrics,
  type NamespacePodStatistics,
  type NamespaceWorkloadMetrics,
  type ResourceRanking
} from '@/api/console/namespace-monitor'

/** 基础查询参数 */
interface BaseQueryParams {
  clusterUuid: string
  namespace: string
}

/** 时间范围查询参数 */
interface TimeRangeParams extends BaseQueryParams {
  start: string
  end: string
}

/** Top Pods 查询参数 */
interface TopPodsParams extends TimeRangeParams {
  limit: number
}

/**
 * Namespace 监控数据管理 Composable
 */
export function useNamespaceMonitor() {
  // ==================== 数据状态 ====================
  const metricsData = ref<NamespaceMetrics>()
  const metricsLoading = ref(false)

  const quotaData = ref<NamespaceQuotaMetrics>()
  const quotaLoading = ref(false)

  const cpuData = ref<NamespaceCPUMetrics>()
  const cpuLoading = ref(false)

  const memoryData = ref<NamespaceMemoryMetrics>()
  const memoryLoading = ref(false)

  const networkData = ref<NamespaceNetworkMetrics>()
  const networkLoading = ref(false)

  const storageData = ref<NamespaceStorageMetrics>()
  const storageLoading = ref(false)

  const podData = ref<NamespacePodStatistics>()
  const podLoading = ref(false)

  const workloadData = ref<NamespaceWorkloadMetrics>()
  const workloadLoading = ref(false)

  const topCPUPods = ref<ResourceRanking[]>([])
  const topMemoryPods = ref<ResourceRanking[]>([])
  const topNetworkPods = ref<ResourceRanking[]>([])
  const topPodsLoading = ref(false)

  // ==================== 工具函数 ====================

  /**
   * 统一的错误处理
   */
  const handleError = (error: any, message: string, silent: boolean = false) => {
    console.error(`${message}:`, error)
    if (!silent) {
      const errorMsg = error?.response?.data?.message || error?.message || message
    }
  }

  /**
   * 数据验证
   */
  const validateData = <T>(data: T | undefined, dataName: string): boolean => {
    if (!data) {
      console.warn(`${dataName} 数据为空`)
      return false
    }
    return true
  }

  // ==================== 加载综合指标 ====================
  const loadMetricsData = async (params: TimeRangeParams) => {
    try {
      metricsLoading.value = true
      const response = await getNamespaceMetricsApi(params)

      if (validateData(response.data, 'Namespace综合指标')) {
        metricsData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载综合指标失败')
    } finally {
      metricsLoading.value = false
    }
  }

  // ==================== 加载资源配额 ====================
  const loadQuotaData = async (params: BaseQueryParams) => {
    try {
      quotaLoading.value = true
      const response = await getNamespaceQuotaApi(params)

      if (validateData(response.data, '资源配额')) {
        quotaData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载资源配额失败')
    } finally {
      quotaLoading.value = false
    }
  }

  // ==================== 加载 CPU 数据 ====================
  const loadCPUData = async (params: TimeRangeParams) => {
    try {
      cpuLoading.value = true
      const response = await getNamespaceCPUApi(params)

      if (validateData(response.data, 'CPU数据')) {
        cpuData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载CPU数据失败')
    } finally {
      cpuLoading.value = false
    }
  }

  // ==================== 加载内存数据 ====================
  const loadMemoryData = async (params: TimeRangeParams) => {
    try {
      memoryLoading.value = true
      const response = await getNamespaceMemoryApi(params)

      if (validateData(response.data, '内存数据')) {
        memoryData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载内存数据失败')
    } finally {
      memoryLoading.value = false
    }
  }

  // ==================== 加载网络数据 ====================
  const loadNetworkData = async (params: TimeRangeParams) => {
    try {
      networkLoading.value = true
      const response = await getNamespaceNetworkApi(params)

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
  const loadStorageData = async (params: BaseQueryParams) => {
    try {
      storageLoading.value = true
      const response = await getNamespaceStorageApi(params)

      if (validateData(response.data, '存储数据')) {
        storageData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载存储数据失败')
    } finally {
      storageLoading.value = false
    }
  }

  // ==================== 加载 Pod 数据 ====================
  const loadPodData = async (params: TimeRangeParams) => {
    try {
      podLoading.value = true
      const response = await getNamespacePodsApi(params)

      if (validateData(response.data, 'Pod数据')) {
        podData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载Pod数据失败')
    } finally {
      podLoading.value = false
    }
  }

  // ==================== 加载工作负载数据 ====================
  const loadWorkloadData = async (params: TimeRangeParams) => {
    try {
      workloadLoading.value = true
      const response = await getNamespaceWorkloadsApi(params)

      if (validateData(response.data, '工作负载数据')) {
        workloadData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载工作负载数据失败')
    } finally {
      workloadLoading.value = false
    }
  }

  // ==================== 加载 Top Pods ====================
  const loadTopPodsData = async (params: TopPodsParams) => {
    try {
      topPodsLoading.value = true

      const [cpuResponse, memoryResponse, networkResponse] = await Promise.allSettled([
        getNamespaceTopPodsByCPUApi(params),
        getNamespaceTopPodsByMemoryApi(params),
        getNamespaceTopPodsByNetworkApi(params)
      ])

      if (
        cpuResponse.status === 'fulfilled' &&
        validateData(cpuResponse.value.data, 'Top CPU Pods')
      ) {
        topCPUPods.value = cpuResponse.value.data
      }

      if (
        memoryResponse.status === 'fulfilled' &&
        validateData(memoryResponse.value.data, 'Top Memory Pods')
      ) {
        topMemoryPods.value = memoryResponse.value.data
      }

      if (
        networkResponse.status === 'fulfilled' &&
        validateData(networkResponse.value.data, 'Top Network Pods')
      ) {
        topNetworkPods.value = networkResponse.value.data
      }
    } catch (error: any) {
      handleError(error, '加载Top Pods失败')
    } finally {
      topPodsLoading.value = false
    }
  }

  // ==================== 重置所有数据 ====================
  const resetAllData = () => {
    metricsData.value = undefined
    quotaData.value = undefined
    cpuData.value = undefined
    memoryData.value = undefined
    networkData.value = undefined
    storageData.value = undefined
    podData.value = undefined
    workloadData.value = undefined
    topCPUPods.value = []
    topMemoryPods.value = []
    topNetworkPods.value = []
  }

  return {
    // 数据状态
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

    // 加载方法
    loadMetricsData,
    loadQuotaData,
    loadCPUData,
    loadMemoryData,
    loadNetworkData,
    loadStorageData,
    loadPodData,
    loadWorkloadData,
    loadTopPodsData,
    resetAllData
  }
}
