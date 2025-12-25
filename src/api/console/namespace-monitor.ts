import request from '@/utils/http'

// 定义基础路径
const NAMESPACE_MONITOR_BASE_PATH = '/console/v1/namespace-monitor'

// ==================== 通用类型 ====================

/** 容器资源排名 */
export interface ContainerResourceRanking {
  podName: string
  containerName: string
  value: number
  unit: string
}

/** 资源排名 */
export interface ResourceRanking {
  name: string
  value: number
  unit: string
}

/** Service 类型统计 */
export interface ServiceTypeCount {
  type: string
  count: number
}

/** StorageClass 使用情况 */
export interface StorageClassUsage {
  storageClass: string
  pvcCount: number
  totalBytes: number
}

/** Pod 重启信息 */
export interface PodRestartInfo {
  namespace: string
  podName: string
  restartCount: number
  restartRate: number
}

/** 资源配额详情 */
export interface ResourceQuotaDetail {
  resource: string
  used: string
  hard: string
  percent: number
}

// ==================== Namespace 综合指标 ====================

/** Namespace 综合指标 */
export interface NamespaceMetrics {
  namespace: string
  timestamp: number
  resources: NamespaceResourceMetrics
  quota: NamespaceQuotaMetrics
  workloads: NamespaceWorkloadMetrics
  network: NamespaceNetworkMetrics
  storage: NamespaceStorageMetrics
  config: NamespaceConfigMetrics
}

// ==================== Namespace 资源使用 ====================

/** Namespace CPU 快照 */
export interface NamespaceCPUSnapshot {
  timestamp: number
  usageCores: number
  avgCores: number
  maxCores: number
  usagePercent: number
}

/** Namespace CPU 数据点 */
export interface NamespaceCPUDataPoint {
  timestamp: number
  usageCores: number
  usagePercent: number
}

/** Namespace CPU 指标 */
export interface NamespaceCPUMetrics {
  current: NamespaceCPUSnapshot
  requests: number
  limits: number
  trend: NamespaceCPUDataPoint[]
  topPods: ResourceRanking[]
  topContainers: ContainerResourceRanking[]
  containersNoRequests: number
  containersNoLimits: number
}

/** Namespace 内存快照 */
export interface NamespaceMemorySnapshot {
  timestamp: number
  workingSetBytes: number
  rssBytes: number
  cacheBytes: number
  avgBytes: number
  maxBytes: number
  usagePercent: number
}

/** Namespace 内存数据点 */
export interface NamespaceMemoryDataPoint {
  timestamp: number
  workingSetBytes: number
  usagePercent: number
}

/** Namespace 内存指标 */
export interface NamespaceMemoryMetrics {
  current: NamespaceMemorySnapshot
  requests: number
  limits: number
  trend: NamespaceMemoryDataPoint[]
  topPods: ResourceRanking[]
  topContainers: ContainerResourceRanking[]
  oomKills: number
}

/** Namespace 资源指标 */
export interface NamespaceResourceMetrics {
  cpu: NamespaceCPUMetrics
  memory: NamespaceMemoryMetrics
}

// ==================== 配额管理 ====================

/** 配额使用情况 */
export interface QuotaUsage {
  hard: number
  used: number
  usagePercent: number
  hasQuota: boolean
}

/** Namespace 配额指标 */
export interface NamespaceQuotaMetrics {
  hasQuota: boolean
  quotaName?: string
  cpu: QuotaUsage
  memory: QuotaUsage
  pods: QuotaUsage
  services: QuotaUsage
  configMaps: QuotaUsage
  secrets: QuotaUsage
  pvcs: QuotaUsage
  storage: QuotaUsage
  allResources?: ResourceQuotaDetail[]
}

// ==================== 工作负载统计 ====================

/** Namespace Pod 数据点 */
export interface NamespacePodDataPoint {
  timestamp: number
  total: number
  running: number
  pending: number
  failed: number
}

/** Namespace Pod 统计 */
export interface NamespacePodStatistics {
  total: number
  running: number
  pending: number
  failed: number
  succeeded: number
  unknown: number
  ready: number
  notReady: number
  totalRestarts: number
  highRestartPods: PodRestartInfo[]
  trend: NamespacePodDataPoint[]
}

/** Namespace Deployment 统计 */
export interface NamespaceDeploymentStatistics {
  total: number
  desiredReplicas: number
  availableReplicas: number
  unavailableReplicas: number
  updating: number
}

/** Namespace StatefulSet 统计 */
export interface NamespaceStatefulSetStatistics {
  total: number
  desiredReplicas: number
  readyReplicas: number
  currentReplicas: number
}

/** Namespace DaemonSet 统计 */
export interface NamespaceDaemonSetStatistics {
  total: number
  desiredScheduled: number
  currentScheduled: number
  availableScheduled: number
  unavailableScheduled: number
}

/** Namespace Job 统计 */
export interface NamespaceJobStatistics {
  active: number
  succeeded: number
  failed: number
  cronJobsTotal: number
  avgDuration: number
}

/** Namespace 容器统计 */
export interface NamespaceContainerStatistics {
  total: number
  running: number
  waiting: number
  terminated: number
}

/** Namespace Service 统计 */
export interface NamespaceServiceStatistics {
  total: number
  byType: ServiceTypeCount[]
  withoutEndpoints: number
}

/** Namespace Endpoint 统计 */
export interface NamespaceEndpointStatistics {
  totalAddresses: number
  servicesWithEndpoints: number
}

/** Namespace Ingress 统计 */
export interface NamespaceIngressStatistics {
  total: number
  pathCount: number
}

/** Namespace 工作负载指标 */
export interface NamespaceWorkloadMetrics {
  pods: NamespacePodStatistics
  deployments: NamespaceDeploymentStatistics
  statefulSets: NamespaceStatefulSetStatistics
  daemonSets: NamespaceDaemonSetStatistics
  jobs: NamespaceJobStatistics
  containers: NamespaceContainerStatistics
  services: NamespaceServiceStatistics
  endpoints: NamespaceEndpointStatistics
  ingresses: NamespaceIngressStatistics
}

// ==================== 网络指标 ====================

/** Namespace 网络快照 */
export interface NamespaceNetworkSnapshot {
  timestamp: number
  receiveBytesPerSec: number
  transmitBytesPerSec: number
  receivePacketsPerSec: number
  transmitPacketsPerSec: number
  receiveErrors: number
  transmitErrors: number
  receiveDrops: number
  transmitDrops: number
}

/** Namespace 网络数据点 */
export interface NamespaceNetworkDataPoint {
  timestamp: number
  receiveBytesPerSec: number
  transmitBytesPerSec: number
}

/** Namespace 网络统计 */
export interface NamespaceNetworkSummary {
  totalReceiveBytes: number
  totalTransmitBytes: number
  maxReceiveBytesPerSec: number
  maxTransmitBytesPerSec: number
  avgReceiveBytesPerSec: number
  avgTransmitBytesPerSec: number
  totalErrors: number
}

/** Namespace 网络指标 */
export interface NamespaceNetworkMetrics {
  current: NamespaceNetworkSnapshot
  trend: NamespaceNetworkDataPoint[]
  summary: NamespaceNetworkSummary
  topPodsByRx: ResourceRanking[]
  topPodsByTx: ResourceRanking[]
}

// ==================== 存储指标 ====================

/** Namespace 存储指标 */
export interface NamespaceStorageMetrics {
  pvcTotal: number
  pvcBound: number
  pvcPending: number
  pvcLost: number
  totalRequestedBytes: number
  byStorageClass: StorageClassUsage[]
}

// ==================== 配置管理 ====================

/** ConfigMap 统计 */
export interface ConfigMapStatistics {
  total: number
  dataItems: number
}

/** Secret 类型统计 */
export interface SecretTypeCount {
  type: string
  count: number
}

/** Secret 统计 */
export interface SecretStatistics {
  total: number
  byType: SecretTypeCount[]
}

/** Namespace 配置指标 */
export interface NamespaceConfigMetrics {
  configMaps: ConfigMapStatistics
  secrets: SecretStatistics
}

// ==================== Namespace 对比 ====================

/** Namespace 对比项 */
export interface NamespaceComparisonItem {
  namespace: string
  cpuUsage: number
  memoryUsage: number
  podCount: number
  networkRxRate: number
  networkTxRate: number
}

/** Namespace 对比 */
export interface NamespaceComparison {
  namespaces: NamespaceComparisonItem[]
  timestamp: number
}

// ==================== Namespace 简要信息 ====================

/** Namespace 简要信息 */
export interface NamespaceBrief {
  namespace: string
  status: string
  podCount: number
  cpuUsage: number
  memoryUsage: number
  createdAt: number
}

// ==================== Namespace 排行 ====================

/** Namespace 排行项 */
export interface NamespaceRankingItem {
  namespace: string
  value: number
  unit: string
}

// ==================== 请求参数 ====================

/** 基础查询参数 */
export interface BaseNamespaceQueryParams {
  clusterUuid: string
  namespace: string
  start?: string
  end?: string
}

/** 获取 Namespace 指标参数 */
export type GetNamespaceMetricsParams = BaseNamespaceQueryParams

/** 获取 Namespace CPU 参数 */
export type GetNamespaceCPUParams = BaseNamespaceQueryParams

/** 获取 Namespace 内存参数 */
export type GetNamespaceMemoryParams = BaseNamespaceQueryParams

/** 获取 Namespace 网络参数 */
export type GetNamespaceNetworkParams = BaseNamespaceQueryParams

/** 获取 Namespace 配额参数 */
export interface GetNamespaceQuotaParams {
  clusterUuid: string
  namespace: string
}

/** 获取 Namespace 工作负载参数 */
export type GetNamespaceWorkloadsParams = BaseNamespaceQueryParams

/** 获取 Namespace Pod 参数 */
export type GetNamespacePodsParams = BaseNamespaceQueryParams

/** 获取 Namespace Deployment 参数 */
export interface GetNamespaceDeploymentsParams {
  clusterUuid: string
  namespace: string
}

/** 获取 Namespace Service 参数 */
export interface GetNamespaceServicesParams {
  clusterUuid: string
  namespace: string
}

/** 获取 Namespace 存储参数 */
export interface GetNamespaceStorageParams {
  clusterUuid: string
  namespace: string
}

/** 获取 Namespace 配置参数 */
export interface GetNamespaceConfigParams {
  clusterUuid: string
  namespace: string
}

/** 获取 Top Pods 参数 */
export interface GetNamespaceTopPodsParams {
  clusterUuid: string
  namespace: string
  limit?: number
  start?: string
  end?: string
}

/** 获取 Top Containers 参数 */
export interface GetNamespaceTopContainersParams {
  clusterUuid: string
  namespace: string
  limit?: number
  start?: string
  end?: string
}

/** 对比 Namespace 参数 */
export interface CompareNamespacesParams {
  clusterUuid: string
  namespaces: string[]
  start?: string
  end?: string
}

// ==================== 响应类型 ====================

export interface GetNamespaceMetricsResponse {
  data: NamespaceMetrics
}

export interface GetNamespaceCPUResponse {
  data: NamespaceCPUMetrics
}

export interface GetNamespaceMemoryResponse {
  data: NamespaceMemoryMetrics
}

export interface GetNamespaceNetworkResponse {
  data: NamespaceNetworkMetrics
}

export interface GetNamespaceQuotaResponse {
  data: NamespaceQuotaMetrics
}

export interface GetNamespaceWorkloadsResponse {
  data: NamespaceWorkloadMetrics
}

export interface GetNamespacePodsResponse {
  data: NamespacePodStatistics
}

export interface GetNamespaceDeploymentsResponse {
  data: NamespaceDeploymentStatistics
}

export interface GetNamespaceServicesResponse {
  data: NamespaceServiceStatistics
}

export interface GetNamespaceStorageResponse {
  data: NamespaceStorageMetrics
}

export interface GetNamespaceConfigResponse {
  data: NamespaceConfigMetrics
}

export interface GetNamespaceTopPodsResponse {
  data: ResourceRanking[]
}

export interface GetNamespaceTopContainersResponse {
  data: ContainerResourceRanking[]
}

export interface CompareNamespacesResponse {
  data: NamespaceComparison
}

// ==================== API 接口 ====================

/**
 * 获取 Namespace 综合指标
 */
export async function getNamespaceMetricsApi(params: GetNamespaceMetricsParams) {
  return request.get<GetNamespaceMetricsResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/metrics`,
    params
  })
}

/**
 * 获取 Namespace CPU 指标
 */
export async function getNamespaceCPUApi(params: GetNamespaceCPUParams) {
  return request.get<GetNamespaceCPUResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/cpu`,
    params
  })
}

/**
 * 获取 Namespace 内存指标
 */
export async function getNamespaceMemoryApi(params: GetNamespaceMemoryParams) {
  return request.get<GetNamespaceMemoryResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/memory`,
    params
  })
}

/**
 * 获取 Namespace 网络指标
 */
export async function getNamespaceNetworkApi(params: GetNamespaceNetworkParams) {
  return request.get<GetNamespaceNetworkResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/network`,
    params
  })
}

/**
 * 获取 Namespace 资源配额
 */
export async function getNamespaceQuotaApi(params: GetNamespaceQuotaParams) {
  return request.get<GetNamespaceQuotaResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/quota`,
    params
  })
}

/**
 * 获取 Namespace 工作负载统计
 */
export async function getNamespaceWorkloadsApi(params: GetNamespaceWorkloadsParams) {
  return request.get<GetNamespaceWorkloadsResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/workloads`,
    params
  })
}

/**
 * 获取 Namespace Pod 统计
 */
export async function getNamespacePodsApi(params: GetNamespacePodsParams) {
  return request.get<GetNamespacePodsResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/pods`,
    params
  })
}

/**
 * 获取 Namespace Deployment 统计
 */
export async function getNamespaceDeploymentsApi(params: GetNamespaceDeploymentsParams) {
  return request.get<GetNamespaceDeploymentsResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/deployments`,
    params
  })
}

/**
 * 获取 Namespace Service 统计
 */
export async function getNamespaceServicesApi(params: GetNamespaceServicesParams) {
  return request.get<GetNamespaceServicesResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/services`,
    params
  })
}

/**
 * 获取 Namespace 存储指标
 */
export async function getNamespaceStorageApi(params: GetNamespaceStorageParams) {
  return request.get<GetNamespaceStorageResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/storage`,
    params
  })
}

/**
 * 获取 Namespace 配置指标
 */
export async function getNamespaceConfigApi(params: GetNamespaceConfigParams) {
  return request.get<GetNamespaceConfigResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/config`,
    params
  })
}

/**
 * 获取 Namespace Top Pods (CPU)
 */
export async function getNamespaceTopPodsByCPUApi(params: GetNamespaceTopPodsParams) {
  return request.get<GetNamespaceTopPodsResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/top/pods/cpu`,
    params
  })
}

/**
 * 获取 Namespace Top Pods (Memory)
 */
export async function getNamespaceTopPodsByMemoryApi(params: GetNamespaceTopPodsParams) {
  return request.get<GetNamespaceTopPodsResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/top/pods/memory`,
    params
  })
}

/**
 * 获取 Namespace Top Pods (Network)
 */
export async function getNamespaceTopPodsByNetworkApi(params: GetNamespaceTopPodsParams) {
  return request.get<GetNamespaceTopPodsResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/top/pods/network`,
    params
  })
}

/**
 * 获取 Namespace Top Containers (CPU)
 */
export async function getNamespaceTopContainersByCPUApi(params: GetNamespaceTopContainersParams) {
  return request.get<GetNamespaceTopContainersResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/top/containers/cpu`,
    params
  })
}

/**
 * 获取 Namespace Top Containers (Memory)
 */
export async function getNamespaceTopContainersByMemoryApi(
  params: GetNamespaceTopContainersParams
) {
  return request.get<GetNamespaceTopContainersResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/top/containers/memory`,
    params
  })
}

/**
 * 对比多个 Namespace
 */
export async function compareNamespacesApi(params: CompareNamespacesParams) {
  return request.get<CompareNamespacesResponse>({
    url: `${NAMESPACE_MONITOR_BASE_PATH}/compare`,
    params
  })
}

// ==================== 工具函数 ====================

/**
 * 判断 Namespace 是否健康
 */
export function isNamespaceHealthy(metrics: NamespaceMetrics): boolean {
  return (
    metrics.resources.cpu.current.usagePercent < 80 &&
    metrics.resources.memory.current.usagePercent < 80 &&
    metrics.workloads.pods.failed === 0
  )
}

/**
 * 判断 Namespace 是否超配额
 */
export function isNamespaceOverQuota(quota: NamespaceQuotaMetrics): boolean {
  return quota.cpu.usagePercent > 90 || quota.memory.usagePercent > 90 || quota.pods.usagePercent > 90
}

/**
 * 获取配额使用等级
 */
export function getQuotaUsageLevel(percent: number): 'safe' | 'warning' | 'critical' {
  if (percent < 70) return 'safe'
  if (percent < 90) return 'warning'
  return 'critical'
}

/**
 * 获取 Namespace 健康分数
 */
export function getNamespaceHealthScore(metrics: NamespaceMetrics): number {
  let score = 100

  // 资源使用扣分
  if (metrics.resources.cpu.current.usagePercent > 80) score -= 15
  if (metrics.resources.memory.current.usagePercent > 80) score -= 15

  // Pod 状态扣分
  if (metrics.workloads.pods.failed > 0) score -= 20
  if (metrics.workloads.pods.pending > metrics.workloads.pods.total * 0.1) score -= 10

  // 配额扣分
  if (metrics.quota.hasQuota) {
    if (metrics.quota.cpu.usagePercent > 90) score -= 20
    if (metrics.quota.memory.usagePercent > 90) score -= 20
  }

  return Math.max(0, score)
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