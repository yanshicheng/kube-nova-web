import request from '@/utils/http'

// 定义基础路径
const CLUSTER_MONITOR_BASE_PATH = '/console/v1/cluster-monitor'

// ==================== 集群资源指标 ====================

/** 集群资源数据点 */
export interface ClusterResourceDataPoint {
  timestamp: number
  usage: number
  usagePercent: number
  requestsPercent: number
}

/** 集群资源汇总 */
export interface ClusterResourceSummary {
  capacity: number
  allocatable: number
  requestsAllocated: number
  limitsAllocated: number
  usage: number
  requestsPercent: number
  usagePercent: number
  trend: ClusterResourceDataPoint[]
  noRequestsCount: number
  noLimitsCount: number
}

/** 集群 Pod 汇总 */
export interface ClusterPodSummary {
  capacity: number
  running: number
  usagePercent: number
}

/** 集群存储汇总 */
export interface ClusterStorageSummary {
  totalCapacityBytes: number
  allocatedBytes: number
  allocationPercent: number
}

/** 集群资源指标 */
export interface ClusterResourceMetrics {
  cpu: ClusterResourceSummary
  memory: ClusterResourceSummary
  pods: ClusterPodSummary
  storage: ClusterStorageSummary
}

// ==================== 节点状态统计 ====================

/** 节点简要状态 */
export interface NodeBriefStatus {
  nodeName: string
  ready: boolean
  memoryPressure: boolean
  diskPressure: boolean
  cpuUsage: number
  memoryUsage: number
  podsCount: number
}

/** 集群节点数据点 */
export interface ClusterNodeDataPoint {
  timestamp: number
  readyNodes: number
  notReadyNodes: number
  avgCPUUsage: number
  avgMemoryUsage: number
}

/** 集群节点指标 */
export interface ClusterNodeMetrics {
  total: number
  ready: number
  notReady: number
  unknown: number
  memoryPressure: number
  diskPressure: number
  pidPressure: number
  avgCPUUsage: number
  avgMemoryUsage: number
  highLoadNodes: number
  nodeList: NodeBriefStatus[]
  trend: ClusterNodeDataPoint[]
}

// ==================== 控制平面指标（完善版）====================

/** 资源类型指标 */
export interface ResourceMetrics {
  resource: string
  requestsPerSecond: number
}

/** HTTP 动词指标 */
export interface VerbMetrics {
  verb: string
  requestsPerSecond: number
}

/** 状态码分布 */
export interface StatusCodeDistribution {
  status2xx: Record<string, number>
  status3xx: Record<string, number>
  status4xx: Record<string, number>
  status5xx: Record<string, number>
}

/** API Server 数据点（完善版）*/
export interface APIServerDataPoint {
  timestamp: number
  requestsPerSecond: number
  errorRate: number
  p95Latency: number
  currentInflightRequests: number
  longRunningRequests: number
}

/** API Server 指标（完善版）*/
export interface APIServerMetrics {
  // 基础指标
  requestsPerSecond: number
  errorRate: number

  // 延迟指标
  p50Latency: number
  p95Latency: number
  p99Latency: number

  // 并发指标
  currentInflightRequests: number
  inflightReadRequests: number
  inflightMutatingRequests: number
  longRunningRequests: number
  watchCount: number

  // 性能指标
  requestDropped: number
  requestTimeout: number
  responseSizeBytes: number
  webhookDurationSeconds: number

  // 认证鉴权
  authenticationAttempts: number
  authenticationFailures: number
  authorizationAttempts: number
  authorizationDuration: number
  clientCertExpirationDays: number

  // 分类统计
  requestsByVerb: VerbMetrics[]
  requestsByCode: StatusCodeDistribution
  requestsByResource: ResourceMetrics[]

  // 趋势数据
  trend: APIServerDataPoint[]
}

/** Etcd 数据点（完善版）*/
export interface EtcdDataPoint {
  timestamp: number
  dbSizeBytes: number
  commitLatency: number
  proposalsFailed: number
  peerRTT: number
  getRate: number
  putRate: number
}

/** Etcd 指标（完善版）*/
export interface EtcdMetrics {
  // 集群状态
  hasLeader: boolean
  leaderChanges: number
  memberCount: number
  isLearner: boolean

  // 存储指标
  dbSizeBytes: number
  dbSizeInUse: number
  dbSizeLimit: number
  keyTotal: number

  // 性能指标
  commitLatency: number
  walFsyncLatency: number
  applyLatency: number
  snapshotLatency: number
  compactLatency: number

  // 网络指标
  peerRTT: number
  networkSendRate: number
  networkRecvRate: number

  // 操作统计
  proposalsFailed: number
  proposalsPending: number
  proposalsApplied: number
  proposalsCommitted: number

  // 操作速率
  getRate: number
  putRate: number
  deleteRate: number

  // 慢操作
  slowApplies: number
  slowCommits: number

  // 趋势数据
  trend: EtcdDataPoint[]
}

/** 调度失败原因 */
export interface ScheduleFailureReasons {
  insufficientCPU: number
  insufficientMemory: number
  nodeAffinity: number
  podAffinity: number
  taint: number
  volumeBinding: number
  noNodesAvailable: number
}

/** 调度器插件延迟 */
export interface SchedulerPluginLatency {
  filterLatency: number
  scoreLatency: number
  preBindLatency: number
  bindLatency: number
}

/** Scheduler 数据点（完善版）*/
export interface SchedulerDataPoint {
  timestamp: number
  scheduleSuccessRate: number
  pendingPods: number
  p95ScheduleLatency: number
  scheduleAttempts: number
}

/** Scheduler 指标（完善版）*/
export interface SchedulerMetrics {
  // 基础指标
  scheduleSuccessRate: number
  scheduleAttempts: number
  pendingPods: number
  unschedulablePods: number

  // 延迟指标
  p50ScheduleLatency: number
  p95ScheduleLatency: number
  p99ScheduleLatency: number
  bindingLatency: number

  // 调度结果
  scheduledPods: number
  failedScheduling: number
  preemptionAttempts: number
  preemptionVictims: number

  // 失败原因
  failureReasons: ScheduleFailureReasons

  // 调度队列
  schedulingQueueLength: number
  activeQueueLength: number
  backoffQueueLength: number

  // 插件延迟
  pluginLatency: SchedulerPluginLatency

  // 趋势数据
  trend: SchedulerDataPoint[]
}

/** 队列延迟指标 */
export interface QueueLatencyMetrics {
  queueDuration: number
  workDuration: number
}

/** 工作队列统计 */
export interface ControllerWorkQueueMetrics {
  addsRate: number
  depthTotal: number
  unfinishedWork: number
  longestRunning: number
  retriesRate: number
}

/** 控制器协调延迟 */
export interface ControllerReconcileLatency {
  deploymentP99: number
  replicaSetP99: number
  statefulSetP99: number
  daemonSetP99: number
  jobP99: number
}

/** Controller Manager 数据点（完善版）*/
export interface ControllerManagerDataPoint {
  timestamp: number
  deploymentQueueDepth: number
  replicaSetQueueDepth: number
  statefulSetQueueDepth: number
  totalQueueDepth: number
  retryRate: number
}

/** Controller Manager 指标（完善版）*/
export interface ControllerManagerMetrics {
  // Leader 选举
  isLeader: boolean
  leaderChanges: number

  // 工作队列深度
  deploymentQueueDepth: number
  replicaSetQueueDepth: number
  statefulSetQueueDepth: number
  daemonSetQueueDepth: number
  jobQueueDepth: number
  nodeQueueDepth: number
  serviceQueueDepth: number
  endpointQueueDepth: number

  // 队列延迟
  queueLatency: QueueLatencyMetrics

  // 工作队列统计
  workQueueMetrics: ControllerWorkQueueMetrics

  // 控制器协调延迟
  reconcileLatency: ControllerReconcileLatency

  // 错误和重试
  totalSyncErrors: number
  retryRate: number

  // 趋势数据
  trend: ControllerManagerDataPoint[]
}

/** 集群控制平面指标 */
export interface ClusterControlPlaneMetrics {
  apiServer: APIServerMetrics
  etcd: EtcdMetrics
  scheduler: SchedulerMetrics
  controllerManager: ControllerManagerMetrics
}

// ==================== 工作负载统计 ====================

/** Pod 重启信息 */
export interface PodRestartInfo {
  namespace: string
  podName: string
  restartCount: number
  restartRate: number
}

/** 集群 Pod 数据点 */
export interface ClusterPodDataPoint {
  timestamp: number
  total: number
  running: number
  pending: number
  failed: number
}

/** 集群 Pod 指标 */
export interface ClusterPodMetrics {
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
  trend: ClusterPodDataPoint[]
}

/** 集群 Deployment 指标 */
export interface ClusterDeploymentMetrics {
  total: number
  availableReplicas: number
  unavailableReplicas: number
  updating: number
}

/** 集群 StatefulSet 指标 */
export interface ClusterStatefulSetMetrics {
  total: number
  readyReplicas: number
  currentReplicas: number
}

/** 集群 DaemonSet 指标 */
export interface ClusterDaemonSetMetrics {
  total: number
  desiredPods: number
  availablePods: number
  unavailablePods: number
}

/** 集群 Job 指标 */
export interface ClusterJobMetrics {
  active: number
  succeeded: number
  failed: number
  cronJobsTotal: number
}

/** Service 类型统计 */
export interface ServiceTypeCount {
  type: string
  count: number
}

/** 集群 Service 指标 */
export interface ClusterServiceMetrics {
  total: number
  byType: ServiceTypeCount[]
}

/** 集群容器指标 */
export interface ClusterContainerMetrics {
  total: number
  running: number
}

/** 集群工作负载指标 */
export interface ClusterWorkloadMetrics {
  pods: ClusterPodMetrics
  deployments: ClusterDeploymentMetrics
  statefulSets: ClusterStatefulSetMetrics
  daemonSets: ClusterDaemonSetMetrics
  jobs: ClusterJobMetrics
  services: ClusterServiceMetrics
  containers: ClusterContainerMetrics
}

// ==================== 网络和存储 ====================

/** 集群网络数据点 */
export interface ClusterNetworkDataPoint {
  timestamp: number
  ingressBytesPerSec: number
  egressBytesPerSec: number
}

/** 集群网络指标 */
export interface ClusterNetworkMetrics {
  totalIngressBytesPerSec: number
  totalEgressBytesPerSec: number
  trend: ClusterNetworkDataPoint[]
}

/** StorageClass 使用情况 */
export interface StorageClassUsage {
  storageClass: string
  pvcCount: number
  totalBytes: number
}

/** 集群存储指标 */
export interface ClusterStorageMetrics {
  pvTotal: number
  pvBound: number
  pvAvailable: number
  pvReleased: number
  pvFailed: number
  pvcTotal: number
  pvcBound: number
  pvcPending: number
  pvcLost: number
  storageClasses: StorageClassUsage[]
}

// ==================== Namespace 统计 ====================

/** Namespace 资源排名 */
export interface NamespaceResourceRanking {
  namespace: string
  value: number
  unit: string
}

/** 集群 Namespace 指标 */
export interface ClusterNamespaceMetrics {
  total: number
  active: number
  topByCPU: NamespaceResourceRanking[]
  topByMemory: NamespaceResourceRanking[]
  topByPods: NamespaceResourceRanking[]
}

// ==================== 集群综合概览 ====================

/** 集群概览 */
export interface ClusterOverview {
  clusterName: string
  timestamp: number
  resources: ClusterResourceMetrics
  nodes: ClusterNodeMetrics
  controlPlane: ClusterControlPlaneMetrics
  workloads: ClusterWorkloadMetrics
  network: ClusterNetworkMetrics
  storage: ClusterStorageMetrics
  namespaces: ClusterNamespaceMetrics
}

// ==================== 请求参数 ====================

/** 基础集群查询参数 */
export interface BaseClusterQueryParams {
  clusterUuid: string
  start?: string
  end?: string
}

/** 集群概览查询参数 */
export type GetClusterOverviewParams = BaseClusterQueryParams

/** 集群资源查询参数 */
export type GetClusterResourcesParams = BaseClusterQueryParams

/** 集群 CPU 查询参数 */
export type GetClusterCPUMetricsParams = BaseClusterQueryParams

/** 集群内存查询参数 */
export type GetClusterMemoryMetricsParams = BaseClusterQueryParams

/** 集群节点查询参数 */
export type GetClusterNodesParams = BaseClusterQueryParams

/** API Server 查询参数 */
export type GetAPIServerMetricsParams = BaseClusterQueryParams

/** Etcd 查询参数 */
export type GetEtcdMetricsParams = BaseClusterQueryParams

/** Scheduler 查询参数 */
export type GetSchedulerMetricsParams = BaseClusterQueryParams

/** Controller Manager 查询参数 */
export type GetControllerManagerMetricsParams = BaseClusterQueryParams

/** 集群工作负载查询参数 */
export type GetClusterWorkloadsParams = BaseClusterQueryParams

/** 集群 Pod 查询参数 */
export type GetClusterPodsParams = BaseClusterQueryParams

/** 集群 Deployment 查询参数 */
export interface GetClusterDeploymentsParams {
  clusterUuid: string
}

/** 集群网络查询参数 */
export type GetClusterNetworkParams = BaseClusterQueryParams

/** 集群存储查询参数 */
export interface GetClusterStorageParams {
  clusterUuid: string
}

/** 集群 Namespace 查询参数 */
export type GetClusterNamespacesParams = BaseClusterQueryParams

// ==================== 响应类型 ====================

export interface GetClusterOverviewResponse {
  data: ClusterOverview
}

export interface GetClusterResourcesResponse {
  data: ClusterResourceMetrics
}

export interface GetClusterCPUMetricsResponse {
  data: ClusterResourceSummary
}

export interface GetClusterMemoryMetricsResponse {
  data: ClusterResourceSummary
}

export interface GetClusterNodesResponse {
  data: ClusterNodeMetrics
}

export interface GetAPIServerMetricsResponse {
  data: APIServerMetrics
}

export interface GetEtcdMetricsResponse {
  data: EtcdMetrics
}

export interface GetSchedulerMetricsResponse {
  data: SchedulerMetrics
}

export interface GetControllerManagerMetricsResponse {
  data: ControllerManagerMetrics
}

export interface GetClusterWorkloadsResponse {
  data: ClusterWorkloadMetrics
}

export interface GetClusterPodsResponse {
  data: ClusterPodMetrics
}

export interface GetClusterDeploymentsResponse {
  data: ClusterDeploymentMetrics
}

export interface GetClusterNetworkResponse {
  data: ClusterNetworkMetrics
}

export interface GetClusterStorageResponse {
  data: ClusterStorageMetrics
}

export interface GetClusterNamespacesResponse {
  data: ClusterNamespaceMetrics
}

// ==================== API 接口 ====================

/**
 * 获取集群综合概览
 */
export async function getClusterOverviewApi(params: GetClusterOverviewParams) {
  return request.get<GetClusterOverviewResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/overview`,
    params
  })
}

/**
 * 获取集群资源指标
 */
export async function getClusterResourcesApi(params: GetClusterResourcesParams) {
  return request.get<GetClusterResourcesResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/resources`,
    params
  })
}

/**
 * 获取集群 CPU 指标
 */
export async function getClusterCPUMetricsApi(params: GetClusterCPUMetricsParams) {
  return request.get<GetClusterCPUMetricsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/cpu`,
    params
  })
}

/**
 * 获取集群内存指标
 */
export async function getClusterMemoryMetricsApi(params: GetClusterMemoryMetricsParams) {
  return request.get<GetClusterMemoryMetricsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/memory`,
    params
  })
}

/**
 * 获取集群节点统计
 */
export async function getClusterNodesApi(params: GetClusterNodesParams) {
  return request.get<GetClusterNodesResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/nodes`,
    params
  })
}

/**
 * 获取 API Server 指标
 */
export async function getAPIServerMetricsApi(params: GetAPIServerMetricsParams) {
  return request.get<GetAPIServerMetricsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/control-plane/apiserver`,
    params
  })
}

/**
 * 获取 Etcd 指标
 */
export async function getEtcdMetricsApi(params: GetEtcdMetricsParams) {
  return request.get<GetEtcdMetricsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/control-plane/etcd`,
    params
  })
}

/**
 * 获取 Scheduler 指标
 */
export async function getSchedulerMetricsApi(params: GetSchedulerMetricsParams) {
  return request.get<GetSchedulerMetricsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/control-plane/scheduler`,
    params
  })
}

/**
 * 获取 Controller Manager 指标
 */
export async function getControllerManagerMetricsApi(params: GetControllerManagerMetricsParams) {
  return request.get<GetControllerManagerMetricsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/control-plane/controller-manager`,
    params
  })
}

/**
 * 获取集群工作负载统计
 */
export async function getClusterWorkloadsApi(params: GetClusterWorkloadsParams) {
  return request.get<GetClusterWorkloadsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/workloads`,
    params
  })
}

/**
 * 获取集群 Pod 统计
 */
export async function getClusterPodsApi(params: GetClusterPodsParams) {
  return request.get<GetClusterPodsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/workloads/pods`,
    params
  })
}

/**
 * 获取集群 Deployment 统计
 */
export async function getClusterDeploymentsApi(params: GetClusterDeploymentsParams) {
  return request.get<GetClusterDeploymentsResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/workloads/deployments`,
    params
  })
}

/**
 * 获取集群网络统计
 */
export async function getClusterNetworkApi(params: GetClusterNetworkParams) {
  return request.get<GetClusterNetworkResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/network`,
    params
  })
}

/**
 * 获取集群存储统计
 */
export async function getClusterStorageApi(params: GetClusterStorageParams) {
  return request.get<GetClusterStorageResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/storage`,
    params
  })
}

/**
 * 获取集群 Namespace 统计
 */
export async function getClusterNamespacesApi(params: GetClusterNamespacesParams) {
  return request.get<GetClusterNamespacesResponse>({
    url: `${CLUSTER_MONITOR_BASE_PATH}/namespaces`,
    params
  })
}

// ==================== 工具函数 ====================

/**
 * 判断集群是否健康
 */
export function isClusterHealthy(overview: ClusterOverview): boolean {
  return (
    overview.nodes.notReady === 0 &&
    overview.resources.cpu.usagePercent < 80 &&
    overview.resources.memory.usagePercent < 80 &&
    overview.controlPlane.etcd.hasLeader &&
    overview.controlPlane.apiServer.errorRate < 0.01
  )
}

/**
 * 获取集群健康分数
 */
export function getClusterHealthScore(overview: ClusterOverview): number {
  let score = 100

  // 节点健康扣分
  if (overview.nodes.notReady > 0) {
    score -= (overview.nodes.notReady / overview.nodes.total) * 30
  }

  // 资源使用扣分
  if (overview.resources.cpu.usagePercent > 80) score -= 10
  if (overview.resources.memory.usagePercent > 80) score -= 10

  // 控制平面扣分
  if (!overview.controlPlane.etcd.hasLeader) score -= 20
  if (overview.controlPlane.apiServer.errorRate > 0.05) score -= 10
  if (overview.controlPlane.scheduler.scheduleSuccessRate < 0.9) score -= 10

  // Pod 状态扣分
  if (overview.workloads.pods.failed > 0) score -= 10
  if (overview.workloads.pods.pending > overview.workloads.pods.total * 0.1) score -= 10

  return Math.max(0, score)
}

/**
 * 获取资源压力等级
 */
export function getResourcePressureLevel(usagePercent: number): 'none' | 'low' | 'medium' | 'high' {
  if (usagePercent < 60) return 'none'
  if (usagePercent < 75) return 'low'
  if (usagePercent < 90) return 'medium'
  return 'high'
}

/**
 * 格式化 Etcd 数据库大小
 */
export function formatEtcdDBSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

/**
 * 判断是否有 API Server 性能问题（完善版）
 */
export function hasAPIServerIssues(apiServer: APIServerMetrics): boolean {
  return (
    apiServer.errorRate > 0.01 ||
    apiServer.p95Latency > 1 || // 改为秒
    apiServer.currentInflightRequests > 600 ||
    apiServer.requestDropped > 0 ||
    apiServer.requestTimeout > 0 ||
    apiServer.clientCertExpirationDays < 30
  )
}

/**
 * 判断是否有调度器问题（完善版）
 */
export function hasSchedulerIssues(scheduler: SchedulerMetrics): boolean {
  return (
    scheduler.scheduleSuccessRate < 0.95 ||
    scheduler.pendingPods > 10 ||
    scheduler.unschedulablePods > 0 ||
    scheduler.failedScheduling > 5 ||
    scheduler.p95ScheduleLatency > 1 // 改为秒
  )
}

/**
 * 判断是否有 Etcd 问题（完善版）
 */
export function hasEtcdIssues(etcd: EtcdMetrics): boolean {
  return (
    !etcd.hasLeader ||
    etcd.commitLatency > 0.025 || // 25ms，秒为单位
    etcd.walFsyncLatency > 0.01 || // 10ms
    etcd.proposalsFailed > 0 ||
    etcd.slowApplies > 0 ||
    etcd.slowCommits > 0 ||
    (etcd.dbSizeLimit > 0 && etcd.dbSizeBytes / etcd.dbSizeLimit > 0.8)
  )
}

/**
 * 判断是否有 Controller Manager 问题（新增）
 */
export function hasControllerManagerIssues(cm: ControllerManagerMetrics): boolean {
  return (
    !cm.isLeader ||
    cm.leaderChanges > 0 ||
    cm.workQueueMetrics.depthTotal > 1000 ||
    cm.workQueueMetrics.longestRunning > 300 ||
    cm.totalSyncErrors > 10 ||
    cm.retryRate > 10
  )
}

/**
 * 获取节点健康度
 */
export function getNodeHealthPercentage(nodes: ClusterNodeMetrics): number {
  if (nodes.total === 0) return 0
  return (nodes.ready / nodes.total) * 100
}

/**
 * 判断是否有存储问题
 */
export function hasStorageIssues(storage: ClusterStorageMetrics): boolean {
  return storage.pvFailed > 0 || storage.pvcPending > 0 || storage.pvcLost > 0
}

/**
 * 获取工作负载健康状态
 */
export function getWorkloadHealthStatus(
  workloads: ClusterWorkloadMetrics
): 'healthy' | 'warning' | 'critical' {
  const failedPods = workloads.pods.failed
  const pendingPods = workloads.pods.pending
  const totalPods = workloads.pods.total

  if (failedPods === 0 && pendingPods === 0) return 'healthy'
  if (failedPods > 0 || pendingPods > totalPods * 0.1) return 'critical'
  return 'warning'
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

/**
 * 获取 API Server QPS 等级
 */
export function getAPIServerQPSLevel(qps: number): 'low' | 'normal' | 'high' | 'very_high' {
  if (qps < 100) return 'low'
  if (qps < 500) return 'normal'
  if (qps < 1000) return 'high'
  return 'very_high'
}

/**
 * 格式化延迟（秒转毫秒）
 */
export function formatLatency(seconds: number): string {
  const ms = seconds * 1000
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`
  if (ms < 1000) return `${ms.toFixed(2)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/**
 * 获取 Etcd 健康等级
 */
export function getEtcdHealthLevel(etcd: EtcdMetrics): 'healthy' | 'warning' | 'critical' {
  if (!etcd.hasLeader) return 'critical'
  if (etcd.commitLatency > 0.1 || etcd.proposalsFailed > 0) return 'critical'
  if (etcd.commitLatency > 0.025 || etcd.slowApplies > 0) return 'warning'
  return 'healthy'
}

/**
 * 获取调度器健康等级（新增）
 */
export function getSchedulerHealthLevel(
  scheduler: SchedulerMetrics
): 'healthy' | 'warning' | 'critical' {
  if (scheduler.scheduleSuccessRate < 0.8) return 'critical'
  if (scheduler.unschedulablePods > 10 || scheduler.pendingPods > 50) return 'critical'
  if (scheduler.scheduleSuccessRate < 0.95 || scheduler.pendingPods > 10) return 'warning'
  return 'healthy'
}

/**
 * 获取调度失败主要原因（新增）
 */
export function getTopScheduleFailureReason(reasons: ScheduleFailureReasons): string {
  const entries = Object.entries(reasons)
  if (entries.length === 0) return 'None'

  const sorted = entries.sort((a, b) => b[1] - a[1])
  const [reason, count] = sorted[0]

  if (count === 0) return 'None'

  const reasonMap: Record<string, string> = {
    insufficientCPU: 'CPU 不足',
    insufficientMemory: '内存不足',
    nodeAffinity: '节点亲和性',
    podAffinity: 'Pod 亲和性',
    taint: '节点污点',
    volumeBinding: '卷绑定失败',
    noNodesAvailable: '无可用节点'
  }

  return reasonMap[reason] || reason
}

/**
 * 获取控制器队列总深度（新增）
 */
export function getTotalControllerQueueDepth(cm: ControllerManagerMetrics): number {
  return (
    cm.deploymentQueueDepth +
    cm.replicaSetQueueDepth +
    cm.statefulSetQueueDepth +
    cm.daemonSetQueueDepth +
    cm.jobQueueDepth +
    cm.nodeQueueDepth +
    cm.serviceQueueDepth +
    cm.endpointQueueDepth
  )
}

/**
 * 获取最繁忙的控制器（新增）
 */
export function getBusiestController(cm: ControllerManagerMetrics): {
  name: string
  depth: number
} {
  const controllers = {
    Deployment: cm.deploymentQueueDepth,
    ReplicaSet: cm.replicaSetQueueDepth,
    StatefulSet: cm.statefulSetQueueDepth,
    DaemonSet: cm.daemonSetQueueDepth,
    Job: cm.jobQueueDepth,
    Node: cm.nodeQueueDepth,
    Service: cm.serviceQueueDepth,
    Endpoint: cm.endpointQueueDepth
  }

  const entries = Object.entries(controllers)
  const sorted = entries.sort((a, b) => b[1] - a[1])

  return {
    name: sorted[0][0],
    depth: sorted[0][1]
  }
}

/**
 * 计算 API Server 并发使用率（新增）
 */
export function getAPIServerConcurrencyRate(apiServer: APIServerMetrics): number {
  // 假设最大并发为 600
  const maxConcurrency = 600
  return (apiServer.currentInflightRequests / maxConcurrency) * 100
}

/**
 * 判断是否需要 Etcd 压缩（新增）
 */
export function needsEtcdCompaction(etcd: EtcdMetrics): boolean {
  // DB 大小超过 2GB 或使用率超过 80%
  const sizeThresholdBytes = 2 * 1024 * 1024 * 1024 // 2GB
  const usageRate = etcd.dbSizeLimit > 0 ? etcd.dbSizeBytes / etcd.dbSizeLimit : 0

  return etcd.dbSizeBytes > sizeThresholdBytes || usageRate > 0.8
}

/**
 * 获取 Etcd 性能评级（新增）
 */
export function getEtcdPerformanceGrade(etcd: EtcdMetrics): 'A' | 'B' | 'C' | 'D' | 'F' {
  let score = 100

  // Commit 延迟评分
  if (etcd.commitLatency > 0.1) score -= 30
  else if (etcd.commitLatency > 0.05) score -= 20
  else if (etcd.commitLatency > 0.025) score -= 10

  // WAL Fsync 延迟评分
  if (etcd.walFsyncLatency > 0.05) score -= 20
  else if (etcd.walFsyncLatency > 0.01) score -= 10

  // 慢操作评分
  if (etcd.slowApplies > 0) score -= 15
  if (etcd.slowCommits > 0) score -= 15

  // Proposal 失败评分
  if (etcd.proposalsFailed > 0) score -= 10

  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * 获取控制平面整体健康状态（新增）
 */
export function getControlPlaneHealthStatus(controlPlane: ClusterControlPlaneMetrics): {
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
} {
  const issues: string[] = []

  // API Server 检查
  if (hasAPIServerIssues(controlPlane.apiServer)) {
    issues.push('API Server 存在性能问题')
  }

  // Etcd 检查
  if (hasEtcdIssues(controlPlane.etcd)) {
    issues.push('Etcd 存在性能或健康问题')
  }

  // Scheduler 检查
  if (hasSchedulerIssues(controlPlane.scheduler)) {
    issues.push('Scheduler 存在调度问题')
  }

  // Controller Manager 检查
  if (hasControllerManagerIssues(controlPlane.controllerManager)) {
    issues.push('Controller Manager 存在协调问题')
  }

  if (issues.length === 0) return { status: 'healthy', issues: [] }
  if (issues.length <= 2) return { status: 'warning', issues }
  return { status: 'critical', issues }
}
