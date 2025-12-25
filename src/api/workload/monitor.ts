import request from '@/utils/http'

// 定义基础路径
const MONITORING_BASE_PATH = '/workload/v1/monitoring'

// ==================== 通用请求类型 ====================

/** 监控资源列表请求（带 namespace） */
export interface MonitoringResourceListRequest {
  clusterUuid: string
  namespace: string
  search?: string // 搜索关键字
}

/** 监控资源名称请求 */
export interface MonitoringResourceNameRequest {
  clusterUuid: string
  namespace: string
  name: string
}

/** 监控资源 YAML 创建/更新请求 */
export interface MonitoringResourceYamlRequest {
  clusterUuid: string
  namespace: string
  yamlStr: string
}

// ==================== Probe 相关类型定义 ====================

/** Probe 列表项 */
export interface ProbeListItem {
  name: string
  namespace: string
  age: string
  creationTimestamp: number
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

/** Probe 列表响应 */
export interface ProbeListResponse {
  total: number
  items: ProbeListItem[]
}

// ==================== PrometheusRule 相关类型定义 ====================

/** PrometheusRule 列表项 */
export interface PrometheusRuleListItem {
  name: string
  namespace: string
  age: string
  creationTimestamp: number
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

/** PrometheusRule 列表响应 */
export interface PrometheusRuleListResponse {
  total: number
  items: PrometheusRuleListItem[]
}

// ==================== Probe API 接口 ====================

/**
 * 获取 Probe 列表
 * @param params 查询参数
 * @returns Probe列表
 */
export async function getProbeListApi(params: MonitoringResourceListRequest) {
  return request.get<ProbeListResponse>({
    url: `${MONITORING_BASE_PATH}/probe`,
    params
  })
}

/**
 * 获取 Probe YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getProbeYamlApi(params: MonitoringResourceNameRequest) {
  return request.get<string>({
    url: `${MONITORING_BASE_PATH}/probe/yaml`,
    params
  })
}

/**
 * 创建 Probe
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createProbeApi(data: MonitoringResourceYamlRequest) {
  return request.post<string>({
    url: `${MONITORING_BASE_PATH}/probe`,
    data
  })
}

/**
 * 更新 Probe
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateProbeApi(data: MonitoringResourceYamlRequest) {
  return request.put<string>({
    url: `${MONITORING_BASE_PATH}/probe`,
    data
  })
}

/**
 * 删除 Probe
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteProbeApi(params: MonitoringResourceNameRequest) {
  return request.del<string>({
    url: `${MONITORING_BASE_PATH}/probe`,
    params
  })
}

// ==================== PrometheusRule API 接口 ====================

/**
 * 获取 PrometheusRule 列表
 * @param params 查询参数
 * @returns PrometheusRule列表
 */
export async function getPrometheusRuleListApi(params: MonitoringResourceListRequest) {
  return request.get<PrometheusRuleListResponse>({
    url: `${MONITORING_BASE_PATH}/prometheusrule`,
    params
  })
}

/**
 * 获取 PrometheusRule YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getPrometheusRuleYamlApi(params: MonitoringResourceNameRequest) {
  return request.get<string>({
    url: `${MONITORING_BASE_PATH}/prometheusrule/yaml`,
    params
  })
}

/**
 * 创建 PrometheusRule
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createPrometheusRuleApi(data: MonitoringResourceYamlRequest) {
  return request.post<string>({
    url: `${MONITORING_BASE_PATH}/prometheusrule`,
    data
  })
}

/**
 * 更新 PrometheusRule
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updatePrometheusRuleApi(data: MonitoringResourceYamlRequest) {
  return request.put<string>({
    url: `${MONITORING_BASE_PATH}/prometheusrule`,
    data
  })
}

/**
 * 删除 PrometheusRule
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deletePrometheusRuleApi(params: MonitoringResourceNameRequest) {
  return request.del<string>({
    url: `${MONITORING_BASE_PATH}/prometheusrule`,
    params
  })
}
