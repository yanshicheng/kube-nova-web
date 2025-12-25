/**
 * HTTP 状态码定义
 * 定义了系统中使用的各种 HTTP 状态码常量
 */

export const ApiStatus = {
  /** 成功 */
  success: 0,
  /** 未授权 */
  unauthorized: 401,
  /** 请求错误 */
  error: 400,
  /** 请求超时 */
  requestTimeout: 408,
  /** 服务器内部错误 */
  internalServerError: 500,
  /** 网关错误 */
  badGateway: 502,
  /** 服务不可用 */
  serviceUnavailable: 503,
  /** 网关超时 */
  gatewayTimeout: 504
} as const

export type ApiStatusType = (typeof ApiStatus)[keyof typeof ApiStatus]