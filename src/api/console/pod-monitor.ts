import request from '@/utils/http'

// 定义基础路径
const POD_MONITOR_BASE_PATH = '/console/v1/pod-monitor'

// ==================== CPU 指标 ====================

/** CPU 使用快照 */
export interface CPUUsageSnapshot {
  timestamp: number
  usageCores: number
  usagePercent: number
  requestCores: number
  limitCores: number
  throttledTime: number
}

/** CPU 使用数据点 */
export interface CPUUsageDataPoint {
  timestamp: number
  usageCores: number
  usagePercent: number
}

/** CPU 资源限制 */
export interface CPULimits {
  requestCores: number
  limitCores: number
  hasLimit: boolean
}

/** CPU 统计汇总 */
export interface CPUSummary {
  avgUsageCores: number
  maxUsageCores: number
  minUsageCores: number
  avgUsagePercent: number
  maxUsagePercent: number
  totalThrottled: number
  throttledPercent: number
}

/** Pod CPU 指标 */
export interface PodCPUMetrics {
  namespace: string
  podName: string
  current: CPUUsageSnapshot
  trend: CPUUsageDataPoint[]
  limits: CPULimits
  summary: CPUSummary
}

/** 容器 CPU 指标 */
export interface ContainerCPUMetrics {
  namespace: string
  podName: string
  containerName: string
  current: CPUUsageSnapshot
  trend: CPUUsageDataPoint[]
  limits: CPULimits
  summary: CPUSummary
}

/** CPU 节流数据点 */
export interface CPUThrottlingDataPoint {
  timestamp: number
  throttledSeconds: number
  throttledPercent: number
}

/** 容器节流情况 */
export interface ContainerThrottling {
  containerName: string
  throttledSeconds: number
  throttledPercent: number
}

/** CPU 节流指标 */
export interface CPUThrottlingMetrics {
  namespace: string
  podName: string
  totalThrottled: number
  throttledPercent: number
  trend: CPUThrottlingDataPoint[]
  byContainer: ContainerThrottling[]
}

// ==================== 内存指标 ====================

/** 内存使用快照 */
export interface MemoryUsageSnapshot {
  timestamp: number
  usageBytes: number
  usagePercent: number
  requestBytes: number
  limitBytes: number
  workingSetBytes: number
  rssBytes: number
  cacheBytes: number
}

/** 内存使用数据点 */
export interface MemoryUsageDataPoint {
  timestamp: number
  usageBytes: number
  usagePercent: number
  workingSetBytes: number
}

/** 内存资源限制 */
export interface MemoryLimits {
  requestBytes: number
  limitBytes: number
  hasLimit: boolean
}

/** 内存统计汇总 */
export interface MemorySummary {
  avgUsageBytes: number
  maxUsageBytes: number
  minUsageBytes: number
  avgUsagePercent: number
  maxUsagePercent: number
  oomKills: number
}

/** Pod 内存指标 */
export interface PodMemoryMetrics {
  namespace: string
  podName: string
  current: MemoryUsageSnapshot
  trend: MemoryUsageDataPoint[]
  limits: MemoryLimits
  summary: MemorySummary
}

/** 容器内存指标 */
export interface ContainerMemoryMetrics {
  namespace: string
  podName: string
  containerName: string
  current: MemoryUsageSnapshot
  trend: MemoryUsageDataPoint[]
  limits: MemoryLimits
  summary: MemorySummary
}

/** 容器 OOM 情况 */
export interface ContainerOOM {
  containerName: string
  oomKills: number
}

/** OOM 事件 */
export interface OOMEvent {
  timestamp: number
  containerName: string
  reason: string
}

/** OOM 指标 */
export interface OOMMetrics {
  namespace: string
  podName: string
  totalOOMKills: number
  byContainer: ContainerOOM[]
  events: OOMEvent[]
}

// ==================== 网络指标 ====================

/** 网络快照 */
export interface NetworkSnapshot {
  timestamp: number
  receiveBytes: number
  transmitBytes: number
  receivePackets: number
  transmitPackets: number
  receiveErrors: number
  transmitErrors: number
}

/** 网络数据点 */
export interface NetworkDataPoint {
  timestamp: number
  receiveBytes: number
  transmitBytes: number
}

/** 网络统计汇总 */
export interface NetworkSummary {
  totalReceiveBytes: number
  totalTransmitBytes: number
  totalReceivePackets: number
  totalTransmitPackets: number
  totalErrors: number
  maxReceiveBytesPerSec: number
  maxTransmitBytesPerSec: number
  avgReceiveBytesPerSec: number
  avgTransmitBytesPerSec: number
}

/** 网络 I/O 指标 */
export interface NetworkMetrics {
  namespace: string
  podName: string
  current: NetworkSnapshot
  trend: NetworkDataPoint[]
  summary: NetworkSummary
}

/** 容器网络 I/O 指标 */
export interface ContainerNetworkMetrics {
  namespace: string
  podName: string
  containerName: string
  current: NetworkSnapshot
  trend: NetworkDataPoint[]
  summary: NetworkSummary
}

/** 网络速率快照 */
export interface NetworkRateSnapshot {
  timestamp: number
  receiveBytesPerSec: number
  transmitBytesPerSec: number
}

/** 网络速率数据点 */
export interface NetworkRateDataPoint {
  timestamp: number
  receiveBytesPerSec: number
  transmitBytesPerSec: number
}

/** 网络速率统计 */
export interface NetworkRateSummary {
  avgReceiveBytesPerSec: number
  maxReceiveBytesPerSec: number
  avgTransmitBytesPerSec: number
  maxTransmitBytesPerSec: number
}

/** 网络速率指标 */
export interface NetworkRateMetrics {
  namespace: string
  podName: string
  current: NetworkRateSnapshot
  trend: NetworkRateDataPoint[]
  summary: NetworkRateSummary
}

/** 容器网络速率指标 */
export interface ContainerNetworkRateMetrics {
  namespace: string
  podName: string
  containerName: string
  current: NetworkRateSnapshot
  trend: NetworkRateDataPoint[]
  summary: NetworkRateSummary
}

// ==================== 磁盘指标 ====================

/** 磁盘快照 */
export interface DiskSnapshot {
  timestamp: number
  readBytes: number
  writeBytes: number
  readOps: number
  writeOps: number
}

/** 磁盘数据点 */
export interface DiskDataPoint {
  timestamp: number
  readBytes: number
  writeBytes: number
}

/** 磁盘统计汇总 */
export interface DiskSummary {
  totalReadBytes: number
  totalWriteBytes: number
  totalReadOps: number
  totalWriteOps: number
  maxReadBytesPerSec: number
  maxWriteBytesPerSec: number
  avgReadBytesPerSec: number
  avgWriteBytesPerSec: number
}

/** 磁盘 I/O 指标 */
export interface DiskMetrics {
  namespace: string
  podName: string
  current: DiskSnapshot
  trend: DiskDataPoint[]
  summary: DiskSummary
}

/** 容器磁盘指标 */
export interface ContainerDiskMetrics {
  namespace: string
  podName: string
  containerName: string
  current: DiskSnapshot
  trend: DiskDataPoint[]
  summary: DiskSummary
}

/** 磁盘速率快照 */
export interface DiskRateSnapshot {
  timestamp: number
  readBytesPerSec: number
  writeBytesPerSec: number
  readOpsPerSec: number
  writeOpsPerSec: number
}

/** 磁盘速率数据点 */
export interface DiskRateDataPoint {
  timestamp: number
  readBytesPerSec: number
  writeBytesPerSec: number
}

/** 磁盘速率统计 */
export interface DiskRateSummary {
  avgReadBytesPerSec: number
  maxReadBytesPerSec: number
  avgWriteBytesPerSec: number
  maxWriteBytesPerSec: number
}

/** 磁盘速率指标 */
export interface DiskRateMetrics {
  namespace: string
  podName: string
  current: DiskRateSnapshot
  trend: DiskRateDataPoint[]
  summary: DiskRateSummary
}

// ==================== Pod 状态指标 ====================

/** 容器状态 */
export interface ContainerState {
  containerName: string
  ready: boolean
  restartCount: number
  state: string
  reason: string
}

/** Pod 状态快照 */
export interface PodStatusSnapshot {
  timestamp: number
  phase: string
  ready: boolean
  reason: string
  message: string
  containerStates: ContainerState[]
}

/** Pod 状态数据点 */
export interface PodStatusDataPoint {
  timestamp: number
  phase: string
  ready: boolean
}

/** 状态转换 */
export interface StatusTransition {
  timestamp: number
  fromPhase: string
  toPhase: string
  reason: string
}

/** Pod 状态指标 */
export interface PodStatusMetrics {
  namespace: string
  podName: string
  current: PodStatusSnapshot
  history: PodStatusDataPoint[]
  transitions: StatusTransition[]
}

/** 容器重启情况 */
export interface ContainerRestart {
  containerName: string
  restartCount: number
  lastRestart?: number
}

/** 重启事件 */
export interface RestartEvent {
  timestamp: number
  containerName: string
  reason: string
  exitCode: number
}

/** 重启数据点 */
export interface RestartDataPoint {
  timestamp: number
  restartCount: number
}

/** 重启指标 */
export interface RestartMetrics {
  namespace: string
  podName: string
  totalRestarts: number
  byContainer: ContainerRestart[]
  recentRestarts: RestartEvent[]
  trend: RestartDataPoint[]
}

/** Pod 生命周期指标 */
export interface PodAgeMetrics {
  namespace: string
  podName: string
  creationTime: number
  age: string
  ageSeconds: number
  uptime: string
  uptimeSeconds: number
}

// ==================== 存储/Volume 指标 ====================

/** 卷使用情况 */
export interface VolumeUsage {
  volumeName: string
  mountPath: string
  device: string
  capacityBytes: number
  usedBytes: number
  availBytes: number
  usagePercent: number
  pvcName: string
  storageClass: string
  accessMode: string
}

/** Pod 存储指标 */
export interface PodVolumeMetrics {
  namespace: string
  podName: string
  volumes: VolumeUsage[]
  totalCapacity: number
  totalUsed: number
  usagePercent: number
}

/** IOPS 快照 */
export interface IOPSSnapshot {
  timestamp: number
  readIOPS: number
  writeIOPS: number
  totalIOPS: number
}

/** IOPS 数据点 */
export interface IOPSDataPoint {
  timestamp: number
  readIOPS: number
  writeIOPS: number
  totalIOPS: number
}

/** IOPS 统计 */
export interface IOPSSummary {
  avgReadIOPS: number
  maxReadIOPS: number
  avgWriteIOPS: number
  maxWriteIOPS: number
}

/** Volume IOPS 指标 */
export interface VolumeIOPSMetrics {
  namespace: string
  podName: string
  current: IOPSSnapshot
  trend: IOPSDataPoint[]
  summary: IOPSSummary
}

// ==================== 健康检查/探针指标 ====================

/** 探针状态 */
export interface ProbeStatus {
  containerName: string
  probeType: string
  status: string
  successCount: number
  failureCount: number
  totalProbes: number
  lastProbeTime: string
  lastSuccessTime?: string
  lastFailureTime?: string
  failureReason?: string
}

/** Pod 探针指标 */
export interface PodProbeMetrics {
  namespace: string
  podName: string
  livenessProbes: ProbeStatus[]
  readinessProbes: ProbeStatus[]
  startupProbes: ProbeStatus[]
}

// ==================== 文件描述符指标 ====================

/** 文件描述符快照 */
export interface FDSnapshot {
  timestamp: number
  openFDs: number
  maxFDs: number
  usagePercent: number
}

/** 文件描述符数据点 */
export interface FDDataPoint {
  timestamp: number
  openFDs: number
  usagePercent: number
}

/** 文件描述符统计 */
export interface FDSummary {
  avgOpenFDs: number
  maxOpenFDs: number
  avgUsagePercent: number
  maxUsagePercent: number
}

/** 文件描述符指标 */
export interface FileDescriptorMetrics {
  namespace: string
  podName: string
  current: FDSnapshot
  trend: FDDataPoint[]
  summary: FDSummary
}

// ==================== 网络连接指标 ====================

/** 连接快照 */
export interface ConnectionSnapshot {
  timestamp: number
  tcpConnections: number
  udpConnections: number
  tcpListening: number
  tcpEstablished: number
  tcpTimeWait: number
  tcpCloseWait: number
}

/** 连接数据点 */
export interface ConnectionDataPoint {
  timestamp: number
  tcpEstablished: number
  tcpTimeWait: number
  totalActive: number
}

/** 连接统计 */
export interface ConnectionSummary {
  avgTCPEstablished: number
  maxTCPEstablished: number
  avgTCPTimeWait: number
  maxTCPTimeWait: number
}

/** 网络连接指标 */
export interface NetworkConnectionMetrics {
  namespace: string
  podName: string
  current: ConnectionSnapshot
  trend: ConnectionDataPoint[]
  summary: ConnectionSummary
}

// ==================== 容器详细状态指标 ====================

/** 容器状态指标 */
export interface ContainerStatusMetrics {
  namespace: string
  podName: string
  containerName: string
  state: string
  ready: boolean
  restartCount: number
  startTime?: string
  lastRestart?: string
  exitCode: number
  reason: string
  message: string
  image: string
  imageID: string
  containerID: string
}

/** 环境变量来源 */
export interface EnvFromSource {
  configMapRef?: string
  secretRef?: string
}

/** 卷挂载信息 */
export interface VolumeMountInfo {
  name: string
  mountPath: string
  subPath?: string
  readOnly: boolean
}

/** 容器环境信息 */
export interface ContainerEnvironment {
  namespace: string
  podName: string
  containerName: string
  image: string
  imagePullPolicy: string
  command?: string[]
  args?: string[]
  envVars?: Record<string, string>
  envFrom?: EnvFromSource[]
  volumeMounts?: VolumeMountInfo[]
  workingDir?: string
}

// ==================== 资源配额指标 ====================

/** 资源配额详情 */
export interface ResourceQuotaDetail {
  resource: string
  used: string
  hard: string
  percent: number
}

/** 资源配额指标 */
export interface ResourceQuotaMetrics {
  namespace: string
  quotaName?: string
  cpuUsed: number
  cpuHard: number
  cpuPercent: number
  memoryUsed: number
  memoryHard: number
  memoryPercent: number
  podsUsed: number
  podsHard: number
  podsPercent: number
  resources?: ResourceQuotaDetail[]
}

// ==================== 日志指标 ====================

/** 日志速率数据点 */
export interface LogRateDataPoint {
  timestamp: number
  linesCount: number
  errorRate: number
}

/** 容器日志指标 */
export interface ContainerLogMetrics {
  namespace: string
  podName: string
  containerName: string
  totalLines: number
  errorCount: number
  warningCount: number
  logRate: number
  trend?: LogRateDataPoint[]
}

// ==================== 进程指标 ====================

/** 进程信息 */
export interface ProcessInfo {
  pid: number
  name: string
  state: string
  cpuPercent: number
  memoryBytes: number
  threads: number
}

/** 进程指标 */
export interface ProcessMetrics {
  namespace: string
  podName: string
  containerName: string
  processCount: number
  threadCount: number
  zombieCount: number
  processes?: ProcessInfo[]
}

// ==================== Pod 综合概览 ====================

/** Pod 概览 */
export interface PodOverview {
  namespace: string
  podName: string
  status: PodStatusSnapshot
  cpu: CPUUsageSnapshot
  memory: MemoryUsageSnapshot
  network: NetworkSnapshot
  disk: DiskSnapshot
  restartCount: number
  age: PodAgeMetrics
  labels: Record<string, string>
  annotations: Record<string, string>
}

/** Pod 排行 */
export interface PodRanking {
  namespace: string
  podName: string
  value: number
  unit: string
}

// ==================== 请求参数 ====================

/** 基础查询参数 */
export interface BaseQueryParams {
  clusterUuid: string
  namespace: string
  podName: string
  start?: string
  end?: string
}

/** 容器查询参数 */
export interface ContainerQueryParams extends BaseQueryParams {
  containerName: string
}

/** CPU 使用查询参数 */
export type GetCPUUsageParams = BaseQueryParams

/** 容器 CPU 使用查询参数 */
export type GetCPUUsageByContainerParams = ContainerQueryParams

/** CPU 节流查询参数 */
export type GetCPUThrottlingParams = BaseQueryParams

/** 内存使用查询参数 */
export type GetMemoryUsageParams = BaseQueryParams

/** 容器内存使用查询参数 */
export type GetMemoryUsageByContainerParams = ContainerQueryParams

/** OOM 查询参数 */
export type GetMemoryOOMParams = BaseQueryParams

/** 网络 I/O 查询参数 */
export type GetNetworkIOParams = BaseQueryParams

/** 容器网络 I/O 查询参数 */
export type GetNetworkIOByContainerParams = ContainerQueryParams

/** 网络速率查询参数 */
export type GetNetworkRateParams = BaseQueryParams

/** 容器网络速率查询参数 */
export type GetNetworkRateByContainerParams = ContainerQueryParams

/** 磁盘 I/O 查询参数 */
export type GetDiskIOParams = BaseQueryParams

/** 容器磁盘 I/O 查询参数 */
export type GetDiskIOByContainerParams = ContainerQueryParams

/** 磁盘速率查询参数 */
export type GetDiskRateParams = BaseQueryParams

/** Pod 状态查询参数 */
export type GetPodStatusParams = BaseQueryParams

/** 重启次数查询参数 */
export type GetRestartCountParams = BaseQueryParams

/** Pod 生命周期查询参数 */
export interface GetPodAgeParams {
  clusterUuid: string
  namespace: string
  podName: string
}

/** 存储使用查询参数 */
export interface GetVolumeUsageParams {
  clusterUuid: string
  namespace: string
  podName: string
}

/** Volume IOPS 查询参数 */
export type GetVolumeIOPSParams = BaseQueryParams

/** 探针状态查询参数 */
export interface GetProbeStatusParams {
  clusterUuid: string
  namespace: string
  podName: string
}

/** 文件描述符查询参数 */
export type GetFileDescriptorUsageParams = BaseQueryParams

/** 网络连接查询参数 */
export type GetNetworkConnectionsParams = BaseQueryParams

/** 容器状态查询参数 */
export interface GetContainerStatusParams {
  clusterUuid: string
  namespace: string
  podName: string
  containerName: string
}

/** 容器环境查询参数 */
export interface GetContainerEnvironmentParams {
  clusterUuid: string
  namespace: string
  podName: string
  containerName: string
}

/** 资源配额查询参数 */
export interface GetResourceQuotaParams {
  clusterUuid: string
  namespace: string
}

/** 容器日志指标查询参数 */
export type GetContainerLogMetricsParams = ContainerQueryParams

/** 进程指标查询参数 */
export type GetProcessMetricsParams = ContainerQueryParams

/** Pod 概览查询参数 */
export type GetPodOverviewParams = BaseQueryParams

/** Pods 列表查询参数 */
export interface ListPodsMetricsParams {
  clusterUuid: string
  namespace: string
  start?: string
  end?: string
}

/** Top Pods 查询参数 */
export interface GetTopPodsParams {
  clusterUuid: string
  namespace: string
  limit?: number
  start?: string
  end?: string
}

// ==================== 响应类型 ====================

/** CPU 使用响应 */
export interface GetCPUUsageResponse {
  data: PodCPUMetrics
}

/** 容器 CPU 使用响应 */
export interface GetCPUUsageByContainerResponse {
  data: ContainerCPUMetrics
}

/** CPU 节流响应 */
export interface GetCPUThrottlingResponse {
  data: CPUThrottlingMetrics
}

/** 内存使用响应 */
export interface GetMemoryUsageResponse {
  data: PodMemoryMetrics
}

/** 容器内存使用响应 */
export interface GetMemoryUsageByContainerResponse {
  data: ContainerMemoryMetrics
}

/** OOM 响应 */
export interface GetMemoryOOMResponse {
  data: OOMMetrics
}

/** 网络 I/O 响应 */
export interface GetNetworkIOResponse {
  data: NetworkMetrics
}

/** 容器网络 I/O 响应 */
export interface GetNetworkIOByContainerResponse {
  data: ContainerNetworkMetrics
}

/** 网络速率响应 */
export interface GetNetworkRateResponse {
  data: NetworkRateMetrics
}

/** 容器网络速率响应 */
export interface GetNetworkRateByContainerResponse {
  data: ContainerNetworkRateMetrics
}

/** 磁盘 I/O 响应 */
export interface GetDiskIOResponse {
  data: DiskMetrics
}

/** 容器磁盘 I/O 响应 */
export interface GetDiskIOByContainerResponse {
  data: ContainerDiskMetrics
}

/** 磁盘速率响应 */
export interface GetDiskRateResponse {
  data: DiskRateMetrics
}

/** Pod 状态响应 */
export interface GetPodStatusResponse {
  data: PodStatusMetrics
}

/** 重启次数响应 */
export interface GetRestartCountResponse {
  data: RestartMetrics
}

/** Pod 生命周期响应 */
export interface GetPodAgeResponse {
  data: PodAgeMetrics
}

/** 存储使用响应 */
export interface GetVolumeUsageResponse {
  data: PodVolumeMetrics
}

/** Volume IOPS 响应 */
export interface GetVolumeIOPSResponse {
  data: VolumeIOPSMetrics
}

/** 探针状态响应 */
export interface GetProbeStatusResponse {
  data: PodProbeMetrics
}

/** 文件描述符响应 */
export interface GetFileDescriptorUsageResponse {
  data: FileDescriptorMetrics
}

/** 网络连接响应 */
export interface GetNetworkConnectionsResponse {
  data: NetworkConnectionMetrics
}

/** 容器状态响应 */
export interface GetContainerStatusResponse {
  data: ContainerStatusMetrics
}

/** 容器环境响应 */
export interface GetContainerEnvironmentResponse {
  data: ContainerEnvironment
}

/** 资源配额响应 */
export interface GetResourceQuotaResponse {
  data: ResourceQuotaMetrics
}

/** 容器日志指标响应 */
export interface GetContainerLogMetricsResponse {
  data: ContainerLogMetrics
}

/** 进程指标响应 */
export interface GetProcessMetricsResponse {
  data: ProcessMetrics
}

/** Pod 概览响应 */
export interface GetPodOverviewResponse {
  data: PodOverview
}

/** Pods 列表响应 */
export interface ListPodsMetricsResponse {
  data: PodOverview[]
}

/** Top Pods 响应 */
export interface GetTopPodsResponse {
  data: PodRanking[]
}

// ==================== API 接口 ====================

// ============ CPU 监控 ============

/**
 * 获取 Pod CPU 使用情况
 * @param params 查询参数
 * @returns CPU 使用指标
 */
export async function getCPUUsageApi(params: GetCPUUsageParams) {
  return request.get<GetCPUUsageResponse>({
    url: `${POD_MONITOR_BASE_PATH}/cpu/usage`,
    params
  })
}

/**
 * 获取容器 CPU 使用情况
 * @param params 查询参数
 * @returns 容器 CPU 使用指标
 */
export async function getCPUUsageByContainerApi(params: GetCPUUsageByContainerParams) {
  return request.get<GetCPUUsageByContainerResponse>({
    url: `${POD_MONITOR_BASE_PATH}/cpu/usage/container`,
    params
  })
}

/**
 * 获取 CPU 节流情况
 * @param params 查询参数
 * @returns CPU 节流指标
 */
export async function getCPUThrottlingApi(params: GetCPUThrottlingParams) {
  return request.get<GetCPUThrottlingResponse>({
    url: `${POD_MONITOR_BASE_PATH}/cpu/throttling`,
    params
  })
}

// ============ 内存监控 ============

/**
 * 获取 Pod 内存使用情况
 * @param params 查询参数
 * @returns 内存使用指标
 */
export async function getMemoryUsageApi(params: GetMemoryUsageParams) {
  return request.get<GetMemoryUsageResponse>({
    url: `${POD_MONITOR_BASE_PATH}/memory/usage`,
    params
  })
}

/**
 * 获取容器内存使用情况
 * @param params 查询参数
 * @returns 容器内存使用指标
 */
export async function getMemoryUsageByContainerApi(params: GetMemoryUsageByContainerParams) {
  return request.get<GetMemoryUsageByContainerResponse>({
    url: `${POD_MONITOR_BASE_PATH}/memory/usage/container`,
    params
  })
}

/**
 * 获取 OOM 情况
 * @param params 查询参数
 * @returns OOM 指标
 */
export async function getMemoryOOMApi(params: GetMemoryOOMParams) {
  return request.get<GetMemoryOOMResponse>({
    url: `${POD_MONITOR_BASE_PATH}/memory/oom`,
    params
  })
}

// ============ 网络监控 ============

/**
 * 获取网络 I/O
 * @param params 查询参数
 * @returns 网络 I/O 指标
 */
export async function getNetworkIOApi(params: GetNetworkIOParams) {
  return request.get<GetNetworkIOResponse>({
    url: `${POD_MONITOR_BASE_PATH}/network/io`,
    params
  })
}

/**
 * 获取容器网络 I/O
 * @param params 查询参数
 * @returns 容器网络 I/O 指标
 */
export async function getNetworkIOByContainerApi(params: GetNetworkIOByContainerParams) {
  return request.get<GetNetworkIOByContainerResponse>({
    url: `${POD_MONITOR_BASE_PATH}/network/io/container`,
    params
  })
}

/**
 * 获取网络速率
 * @param params 查询参数
 * @returns 网络速率指标
 */
export async function getNetworkRateApi(params: GetNetworkRateParams) {
  return request.get<GetNetworkRateResponse>({
    url: `${POD_MONITOR_BASE_PATH}/network/rate`,
    params
  })
}

/**
 * 获取容器网络速率
 * @param params 查询参数
 * @returns 容器网络速率指标
 */
export async function getNetworkRateByContainerApi(params: GetNetworkRateByContainerParams) {
  return request.get<GetNetworkRateByContainerResponse>({
    url: `${POD_MONITOR_BASE_PATH}/network/rate/container`,
    params
  })
}

// ============ 磁盘监控 ============

/**
 * 获取磁盘 I/O
 * @param params 查询参数
 * @returns 磁盘 I/O 指标
 */
export async function getDiskIOApi(params: GetDiskIOParams) {
  return request.get<GetDiskIOResponse>({
    url: `${POD_MONITOR_BASE_PATH}/disk/io`,
    params
  })
}

/**
 * 获取容器磁盘 I/O
 * @param params 查询参数
 * @returns 容器磁盘 I/O 指标
 */
export async function getDiskIOByContainerApi(params: GetDiskIOByContainerParams) {
  return request.get<GetDiskIOByContainerResponse>({
    url: `${POD_MONITOR_BASE_PATH}/disk/io/container`,
    params
  })
}

/**
 * 获取磁盘速率
 * @param params 查询参数
 * @returns 磁盘速率指标
 */
export async function getDiskRateApi(params: GetDiskRateParams) {
  return request.get<GetDiskRateResponse>({
    url: `${POD_MONITOR_BASE_PATH}/disk/rate`,
    params
  })
}

// ============ Pod 状态监控 ============

/**
 * 获取 Pod 状态
 * @param params 查询参数
 * @returns Pod 状态指标
 */
export async function getPodStatusApi(params: GetPodStatusParams) {
  return request.get<GetPodStatusResponse>({
    url: `${POD_MONITOR_BASE_PATH}/status`,
    params
  })
}

/**
 * 获取重启次数
 * @param params 查询参数
 * @returns 重启指标
 */
export async function getRestartCountApi(params: GetRestartCountParams) {
  return request.get<GetRestartCountResponse>({
    url: `${POD_MONITOR_BASE_PATH}/restart`,
    params
  })
}

/**
 * 获取 Pod 生命周期
 * @param params 查询参数
 * @returns Pod 生命周期指标
 */
export async function getPodAgeApi(params: GetPodAgeParams) {
  return request.get<GetPodAgeResponse>({
    url: `${POD_MONITOR_BASE_PATH}/age`,
    params
  })
}

// ============ 存储/Volume 监控 ============

/**
 * 获取存储使用情况
 * @param params 查询参数
 * @returns 存储使用指标
 */
export async function getVolumeUsageApi(params: GetVolumeUsageParams) {
  return request.get<GetVolumeUsageResponse>({
    url: `${POD_MONITOR_BASE_PATH}/volume/usage`,
    params
  })
}

/**
 * 获取 Volume IOPS
 * @param params 查询参数
 * @returns Volume IOPS 指标
 */
export async function getVolumeIOPSApi(params: GetVolumeIOPSParams) {
  return request.get<GetVolumeIOPSResponse>({
    url: `${POD_MONITOR_BASE_PATH}/volume/iops`,
    params
  })
}

// ============ 健康检查/探针监控 ============

/**
 * 获取探针状态
 * @param params 查询参数
 * @returns 探针状态指标
 */
export async function getProbeStatusApi(params: GetProbeStatusParams) {
  return request.get<GetProbeStatusResponse>({
    url: `${POD_MONITOR_BASE_PATH}/probe/status`,
    params
  })
}

// ============ 文件描述符监控 ============

/**
 * 获取文件描述符使用情况
 * @param params 查询参数
 * @returns 文件描述符指标
 */
export async function getFileDescriptorUsageApi(params: GetFileDescriptorUsageParams) {
  return request.get<GetFileDescriptorUsageResponse>({
    url: `${POD_MONITOR_BASE_PATH}/fd/usage`,
    params
  })
}

// ============ 网络连接监控 ============

/**
 * 获取网络连接情况
 * @param params 查询参数
 * @returns 网络连接指标
 */
export async function getNetworkConnectionsApi(params: GetNetworkConnectionsParams) {
  return request.get<GetNetworkConnectionsResponse>({
    url: `${POD_MONITOR_BASE_PATH}/network/connections`,
    params
  })
}

// ============ 容器详细信息 ============

/**
 * 获取容器状态
 * @param params 查询参数
 * @returns 容器状态指标
 */
export async function getContainerStatusApi(params: GetContainerStatusParams) {
  return request.get<GetContainerStatusResponse>({
    url: `${POD_MONITOR_BASE_PATH}/container/status`,
    params
  })
}

/**
 * 获取容器环境信息
 * @param params 查询参数
 * @returns 容器环境信息
 */
export async function getContainerEnvironmentApi(params: GetContainerEnvironmentParams) {
  return request.get<GetContainerEnvironmentResponse>({
    url: `${POD_MONITOR_BASE_PATH}/container/environment`,
    params
  })
}

// ============ 资源配额 ============

/**
 * 获取命名空间资源配额
 * @param params 查询参数
 * @returns 资源配额指标
 */
export async function getResourceQuotaApi(params: GetResourceQuotaParams) {
  return request.get<GetResourceQuotaResponse>({
    url: `${POD_MONITOR_BASE_PATH}/quota`,
    params
  })
}

// ============ 日志指标 ============

/**
 * 获取容器日志指标
 * @param params 查询参数
 * @returns 容器日志指标
 */
export async function getContainerLogMetricsApi(params: GetContainerLogMetricsParams) {
  return request.get<GetContainerLogMetricsResponse>({
    url: `${POD_MONITOR_BASE_PATH}/logs/metrics`,
    params
  })
}

// ============ 进程指标 ============

/**
 * 获取进程指标
 * @param params 查询参数
 * @returns 进程指标
 */
export async function getProcessMetricsApi(params: GetProcessMetricsParams) {
  return request.get<GetProcessMetricsResponse>({
    url: `${POD_MONITOR_BASE_PATH}/process/metrics`,
    params
  })
}

// ============ 聚合查询 ============

/**
 * 获取 Pod 概览
 * @param params 查询参数
 * @returns Pod 概览信息
 */
export async function getPodOverviewApi(params: GetPodOverviewParams) {
  return request.get<GetPodOverviewResponse>({
    url: `${POD_MONITOR_BASE_PATH}/overview`,
    params
  })
}

/**
 * 列出 Pods 指标
 * @param params 查询参数
 * @returns Pods 指标列表
 */
export async function listPodsMetricsApi(params: ListPodsMetricsParams) {
  return request.get<ListPodsMetricsResponse>({
    url: `${POD_MONITOR_BASE_PATH}/list`,
    params
  })
}

// ============ Top 查询 ============

/**
 * 获取 CPU Top Pods
 * @param params 查询参数
 * @returns CPU Top Pods 排行
 */
export async function getTopPodsByCPUApi(params: GetTopPodsParams) {
  return request.get<GetTopPodsResponse>({
    url: `${POD_MONITOR_BASE_PATH}/top/cpu`,
    params
  })
}

/**
 * 获取内存 Top Pods
 * @param params 查询参数
 * @returns 内存 Top Pods 排行
 */
export async function getTopPodsByMemoryApi(params: GetTopPodsParams) {
  return request.get<GetTopPodsResponse>({
    url: `${POD_MONITOR_BASE_PATH}/top/memory`,
    params
  })
}

/**
 * 获取网络 Top Pods
 * @param params 查询参数
 * @returns 网络 Top Pods 排行
 */
export async function getTopPodsByNetworkApi(params: GetTopPodsParams) {
  return request.get<GetTopPodsResponse>({
    url: `${POD_MONITOR_BASE_PATH}/top/network`,
    params
  })
}

// ==================== 枚举定义 ====================

/**
 * Pod 阶段枚举
 */
export enum PodPhase {
  PENDING = 'Pending',
  RUNNING = 'Running',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown'
}

/**
 * 容器状态枚举
 */
export enum ContainerStateType {
  RUNNING = 'Running',
  WAITING = 'Waiting',
  TERMINATED = 'Terminated'
}

/**
 * 探针类型枚举
 */
export enum ProbeType {
  HTTP = 'HTTP',
  TCP = 'TCP',
  EXEC = 'Exec'
}

/**
 * 探针状态枚举
 */
export enum ProbeStatusType {
  SUCCESS = 'Success',
  FAILURE = 'Failure'
}

// ==================== 工具函数 ====================

/**
 * 格式化字节数为可读格式
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

/**
 * 字节转换为 MB
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns MB 值
 */
export function bytesToMB(bytes: number, decimals: number = 2): number {
  return Number((bytes / (1024 * 1024)).toFixed(decimals))
}

/**
 * 字节转换为 GB
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns GB 值
 */
export function bytesToGB(bytes: number, decimals: number = 2): number {
  return Number((bytes / (1024 * 1024 * 1024)).toFixed(decimals))
}

/**
 * 格式化速率（Bytes/s）
 * @param bytesPerSec 每秒字节数
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatBytesPerSec(bytesPerSec: number, decimals: number = 2): string {
  if (bytesPerSec === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))
  return `${(bytesPerSec / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

/**
 * 格式化百分比
 * @param percent 百分比值
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatPercent(percent: number, decimals: number = 1): string {
  return `${percent.toFixed(decimals)}%`
}

/**
 * 格式化核心数
 * @param cores 核心数
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatCores(cores: number, decimals: number = 2): string {
  return `${cores.toFixed(decimals)} cores`
}

/**
 * 格式化 IOPS
 * @param iops IOPS 值
 * @returns 格式化后的字符串
 */
export function formatIOPS(iops: number): string {
  if (iops >= 1000) {
    return `${(iops / 1000).toFixed(2)}K IOPS`
  }
  return `${iops.toFixed(0)} IOPS`
}

/**
 * 获取最近时间范围参数
 * @param minutes 最近多少分钟
 * @returns 包含 start, end
 */
export function getRecentTimeParams(minutes: number = 60): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime() - minutes * 60 * 1000)
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

/**
 * 创建时间参数
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 包含 start, end
 */
export function createTimeParams(startTime: Date, endTime: Date): { start: string; end: string } {
  return {
    start: startTime.toISOString(),
    end: endTime.toISOString()
  }
}

/**
 * 判断 Pod 是否健康
 * @param overview Pod 概览
 * @returns 是否健康
 */
export function isPodHealthy(overview: PodOverview): boolean {
  return (
    overview.status.phase === PodPhase.RUNNING &&
    overview.status.ready &&
    overview.cpu.usagePercent < 80 &&
    overview.memory.usagePercent < 80
  )
}

/**
 * 获取资源使用等级
 * @param usagePercent 使用百分比
 * @returns 等级 (low, medium, high, critical)
 */
export function getResourceUsageLevel(
  usagePercent: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (usagePercent < 50) return 'low'
  if (usagePercent < 70) return 'medium'
  if (usagePercent < 90) return 'high'
  return 'critical'
}

/**
 * 格式化 Pod 生命周期
 * @param ageSeconds 生命周期秒数
 * @returns 格式化后的字符串
 */
export function formatPodAge(ageSeconds: number): string {
  const days = Math.floor(ageSeconds / 86400)
  const hours = Math.floor((ageSeconds % 86400) / 3600)
  const minutes = Math.floor((ageSeconds % 3600) / 60)

  if (days > 0) return `${days}d${hours}h`
  if (hours > 0) return `${hours}h${minutes}m`
  return `${minutes}m`
}

/**
 * 判断容器是否健康
 * @param container 容器状态
 * @returns 是否健康
 */
export function isContainerHealthy(container: ContainerState): boolean {
  return (
    container.ready &&
    container.state === ContainerStateType.RUNNING &&
    container.restartCount === 0
  )
}

/**
 * 获取探针健康度
 * @param probe 探针状态
 * @returns 健康度百分比
 */
export function getProbeHealthScore(probe: ProbeStatus): number {
  if (probe.totalProbes === 0) return 100
  return (probe.successCount / probe.totalProbes) * 100
}

/**
 * 格式化连接数
 * @param connections 连接数
 * @returns 格式化后的字符串
 */
export function formatConnections(connections: number): string {
  if (connections >= 1000) {
    return `${(connections / 1000).toFixed(1)}K`
  }
  return connections.toString()
}

/**
 * 判断是否有 OOM 风险
 * @param memory 内存指标
 * @returns 是否有风险
 */
export function hasOOMRisk(memory: PodMemoryMetrics): boolean {
  return memory.summary.oomKills > 0 || (memory.limits.hasLimit && memory.current.usagePercent > 90)
}

/**
 * 判断是否有 CPU 节流
 * @param throttling CPU 节流指标
 * @returns 是否有节流
 */
export function hasCPUThrottling(throttling: CPUThrottlingMetrics): boolean {
  return throttling.throttledPercent > 5 // 超过 5% 认为有明显节流
}

/**
 * 获取磁盘使用率
 * @param volume 卷使用情况
 * @returns 使用率百分比
 */
export function getVolumeUsagePercent(volume: VolumeUsage): number {
  if (volume.capacityBytes === 0) return 0
  return (volume.usedBytes / volume.capacityBytes) * 100
}