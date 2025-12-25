import request from '@/utils/http'

// 定义基础路径
const INGRESS_MONITOR_BASE_PATH = '/console/v1/ingress-monitor'

// ==================== Ingress Controller 健康 ====================

/** Ingress 连接指标 */
export interface IngressConnectionMetrics {
  active: number
  reading: number
  writing: number
  waiting: number
  total: number
}

/** Ingress Controller 数据点 */
export interface IngressControllerDataPoint {
  timestamp: number
  activeConnections: number
  reloadRate: number
  cpuUsage: number
  memoryUsage: number
}

/** Ingress Controller 健康状态 */
export interface IngressControllerHealth {
  controllerName: string
  totalPods: number
  runningPods: number
  readyPods: number
  cpuUsage: number
  memoryUsage: number
  lastReloadSuccess: boolean
  lastReloadTime: number
  reloadRate: number
  reloadFailRate: number
  connections: IngressConnectionMetrics
  trend: IngressControllerDataPoint[]
}

// ==================== Ingress 流量指标 ====================

/** Ingress 流量快照 */
export interface IngressTrafficSnapshot {
  timestamp: number
  requestsPerSecond: number
  activeConnections: number
  ingressBytesPerSec: number
  egressBytesPerSec: number
}

/** Ingress 流量数据点 */
export interface IngressTrafficDataPoint {
  timestamp: number
  requestsPerSecond: number
  ingressBytesPerSec: number
  egressBytesPerSec: number
}

/** 按维度的流量 */
export interface TrafficByDimension {
  name: string
  namespace?: string
  requestsPerSecond: number
  bytesPerSecond: number
}

/** 按方法的流量 */
export interface TrafficByMethod {
  method: string
  requestsPerSecond: number
}

/** Ingress 流量统计 */
export interface IngressTrafficSummary {
  totalRequests: number
  totalIngressBytes: number
  totalEgressBytes: number
  avgRequestsPerSec: number
  maxRequestsPerSec: number
  avgRequestSize: number
  avgResponseSize: number
}

/** Ingress 流量指标 */
export interface IngressTrafficMetrics {
  current: IngressTrafficSnapshot
  trend: IngressTrafficDataPoint[]
  byHost: TrafficByDimension[]
  byPath: TrafficByDimension[]
  byService: TrafficByDimension[]
  byMethod: TrafficByMethod[]
  summary: IngressTrafficSummary
}

// ==================== Ingress 性能指标 ====================

/** Ingress 延迟统计 */
export interface IngressLatencyStats {
  p50: number
  p95: number
  p99: number
  avg: number
  max: number
}

/** 按维度的延迟 */
export interface LatencyByDimension {
  name: string
  namespace?: string
  latency: IngressLatencyStats
}

/** Ingress 延迟数据点 */
export interface IngressLatencyDataPoint {
  timestamp: number
  p50: number
  p95: number
  p99: number
}

/** Ingress 性能指标 */
export interface IngressPerformanceMetrics {
  overall: IngressLatencyStats
  byHost: LatencyByDimension[]
  byPath: LatencyByDimension[]
  upstreamLatency: IngressLatencyStats
  trend: IngressLatencyDataPoint[]
}

// ==================== Ingress 错误指标 ====================

/** Ingress 错误率统计 */
export interface IngressErrorRateStats {
  totalErrorRate: number
  error4xxRate: number
  error5xxRate: number
}

/** Ingress 状态码分布 */
export interface IngressStatusCodeDistribution {
  status2xx: Record<string, number>
  status3xx: Record<string, number>
  status4xx: Record<string, number>
  status5xx: Record<string, number>
}

/** 状态码速率 */
export interface StatusCodeRate {
  statusCode: string
  rate: number
  percent: number
}

/** 按维度的错误率 */
export interface ErrorRateByDimension {
  name: string
  namespace?: string
  errorRate: IngressErrorRateStats
  topErrors: StatusCodeRate[]
}

/** Ingress 错误数据点 */
export interface IngressErrorDataPoint {
  timestamp: number
  totalErrorRate: number
  error4xxRate: number
  error5xxRate: number
}

/** Ingress 错误指标 */
export interface IngressErrorMetrics {
  overall: IngressErrorRateStats
  statusCodes: IngressStatusCodeDistribution
  byHost: ErrorRateByDimension[]
  byPath: ErrorRateByDimension[]
  trend: IngressErrorDataPoint[]
}

// ==================== Ingress 后端健康 ====================

/** Service Endpoints */
export interface ServiceEndpoints {
  serviceName: string
  namespace: string
  availableEndpoints: number
  hasEndpoints: boolean
}

/** 后端健康状态 */
export interface BackendHealthStatus {
  upstream: string
  responseLatency: number
  successRate: number
  activeConnections: number
}

/** Ingress 后端指标 */
export interface IngressBackendMetrics {
  upstreamLatency: number
  endpointsByService: ServiceEndpoints[]
  backendHealth: BackendHealthStatus[]
}

// ==================== Ingress 证书指标 ====================

/** 证书信息 */
export interface CertificateInfo {
  name: string
  namespace: string
  expirationTime: number
  daysRemaining: number
  isExpiring: boolean
  isExpired: boolean
}

/** Ingress 证书指标 */
export interface IngressCertificateMetrics {
  httpsRequestPercent: number
  certificates: CertificateInfo[]
  expiringCount: number
  expiredCount: number
}

// ==================== Ingress 对象信息 ====================

/** Ingress 路径信息 */
export interface IngressPathInfo {
  host: string
  path: string
  pathType: string
  serviceName: string
  servicePort: number
}

/** Ingress 对象指标 */
export interface IngressObjectMetrics {
  namespace: string
  ingressName: string
  pathCount: number
  ruleCount: number
  tlsEnabled: boolean
  hosts: string[]
  paths: IngressPathInfo[]
  createdAt: number
  labels: Record<string, string>
  annotations: Record<string, string>
}

// ==================== Ingress 限流指标 ====================

/** 按路径的限流情况 */
export interface RateLimitByPath {
  path: string
  limitedRequests: number
  totalRequests: number
  limitTriggerPercent: number
}

/** Ingress 限流数据点 */
export interface IngressRateLimitDataPoint {
  timestamp: number
  limitedRequests: number
  limitTriggerRate: number
}

/** Ingress 限流指标 */
export interface IngressRateLimitMetrics {
  namespace: string
  ingressName: string
  limitedRequests: number
  limitTriggerRate: number
  byPath: RateLimitByPath[]
  trend: IngressRateLimitDataPoint[]
}

// ==================== Ingress 排行 ====================

/** Ingress 排行项 */
export interface IngressRankingItem {
  namespace: string
  ingressName: string
  value: number
  unit: string
}

/** Ingress 排行 */
export interface IngressRanking {
  topByQPS: IngressRankingItem[]
  topByErrorRate: IngressRankingItem[]
  topByLatency: IngressRankingItem[]
  topByTraffic: IngressRankingItem[]
}

/** Path 排行项 */
export interface PathRankingItem {
  host: string
  path: string
  value: number
  unit: string
}

/** Path 排行 */
export interface PathRanking {
  topByQPS: PathRankingItem[]
  topByErrorRate: PathRankingItem[]
  topByLatency: PathRankingItem[]
}

/** Host 排行项 */
export interface HostRankingItem {
  host: string
  value: number
  unit: string
}

/** Host 排行 */
export interface HostRanking {
  topByQPS: HostRankingItem[]
  topByErrorRate: HostRankingItem[]
  topByLatency: HostRankingItem[]
}

// ==================== Ingress 综合指标 ====================

/** Ingress 综合指标 */
export interface IngressMetrics {
  namespace: string
  ingressName: string
  timestamp: number
  controller: IngressControllerHealth
  traffic: IngressTrafficMetrics
  performance: IngressPerformanceMetrics
  errors: IngressErrorMetrics
  backends: IngressBackendMetrics
  certificates: IngressCertificateMetrics
}

// ==================== 请求参数 ====================

/** 基础查询参数 */
export interface BaseIngressQueryParams {
  clusterUuid: string
  namespace: string
  ingressName: string
  start?: string
  end?: string
}

/** Controller 健康查询参数 */
export interface GetControllerHealthParams {
  clusterUuid: string
  start?: string
  end?: string
}

/** Host 查询参数 */
export interface GetIngressByHostParams {
  clusterUuid: string
  host: string
  start?: string
  end?: string
}

/** Path 查询参数 */
export interface GetIngressByPathParams {
  clusterUuid: string
  path: string
  start?: string
  end?: string
}

/** 证书查询参数 */
export interface GetIngressCertificatesParams {
  clusterUuid: string
  namespace: string
  ingressName: string
}

/** 过期证书查询参数 */
export interface GetExpiringCertificatesParams {
  clusterUuid: string
  daysThreshold?: number
}

/** Ingress 对象查询参数 */
export interface GetIngressObjectParams {
  clusterUuid: string
  namespace: string
  ingressName: string
}

/** 排行查询参数 */
export interface GetIngressRankingParams {
  clusterUuid: string
  limit?: number
  start?: string
  end?: string
}

/** 列表查询参数 */
export interface ListIngressMetricsParams {
  clusterUuid: string
  namespace: string
  start?: string
  end?: string
}

// ==================== 响应类型 ====================

export interface GetIngressMetricsResponse {
  data: IngressMetrics
}

export interface GetControllerHealthResponse {
  data: IngressControllerHealth
}

export interface GetIngressTrafficResponse {
  data: IngressTrafficMetrics
}

export interface GetIngressPerformanceResponse {
  data: IngressPerformanceMetrics
}

export interface GetIngressLatencyStatsResponse {
  data: IngressLatencyStats
}

export interface GetIngressErrorsResponse {
  data: IngressErrorMetrics
}

export interface GetIngressStatusCodesResponse {
  data: IngressStatusCodeDistribution
}

export interface GetIngressBackendsResponse {
  data: IngressBackendMetrics
}

export interface GetIngressCertificatesResponse {
  data: IngressCertificateMetrics
}

export interface GetExpiringCertificatesResponse {
  data: CertificateInfo[]
}

export interface GetIngressObjectResponse {
  data: IngressObjectMetrics
}

export interface GetIngressRateLimitResponse {
  data: IngressRateLimitMetrics
}

export interface GetIngressRankingResponse {
  data: IngressRanking
}

export interface GetPathRankingResponse {
  data: PathRanking
}

export interface GetHostRankingResponse {
  data: HostRanking
}

export interface ListIngressMetricsResponse {
  data: IngressMetrics[]
}

// ==================== API 接口 ====================

/**
 * 获取 Ingress 综合指标
 */
export async function getIngressMetricsApi(params: BaseIngressQueryParams) {
  return request.get<GetIngressMetricsResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/metrics`,
    params
  })
}

/**
 * 获取 Ingress Controller 健康状态
 */
export async function getControllerHealthApi(params: GetControllerHealthParams) {
  return request.get<GetControllerHealthResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/controller/health`,
    params
  })
}

/**
 * 获取 Ingress 流量指标
 */
export async function getIngressTrafficApi(params: BaseIngressQueryParams) {
  return request.get<GetIngressTrafficResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/traffic`,
    params
  })
}

/**
 * 按 Host 获取流量指标
 */
export async function getIngressTrafficByHostApi(params: GetIngressByHostParams) {
  return request.get<GetIngressTrafficResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/traffic/host`,
    params
  })
}

/**
 * 按 Path 获取流量指标
 */
export async function getIngressTrafficByPathApi(params: GetIngressByPathParams) {
  return request.get<GetIngressTrafficResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/traffic/path`,
    params
  })
}

/**
 * 获取 Ingress 性能指标
 */
export async function getIngressPerformanceApi(params: BaseIngressQueryParams) {
  return request.get<GetIngressPerformanceResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/performance`,
    params
  })
}

/**
 * 按 Host 获取延迟指标
 */
export async function getIngressLatencyByHostApi(params: GetIngressByHostParams) {
  return request.get<GetIngressLatencyStatsResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/latency/host`,
    params
  })
}

/**
 * 按 Path 获取延迟指标
 */
export async function getIngressLatencyByPathApi(params: GetIngressByPathParams) {
  return request.get<GetIngressLatencyStatsResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/latency/path`,
    params
  })
}

/**
 * 获取 Ingress 错误指标
 */
export async function getIngressErrorsApi(params: BaseIngressQueryParams) {
  return request.get<GetIngressErrorsResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/errors`,
    params
  })
}

/**
 * 获取 Ingress 状态码分布
 */
export async function getIngressStatusCodesApi(params: BaseIngressQueryParams) {
  return request.get<GetIngressStatusCodesResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/status-codes`,
    params
  })
}

/**
 * 获取 Ingress 后端健康状态
 */
export async function getIngressBackendsApi(params: BaseIngressQueryParams) {
  return request.get<GetIngressBackendsResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/backends`,
    params
  })
}

/**
 * 获取 Ingress 证书信息
 */
export async function getIngressCertificatesApi(params: GetIngressCertificatesParams) {
  return request.get<GetIngressCertificatesResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/certificates`,
    params
  })
}

/**
 * 获取即将过期的证书
 */
export async function getExpiringCertificatesApi(params: GetExpiringCertificatesParams) {
  return request.get<GetExpiringCertificatesResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/certificates/expiring`,
    params
  })
}

/**
 * 获取 Ingress 对象信息
 */
export async function getIngressObjectApi(params: GetIngressObjectParams) {
  return request.get<GetIngressObjectResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/object`,
    params
  })
}

/**
 * 获取 Ingress 限流指标
 */
export async function getIngressRateLimitApi(params: BaseIngressQueryParams) {
  return request.get<GetIngressRateLimitResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/rate-limit`,
    params
  })
}

/**
 * 获取 Ingress 排行
 */
export async function getIngressRankingApi(params: GetIngressRankingParams) {
  return request.get<GetIngressRankingResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/ranking`,
    params
  })
}

/**
 * 获取 Path 排行
 */
export async function getPathRankingApi(params: GetIngressRankingParams) {
  return request.get<GetPathRankingResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/ranking/path`,
    params
  })
}

/**
 * 获取 Host 排行
 */
export async function getHostRankingApi(params: GetIngressRankingParams) {
  return request.get<GetHostRankingResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/ranking/host`,
    params
  })
}

/**
 * 列出 Namespace 下的 Ingress 指标
 */
export async function listIngressMetricsApi(params: ListIngressMetricsParams) {
  return request.get<ListIngressMetricsResponse>({
    url: `${INGRESS_MONITOR_BASE_PATH}/list`,
    params
  })
}

// ==================== 工具函数 ====================

/**
 * 判断 Ingress 是否健康
 */
export function isIngressHealthy(metrics: IngressMetrics): boolean {
  return (
    metrics.controller.readyPods > 0 &&
    metrics.errors.overall.totalErrorRate < 0.05 &&
    metrics.performance.overall.p95 < 1000
  )
}

/**
 * 判断证书是否即将过期
 */
export function isCertificateExpiring(cert: CertificateInfo): boolean {
  return cert.daysRemaining < 30 && cert.daysRemaining > 0
}

/**
 * 判断证书是否已过期
 */
export function isCertificateExpired(cert: CertificateInfo): boolean {
  return cert.daysRemaining <= 0
}

/**
 * 获取错误率等级
 */
export function getErrorRateLevel(errorRate: number): 'low' | 'medium' | 'high' | 'critical' {
  if (errorRate < 0.01) return 'low'
  if (errorRate < 0.05) return 'medium'
  if (errorRate < 0.1) return 'high'
  return 'critical'
}

/**
 * 格式化 QPS
 */
export function formatQPS(qps: number): string {
  if (qps >= 1000) {
    return `${(qps / 1000).toFixed(2)}K QPS`
  }
  return `${qps.toFixed(0)} QPS`
}

/**
 * 判断后端是否健康
 */
export function isBackendHealthy(backend: BackendHealthStatus): boolean {
  return backend.successRate > 0.95
}

/**
 * 获取延迟等级
 */
export function getLatencyLevel(latencyMs: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (latencyMs < 100) return 'excellent'
  if (latencyMs < 500) return 'good'
  if (latencyMs < 1000) return 'fair'
  return 'poor'
}
