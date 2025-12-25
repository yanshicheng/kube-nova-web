import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getPodOverviewApi,
  getCPUUsageApi,
  getCPUUsageByContainerApi,
  getMemoryUsageApi,
  getMemoryUsageByContainerApi,
  getNetworkIOApi,
  getDiskIOApi,
  getPodStatusApi,
  getRestartCountApi,
  type PodOverview,
  type PodCPUMetrics,
  type ContainerCPUMetrics,
  type PodMemoryMetrics,
  type ContainerMemoryMetrics,
  type NetworkMetrics,
  type DiskMetrics,
  type PodStatusMetrics,
  type RestartMetrics,
  type ContainerState
} from '@/api/console/pod-monitor'

/** 监控查询参数 */
interface MonitorParams {
  clusterUuid: string
  namespace: string
  podName: string
  start: string
  end: string
  containerName?: string
}

/** 容器信息（简化版） */
export interface ContainerInfo {
  name: string
  ready: boolean
  state: string
  restartCount: number
  reason?: string
}

/**
 * Pod 监控数据管理 Composable
 */
export function usePodMonitor() {
  // ==================== 数据状态 ====================
  const overviewData = ref<PodOverview>()
  const overviewLoading = ref(false)

  const cpuData = ref<PodCPUMetrics | ContainerCPUMetrics>()
  const cpuLoading = ref(false)

  const memoryData = ref<PodMemoryMetrics | ContainerMemoryMetrics>()
  const memoryLoading = ref(false)

  const networkData = ref<NetworkMetrics>()
  const networkLoading = ref(false)

  const diskData = ref<DiskMetrics>()
  const diskLoading = ref(false)

  const statusData = ref<PodStatusMetrics>()
  const restartData = ref<RestartMetrics>()
  const statusLoading = ref(false)

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
  const loadOverviewData = async (params: MonitorParams) => {
    try {
      overviewLoading.value = true
      const response = await getPodOverviewApi({
        clusterUuid: params.clusterUuid,
        namespace: params.namespace,
        podName: params.podName,
        start: params.start,
        end: params.end
      })

      if (validateData(response.data, 'Pod概览')) {
        overviewData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载概览数据失败')
    } finally {
      overviewLoading.value = false
    }
  }

  // ==================== 加载 CPU 数据 ====================
  const loadCPUData = async (params: MonitorParams) => {
    try {
      cpuLoading.value = true

      if (params.containerName) {
        const response = await getCPUUsageByContainerApi({
          clusterUuid: params.clusterUuid,
          namespace: params.namespace,
          podName: params.podName,
          containerName: params.containerName,
          start: params.start,
          end: params.end
        })

        if (validateData(response.data, 'CPU容器数据')) {
          cpuData.value = response.data
        }
      } else {
        const response = await getCPUUsageApi({
          clusterUuid: params.clusterUuid,
          namespace: params.namespace,
          podName: params.podName,
          start: params.start,
          end: params.end
        })

        if (validateData(response.data, 'CPU数据')) {
          cpuData.value = response.data
        }
      }
    } catch (error: any) {
      handleError(error, '加载CPU数据失败')
    } finally {
      cpuLoading.value = false
    }
  }

  // ==================== 加载内存数据 ====================
  const loadMemoryData = async (params: MonitorParams) => {
    try {
      memoryLoading.value = true

      if (params.containerName) {
        const response = await getMemoryUsageByContainerApi({
          clusterUuid: params.clusterUuid,
          namespace: params.namespace,
          podName: params.podName,
          containerName: params.containerName,
          start: params.start,
          end: params.end
        })

        if (validateData(response.data, '内存容器数据')) {
          memoryData.value = response.data
        }
      } else {
        const response = await getMemoryUsageApi({
          clusterUuid: params.clusterUuid,
          namespace: params.namespace,
          podName: params.podName,
          start: params.start,
          end: params.end
        })

        if (validateData(response.data, '内存数据')) {
          memoryData.value = response.data
        }
      }
    } catch (error: any) {
      handleError(error, '加载内存数据失败')
    } finally {
      memoryLoading.value = false
    }
  }

  // ==================== 加载网络数据 ====================
  const loadNetworkData = async (params: MonitorParams) => {
    try {
      networkLoading.value = true
      const response = await getNetworkIOApi({
        clusterUuid: params.clusterUuid,
        namespace: params.namespace,
        podName: params.podName,
        start: params.start,
        end: params.end
      })

      if (validateData(response.data, '网络数据')) {
        networkData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载网络数据失败')
    } finally {
      networkLoading.value = false
    }
  }

  // ==================== 加载磁盘数据 ====================
  const loadDiskData = async (params: MonitorParams) => {
    try {
      diskLoading.value = true
      const response = await getDiskIOApi({
        clusterUuid: params.clusterUuid,
        namespace: params.namespace,
        podName: params.podName,
        start: params.start,
        end: params.end
      })

      if (validateData(response.data, '磁盘数据')) {
        diskData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载磁盘数据失败')
    } finally {
      diskLoading.value = false
    }
  }

  // ==================== 加载状态数据 ====================
  const loadStatusData = async (params: MonitorParams) => {
    try {
      statusLoading.value = true

      const [statusResponse, restartResponse] = await Promise.allSettled([
        getPodStatusApi({
          clusterUuid: params.clusterUuid,
          namespace: params.namespace,
          podName: params.podName,
          start: params.start,
          end: params.end
        }),
        getRestartCountApi({
          clusterUuid: params.clusterUuid,
          namespace: params.namespace,
          podName: params.podName,
          start: params.start,
          end: params.end
        })
      ])

      if (
        statusResponse.status === 'fulfilled' &&
        validateData(statusResponse.value.data, 'Pod状态')
      ) {
        statusData.value = statusResponse.value.data
      } else if (statusResponse.status === 'rejected') {
        handleError(statusResponse.reason, '加载Pod状态失败')
      }

      if (
        restartResponse.status === 'fulfilled' &&
        validateData(restartResponse.value.data, '重启数据')
      ) {
        restartData.value = restartResponse.value.data
      } else if (restartResponse.status === 'rejected') {
        handleError(restartResponse.reason, '加载重启数据失败')
      }
    } catch (error: any) {
      handleError(error, '加载状态数据失败')
    } finally {
      statusLoading.value = false
    }
  }

  /**
   * 从状态数据中提取容器列表
   */
  const extractContainersFromStatus = (): ContainerInfo[] => {
    if (!statusData.value?.current?.containerStates) {
      return []
    }

    return statusData.value.current.containerStates.map((container: ContainerState) => ({
      name: container.containerName,
      ready: container.ready,
      state: container.state,
      restartCount: container.restartCount,
      reason: container.reason
    }))
  }

  // ==================== 重置所有数据 ====================
  const resetAllData = () => {
    overviewData.value = undefined
    cpuData.value = undefined
    memoryData.value = undefined
    networkData.value = undefined
    diskData.value = undefined
    statusData.value = undefined
    restartData.value = undefined
  }

  return {
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
    extractContainersFromStatus,
    resetAllData
  }
}