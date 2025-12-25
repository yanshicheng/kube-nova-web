import request from '@/utils/http'

// 定义基础路径
const NODE_MONITOR_BASE_PATH = '/console/v1/node-monitor'

// ==================== Node CPU 指标 ====================

/** Node CPU 快照 */
export interface NodeCPUSnapshot {
  timestamp: number
  totalCores: number
  usagePercent: number
  userPercent: number
  systemPercent: number
  iowaitPercent: number
  stealPercent: number
  irqPercent: number
  softirqPercent: number
  load1: number
  load5: number
  load15: number
  contextSwitchRate: number
}

/** Node CPU 数据点 */
export interface NodeCPUDataPoint {
  timestamp: number
  usagePercent: number
  load5: number
}

/** Node CPU 统计 */
export interface NodeCPUSummary {
  avgUsagePercent: number
  maxUsagePercent: number
  minUsagePercent: number
  avgLoad5: number
  maxLoad5: number
}

/** Node CPU 指标 */
export interface NodeCPUMetrics {
  current: NodeCPUSnapshot
  trend: NodeCPUDataPoint[]
  summary: NodeCPUSummary
}

// ==================== Node 内存指标 ====================

/** Node 内存快照 */
export interface NodeMemorySnapshot {
  timestamp: number
  totalBytes: number
  usedBytes: number
  availableBytes: number
  freeBytes: number
  buffersBytes: number
  cachedBytes: number
  activeBytes: number
  inactiveBytes: number
  usagePercent: number
  swapTotalBytes: number
  swapUsedBytes: number
  swapFreeBytes: number
  swapUsagePercent: number
  swapInRate: number
  swapOutRate: number
}

/** Node 内存数据点 */
export interface NodeMemoryDataPoint {
  timestamp: number
  usedBytes: number
  usagePercent: number
  availableBytes: number
}

/** Node 内存统计 */
export interface NodeMemorySummary {
  avgUsagePercent: number
  maxUsagePercent: number
  minUsagePercent: number
  avgSwapUsage: number
  maxSwapUsage: number
}

/** Node 内存指标 */
export interface NodeMemoryMetrics {
  current: NodeMemorySnapshot
  trend: NodeMemoryDataPoint[]
  summary: NodeMemorySummary
}

// ==================== Node 磁盘指标 ====================

/** Node 文件系统快照 */
export interface NodeFilesystemSnapshot {
  timestamp: number
  totalBytes: number
  usedBytes: number
  availableBytes: number
  usagePercent: number
  totalInodes: number
  usedInodes: number
  freeInodes: number
  inodePercent: number
}

/** Node 文件系统数据点 */
export interface NodeFilesystemDataPoint {
  timestamp: number
  usedBytes: number
  usagePercent: number
}

/** Node 文件系统指标 */
export interface NodeFilesystemMetrics {
  mountpoint: string
  device: string
  fsType: string
  current: NodeFilesystemSnapshot
  trend: NodeFilesystemDataPoint[]
}

/** Node 磁盘设备快照 */
export interface NodeDiskDeviceSnapshot {
  timestamp: number
  readIOPS: number
  writeIOPS: number
  readBytesPerSec: number
  writeBytesPerSec: number
  ioUtilizationPercent: number
  avgAwaitMs: number
}

/** Node 磁盘设备数据点 */
export interface NodeDiskDeviceDataPoint {
  timestamp: number
  readBytesPerSec: number
  writeBytesPerSec: number
  ioUtilizationPercent: number
}

/** Node 磁盘设备统计 */
export interface NodeDiskDeviceSummary {
  avgReadBytesPerSec: number
  maxReadBytesPerSec: number
  avgWriteBytesPerSec: number
  maxWriteBytesPerSec: number
  avgIOUtilization: number
  maxIOUtilization: number
}

/** Node 磁盘设备指标 */
export interface NodeDiskDeviceMetrics {
  device: string
  current: NodeDiskDeviceSnapshot
  trend: NodeDiskDeviceDataPoint[]
  summary: NodeDiskDeviceSummary
}

/** Node 磁盘指标 */
export interface NodeDiskMetrics {
  filesystems: NodeFilesystemMetrics[]
  devices: NodeDiskDeviceMetrics[]
}

// ==================== Node 网络指标 ====================

/** Node 网络接口快照 */
export interface NodeNetworkInterfaceSnapshot {
  timestamp: number
  receiveBytesPerSec: number
  transmitBytesPerSec: number
  receivePacketsPerSec: number
  transmitPacketsPerSec: number
  receiveErrorsRate: number
  transmitErrorsRate: number
  receiveDropsRate: number
  transmitDropsRate: number
}

/** Node 网络接口数据点 */
export interface NodeNetworkInterfaceDataPoint {
  timestamp: number
  receiveBytesPerSec: number
  transmitBytesPerSec: number
}

/** Node 网络接口统计 */
export interface NodeNetworkInterfaceSummary {
  avgReceiveBytesPerSec: number
  maxReceiveBytesPerSec: number
  avgTransmitBytesPerSec: number
  maxTransmitBytesPerSec: number
  totalReceiveErrors: number
  totalTransmitErrors: number
  totalReceiveDrops: number
  totalTransmitDrops: number
}

/** Node 网络接口指标 */
export interface NodeNetworkInterfaceMetrics {
  interfaceName: string
  current: NodeNetworkInterfaceSnapshot
  trend: NodeNetworkInterfaceDataPoint[]
  summary: NodeNetworkInterfaceSummary
}

/** Node TCP 快照 */
export interface NodeTCPSnapshot {
  timestamp: number
  establishedConnections: number
  timeWaitConnections: number
  activeOpensRate: number
  passiveOpensRate: number
  socketsInUse: number
}

/** Node TCP 数据点 */
export interface NodeTCPDataPoint {
  timestamp: number
  establishedConnections: number
  timeWaitConnections: number
}

/** Node TCP 指标 */
export interface NodeTCPMetrics {
  current: NodeTCPSnapshot
  trend: NodeTCPDataPoint[]
}

/** Node 网络指标 */
export interface NodeNetworkMetrics {
  interfaces: NodeNetworkInterfaceMetrics[]
  tcp: NodeTCPMetrics
}

// ==================== Node Kubernetes 状态 ====================

/** Node 条件 */
export interface NodeCondition {
  type: string
  status: boolean
  reason?: string
  message?: string
  lastTransitionTime: number
}

/** Node 资源数量 */
export interface NodeResourceQuantity {
  cpuCores: number
  memoryBytes: number
  pods: number
  ephemeralStorage: number
}

/** Node Kubelet 数据点 */
export interface NodeKubeletDataPoint {
  timestamp: number
  plegRelistDuration: number
  runtimeOpsRate: number
  runtimeOpsErrorRate: number
}

/** Node Kubelet 指标 */
export interface NodeKubeletMetrics {
  runningPods: number
  runningContainers: number
  plegRelistDuration: number
  runtimeOpsRate: number
  runtimeOpsErrorRate: number
  runtimeOpsDuration: number
  trend: NodeKubeletDataPoint[]
}

/** Node 信息 */
export interface NodeInfo {
  kubeletVersion: string
  containerRuntimeVersion: string
  kernelVersion: string
  osImage: string
  architecture: string
  bootTime: number
  uptimeSeconds: number
}

/** Node 污点 */
export interface NodeTaint {
  key: string
  value: string
  effect: string
}

/** Node K8s 状态 */
export interface NodeK8sStatus {
  conditions: NodeCondition[]
  capacity: NodeResourceQuantity
  allocatable: NodeResourceQuantity
  allocated: NodeResourceQuantity
  kubeletMetrics: NodeKubeletMetrics
  nodeInfo: NodeInfo
  taints: NodeTaint[]
  labels: Record<string, string>
  annotations: Record<string, string>
}

// ==================== Node 系统指标 ====================

/** Node 进程指标 */
export interface NodeProcessMetrics {
  running: number
  blocked: number
}

/** Node 文件描述符数据点 */
export interface NodeFileDescriptorDataPoint {
  timestamp: number
  allocated: number
  usagePercent: number
}

/** Node 文件描述符指标 */
export interface NodeFileDescriptorMetrics {
  allocated: number
  maximum: number
  usagePercent: number
  trend: NodeFileDescriptorDataPoint[]
}

/** Node 系统指标 */
export interface NodeSystemMetrics {
  processes: NodeProcessMetrics
  fileDescriptors: NodeFileDescriptorMetrics
}

// ==================== Node 上的 Pod 信息 ====================

/** Pod 资源使用 */
export interface PodResourceUsage {
  namespace: string
  podName: string
  value: number
  unit: string
}

/** Node Pod 简要信息 */
export interface NodePodBrief {
  namespace: string
  podName: string
  phase: string
  cpuUsage: number
  memoryUsage: number
  restartCount: number
}

/** Node Pod 指标 */
export interface NodePodMetrics {
  nodeName: string
  totalPods: number
  runningPods: number
  pendingPods: number
  failedPods: number
  topPodsByCPU: PodResourceUsage[]
  topPodsByMem: PodResourceUsage[]
  podList: NodePodBrief[]
}

// ==================== Node 对比 ====================

/** Node 对比项 */
export interface NodeComparisonItem {
  nodeName: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  load5: number
  podCount: number
  ready: boolean
}

/** Node 对比 */
export interface NodeComparison {
  nodes: NodeComparisonItem[]
  timestamp: number
}

// ==================== Node 排行 ====================

/** Node 排行项 */
export interface NodeRankingItem {
  nodeName: string
  value: number
  unit: string
}

/** Node 排行 */
export interface NodeRanking {
  topByCPU: NodeRankingItem[]
  topByMemory: NodeRankingItem[]
  topByDisk: NodeRankingItem[]
  topByLoad: NodeRankingItem[]
  topByPods: NodeRankingItem[]
}

// ==================== Node 综合指标 ====================

/** Node 综合指标 */
export interface NodeMetrics {
  nodeName: string
  timestamp: number
  cpu: NodeCPUMetrics
  memory: NodeMemoryMetrics
  disk: NodeDiskMetrics
  network: NodeNetworkMetrics
  k8sStatus: NodeK8sStatus
  system: NodeSystemMetrics
}

// ==================== 请求参数 ====================

/** 基础查询参数 */
export interface BaseNodeQueryParams {
  clusterUuid: string
  nodeName: string
  start?: string
  end?: string
}

/** Node 列表查询参数 */
export interface ListNodesMetricsParams {
  clusterUuid: string
  start?: string
  end?: string
}

/** 对比 Node 参数 */
export interface CompareNodesParams {
  clusterUuid: string
  nodeNames: string[]
  start?: string
  end?: string
}

/** Node 排行参数 */
export interface GetNodeRankingParams {
  clusterUuid: string
  limit?: number
  start?: string
  end?: string
}

/** Node 条件查询参数 */
export interface GetNodeConditionsParams {
  clusterUuid: string
  nodeName: string
}

/** Node 容量查询参数 */
export interface GetNodeCapacityParams {
  clusterUuid: string
  nodeName: string
}

/** 获取指定网卡参数 */
export interface GetNodeNetworkInterfaceParams {
  clusterUuid: string
  nodeName: string
  interfaceName: string
  start?: string
  end?: string
}

// ==================== 响应类型 ====================

export interface GetNodeMetricsResponse {
  data: NodeMetrics
}

export interface GetNodeCPUResponse {
  data: NodeCPUMetrics
}

export interface GetNodeMemoryResponse {
  data: NodeMemoryMetrics
}

export interface GetNodeDiskResponse {
  data: NodeDiskMetrics
}

export interface GetNodeFilesystemsResponse {
  data: NodeFilesystemMetrics[]
}

export interface GetNodeDiskDevicesResponse {
  data: NodeDiskDeviceMetrics[]
}

export interface GetNodeNetworkResponse {
  data: NodeNetworkMetrics
}

export interface GetNodeNetworkInterfacesResponse {
  data: NodeNetworkInterfaceMetrics[]
}

export interface GetNodeNetworkInterfaceResponse {
  data: NodeNetworkInterfaceMetrics
}

export interface GetNodeTCPResponse {
  data: NodeTCPMetrics
}

export interface GetNodeK8sStatusResponse {
  data: NodeK8sStatus
}

export interface GetNodeConditionsResponse {
  data: NodeCondition[]
}

export interface GetNodeCapacityResponse {
  data: NodeResourceQuantity
}

export interface GetNodeAllocatableResponse {
  data: NodeResourceQuantity
}

export interface GetNodeAllocatedResponse {
  data: NodeResourceQuantity
}

export interface GetNodeKubeletResponse {
  data: NodeKubeletMetrics
}

export interface GetNodeSystemResponse {
  data: NodeSystemMetrics
}

export interface GetNodePodsResponse {
  data: NodePodMetrics
}

export interface CompareNodesResponse {
  data: NodeComparison
}

export interface GetNodeRankingResponse {
  data: NodeRanking
}

export interface ListNodesMetricsResponse {
  data: NodeMetrics[]
}

// ==================== API 接口 ====================

/**
 * 获取节点综合指标
 */
export async function getNodeMetricsApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeMetricsResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/metrics`,
    params
  })
}

/**
 * 获取节点 CPU 指标
 */
export async function getNodeCPUApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeCPUResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/cpu`,
    params
  })
}

/**
 * 获取节点内存指标
 */
export async function getNodeMemoryApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeMemoryResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/memory`,
    params
  })
}

/**
 * 获取节点磁盘指标
 */
export async function getNodeDiskApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeDiskResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/disk`,
    params
  })
}

/**
 * 获取节点文件系统列表
 */
export async function getNodeFilesystemsApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeFilesystemsResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/filesystems`,
    params
  })
}

/**
 * 获取节点磁盘设备列表
 */
export async function getNodeDiskDevicesApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeDiskDevicesResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/disk/devices`,
    params
  })
}

/**
 * 获取节点网络指标
 */
export async function getNodeNetworkApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeNetworkResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/network`,
    params
  })
}

/**
 * 获取节点网络接口列表
 */
export async function getNodeNetworkInterfacesApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeNetworkInterfacesResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/network/interfaces`,
    params
  })
}

/**
 * 获取节点指定网络接口指标
 */
export async function getNodeNetworkInterfaceApi(params: GetNodeNetworkInterfaceParams) {
  return request.get<GetNodeNetworkInterfaceResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/network/interface`,
    params
  })
}

/**
 * 获取节点 TCP 指标
 */
export async function getNodeTCPApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeTCPResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/tcp`,
    params
  })
}

/**
 * 获取节点 K8s 状态
 */
export async function getNodeK8sStatusApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeK8sStatusResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/k8s/status`,
    params
  })
}

/**
 * 获取节点状况
 */
export async function getNodeConditionsApi(params: GetNodeConditionsParams) {
  return request.get<GetNodeConditionsResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/k8s/conditions`,
    params
  })
}

/**
 * 获取节点容量
 */
export async function getNodeCapacityApi(params: GetNodeCapacityParams) {
  return request.get<GetNodeCapacityResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/k8s/capacity`,
    params
  })
}

/**
 * 获取节点可分配资源
 */
export async function getNodeAllocatableApi(params: GetNodeCapacityParams) {
  return request.get<GetNodeAllocatableResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/k8s/allocatable`,
    params
  })
}

/**
 * 获取节点已分配资源
 */
export async function getNodeAllocatedApi(params: GetNodeCapacityParams) {
  return request.get<GetNodeAllocatedResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/k8s/allocated`,
    params
  })
}

/**
 * 获取节点 Kubelet 指标
 */
export async function getNodeKubeletApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeKubeletResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/k8s/kubelet`,
    params
  })
}

/**
 * 获取节点系统指标
 */
export async function getNodeSystemApi(params: BaseNodeQueryParams) {
  return request.get<GetNodeSystemResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/system`,
    params
  })
}

/**
 * 获取节点上的 Pod 信息
 */
export async function getNodePodsApi(params: BaseNodeQueryParams) {
  return request.get<GetNodePodsResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/pods`,
    params
  })
}

/**
 * 对比多个节点
 */
export async function compareNodesApi(params: CompareNodesParams) {
  return request.get<CompareNodesResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/compare`,
    params
  })
}

/**
 * 获取节点排行
 */
export async function getNodeRankingApi(params: GetNodeRankingParams) {
  return request.get<GetNodeRankingResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/ranking`,
    params
  })
}

/**
 * 列出所有节点指标
 */
export async function listNodesMetricsApi(params: ListNodesMetricsParams) {
  return request.get<ListNodesMetricsResponse>({
    url: `${NODE_MONITOR_BASE_PATH}/list`,
    params
  })
}

// ==================== 工具函数 ====================

/**
 * 判断节点是否健康
 */
export function isNodeHealthy(node: NodeMetrics): boolean {
  const readyCondition = node.k8sStatus.conditions.find((c) => c.type === 'Ready')
  return (
    readyCondition?.status === true &&
    node.cpu.current.usagePercent < 80 &&
    node.memory.current.usagePercent < 80
  )
}

/**
 * 获取节点负载等级
 */
export function getNodeLoadLevel(
  load5: number,
  cores: number
): 'low' | 'medium' | 'high' | 'critical' {
  const loadPerCore = load5 / cores
  if (loadPerCore < 0.7) return 'low'
  if (loadPerCore < 1.0) return 'medium'
  if (loadPerCore < 1.5) return 'high'
  return 'critical'
}

/**
 * 格式化节点运行时间
 */
export function formatNodeUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / 86400)
  const hours = Math.floor((uptimeSeconds % 86400) / 3600)
  if (days > 0) return `${days}d${hours}h`
  return `${hours}h`
}

/**
 * 判断是否有内存压力
 */
export function hasMemoryPressure(conditions: NodeCondition[]): boolean {
  const memoryPressure = conditions.find((c) => c.type === 'MemoryPressure')
  return memoryPressure?.status === true
}

/**
 * 判断是否有磁盘压力
 */
export function hasDiskPressure(conditions: NodeCondition[]): boolean {
  const diskPressure = conditions.find((c) => c.type === 'DiskPressure')
  return diskPressure?.status === true
}

/**
 * 获取节点资源使用率
 */
export function getNodeResourceUtilization(
  allocated: NodeResourceQuantity,
  capacity: NodeResourceQuantity
): {
  cpuPercent: number
  memoryPercent: number
  podsPercent: number
} {
  return {
    cpuPercent: (allocated.cpuCores / capacity.cpuCores) * 100,
    memoryPercent: (allocated.memoryBytes / capacity.memoryBytes) * 100,
    podsPercent: (allocated.pods / capacity.pods) * 100
  }
}

/**
 * 格式化字节数
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}