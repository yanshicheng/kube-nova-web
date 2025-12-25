import request from '@/utils/http'

// 定义基础路径
const AUTOSCALING_BASE_PATH = '/workload/v1/autoscaling'

// ==================== HPA 相关类型定义 ====================

/** HPA 指标类型 */
export type HPAMetricType = 'Resource' | 'Pods' | 'Object' | 'External' | 'ContainerResource'

/** HPA 指标目标类型 */
export type HPATargetType = 'Utilization' | 'AverageValue' | 'Value'

/** HPA 资源指标 */
export interface HPAResourceMetric {
  name: string // cpu, memory
  target: {
    type: HPATargetType
    averageUtilization?: number // 百分比
    averageValue?: string // 如: "100m", "1Gi"
    value?: string
  }
}

/** HPA Pods 指标 */
export interface HPAPodsMetric {
  metric: {
    name: string
    selector?: Record<string, string>
  }
  target: {
    type: HPATargetType
    averageValue: string
  }
}

/** HPA Object 指标 */
export interface HPAObjectMetric {
  metric: {
    name: string
    selector?: Record<string, string>
  }
  describedObject: {
    apiVersion: string
    kind: string
    name: string
  }
  target: {
    type: HPATargetType
    value: string
    averageValue?: string
  }
}

/** HPA External 指标 */
export interface HPAExternalMetric {
  metric: {
    name: string
    selector?: Record<string, string>
  }
  target: {
    type: HPATargetType
    value: string
    averageValue?: string
  }
}

/** HPA Container 资源指标 */
export interface HPAContainerResourceMetric {
  name: string // cpu, memory
  container: string // 容器名称
  target: {
    type: HPATargetType
    averageUtilization?: number
    averageValue?: string
  }
}

/** HPA 指标定义 */
export interface HPAMetric {
  type: HPAMetricType
  resource?: HPAResourceMetric
  pods?: HPAPodsMetric
  object?: HPAObjectMetric
  external?: HPAExternalMetric
  containerResource?: HPAContainerResourceMetric
}

/** HPA 扩缩容策略 */
export interface HPAScalingPolicy {
  type: string // Pods, Percent
  value: number
  periodSeconds: number
}

/** HPA 扩缩容规则 */
export interface HPAScalingRules {
  stabilizationWindowSeconds?: number // 稳定窗口时间（秒）
  selectPolicy?: string // Max, Min, Disabled
  policies?: HPAScalingPolicy[]
}

/** HPA 行为配置 */
export interface HPABehavior {
  scaleUp?: HPAScalingRules // 扩容规则
  scaleDown?: HPAScalingRules // 缩容规则
}

/** HPA 当前指标值 */
export interface HPACurrentMetric {
  type: HPAMetricType
  current: {
    averageUtilization?: number
    averageValue?: string
    value?: string
  }
}

/** HPA 状态条件 */
export interface HPACondition {
  type: string // ScalingActive, AbleToScale, ScalingLimited
  status: string // True, False, Unknown
  reason: string
  message: string
  lastTransitionTime: number
}

/** HPA 详情 */
export interface HPADetail {
  name: string // HPA 名称
  namespace: string // 命名空间
  targetRef: {
    apiVersion: string
    kind: string // Deployment, StatefulSet, etc.
    name: string
  }
  minReplicas: number // 最小副本数
  maxReplicas: number // 最大副本数
  metrics: HPAMetric[] // 指标列表
  behavior?: HPABehavior // 行为配置
  currentReplicas: number // 当前副本数
  desiredReplicas: number // 期望副本数
  currentMetrics?: HPACurrentMetric[] // 当前指标值
  conditions?: HPACondition[] // 状态条件
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** HPA 创建/更新请求 */
export interface HPARequest {
  versionId: number // 版本ID
  hpaYamlStr: string // HPA YAML 字符串
}

/** 获取 HPA 请求 */
export interface GetHPARequest {
  versionId: number // 版本ID
}

// ==================== VPA 相关类型定义 ====================

/** VPA 更新模式 */
export type VPAUpdateMode = 'Off' | 'Initial' | 'Recreate' | 'Auto'

/** VPA 容器模式 */
export type VPAContainerMode = 'Auto' | 'Off'

/** VPA 控制值类型 */
export type VPAControlledValues = 'RequestsAndLimits' | 'RequestsOnly'

/** VPA 更新策略 */
export interface VPAUpdatePolicy {
  updateMode?: VPAUpdateMode // 更新模式
  minReplicas?: number // 最小副本数（用于限制更新）
}

/** VPA 资源约束 */
export interface VPAResourceConstraints {
  cpu?: string
  memory?: string
}

/** VPA 容器资源策略 */
export interface VPAResourcePolicy {
  containerName: string // 容器名称
  mode?: VPAContainerMode // 容器模式
  minAllowed?: VPAResourceConstraints // 最小允许值
  maxAllowed?: VPAResourceConstraints // 最大允许值
  controlledResources?: string[] // 控制的资源: cpu, memory
  controlledValues?: VPAControlledValues // 控制的值类型
}

/** VPA 资源推荐 */
export interface VPAResourceRecommendation {
  cpu?: string
  memory?: string
}

/** VPA 容器推荐 */
export interface VPARecommendation {
  containerName: string // 容器名称
  target?: VPAResourceRecommendation // 目标推荐值
  lowerBound?: VPAResourceRecommendation // 下界
  upperBound?: VPAResourceRecommendation // 上界
  uncappedTarget?: VPAResourceRecommendation // 无上限目标值
}

/** VPA 状态条件 */
export interface VPACondition {
  type: string // RecommendationProvided, LowConfidence, NoPodsMatched, FetchingHistory
  status: string // True, False, Unknown
  reason?: string
  message?: string
  lastTransitionTime: number
}

/** VPA 详情 */
export interface VPADetail {
  name: string // VPA 名称
  namespace: string // 命名空间
  targetRef: {
    apiVersion: string
    kind: string // Deployment, StatefulSet, etc.
    name: string
  }
  updatePolicy?: VPAUpdatePolicy // 更新策略
  resourcePolicy?: {
    containerPolicies?: VPAResourcePolicy[] // 容器策略列表
  }
  recommendation?: {
    containerRecommendations?: VPARecommendation[] // 容器推荐列表
  }
  conditions?: VPACondition[] // 状态条件
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** VPA 创建/更新请求 */
export interface VPARequest {
  versionId: number // 版本ID
  vpaYamlStr: string // VPA YAML 字符串
}

/** 获取 VPA 请求 */
export interface GetVPARequest {
  versionId: number // 版本ID
}

// ==================== API 接口 ====================

// ========== HPA API ==========

/**
 * 获取 HPA 详情
 * @param params 查询参数
 * @returns HPA详情
 */
export async function getHPADetailApi(params: GetHPARequest) {
  return request.get<HPADetail>({
    url: `${AUTOSCALING_BASE_PATH}/hpa`,
    params
  })
}

/**
 * 获取 HPA YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getHPAYamlApi(params: GetHPARequest) {
  return request.get<string>({
    url: `${AUTOSCALING_BASE_PATH}/hpa/yaml`,
    params
  })
}

/**
 * 创建 HPA
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createHPAApi(data: HPARequest) {
  return request.post<string>({
    url: `${AUTOSCALING_BASE_PATH}/hpa`,
    data
  })
}

/**
 * 更新 HPA
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateHPAApi(data: HPARequest) {
  return request.put<string>({
    url: `${AUTOSCALING_BASE_PATH}/hpa`,
    data
  })
}

/**
 * 删除 HPA
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteHPAApi(params: GetHPARequest) {
  return request.del<string>({
    url: `${AUTOSCALING_BASE_PATH}/hpa`,
    params
  })
}

// ========== VPA API ==========

/**
 * 获取 VPA 详情
 * @param params 查询参数
 * @returns VPA详情
 */
export async function getVPADetailApi(params: GetVPARequest) {
  return request.get<VPADetail>({
    url: `${AUTOSCALING_BASE_PATH}/vpa`,
    params
  })
}

/**
 * 获取 VPA YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getVPAYamlApi(params: GetVPARequest) {
  return request.get<string>({
    url: `${AUTOSCALING_BASE_PATH}/vpa/yaml`,
    params
  })
}

/**
 * 创建 VPA
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createVPAApi(data: VPARequest) {
  return request.post<string>({
    url: `${AUTOSCALING_BASE_PATH}/vpa`,
    data
  })
}

/**
 * 更新 VPA
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateVPAApi(data: VPARequest) {
  return request.put<string>({
    url: `${AUTOSCALING_BASE_PATH}/vpa`,
    data
  })
}

/**
 * 删除 VPA
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteVPAApi(params: GetVPARequest) {
  return request.del<string>({
    url: `${AUTOSCALING_BASE_PATH}/vpa`,
    params
  })
}
