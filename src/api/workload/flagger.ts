import request from '@/utils/http'

// 定义基础路径
const CANARY_BASE_PATH = '/workload/v1/flagger'

// ==================== 基础类型定义 ====================

/** Canary 列表查询请求 */
export interface CanaryListRequest {
  workloadId: number // 工作负载ID
  search?: string // 搜索关键字
  labelSelector?: string // 标签选择器
}

export interface CanaryApplicationListRequest {
  workloadId: number // 工作负载ID
  applicationId: number
  search?: string // 搜索关键字
  labelSelector?: string // 标签选择器
}

/** Canary 名称请求 */
export interface CanaryNameRequest {
  workloadId: number // 工作负载ID
  name: string // Canary 名称
}

// ==================== Canary 响应类型 ====================

/** 目标资源引用信息 */
export interface TargetRefInfo {
  apiVersion: string // API 版本，如: apps/v1
  kind: string // 资源类型: Deployment, DaemonSet
  name: string // 资源名称
}

/** Canary 列表项 */
export interface CanaryListItem {
  name: string // 名称
  namespace: string // 命名空间
  targetRef: TargetRefInfo // 目标资源引用
  progressDeadline: number // 进度截止时间（秒）
  status: string // 状态: Initialized, Progressing, Promoting, Finalising, Succeeded, Failed
  canaryWeight: number // 当前金丝雀权重
  failedChecks: number // 失败检查次数
  phase: string // 阶段: Initializing, Waiting, Progressing, Promoting, Finalising, Succeeded, Failed
  lastTransition: string // 最后状态变更时间
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄，如: "2d5h"
  creationTimestamp: number // 创建时间戳（毫秒）
}

/** Canary 列表响应 */
export interface CanaryListResponse {
  total: number // 总数
  items: CanaryListItem[] // 列表项
}

/** 阈值范围 */
export interface ThresholdRange {
  min?: number // 最小值
  max?: number // 最大值
}

/** 模板引用 */
export interface TemplateRef {
  name: string // 模板名称
  namespace: string // 模板命名空间
}

/** 指标信息 */
export interface MetricInfo {
  name: string // 指标名称
  interval?: string // 指标间隔
  thresholdRange?: ThresholdRange // 阈值范围
  query?: string // 查询语句
  templateRef?: TemplateRef // 模板引用
}

/** 字符串匹配 */
export interface StringMatch {
  exact?: string // 精确匹配
  prefix?: string // 前缀匹配
  suffix?: string // 后缀匹配
  regex?: string // 正则匹配
}

/** 流量匹配信息 */
export interface MatchInfo {
  headers?: Record<string, StringMatch> // HTTP 头匹配
}

/** Webhook 信息 */
export interface WebhookInfo {
  name: string // Webhook 名称
  type: string // 类型: pre-rollout, rollout, confirm-rollout, post-rollout, rollback
  url: string // URL 地址
  timeout?: string // 超时时间
  metadata?: Record<string, string> // 元数据
}

/** 金丝雀分析配置 */
export interface CanaryAnalysis {
  interval: string // 分析间隔，如: "1m"
  threshold: number // 失败阈值
  maxWeight: number // 最大权重
  stepWeight: number // 步进权重
  metrics: MetricInfo[] // 指标列表
  webhooks: WebhookInfo[] // Webhook 列表
  match: MatchInfo[] // 流量匹配规则
  iterations: number // 迭代次数
}

/** TLS 策略 */
export interface TLSPolicy {
  mode: string // TLS 模式: DISABLE, SIMPLE, MUTUAL, ISTIO_MUTUAL
}

/** 流量策略 */
export interface TrafficPolicy {
  tls?: TLSPolicy // TLS 配置
}

/** 金丝雀服务配置 */
export interface CanaryService {
  port: number // 端口
  targetPort?: number // 目标端口
  name?: string // 服务名称
  portName?: string // 端口名称
  gateways?: string[] // Istio Gateway 列表
  hosts?: string[] // 主机列表
  trafficPolicy?: TrafficPolicy // 流量策略
}

/** Canary 详细信息 */
export interface CanaryDetail {
  name: string // 名称
  namespace: string // 命名空间
  targetRef: TargetRefInfo // 目标资源引用
  progressDeadline: number // 进度截止时间
  status: string // 状态
  canaryWeight: number // 金丝雀权重
  failedChecks: number // 失败检查次数
  phase: string // 阶段
  lastTransition: string // 最后状态变更时间
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
  analysis: CanaryAnalysis // 分析配置
  service: CanaryService // 服务配置
}

/** Canary 状态条件 */
export interface CanaryStatusCondition {
  type: string // 类型: Promoted, Progressing
  status: string // 状态: True, False, Unknown
  lastUpdateTime: string // 最后更新时间
  lastTransitionTime: string // 最后变更时间
  reason: string // 原因
  message: string // 消息
}

/** Canary 状态响应 */
export interface CanaryStatusResponse {
  name: string // 名称
  namespace: string // 命名空间
  phase: string // 当前阶段
  canaryWeight: number // 金丝雀权重
  failedChecks: number // 失败检查次数
  iterations: number // 迭代次数
  conditions: CanaryStatusCondition[] // 状态条件
  trackedConfigs: Record<string, string> // 跟踪的配置
  lastAppliedSpec: string // 最后应用的规格
}

// ==================== Canary 操作请求 ====================

/** 创建 Canary 请求 */
export interface CreateCanaryRequest {
  workloadId: number // 工作负载ID
  versionId: number // 版本ID
  flaggerYamlStr: string // Flagger YAML 字符串
}

/** 更新 Canary 请求 */
export interface UpdateCanaryRequest {
  workloadId: number // 工作负载ID
  versionId: number // 版本ID
  name: string // Canary 名称
  flaggerYamlStr: string // Flagger YAML 字符串
}

/** 删除 Canary 请求 */
export interface DeleteCanaryRequest {
  workloadId: number // 工作负载ID
  name: string // Canary 名称
}

/** Canary 控制操作请求（暂停/恢复/重置） */
export interface CanaryControlRequest {
  workloadId: number // 工作负载ID
  name: string // Canary 名称
}

// ==================== API 接口 ====================

/**
 * 获取 Canary 列表
 * @param params 查询参数
 * @returns Canary 列表
 */
export async function getCanaryListApi(params: CanaryListRequest) {
  return request.get<CanaryListResponse>({
    url: `${CANARY_BASE_PATH}/canary`,
    params
  })
}

/**
 * 获取 Canary 应用级别 列表
 * @param params 查询参数
 * @returns Canary 列表
 */
export async function getCanaryListApplicationApi(params: CanaryApplicationListRequest) {
  return request.get<CanaryListItem[]>({
    url: `${CANARY_BASE_PATH}/canary/application`,
    params
  })
}

/**
 * 获取 Canary 详情
 * @param params 查询参数
 * @returns Canary 详情
 */
export async function getCanaryDetailApi(params: CanaryNameRequest) {
  return request.get<CanaryDetail>({
    url: `${CANARY_BASE_PATH}/canary/detail`,
    params
  })
}

/**
 * 获取 Canary YAML
 * @param params 查询参数
 * @returns YAML 字符串
 */
export async function getCanaryYamlApi(params: CanaryNameRequest) {
  return request.get<string>({
    url: `${CANARY_BASE_PATH}/canary/yaml`,
    params
  })
}

/**
 * 创建 Canary 资源
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createCanaryApi(data: CreateCanaryRequest) {
  return request.post<string>({
    url: `${CANARY_BASE_PATH}/canary`,
    data
  })
}

/**
 * 更新 Canary 资源
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateCanaryApi(data: UpdateCanaryRequest) {
  return request.put<string>({
    url: `${CANARY_BASE_PATH}/canary`,
    data
  })
}

/**
 * 删除 Canary 资源
 * @param data 删除参数
 * @returns 操作结果
 */
export async function deleteCanaryApi(data: DeleteCanaryRequest) {
  return request.del<string>({
    url: `${CANARY_BASE_PATH}/canary`,
    data
  })
}

/**
 * 获取 Canary 状态信息
 * @param params 查询参数
 * @returns Canary 状态
 */
export async function getCanaryStatusApi(params: CanaryNameRequest) {
  return request.get<CanaryStatusResponse>({
    url: `${CANARY_BASE_PATH}/canary/status`,
    params
  })
}

/**
 * 暂停 Canary 金丝雀发布
 * @param data 控制参数
 * @returns 操作结果
 */
export async function pauseCanaryApi(data: CanaryControlRequest) {
  return request.post<string>({
    url: `${CANARY_BASE_PATH}/canary/pause`,
    data
  })
}

/**
 * 恢复 Canary 金丝雀发布
 * @param data 控制参数
 * @returns 操作结果
 */
export async function resumeCanaryApi(data: CanaryControlRequest) {
  return request.post<string>({
    url: `${CANARY_BASE_PATH}/canary/resume`,
    data
  })
}

/**
 * 重置 Canary 状态
 * @param data 控制参数
 * @returns 操作结果
 */
export async function resetCanaryApi(data: CanaryControlRequest) {
  return request.post<string>({
    url: `${CANARY_BASE_PATH}/canary/reset`,
    data
  })
}

// ==================== MetricTemplate 类型定义 ====================

/** MetricTemplate 查询请求 */
export interface MetricTemplateListRequest {
  provider: 'nginx' | 'istio' // 网格提供商
}

/** MetricTemplate 列表项 */
export interface MetricTemplateListItem {
  name: string // 模板名称
  namespace: string // 命名空间
  variables: string[] // 需要的额外参数列表
}

// ==================== MetricTemplate API ====================

/**
 * 获取指标模板列表
 * @param params 查询参数
 * @returns 指标模板列表
 */
export async function getMetricTemplateListApi(params: MetricTemplateListRequest) {
  return request.get<MetricTemplateListItem[]>({
    url: `${CANARY_BASE_PATH}/metric-template`,
    params
  })
}