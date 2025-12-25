import request from '@/utils/http'

// 定义基础路径
const AUTH_BASE_PATH = '/portal/v1/auth'

// ========== 类型定义 ==========

/** Token信息 */
export interface AuthTokenResponse {
  accessToken: string // 访问令牌
  accessExpiresIn: number // 访问令牌过期时间（秒）
  refreshToken: string // 刷新令牌
  refreshExpiresIn: number // 刷新令牌过期时间（秒）
}

/** 登录请求参数 */
export interface AuthLoginRequest {
  username: string // 用户名
  password: string // 密码
}

/** 登录响应 */
export interface AuthLoginResponse {
  userId: number // 用户ID
  username: string // 用户名
  nickName: string // 昵称
  uuid: string // 用户UUID
  roles: string[] // 角色列表
  token: AuthTokenResponse // Token信息
}

/** 刷新Token请求参数 */
export interface AuthRefreshTokenRequest {
  refreshToken: string // 刷新令牌
}

/** 刷新Token响应 */
export interface AuthRefreshTokenResponse {
  accessToken: string // 访问令牌
  accessExpiresIn: number // 访问令牌过期时间（秒）
}

/** 登出请求参数 */
export interface AuthLogoutRequest {
  username?: string // 用户名
  uuid?: string // 用户UUID
}

/** 登出响应 */
export interface AuthLogoutResponse {
  success: boolean // 是否成功
  message: string // 消息
}



/** 验证Token请求参数 */
export interface AuthVerifyTokenRequest {
  token: string // 令牌
}

/** 验证Token响应 */
export interface AuthVerifyTokenResponse {
  isValid: boolean // 令牌是否有效
  errorType: number // 错误类型
  errorMessage: string // 错误信息
  expireTime: number // 过期时间（Unix 时间戳）
  userId: number // 用户ID
  username: string // 用户名
  uuid: string // 用户UUID
  nickName: string // 昵称
  roles: string[] // 角色列表
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
 * 登录
 * @param data 登录参数
 * @returns 登录响应
 */
export async function loginApi(data: AuthLoginRequest) {
  // 对密码进行base64加密
  const encryptedData = {
    username: data.username,
    password: encodeBase64(data.password)
  }

  return request.post<AuthLoginResponse>({
    url: `${AUTH_BASE_PATH}/login`,
    data: encryptedData
  })
}

/**
 * 登出
 * @param data 登出参数
 * @returns 登出响应
 */
export async function logoutApi(data?: AuthLogoutRequest) {
  return request.post<AuthLogoutResponse>({
    url: `${AUTH_BASE_PATH}/logout`,
    data: data || {}
  })
}

/**
 * 刷新Token
 * @param data 刷新Token参数
 * @returns 刷新Token响应
 */
export async function refreshTokenApi(data: AuthRefreshTokenRequest) {
  return request.post<AuthRefreshTokenResponse>({
    url: `${AUTH_BASE_PATH}/refresh-token`,
    data
  })
}

/**
 * 验证Token
 * @param data 验证Token参数
 * @returns 验证Token响应
 */
export async function verifyTokenApi(data: AuthVerifyTokenRequest) {
  return request.post<AuthVerifyTokenResponse>({
    url: `${AUTH_BASE_PATH}/verify-token`,
    data
  })
}

/**
 * 获取权限码
 * @returns 权限码列表
 */
export async function getCodesApi() {
  return request.get<string[]>({
    url: `${AUTH_BASE_PATH}/codes`
  })
}
