import request from '@/utils/http'

// 定义基础路径
const API_BASE_PATH = '/portal/v1/api'

// ========== 类型定义 ==========

/** API权限信息 */
export interface ApiSysAPI {
  id: number // 主键ID
  parentId: number // 父级API ID，0为顶级
  name: string // API名称
  path: string // API路径，支持RESTful风格如 /api/users/:id
  method: string // HTTP方法: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
  isPermission: number // 是否为权限(权限 or 分组) 0: 分组 1: 权限
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加API请求 */
export interface ApiAddRequest {
  parentId?: number // 父级API ID，0为顶级
  name: string // API名称，必填
  path: string // API路径，必填
  method: string // HTTP方法，必填
  isPermission: number // 是否为权限，必填
}

/** 更新API请求 */
export interface ApiUpdateRequest {
  id: number // API ID，必填
  parentId?: number // 父级API ID
  name: string // API名称，必填
  path: string // API路径，必填
  method: string // HTTP方法，必填
  isPermission: number // 是否为权限，必填
}

/** 搜索API请求 */
export interface ApiSearchRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  parentId?: number // 父级API ID
  name?: string // API名称
  path?: string // API路径
  method?: string // HTTP方法
  isPermission?: number // 是否为权限
}

/** 搜索API响应 */
export interface ApiSearchResponse {
  items: ApiSysAPI[] // API数据列表
  total: number // 总条数
}

/** 分组树节点 */
export interface ApiGroupTreeNode {
  id: number // 主键ID
  name: string // 分组名称
  pid: number // 父级ID
  children: ApiGroupTreeNode[] // 子节点
}

/** 获取分组树请求 */
export interface ApiGroupsTreeRequest {
  isPermission?: number // 权限类型筛选
}

/** 获取分组树响应 */

// ========== API 接口 ==========

/**
 * 添加API
 * @param data 添加API请求参数
 * @returns 操作结果
 */
export async function addApiApi(data: ApiAddRequest) {
  return request.post<string>({
    url: `${API_BASE_PATH}`,
    data
  })
}

/**
 * 更新API
 * @param data 更新API请求参数
 * @returns 操作结果
 */
export async function updateApiApi(data: ApiUpdateRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${API_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除API
 * @param id API ID
 * @returns 操作结果
 */
export async function deleteApiApi(id: number) {
  return request.del<string>({
    url: `${API_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取API
 * @param id API ID
 * @returns API信息
 */
export async function getApiByIdApi(id: number) {
  return request.get<ApiSysAPI>({
    url: `${API_BASE_PATH}/${id}`
  })
}

/**
 * 搜索API
 * @param params 搜索参数
 * @returns API列表
 */
export async function searchApiApi(params?: ApiSearchRequest) {
  return request.get<ApiSearchResponse>({
    url: `${API_BASE_PATH}`,
    params
  })
}

/**
 * 获取分组树
 * @param params 请求参数
 * @returns 分组树数据
 */
export async function getApiGroupsTreeApi(params?: ApiGroupsTreeRequest) {
  return request.get<ApiGroupTreeNode[]>({
    url: `${API_BASE_PATH}/groups/tree`,
    params
  })
}

/** API权限树节点 */
export interface ApiSysAPITreeNode {
  id: number // 主键ID
  name: string // API名称
  isPermission: number // 是否为权限(权限 or 分组) 0: 分组 1: 权限
  children: ApiSysAPITreeNode[] // 子节点
}

/** 获取API权限树请求 */
export interface ApiTreeRequest {
  // 可以添加过滤条件，如只获取权限或只获取分组
}

// ========== 新增API接口 ==========

/**
 * 获取API权限树
 * @param params 请求参数
 * @returns API权限树
 */
export async function getApiTreeApi(params?: ApiTreeRequest) {
  return request.get<ApiSysAPITreeNode[]>({
    url: `${API_BASE_PATH}/tree`,
    params
  })
}
