import request from '@/utils/http'

// 定义基础路径
const TOKEN_BASE_PATH = '/portal/v1/token'

// ========== 类型定义 ==========

/** Token信息 */
export interface TokenSysToken {
  id: number // 自增主键
  ownerType: number // 所有者类型: 1-用户, 2-角色
  ownerId: number // 所有者ID（用户ID或角色ID）
  token: string // Token值
  name: string // Token名称
  type: number // 类型: 1-临时, 2-长期, 3-永久
  expireTime: number // 过期时间
  status: number // 状态: 0-禁用, 1-启用
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加Token请求 */
export interface TokenAddRequest {
  ownerType: number // 所有者类型
  ownerId: number // 所有者ID
  name: string // Token名称
  type: number // 类型
  expireTime?: number // 过期时间
  status?: number // 状态
}

/** 添加Token响应 */
export interface TokenAddResponse {
  token: string // 生成的Token值
}

/** 搜索Token请求 */
export interface TokenSearchRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  ownerType?: number // 所有者类型
  ownerId?: number // 所有者ID
  token?: string // Token值
  name?: string // Token名称
  type?: number // 类型
}

/** 搜索Token响应 */
export interface TokenSearchResponse {
  items: TokenSysToken[] // Token列表
  total: number // 总条数
}

/** 获取用户Token响应 */
export interface TokenUserResponse {
  token: string // Token值
}

// ========== API 接口 ==========

/**
 * 添加Token
 * @param data 添加Token请求参数
 * @returns Token值
 */
export async function addTokenApi(data: TokenAddRequest) {
  return request.post<TokenAddResponse>({
    url: `${TOKEN_BASE_PATH}`,
    data
  })
}

/**
 * 删除Token
 * @param id Token ID
 * @returns 操作结果
 */
export async function deleteTokenApi(id: number) {
  return request.del<string>({
    url: `${TOKEN_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取Token
 * @param id Token ID
 * @returns Token信息
 */
export async function getTokenByIdApi(id: number) {
  return request.get<TokenSysToken>({
    url: `${TOKEN_BASE_PATH}/${id}`
  })
}

/**
 * 搜索Token
 * @param params 搜索参数
 * @returns Token列表
 */
export async function searchTokenApi(params?: TokenSearchRequest) {
  return request.get<TokenSearchResponse>({
    url: `${TOKEN_BASE_PATH}`,
    params
  })
}

/**
 * 根据用户ID获取Token
 * @param userId 用户ID
 * @returns Token值
 */
export async function getTokenByUserIdApi(userId: number) {
  return request.get<TokenUserResponse>({
    url: `${TOKEN_BASE_PATH}/user/${userId}`
  })
}
