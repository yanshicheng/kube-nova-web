import request from '@/utils/http'

// 定义基础路径
const WORKLOAD_BASE_PATH = '/workload/v1/application'

// ========== 类型定义 ==========

/** 资源类型枚举 */
export enum ResourceType {
  DEPLOYMENT = 'deployment',
  STATEFULSET = 'statefulset',
  DAEMONSET = 'daemonset',
  JOB = 'job',
  CRONJOB = 'cronjob',
  POD = 'pod'
}

/** 添加应用资源请求 */
export interface AddApplicationResourceRequest {
  resourceClusterId: number // 集群资源ID
  clusterUuid: string // 集群UUID
  workspaceId: number // 工作空间ID
  nameCn: string // 应用名称中文
  resourceName: string // 资源名称
  nameEn: string // 应用名称英文 只能英文开头 包含的内容只能是 字母、数字、中横线、下划线
  version: string // 版本 包含的内容只能是 字母、数字、中横线、下划线
  resourceType: ResourceType // 资源类型
  resourceYamlStr: string // 对应类型的yaml字符串
  description?: string // 描述（最多200字符）
}

/** 项目应用信息 */
export interface OnecProjectApplication {
  id: number
  workspaceId: number
  nameCn: string
  nameEn: string
  resourceType: string
  description: string
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

/** 更新应用请求 */
export interface UpdateOnecProjectApplicationRequest {
  id: number // 应用ID
  nameCn: string // 应用名称中文
  description?: string // 描述（最多500字符）
}

/** 查询应用请求 */
export interface SearchOnecProjectApplicationRequest {
  workspaceId: number // 工作空间ID
  nameCn?: string // 应用名称（可选）
}

/** 项目版本信息 */
export interface OnecProjectVersion {
  id: number
  applicationId: number
  version: string
  resourceName: string // 资源名称
  versionRole?: string // 版本角色：stable, canary 等
  parentAppName: string
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

/** 添加版本请求 */
export interface AddOnecProjectVersionRequest {
  applicationId: number // 应用ID
  version: string // 版本号
  resourceName: string // 资源名称
  resourceYamlStr: string // 资源YAML字符串
}

/** 查询版本请求 */
export interface SearchOnecProjectVersionRequest {
  applicationId: number // 应用ID
}

/** 更新版本请求 */
export interface UpdateOnecProjectVersionRequest {
  id: number // 版本ID
  resourceYamlStr: string // 资源YAML字符串
}

/** 审计日志信息 */
export interface OnecProjectAuditLog {
  id: number
  workspaceId: number
  applicationId: number
  resourceClusterId: number
  versionId: number
  resourceType: string
  title: string
  action: string
  actionDetail: string
  operatorId: number
  operatorName: string
  createdAt: number
  updatedAt: number
  status: number // 操作状态：1. SUCCESS/2. FAILURE/3. PENDING/4. CANCELED/5. TIMEOUT/6. UNKNOWN
}

/** 查询审计日志请求 */
export interface SearchOnecProjectAuditLogRequest {
  page?: number // 页码
  pageSize?: number // 每页数量
  workspaceId: number // 工作空间ID
  applicationId?: number // 应用ID（可选）
  resourceClusterId?: number // 集群资源ID（可选）
  resourceType?: string // 资源类型（可选）
  action?: string // 操作类型（可选）
  operatorName?: string // 操作人（可选）
}

/** 查询审计日志响应 */
export interface SearchOnecProjectAuditLogResponse {
  data: OnecProjectAuditLog[]
  total: number
}

/** 默认ID请求 */
export interface DefaultIdRequest {
  id: number
}

// ========== API 接口 ==========

/**
 * 添加应用资源（同步资源到集群）
 * @param data 添加应用资源请求参数
 * @returns 操作结果
 */
export async function addApplicationResourceApi(data: AddApplicationResourceRequest) {
  return request.post<string>({
    url: `${WORKLOAD_BASE_PATH}/resource`,
    data
  })
}

/**
 * 获取应用详情
 * @param id 应用ID
 * @returns 应用详情信息
 */
export async function getApplicationDetailApi(id: number) {
  return request.get<OnecProjectApplication>({
    url: `${WORKLOAD_BASE_PATH}/detail/${id}`
  })
}

/**
 * 获取版本详情
 * @param versionId 版本ID
 * @returns 版本详情信息
 */
export async function getVersionDetailApi(versionId: number) {
  return request.get<OnecProjectVersion>({
    url: `${WORKLOAD_BASE_PATH}/version/detail/${versionId}`
  })
}

/**
 * 更新应用
 * @param data 更新应用请求参数
 * @returns 操作结果
 */
export async function updateApplicationApi(data: UpdateOnecProjectApplicationRequest) {
  return request.put<string>({
    url: `${WORKLOAD_BASE_PATH}/update`,
    data
  })
}

/**
 * 删除应用
 * @param id 应用ID
 * @returns 操作结果
 */
export async function deleteApplicationApi(id: number) {
  return request.del<string>({
    url: `${WORKLOAD_BASE_PATH}/del/${id}`
  })
}

/**
 * 查询应用列表
 * @param params 查询应用请求参数
 * @returns 应用列表
 */
export async function searchApplicationApi(params: SearchOnecProjectApplicationRequest) {
  return request.get<OnecProjectApplication[]>({
    url: `${WORKLOAD_BASE_PATH}/search`,
    params
  })
}

/**
 * 添加版本
 * @param data 添加版本请求参数
 * @returns 操作结果
 */
export async function addVersionApi(data: AddOnecProjectVersionRequest) {
  return request.post<string>({
    url: `${WORKLOAD_BASE_PATH}/version/add`,
    data
  })
}

/**
 * 删除版本
 * @param id 版本ID
 * @returns 操作结果
 */
export async function deleteVersionApi(id: number) {
  return request.del<string>({
    url: `${WORKLOAD_BASE_PATH}/version/del/${id}`
  })
}

/**
 * 查询版本列表
 * @param params 查询版本请求参数
 * @returns 版本列表
 */
export async function searchVersionApi(params: SearchOnecProjectVersionRequest) {
  return request.get<OnecProjectVersion[]>({
    url: `${WORKLOAD_BASE_PATH}/version/search`,
    params
  })
}

/**
 * 更新版本
 * @param data 更新版本请求参数
 * @returns 操作结果
 */
export async function updateVersionApi(data: UpdateOnecProjectVersionRequest) {
  return request.put<string>({
    url: `${WORKLOAD_BASE_PATH}/version/update`,
    data
  })
}

/**
 * 删除审计日志
 * @param id 审计日志ID
 * @returns 操作结果
 */
export async function deleteAuditLogApi(id: number) {
  return request.del<string>({
    url: `${WORKLOAD_BASE_PATH}/audit-log/del/${id}`
  })
}

/**
 * 查询审计日志列表
 * @param params 查询审计日志请求参数
 * @returns 审计日志列表
 */
export async function searchAuditLogApi(params: SearchOnecProjectAuditLogRequest) {
  return request.get<SearchOnecProjectAuditLogResponse>({
    url: `${WORKLOAD_BASE_PATH}/audit-log/search`,
    params
  })
}

/**
 * 获取资源类型列表（辅助函数）
 * @returns 资源类型列表
 */
export function getResourceTypes() {
  return [
    { value: ResourceType.DEPLOYMENT, label: 'Deployment' },
    { value: ResourceType.STATEFULSET, label: 'StatefulSet' },
    { value: ResourceType.DAEMONSET, label: 'DaemonSet' },
    { value: ResourceType.JOB, label: 'Job' },
    { value: ResourceType.CRONJOB, label: 'CronJob' },
    { value: ResourceType.POD, label: 'Pod' }
  ]
}

/**
 * 审计日志状态枚举（辅助）
 */
export enum AuditLogStatus {
  SUCCESS = 1,
  FAILURE = 2,
  PENDING = 3,
  CANCELED = 4,
  TIMEOUT = 5,
  UNKNOWN = 6
}

/**
 * 获取审计日志状态文本（辅助函数）
 * @param status 状态码
 * @returns 状态文本
 */
export function getAuditLogStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    [AuditLogStatus.SUCCESS]: '成功',
    [AuditLogStatus.FAILURE]: '失败',
    [AuditLogStatus.PENDING]: '进行中',
    [AuditLogStatus.CANCELED]: '已取消',
    [AuditLogStatus.TIMEOUT]: '超时',
    [AuditLogStatus.UNKNOWN]: '未知'
  }
  return statusMap[status] || '未知'
}

/**
 * 获取审计日志状态类型（辅助函数，用于 ElTag）
 * @param status 状态码
 * @returns Element Plus Tag 类型
 */
export function getAuditLogStatusType(
  status: number
): '' | 'success' | 'warning' | 'danger' | 'info' {
  const typeMap: Record<number, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    [AuditLogStatus.SUCCESS]: 'success',
    [AuditLogStatus.FAILURE]: 'danger',
    [AuditLogStatus.PENDING]: 'warning',
    [AuditLogStatus.CANCELED]: 'info',
    [AuditLogStatus.TIMEOUT]: 'danger',
    [AuditLogStatus.UNKNOWN]: 'info'
  }
  return typeMap[status] || 'info'
}

// 类型定义区域添加
/** 版本标签响应 */
export interface VersionLabelsResp {
  key: string // 标签键
  value: string // 标签值
}

// API 函数区域添加（在版本相关 API 后面）
/**
 * 获取某一个版本的 labels
 * @param id 版本ID
 * @returns 版本标签列表
 */
export async function getVersionLabelsApi(id: number) {
  return request.get<VersionLabelsResp[]>({
    url: `${WORKLOAD_BASE_PATH}/version/labels/${id}`
  })
}

// ========== 类型定义 ========== 部分添加

/** 迁移版本请求 */
export interface MigrateVersionOnProjectRequest {
  versionId: number // 版本ID
  newVersionName: string // 新版本名称
  newApplicationId: number // 新应用ID
}

/** 迁移工作空间请求 */
export interface MigrateWorkspaceOnProjectRequest {
  workloadId: number // 工作负载ID
  newProjectId: number // 新项目ID
}

// 在文件开头添加项目管理基础路径常量
const PROJECT_BASE_PATH = '/manager/v1/project'

// ========== API 接口 ========== 部分添加（建议放在文件末尾）

/**
 * 同集群迁移版本
 * @param data 迁移版本请求参数
 * @returns 操作结果
 */
export async function migrateVersionOnProjectApi(data: MigrateVersionOnProjectRequest) {
  return request.post<string>({
    url: `${PROJECT_BASE_PATH}/migrate/version`,
    data
  })
}

/**
 * 同集群迁移工作空间
 * @param data 迁移工作空间请求参数
 * @returns 操作结果
 */
export async function migrateWorkspaceOnProjectApi(data: MigrateWorkspaceOnProjectRequest) {
  return request.post<string>({
    url: `${PROJECT_BASE_PATH}/migrate/workspace`,
    data
  })
}
