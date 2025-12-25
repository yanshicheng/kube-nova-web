import request from '@/utils/http'

// 定义基础路径
const LOGIN_LOG_BASE_PATH = '/portal/v1/login-log'

// ========== 类型定义 ==========

/** 登录日志信息 */
export interface LoginLogSysLoginLog {
  id: number // 自增主键
  userId: number // 用户ID(登录成功才有)
  username: string // 登录用户名
  ipAddress: string // IP地址
  userAgent: string // 用户代理
  loginTime: number // 登录时间（Unix时间戳）
  loginStatus: number // 登录状态(0:失败 1:成功)
}

/** 搜索登录日志请求 */
export interface LoginLogSearchRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderField?: string // 排序字段
  isAsc?: boolean // 是否升序
  userId?: number // 用户ID
  username?: string // 登录用户名
  ipAddress?: string // IP地址
  userAgent?: string // 用户代理
}

/** 搜索登录日志响应 */
export interface LoginLogSearchResponse {
  items: LoginLogSysLoginLog[] // 登录日志列表
  total: number // 总条数
}

// ========== API 接口 ==========

/**
 * 删除登录日志
 * @param id 日志ID
 * @returns 操作结果
 */
export async function deleteLoginLogApi(id: number) {
  return request.del<string>({
    url: `${LOGIN_LOG_BASE_PATH}/${id}`
  })
}

/**
 * 搜索登录日志
 * @param params 搜索参数
 * @returns 登录日志列表
 */
export async function searchLoginLogApi(params?: LoginLogSearchRequest) {
  // 参数转换，确保字段名与后端一致
  const requestParams = {
    ...params,
    orderField: params?.orderField
  }

  return request.get<LoginLogSearchResponse>({
    url: `${LOGIN_LOG_BASE_PATH}`,
    params: requestParams
  })
}
