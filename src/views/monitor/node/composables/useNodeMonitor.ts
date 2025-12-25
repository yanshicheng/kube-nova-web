import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getNodeCPUApi,
  getNodeMemoryApi,
  getNodeNetworkApi,
  getNodeNetworkInterfaceApi,
  getNodeDiskApi,
  getNodeK8sStatusApi,
  getNodeSystemApi,
  getNodePodsApi,
  type NodeCPUMetrics,
  type NodeMemoryMetrics,
  type NodeNetworkMetrics,
  type NodeNetworkInterfaceMetrics,
  type NodeDiskMetrics,
  type NodeK8sStatus,
  type NodeSystemMetrics,
  type NodePodMetrics
} from '@/api/console/node-monitor'

/** 监控查询参数 */
interface MonitorParams {
  clusterUuid: string
  nodeName: string
  start: string // ISO8601 格式
  end: string // ISO8601 格式
}

/** 网卡查询参数 */
interface NetworkInterfaceParams extends MonitorParams {
  interfaceName: string
}

/** 概览数据 */
interface NodeOverview {
  cpu: {
    usagePercent: number
    load5: number
    cores: number
  }
  memory: {
    usagePercent: number
    usedBytes: number
    totalBytes: number
    swapUsagePercent: number
  }
  disk: {
    usagePercent: number
    usedBytes: number
    totalBytes: number
  }
  network: {
    receiveBytesPerSec: number
    transmitBytesPerSec: number
  }
  pods: {
    total: number
    running: number
    pending: number
    failed: number
  }
  ready: boolean
}

/**
 * Node 监控数据管理 Composable
 */
export function useNodeMonitor() {
  // ==================== 数据状态 ====================
  const overviewData = ref<NodeOverview>()
  const overviewLoading = ref(false)

  const cpuData = ref<NodeCPUMetrics>()
  const cpuLoading = ref(false)

  const memoryData = ref<NodeMemoryMetrics>()
  const memoryLoading = ref(false)

  const networkData = ref<NodeNetworkMetrics | NodeNetworkInterfaceMetrics>()
  const networkLoading = ref(false)

  const diskData = ref<NodeDiskMetrics>()
  const diskLoading = ref(false)

  const k8sStatusData = ref<NodeK8sStatus>()
  const k8sStatusLoading = ref(false)

  const systemData = ref<NodeSystemMetrics>()
  const systemLoading = ref(false)

  const podsData = ref<NodePodMetrics>()
  const podsLoading = ref(false)

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

      // 并行加载基础数据用于生成概览
      const [cpuRes, memoryRes, diskRes, networkRes, podsRes, k8sRes] = await Promise.allSettled([
        getNodeCPUApi(params),
        getNodeMemoryApi(params),
        getNodeDiskApi(params),
        getNodeNetworkApi(params),
        getNodePodsApi(params),
        getNodeK8sStatusApi(params)
      ])

      // 组装概览数据
      const overview: NodeOverview = {
        cpu: {
          usagePercent: 0,
          load5: 0,
          cores: 0
        },
        memory: {
          usagePercent: 0,
          usedBytes: 0,
          totalBytes: 0,
          swapUsagePercent: 0
        },
        disk: {
          usagePercent: 0,
          usedBytes: 0,
          totalBytes: 0
        },
        network: {
          receiveBytesPerSec: 0,
          transmitBytesPerSec: 0
        },
        pods: {
          total: 0,
          running: 0,
          pending: 0,
          failed: 0
        },
        ready: false
      }

      // CPU
      if (cpuRes.status === 'fulfilled' && cpuRes.value.data) {
        overview.cpu = {
          usagePercent: cpuRes.value.data.current.usagePercent,
          load5: cpuRes.value.data.current.load5,
          cores: cpuRes.value.data.current.totalCores
        }
      }

      // 内存
      if (memoryRes.status === 'fulfilled' && memoryRes.value.data) {
        overview.memory = {
          usagePercent: memoryRes.value.data.current.usagePercent,
          usedBytes: memoryRes.value.data.current.usedBytes,
          totalBytes: memoryRes.value.data.current.totalBytes,
          swapUsagePercent: memoryRes.value.data.current.swapUsagePercent
        }
      }

      // 磁盘（取第一个文件系统）
      if (diskRes.status === 'fulfilled' && diskRes.value.data?.filesystems?.[0]) {
        const fs = diskRes.value.data.filesystems[0]
        overview.disk = {
          usagePercent: fs.current.usagePercent,
          usedBytes: fs.current.usedBytes,
          totalBytes: fs.current.totalBytes
        }
      }

      // 网络（汇总所有接口）
      if (networkRes.status === 'fulfilled' && networkRes.value.data?.interfaces) {
        const interfaces = networkRes.value.data.interfaces
        overview.network = {
          receiveBytesPerSec: interfaces.reduce((sum, i) => sum + i.current.receiveBytesPerSec, 0),
          transmitBytesPerSec: interfaces.reduce((sum, i) => sum + i.current.transmitBytesPerSec, 0)
        }
      }

      // Pod
      if (podsRes.status === 'fulfilled' && podsRes.value.data) {
        overview.pods = {
          total: podsRes.value.data.totalPods,
          running: podsRes.value.data.runningPods,
          pending: podsRes.value.data.pendingPods,
          failed: podsRes.value.data.failedPods
        }
      }

      // Node 状态
      if (k8sRes.status === 'fulfilled' && k8sRes.value.data?.conditions) {
        const readyCondition = k8sRes.value.data.conditions.find((c) => c.type === 'Ready')
        overview.ready = readyCondition?.status || false
      }

      overviewData.value = overview
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
      const response = await getNodeCPUApi(params)

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
  const loadMemoryData = async (params: MonitorParams) => {
    try {
      memoryLoading.value = true
      const response = await getNodeMemoryApi(params)

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
  const loadNetworkData = async (params: MonitorParams) => {
    try {
      networkLoading.value = true
      const response = await getNodeNetworkApi(params)

      if (validateData(response.data, '网络数据')) {
        networkData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载网络数据失败')
    } finally {
      networkLoading.value = false
    }
  }

  // ==================== 加载指定网卡数据 ====================
  const loadNetworkInterfaceData = async (params: NetworkInterfaceParams) => {
    try {
      networkLoading.value = true
      const response = await getNodeNetworkInterfaceApi(params)

      if (validateData(response.data, '网卡数据')) {
        networkData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载网卡数据失败')
    } finally {
      networkLoading.value = false
    }
  }

  // ==================== 加载磁盘数据 ====================
  const loadDiskData = async (params: MonitorParams) => {
    try {
      diskLoading.value = true
      const response = await getNodeDiskApi(params)

      if (validateData(response.data, '磁盘数据')) {
        diskData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载磁盘数据失败')
    } finally {
      diskLoading.value = false
    }
  }

  // ==================== 加载 K8s 状态数据 ====================
  const loadK8sStatusData = async (params: MonitorParams) => {
    try {
      k8sStatusLoading.value = true
      const response = await getNodeK8sStatusApi(params)

      if (validateData(response.data, 'K8s状态数据')) {
        k8sStatusData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载K8s状态数据失败')
    } finally {
      k8sStatusLoading.value = false
    }
  }

  // ==================== 加载系统数据 ====================
  const loadSystemData = async (params: MonitorParams) => {
    try {
      systemLoading.value = true
      const response = await getNodeSystemApi(params)

      if (validateData(response.data, '系统数据')) {
        systemData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载系统数据失败')
    } finally {
      systemLoading.value = false
    }
  }

  // ==================== 加载 Pod 列表数据 ====================
  const loadPodsData = async (params: MonitorParams) => {
    try {
      podsLoading.value = true
      const response = await getNodePodsApi(params)

      if (validateData(response.data, 'Pod列表数据')) {
        podsData.value = response.data
      }
    } catch (error: any) {
      handleError(error, '加载Pod列表数据失败')
    } finally {
      podsLoading.value = false
    }
  }

  // ==================== 重置所有数据 ====================
  const resetAllData = () => {
    overviewData.value = undefined
    cpuData.value = undefined
    memoryData.value = undefined
    networkData.value = undefined
    diskData.value = undefined
    k8sStatusData.value = undefined
    systemData.value = undefined
    podsData.value = undefined
  }

  return {
    // 数据状态
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

    // 加载方法
    loadOverviewData,
    loadCPUData,
    loadMemoryData,
    loadNetworkData,
    loadNetworkInterfaceData,
    loadDiskData,
    loadK8sStatusData,
    loadSystemData,
    loadPodsData,
    resetAllData
  }
}
