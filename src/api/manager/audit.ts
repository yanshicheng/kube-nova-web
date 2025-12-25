import request from '@/utils/http'

// 定义基础路径
const AUDIT_LOG_BASE_PATH = '/manager/v1/project/audit-log'

// ========== 类型定义 ==========

/** 审计日志信息 */
export interface ProjectAuditLog {
  id: number // 主键ID
  clusterName: string // 集群名称
  clusterUuid: string // 集群UUID
  projectId: number // 项目ID
  projectName: string // 项目名称
  workspaceId: number // 工作空间ID，0表示项目级别操作
  workspaceName: string // 工作空间名称
  applicationId: number // 应用ID
  applicationName: string // 应用名称
  title: string // 操作简称，如"资源副本扩容"
  actionDetail: string // 操作详情描述
  status: number // 操作状态 1:成功 0:失败
  operatorId: number // 操作人用户ID
  operatorName: string // 操作人姓名
  createdAt: number // 记录创建时间（时间戳）
  updatedAt: number // 记录更新时间（时间戳）
}

/** 删除审计日志请求 */
export interface DeleteProjectAuditLogRequest {
  id: number // 审计日志ID
}

/** 批量删除审计日志请求 */
export interface BatchDeleteProjectAuditLogRequest {
  ids: number[] // 审计日志ID列表，最多100个
}

/** 删除指定天数之前的审计日志请求 */
export interface DeleteProjectAuditLogBeforeDaysRequest {
  days: number // 删除多少天之前的数据，至少1天
}

/** 搜索审计日志请求 */
export interface SearchProjectAuditLogRequest {
  page?: number // 页码，默认1
  pageSize?: number // 每页数量，默认20，最大100
  orderField?: string // 排序字段，默认id
  isAsc?: boolean // 是否升序，默认false（降序）
  clusterUuid?: string // 集群UUID筛选（可选）
  workspaceId?: number // 工作空间ID筛选（可选，-1表示项目级别操作）
  applicationId?: number // 应用ID筛选（可选，-1表示不筛选）
  title?: string // 操作简称模糊搜索（可选）
  operatorName?: string // 操作人姓名模糊搜索（可选）
  startAt?: number
  endAt?: number
}

/** 搜索审计日志响应 */
export interface SearchProjectAuditLogResponse {
  items: ProjectAuditLog[] // 审计日志列表
  total: number // 总数
}

// ========== API 接口 ==========

/**
 * 搜索审计日志
 * @description 搜索审计日志列表，支持分页和多条件筛选
 * @param params 搜索参数
 * @returns 审计日志列表和总数
 */
export async function searchProjectAuditLogApi(params?: SearchProjectAuditLogRequest) {
  return request.get<SearchProjectAuditLogResponse>({
    url: `${AUDIT_LOG_BASE_PATH}/search`,
    params
  })
}

/**
 * 删除审计日志
 * @description 删除指定的审计日志记录
 * @param id 审计日志ID
 * @returns 操作结果消息
 */
export async function deleteProjectAuditLogApi(id: number) {
  return request.del<string>({
    url: `${AUDIT_LOG_BASE_PATH}/${id}`
  })
}

/**
 * 批量删除审计日志
 * @description 批量删除审计日志记录，最多100条
 * @param data 包含要删除的审计日志ID列表
 * @returns 操作结果消息
 */
export async function batchDeleteProjectAuditLogApi(data: BatchDeleteProjectAuditLogRequest) {
  return request.post<string>({
    url: `${AUDIT_LOG_BASE_PATH}/batch-delete`,
    data
  })
}

/**
 * 删除指定天数之前的审计日志
 * @description 删除指定天数之前的审计日志数据，用于定期清理历史数据
 * @param data 包含天数参数
 * @returns 操作结果消息
 */
export async function deleteProjectAuditLogBeforeDaysApi(
  data: DeleteProjectAuditLogBeforeDaysRequest
) {
  return request.post<string>({
    url: `${AUDIT_LOG_BASE_PATH}/delete-before-days`,
    data
  })
}

// ========== 工具函数 ==========

/**
 * 获取操作状态的显示信息
 * @param status 状态值
 * @returns 状态信息对象
 */
export function getAuditStatusInfo(status: number): { label: string; color: string; type: string } {
  if (status === 1) {
    return { label: '成功', color: 'success', type: 'success' }
  }
  return { label: '失败', color: 'error', type: 'danger' }
}

/**
 * 格式化操作详情
 * @param detail 操作详情
 * @param maxLength 最大长度，默认50
 * @returns 格式化后的详情
 */
export function formatActionDetail(detail: string, maxLength: number = 50): string {
  if (!detail) return '-'
  if (detail.length <= maxLength) return detail
  return detail.substring(0, maxLength) + '...'
}

/**
 * 判断是否为项目级别操作
 * @param workspaceId 工作空间ID
 * @returns 是否为项目级别操作
 */
export function isProjectLevelOperation(workspaceId: number): boolean {
  return workspaceId === 0 || workspaceId === -1
}

/**
 * 获取工作空间显示名称
 * @param workspaceName 工作空间名称
 * @param workspaceId 工作空间ID
 * @returns 显示名称
 */
export function getWorkspaceDisplayName(workspaceName: string, workspaceId: number): string {
  if (isProjectLevelOperation(workspaceId)) {
    return '-'
  }
  return workspaceName || '-'
}
