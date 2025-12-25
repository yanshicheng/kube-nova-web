import request from '@/utils/http'

// 定义基础路径
const ROLE_BASE_PATH = '/portal/v1/role'

// ========== 类型定义 ==========

/** 角色信息 */
export interface RoleSysRole {
  id: number // 自增主键
  name: string // 角色名称
  code: string // 角色编码(如: super, admin, user)
  remark: string // 备注说明
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加角色请求 */
export interface RoleAddRequest {
  name: string // 角色名称，必填
  code: string // 角色编码，必填
  remark?: string // 备注说明
}

/** 更新角色请求 */
export interface RoleUpdateRequest {
  id: number // 角色ID，必填
  name: string // 角色名称，必填
  code?: string // 角色编码
  remark?: string // 备注说明
}

/** 搜索角色请求 */
export interface RoleSearchRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  name?: string // 角色名称
  code?: string // 角色编码
}

/** 搜索角色响应 */
export interface RoleSearchResponse {
  items: RoleSysRole[] // 角色数据列表
  total: number // 总条数
}

/** 角色绑定菜单请求 */
export interface RoleBindMenuRequest {
  roleId: number // 角色ID，必填
  menuIds: number[] // 菜单ID列表
}

/** 角色绑定API权限请求 */
export interface RoleBindApiRequest {
  roleId: number // 角色ID，必填
  apiIds: number[] // API权限ID列表
}

// ========== API 接口 ==========

/**
 * 添加角色
 * @param data 添加角色请求参数
 * @returns 操作结果
 */
export async function addRoleApi(data: RoleAddRequest) {
  return request.post<string>({
    url: `${ROLE_BASE_PATH}`,
    data
  })
}

/**
 * 更新角色
 * @param data 更新角色请求参数
 * @returns 操作结果
 */
export async function updateRoleApi(data: RoleUpdateRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${ROLE_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除角色
 * @param id 角色ID
 * @returns 操作结果
 */
export async function deleteRoleApi(id: number) {
  return request.del<string>({
    url: `${ROLE_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取角色
 * @param id 角色ID
 * @returns 角色信息
 */
export async function getRoleByIdApi(id: number) {
  return request.get<RoleSysRole>({
    url: `${ROLE_BASE_PATH}/${id}`
  })
}

/**
 * 搜索角色
 * @param params 搜索参数
 * @returns 角色列表
 */
export async function searchRoleApi(params?: RoleSearchRequest) {
  return request.get<RoleSearchResponse>({
    url: `${ROLE_BASE_PATH}`,
    params
  })
}

/**
 * 角色绑定菜单
 * @param data 角色绑定菜单请求参数
 * @returns 操作结果
 */
export async function bindRoleMenuApi(data: RoleBindMenuRequest) {
  const { roleId, menuIds } = data
  return request.post<string>({
    url: `${ROLE_BASE_PATH}/${roleId}/menus`,
    data: { menuIds }
  })
}

/**
 * 查询角色菜单
 * @param roleId 角色ID
 * @returns 菜单ID列表
 */
export async function getRoleMenuApi(roleId: number) {
  return request.get<number[]>({
    url: `${ROLE_BASE_PATH}/${roleId}/menus`
  })
}

/**
 * 角色绑定API权限
 * @param data 角色绑定API权限请求参数
 * @returns 操作结果
 */
export async function bindRoleApiApi(data: RoleBindApiRequest) {
  const { roleId, apiIds } = data
  return request.post<string>({
    url: `${ROLE_BASE_PATH}/${roleId}/apis`,
    data: { apiIds }
  })
}

/**
 * 查询角色API权限
 * @param roleId 角色ID
 * @returns API权限ID列表
 */
export async function getRoleApiApi(roleId: number) {
  return request.get<number[]>({
    url: `${ROLE_BASE_PATH}/${roleId}/apis`
  })
}
