import request from '@/utils/http'

// 定义基础路径
const FLAGGER_MONITOR_BASE_PATH = '/console/v1/flagger-monitor'

// ==================== Canary 状态 ====================

/** Canary 状态 */
export interface CanaryStatus {
  phase: string
  phaseCode: number
  lastTransition: number
}

// ==================== Canary 进度 ====================

/** Canary 进度数据点 */
export interface CanaryProgressDataPoint {
  timestamp: number
  weight: number
  iteration: number
}

/** Canary 进度 */
export interface CanaryProgress {
  currentWeight: number
  targetWeight: number
  iteration: number
  progressPercent: number
  trend: CanaryProgressDataPoint[]
}

// ==================== Canary 分析 ====================

/** 指标检查结果 */
export interface MetricCheckResult {
  metricName: string
  checksPassed: number
  checksFailed: number
  successRate: number
  lastCheck: number
}

/** Canary 分析数据点 */
export interface CanaryAnalysisDataPoint {
  timestamp: number
  checkSuccessRate: number
  failedChecks: number
}

/** Canary 分析 */
export interface CanaryAnalysis {
  metricChecks: MetricCheckResult[]
  checkSuccessRate: number
  totalChecks: number
  failedChecks: number
  trend: CanaryAnalysisDataPoint[]
}

// ==================== Canary 对比 ====================

/** 工作负载指标 */
export interface WorkloadMetrics {
  successRate: number
  errorRate: number
  p50Latency: number
  p95Latency: number
  p99Latency: number
  requestRate: number
}

/** Canary 对比数据点 */
export interface CanaryComparisonDataPoint {
  timestamp: number
  canarySuccessRate: number
  primarySuccessRate: number
  canaryP95Latency: number
  primaryP95Latency: number
  canaryErrorRate: number
  primaryErrorRate: number
}

/** Canary 对比 */
export interface CanaryComparison {
  canaryMetrics: WorkloadMetrics
  primaryMetrics: WorkloadMetrics
  trend: CanaryComparisonDataPoint[]
}

// ==================== Canary 持续时间 ====================

/** Canary 持续时间 */
export interface CanaryDuration {
  startTime: number
  endTime?: number
  durationSeconds: number
}

// ==================== Canary 数据点 ====================

/** Canary 数据点 */
export interface CanaryDataPoint {
  timestamp: number
  phase: string
  phaseCode: number
  weight: number
  iteration: number
}

// ==================== Canary 指标 ====================

/** Canary 指标 */
export interface CanaryMetrics {
  name: string
  namespace: string
  target: string
  status: CanaryStatus
  progress: CanaryProgress
  analysis: CanaryAnalysis
  comparison: CanaryComparison
  trend: CanaryDataPoint[]
  duration: CanaryDuration
  lastUpdateTime: number
}

// ==================== Flagger 统计 ====================

/** Flagger 持续时间数据点 */
export interface FlaggerDurationDataPoint {
  timestamp: number
  avgDurationSeconds: number
  p95DurationSeconds: number
}

/** Flagger 持续时间统计 */
export interface FlaggerDurationStatistics {
  avgDurationSeconds: number
  minDurationSeconds: number
  maxDurationSeconds: number
  p50DurationSeconds: number
  p95DurationSeconds: number
  p99DurationSeconds: number
  trend: FlaggerDurationDataPoint[]
}

/** Flagger Webhook 数据点 */
export interface FlaggerWebhookDataPoint {
  timestamp: number
  totalRequests: number
  successRate: number
}

/** Flagger Webhook 统计 */
export interface FlaggerWebhookStatistics {
  totalRequests: number
  successRequests: number
  failedRequests: number
  successRate: number
  failureRate: number
  trend: FlaggerWebhookDataPoint[]
}

/** Flagger 统计数据点 */
export interface FlaggerStatisticsDataPoint {
  timestamp: number
  totalCanaries: number
  activeCanaries: number
  successCanaries: number
  failedCanaries: number
  successRate: number
}

/** Flagger 统计 */
export interface FlaggerStatistics {
  totalCanaries: number
  activeCanaries: number
  waitingCanaries: number
  successCanaries: number
  failedCanaries: number
  successRate: number
  failureRate: number
  duration: FlaggerDurationStatistics
  webhookStats: FlaggerWebhookStatistics
  trend: FlaggerStatisticsDataPoint[]
}

// ==================== Flagger Controller 健康 ====================

/** Flagger Controller 数据点 */
export interface FlaggerControllerDataPoint {
  timestamp: number
  reconcileTotal: number
  reconcileErrorRate: number
  avgReconcileTime: number
}

/** Flagger Controller 健康 */
export interface FlaggerControllerHealth {
  reconcileTotal: number
  reconcileErrors: number
  reconcileErrorRate: number
  avgReconcileTime: number
  p95ReconcileTime: number
  trend: FlaggerControllerDataPoint[]
}

// ==================== Canary 列表 ====================

/** Canary 简要信息 */
export interface CanaryBrief {
  name: string
  namespace: string
  target: string
  phase: string
  currentWeight: number
  iteration: number
  lastUpdate: number
}

/** Canary 列表摘要 */
export interface CanaryListSummary {
  total: number
  active: number
  waiting: number
  succeeded: number
  failed: number
  initialized: number
}

/** Canary 列表指标 */
export interface CanaryListMetrics {
  timestamp: number
  canaries: CanaryBrief[]
  summary: CanaryListSummary
}

// ==================== Namespace Canary 统计 ====================

/** Namespace Canary 统计 */
export interface NamespaceCanaryStatistics {
  total: number
  active: number
  successRate: number
  avgDuration: number
}

/** Namespace Canary 指标 */
export interface NamespaceCanaryMetrics {
  namespace: string
  timestamp: number
  canaries: CanaryBrief[]
  statistics: NamespaceCanaryStatistics
}

// ==================== Canary 排行 ====================

/** Canary 排行项 */
export interface CanaryRankingItem {
  namespace: string
  name: string
  value: number
  unit: string
}

/** Canary 排行 */
export interface CanaryRanking {
  topByDuration: CanaryRankingItem[]
  topByIterations: CanaryRankingItem[]
  topByFailedChecks: CanaryRankingItem[]
  recentFailed: CanaryBrief[]
  recentSucceeded: CanaryBrief[]
}

// ==================== Canary 历史记录 ====================

/** Canary 历史记录项 */
export interface CanaryHistoryRecord {
  startTime: number
  endTime: number
  durationSeconds: number
  finalPhase: string
  maxWeight: number
  iterations: number
  failedChecks: number
}

/** Canary 历史记录 */
export interface CanaryHistory {
  namespace: string
  name: string
  records: CanaryHistoryRecord[]
}

// ==================== Canary 实时监控 ====================

/** Canary 实时监控指标 */
export interface CanaryRealtimeMetrics {
  namespace: string
  name: string
  timestamp: number
  currentStatus: CanaryStatus
  currentWeight: number
  comparison: CanaryComparison
  recentChecks: MetricCheckResult[]
}

// ==================== Flagger 综合指标 ====================

/** Flagger 综合指标 */
export interface FlaggerMetrics {
  timestamp: number
  canaries: CanaryMetrics[]
  statistics: FlaggerStatistics
  controller: FlaggerControllerHealth
}

// ==================== 请求参数 ====================

/** 基础查询参数 */
export interface BaseFlaggerQueryParams {
  clusterUuid: string
  start?: string
  end?: string
}

/** Canary 查询参数 */
export interface BaseCanaryQueryParams {
  clusterUuid: string
  namespace: string
  name: string
  start?: string
  end?: string
}

/** Canary 状态查询参数 */
export interface GetCanaryStatusParams {
  clusterUuid: string
  namespace: string
  name: string
}

/** Canary 持续时间查询参数 */
export interface GetCanaryDurationParams {
  clusterUuid: string
  namespace: string
  name: string
}

/** Canary 列表查询参数 */
export interface ListCanariesParams {
  clusterUuid: string
  namespace: string
}

/** 所有 Canary 列表查询参数 */
export interface ListAllCanariesParams {
  clusterUuid: string
}

/** Namespace Canary 查询参数 */
export interface GetNamespaceCanaryMetricsParams {
  clusterUuid: string
  namespace: string
  start?: string
  end?: string
}

/** Canary 排行查询参数 */
export interface GetCanaryRankingParams {
  clusterUuid: string
  limit?: number
  start?: string
  end?: string
}

/** Canary 历史查询参数 */
export interface GetCanaryHistoryParams {
  clusterUuid: string
  namespace: string
  name: string
  start?: string
  end?: string
}

/** Canary 实时监控参数 */
export interface GetCanaryRealtimeMetricsParams {
  clusterUuid: string
  namespace: string
  name: string
}

// ==================== 响应类型 ====================

export interface GetFlaggerMetricsResponse {
  data: FlaggerMetrics
}

export interface GetCanaryMetricsResponse {
  data: CanaryMetrics
}

export interface GetCanaryStatusResponse {
  data: CanaryStatus
}

export interface GetCanaryProgressResponse {
  data: CanaryProgress
}

export interface GetCanaryAnalysisResponse {
  data: CanaryAnalysis
}

export interface GetCanaryComparisonResponse {
  data: CanaryComparison
}

export interface GetCanaryDurationResponse {
  data: CanaryDuration
}

export interface ListCanariesResponse {
  data: CanaryListMetrics
}

export interface GetFlaggerStatisticsResponse {
  data: FlaggerStatistics
}

export interface GetFlaggerDurationStatisticsResponse {
  data: FlaggerDurationStatistics
}

export interface GetFlaggerWebhookStatisticsResponse {
  data: FlaggerWebhookStatistics
}

export interface GetFlaggerControllerHealthResponse {
  data: FlaggerControllerHealth
}

export interface GetNamespaceCanaryMetricsResponse {
  data: NamespaceCanaryMetrics
}

export interface GetCanaryRankingResponse {
  data: CanaryRanking
}

export interface GetCanaryHistoryResponse {
  data: CanaryHistory
}

export interface GetCanaryRealtimeMetricsResponse {
  data: CanaryRealtimeMetrics
}

// ==================== API 接口 ====================

/**
 * 获取 Flagger 综合指标
 */
export async function getFlaggerMetricsApi(params: BaseFlaggerQueryParams) {
  return request.get<GetFlaggerMetricsResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/metrics`,
    params
  })
}

/**
 * 获取 Canary 指标
 */
export async function getCanaryMetricsApi(params: BaseCanaryQueryParams) {
  return request.get<GetCanaryMetricsResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/metrics`,
    params
  })
}

/**
 * 获取 Canary 状态
 */
export async function getCanaryStatusApi(params: GetCanaryStatusParams) {
  return request.get<GetCanaryStatusResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/status`,
    params
  })
}

/**
 * 获取 Canary 进度
 */
export async function getCanaryProgressApi(params: BaseCanaryQueryParams) {
  return request.get<GetCanaryProgressResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/progress`,
    params
  })
}

/**
 * 获取 Canary 分析结果
 */
export async function getCanaryAnalysisApi(params: BaseCanaryQueryParams) {
  return request.get<GetCanaryAnalysisResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/analysis`,
    params
  })
}

/**
 * 获取 Canary 对比
 */
export async function getCanaryComparisonApi(params: BaseCanaryQueryParams) {
  return request.get<GetCanaryComparisonResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/comparison`,
    params
  })
}

/**
 * 获取 Canary 持续时间
 */
export async function getCanaryDurationApi(params: GetCanaryDurationParams) {
  return request.get<GetCanaryDurationResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/duration`,
    params
  })
}

/**
 * 列出 Namespace 下的 Canary
 */
export async function listCanariesApi(params: ListCanariesParams) {
  return request.get<ListCanariesResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/list`,
    params
  })
}

/**
 * 列出所有 Canary
 */
export async function listAllCanariesApi(params: ListAllCanariesParams) {
  return request.get<ListCanariesResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/canary/list-all`,
    params
  })
}

/**
 * 获取 Flagger 统计信息
 */
export async function getFlaggerStatisticsApi(params: BaseFlaggerQueryParams) {
  return request.get<GetFlaggerStatisticsResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/statistics`,
    params
  })
}

/**
 * 获取 Flagger 持续时间统计
 */
export async function getFlaggerDurationStatisticsApi(params: BaseFlaggerQueryParams) {
  return request.get<GetFlaggerDurationStatisticsResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/statistics/duration`,
    params
  })
}

/**
 * 获取 Flagger Webhook 统计
 */
export async function getFlaggerWebhookStatisticsApi(params: BaseFlaggerQueryParams) {
  return request.get<GetFlaggerWebhookStatisticsResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/statistics/webhook`,
    params
  })
}

/**
 * 获取 Flagger Controller 健康状态
 */
export async function getFlaggerControllerHealthApi(params: BaseFlaggerQueryParams) {
  return request.get<GetFlaggerControllerHealthResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/controller/health`,
    params
  })
}

/**
 * 获取 Namespace Canary 指标
 */
export async function getNamespaceCanaryMetricsApi(params: GetNamespaceCanaryMetricsParams) {
  return request.get<GetNamespaceCanaryMetricsResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/namespace/canaries`,
    params
  })
}

/**
 * 获取 Canary 排行
 */
export async function getCanaryRankingApi(params: GetCanaryRankingParams) {
  return request.get<GetCanaryRankingResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/ranking`,
    params
  })
}

/**
 * 获取 Canary 历史记录
 */
export async function getCanaryHistoryApi(params: GetCanaryHistoryParams) {
  return request.get<GetCanaryHistoryResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/history`,
    params
  })
}

/**
 * 获取 Canary 实时监控指标
 */
export async function getCanaryRealtimeMetricsApi(params: GetCanaryRealtimeMetricsParams) {
  return request.get<GetCanaryRealtimeMetricsResponse>({
    url: `${FLAGGER_MONITOR_BASE_PATH}/realtime`,
    params
  })
}

// ==================== 枚举定义 ====================

/**
 * Canary 阶段枚举
 */
export enum CanaryPhase {
  INITIALIZED = 'Initialized',
  WAITING = 'Waiting',
  PROGRESSING = 'Progressing',
  PROMOTING = 'Promoting',
  FINALISING = 'Finalising',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed'
}

// ==================== 工具函数 ====================

/**
 * 判断 Canary 是否进行中
 */
export function isCanaryProgressing(status: CanaryStatus): boolean {
  return status.phase === CanaryPhase.PROGRESSING
}

/**
 * 判断 Canary 是否成功
 */
export function isCanarySucceeded(status: CanaryStatus): boolean {
  return status.phase === CanaryPhase.SUCCEEDED
}

/**
 * 判断 Canary 是否失败
 */
export function isCanaryFailed(status: CanaryStatus): boolean {
  return status.phase === CanaryPhase.FAILED
}

/**
 * 判断 Canary 是否等待中
 */
export function isCanaryWaiting(status: CanaryStatus): boolean {
  return status.phase === CanaryPhase.WAITING
}

/**
 * 判断 Canary 是否活跃
 */
export function isCanaryActive(status: CanaryStatus): boolean {
  return (
    status.phase === CanaryPhase.PROGRESSING ||
    status.phase === CanaryPhase.PROMOTING ||
    status.phase === CanaryPhase.FINALISING
  )
}

/**
 * 获取 Canary 健康分数
 */
export function getCanaryHealthScore(analysis: CanaryAnalysis): number {
  return analysis.checkSuccessRate * 100
}

/**
 * 格式化 Canary 持续时间
 */
export function formatCanaryDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)
  const seconds = Math.floor(durationSeconds % 60)

  if (hours > 0) return `${hours}h${minutes}m`
  if (minutes > 0) return `${minutes}m${seconds}s`
  return `${seconds}s`
}

/**
 * 获取 Canary 阶段颜色
 */
export function getCanaryPhaseColor(phase: string): string {
  const colorMap: Record<string, string> = {
    [CanaryPhase.INITIALIZED]: '#808080',
    [CanaryPhase.WAITING]: '#FFA500',
    [CanaryPhase.PROGRESSING]: '#1890FF',
    [CanaryPhase.PROMOTING]: '#52C41A',
    [CanaryPhase.FINALISING]: '#52C41A',
    [CanaryPhase.SUCCEEDED]: '#52C41A',
    [CanaryPhase.FAILED]: '#FF4D4F'
  }
  return colorMap[phase] || '#808080'
}

/**
 * 判断 Canary 分析是否健康
 */
export function isCanaryAnalysisHealthy(analysis: CanaryAnalysis): boolean {
  return analysis.checkSuccessRate >= 0.95
}

/**
 * 获取 Canary 对比差异
 */
export function getCanaryComparisonDiff(comparison: CanaryComparison): {
  successRateDiff: number
  errorRateDiff: number
  p95LatencyDiff: number
} {
  return {
    successRateDiff: comparison.canaryMetrics.successRate - comparison.primaryMetrics.successRate,
    errorRateDiff: comparison.canaryMetrics.errorRate - comparison.primaryMetrics.errorRate,
    p95LatencyDiff: comparison.canaryMetrics.p95Latency - comparison.primaryMetrics.p95Latency
  }
}

/**
 * 判断 Canary 是否比 Primary 更好
 */
export function isCanaryBetter(comparison: CanaryComparison): boolean {
  const diff = getCanaryComparisonDiff(comparison)
  return diff.successRateDiff >= 0 && diff.errorRateDiff <= 0 && diff.p95LatencyDiff <= 0
}

/**
 * 获取 Flagger 健康状态
 */
export function getFlaggerHealthStatus(
  stats: FlaggerStatistics
): 'healthy' | 'warning' | 'critical' {
  if (stats.failedCanaries === 0) return 'healthy'
  if (stats.successRate >= 0.8) return 'warning'
  return 'critical'
}

/**
 * 格式化权重百分比
 */
export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)}%`
}

/**
 * 判断是否需要关注
 */
export function needsAttention(canary: CanaryMetrics): boolean {
  return (
    canary.status.phase === CanaryPhase.FAILED ||
    (canary.status.phase === CanaryPhase.PROGRESSING && canary.analysis.checkSuccessRate < 0.9)
  )
}
