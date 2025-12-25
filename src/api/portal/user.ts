import request from '@/utils/http'

// 定义基础路径
const USER_BASE_PATH = '/portal/v1/user'

// ========== 类型定义 ==========

/** 用户信息 */
export interface UserSysUser {
  id: number // 自增主键
  username: string // 用户名
  nickname: string // 昵称
  avatar: string // 头像URL
  email: string // 邮箱
  phone: string // 手机号
  workNumber: string // 工号
  deptId: number // 部门ID
  status: number // 状态: 0-禁用, 1-启用
  isNeedResetPwd: number // 是否需要重置密码: 0-否, 1-是
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 用户详情信息 */
export interface UserSysUserInfo {
  id: number // 自增主键
  username: string // 用户名
  nickname: string // 昵称
  avatar: string // 头像URL
  email: string // 邮箱
  phone: string // 手机号
  workNumber: string // 工号
  status: number // 状态: 0-禁用, 1-启用
  isNeedResetPwd: number // 是否需要重置密码: 0-否, 1-是
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
  deptNames: string // 部门完整信息 / 分割
  roleNames: string // 角色列表names
}

/** 添加用户请求 */
export interface UserAddRequest {
  username: string // 用户名
  nickname: string // 昵称
  email: string // 邮箱
  phone: string // 手机号
  workNumber: string // 工号
  deptId?: number // 部门ID
}

/** 更新用户请求（管理员更新） */
export interface UserUpdateRequest {
  id: number // 用户ID
  nickname: string // 昵称
  email: string // 邮箱
  phone: string // 手机号
  workNumber: string // 工号
  deptId: number // 部门ID
  status?: number // 状态
  isNeedResetPwd?: number // 是否需要重置密码
}

/** 更新个人信息请求 */
export interface UserUpdateInfoRequest {
  nickname: string // 昵称
  email: string // 邮箱
  phone: string // 手机号
}

/** 搜索用户请求 */
export interface UserSearchRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  username?: string // 用户名
  nickname?: string // 昵称
  phone?: string // 手机号
  email?: string // 邮箱
  workNumber?: string // 工号
  createBy?: string
  updateBy?: string
  loginIp?: string
}

/** 搜索用户响应 */
export interface UserSearchResponse {
  items: UserSysUser[] // 用户列表
  total: number // 总条数
}

/** 修改头像请求 */
export interface UserUpdateAvatarRequest {
  avatar: string // 头像URL
}

/** 修改密码请求 */
export interface UserUpdatePasswordRequest {
  username: string
  oldPassword: string // 旧密码
  newPassword: string // 新密码
  confirmPassword: string // 确认密码
}

/** 启用禁用用户请求 */
export interface UserUpdateStatusRequest {
  id: number // 用户ID
  status: number // 状态: 0-禁用, 1-启用
}

/** 用户绑定角色请求 */
export interface UserBindRoleRequest {
  id: number // 用户ID
  roleIds: number[] // 角色ID列表
}

/** 获取用户角色响应 */
export interface UserRolesResponse {
  roleIds: number[] // 角色ID列表
  roleNames: string[] // 角色名称列表
}

/** 重置密码请求（管理员重置其他用户密码） */
export interface UserResetPasswordRequest {
  id: number // 用户ID
}

// ========== API 接口 ==========

/**
 * Base64编码
 */
function encodeBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16))
    })
  )
}

/**
 * 添加用户
 * @param data 添加用户请求参数
 * @returns 操作结果
 */
export async function addUserApi(data: UserAddRequest) {
  return request.post<string>({
    url: `${USER_BASE_PATH}`,
    data
  })
}

/**
 * 更新用户（管理员）
 * @param data 更新用户请求参数
 * @returns 操作结果
 */
export async function updateUserApi(data: UserUpdateRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${USER_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除用户
 * @param id 用户ID
 * @returns 操作结果
 */
export async function deleteUserApi(id: number) {
  return request.del<string>({
    url: `${USER_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取用户
 * @param id 用户ID
 * @returns 用户信息
 */
export async function getUserByIdApi(id: number) {
  return request.get<UserSysUser>({
    url: `${USER_BASE_PATH}/${id}`
  })
}

/**
 * 搜索用户
 * @param params 搜索参数
 * @returns 用户列表
 */
export async function searchUserApi(params?: UserSearchRequest) {
  return request.get<UserSearchResponse>({
    url: `${USER_BASE_PATH}`,
    params
  })
}

/**
 * 获取当前用户详情
 * @returns 用户详情信息
 */
export async function getUserInfoApi() {
  return request.get<UserSysUserInfo>({
    url: `${USER_BASE_PATH}/info`
  })
}

/**
 * 更新个人信息
 * @param data 更新个人信息请求参数
 * @returns 操作结果
 */
export async function updateUserInfoApi(data: UserUpdateInfoRequest) {
  return request.put<string>({
    url: `${USER_BASE_PATH}/info`,
    data
  })
}

/**
 * 修改头像
 * @param data 修改头像请求参数
 * @returns 操作结果
 */
export async function updateUserAvatarApi(data: UserUpdateAvatarRequest) {
  return request.put<string>({
    url: `${USER_BASE_PATH}/avatar`,
    data
  })
}

/**
 * 修改密码
 * @param data 修改密码请求参数
 * @returns 操作结果
 */
export async function updateUserPasswordApi(data: UserUpdatePasswordRequest) {
  // 对密码进行base64加密
  const encryptedData = {
    username: data.username,
    oldPassword: encodeBase64(data.oldPassword),
    newPassword: encodeBase64(data.newPassword),
    confirmPassword: encodeBase64(data.confirmPassword)
  }

  return request.put<string>({
    url: `${USER_BASE_PATH}/password`,
    data: encryptedData
  })
}

/**
 * 启用/禁用用户
 * @param data 启用禁用用户请求参数
 * @returns 操作结果
 */
export async function updateUserStatusApi(data: UserUpdateStatusRequest) {
  return request.put<string>({
    url: `${USER_BASE_PATH}/status`,
    data: data
  })
}

/**
 * 用户绑定角色
 * @param data 用户绑定角色请求参数
 * @returns 操作结果
 */
export async function updateUserBindRoleApi(data: UserBindRoleRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${USER_BASE_PATH}/${id}/roles`,
    data: params
  })
}

/**
 * 获取用户角色
 * @param id 用户ID
 * @returns 用户角色信息
 */
export async function getUserRolesApi(id: number) {
  return request.get<UserRolesResponse>({
    url: `${USER_BASE_PATH}/${id}/roles`
  })
}

/**
 * 重置密码（管理员重置其他用户密码）
 * @param id 用户ID
 * @returns 操作结果
 */
export async function resetUserPasswordApi(id: number) {
  return request.post<string>({
    url: `${USER_BASE_PATH}/${id}/reset-password`,
    data: {}
  })
}



