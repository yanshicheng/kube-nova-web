import request from '@/utils/http'

// 定义基础路径
const SYNC_BASE_PATH = '/manager/v1/sync'
// 定义同步操作的超时时间（10分钟 = 600000毫秒）
const SYNC_TIMEOUT = 10 * 60 * 1000

// ========== 类型定义 ==========

/** 同步集群请求 */
export interface SyncClusterRequest {
  id: number // 集群ID
}

/** 同步集群资源信息请求 */
export interface SyncClusterResourceRequest {
  id: number // 集群ID
}

/** 同步请求（通用） */
export interface SyncRequest {
  id: number // ID
}

// ========== API 接口 ==========

/**
 * 同步单个集群
 * @param id 集群ID
 * @returns 操作结果
 */
export async function syncClusterApi(id: number) {
  return request.post<string>({
    url: `${SYNC_BASE_PATH}/cluster/${id}`,
    data: {}
  })
}

/**
 * 同步所有集群信息
 * @returns 操作结果
 */
export async function syncAllClustersApi() {
  return request.post<string>({
    url: `${SYNC_BASE_PATH}/cluster/all`,
    data: {},
    timeout: SYNC_TIMEOUT
  })
}

/**
 * 同步集群资源信息
 * @param id 集群ID
 * @returns 操作结果
 */
export async function syncClusterResourceApi(id: number) {
  return request.post<string>({
    url: `${SYNC_BASE_PATH}/cluster/${id}/resource`,
    data: {},
    timeout: SYNC_TIMEOUT
  })
}

/**
 * 同步项目
 * @param id 项目ID
 * @returns 操作结果
 */
export async function syncProjectApi(id: number) {
  return request.post<string>({
    url: `${SYNC_BASE_PATH}/project/${id}`,
    data: {},
    timeout: SYNC_TIMEOUT
  })
}

/**
 * 同步项目集群配额
 * @description 同步计算项目集群的资源使用量，更新到数据库
 * @param id 项目ID
 * @returns 操作结果
 */
export async function syncProjectClusterResourceApi(id: number) {
  return request.post<string>({
    url: `${SYNC_BASE_PATH}/project/${id}/sync`,
    data: {},
    timeout: SYNC_TIMEOUT
  })
}

/**
 * 同步所有项目集群配额
 * @returns 操作结果
 */
export async function syncAllProjectsApi() {
  return request.post<string>({
    url: `${SYNC_BASE_PATH}/project/all`,
    data: {},
    timeout: SYNC_TIMEOUT
  })
}

/**
 * 同步工作空间状态
 * @description 同步工作空间的实际运行状态和资源使用情况
 * @param id 工作空间ID
 * @returns 操作结果
 */
export async function syncWorkspaceApi(id: number) {
  return request.post<string>({
    url: `${SYNC_BASE_PATH}/workspace/${id}/sync`,
    data: {},
    timeout: SYNC_TIMEOUT
  })
}
