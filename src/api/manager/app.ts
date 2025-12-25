import request from '@/utils/http'

// 定义基础路径
const APP_BASE_PATH = '/manager/v1/app'

// ========== 类型定义 ==========

/** 应用类型枚举 */
export enum AppType {
  MONITORING = 1, // 监控
  LOGGING = 2, // 日志
  TRACING = 3, // 链路追踪
  MESH = 4, // 服务网格
  ALERT = 5 // 告警
}

/** 协议类型 */
export type ProtocolType = 'http' | 'https' | 'grpc'

/** 认证类型 */
export type AuthType = 'none' | 'basic' | 'bearer' | 'certificate'

/** 集群应用详情 */
export interface ClusterAppDetail {
  id: number // 自增主键
  clusterUuid: string // 关联的集群UUID
  appName: string // 应用名称，如Prometheus-生产环境
  appCode: string // 应用标识码，如prometheus/grafana/elasticsearch
  appType: number // 应用类型：1. monitoring(监控)/2. logging(日志)/3. tracing(链路追踪)/4. mesh(服务网格)/ 5. alert (告警)
  isDefault: number // 是否默认配置：1-默认，0-非默认
  appUrl: string // 应用访问地址，如https://prometheus.example.com
  port: number // 服务端口
  protocol: string // 访问协议：http/https/grpc
  authEnabled: number // 是否需要认证：1-需要，0-不需要
  authType: string // 认证类型：none/basic/bearer/certificate
  username: string // 用户名（AES加密存储）
  password: string // 密码（AES加密存储）
  token: string // Token/API Key（AES加密存储）
  accessKey: string // Access Key
  accessSecret: string // Access Secret
  tlsEnabled: number // 是否启用TLS：1-启用，0-不启用
  caFile: string // CA证书内容
  caKey: string // CA Key内容
  caCert: string // CA证书内容（PEM格式）
  clientCert: string // 客户端证书（PEM格式）
  clientKey: string // 客户端密钥（PEM格式，AES加密存储）
  insecureSkipVerify: number // 是否跳过证书验证：1-跳过，0-不跳过
  status: number // 状态: 0-异常，1-正常
  createdBy: string // 记录创建人
  updatedBy: string // 记录最后更新人
  createdAt: number // 记录创建时间（时间戳）
  updatedAt: number // 记录更新时间（时间戳）
}

/** 添加/更新集群应用请求 */
export interface AddClusterAppRequest {
  clusterUuid: string // 关联的集群UUID，必填
  appName: string // 应用名称，如Prometheus-生产环境，必填
  appCode: string // 应用标识码，如prometheus/grafana/elasticsearch，必填
  appType: number // 应用类型：1-5，必填
  isDefault?: number // 是否默认配置：1-默认，0-非默认，可选
  appUrl: string // 应用访问地址，必填
  port?: number // 服务端口，可选，范围1-65535
  protocol?: ProtocolType // 访问协议，可选，默认http
  authEnabled?: number // 是否需要认证：1-需要，0-不需要，可选
  authType?: AuthType // 认证类型，可选
  username?: string // 用户名，可选，最大长度100
  password?: string // 密码，可选，最大长度200
  token?: string // Token/API Key，可选，最大长度500
  accessKey?: string // Access Key，可选，最大长度100
  accessSecret?: string // Access Secret，可选，最大长度200
  tlsEnabled?: number // 是否启用TLS：1-启用，0-不启用，可选
  caFile?: string // CA证书内容，可选
  caKey?: string // CA Key内容，可选
  caCert?: string // CA证书内容（PEM格式），可选
  clientCert?: string // 客户端证书（PEM格式），可选
  clientKey?: string // 客户端密钥（PEM格式，AES加密存储），可选
  insecureSkipVerify?: number // 是否跳过证书验证：1-跳过，0-不跳过，可选
  updatedBy?: string // 记录最后更新人，可选，最大长度50
}

/** 添加/更新集群应用响应 */
export interface AddClusterAppResponse {
  message: string // 操作结果消息
}

/** 验证应用响应 */
export interface ClusterAppValidateResponse {
  isValid: boolean // 验证是否通过
  message: string // 验证结果消息
}

/** 获取集群应用列表请求 */
export interface ClusterAppListRequest {
  clusterUuid: string // 集群UUID，必填
}



// ========== API 接口 ==========

/**
 * 添加或更新集群应用
 * @description 添加或更新集群应用配置，如果应用已存在则更新，否则创建新应用
 * @param data 应用配置信息
 * @returns 操作结果消息
 */
export async function addClusterAppApi(data: AddClusterAppRequest) {
  return request.post<AddClusterAppResponse>({
    url: `${APP_BASE_PATH}`,
    data
  })
}

/**
 * 获取应用详情
 * @description 根据应用ID获取应用的详细配置信息
 * @param id 应用ID
 * @returns 应用详细信息
 */
export async function getClusterAppDetailApi(id: number) {
  return request.get<ClusterAppDetail>({
    url: `${APP_BASE_PATH}/${id}`
  })
}

/**
 * 验证应用连通性
 * @description 测试中间件是否正常，验证应用的连通性和认证配置
 * @param id 应用ID
 * @returns 验证结果
 */
export async function validateClusterAppApi(id: number) {
  return request.post<ClusterAppValidateResponse>({
    url: `${APP_BASE_PATH}/${id}/validate`,
    data: {}
  })
}

/**
 * 获取集群应用列表
 * @description 获取指定集群下的所有应用配置列表
 * @param clusterUuid 集群UUID
 * @returns 应用列表
 */
export async function getClusterAppListApi(clusterUuid: string) {
  return request.get<ClusterAppDetail[]>({
    url: `${APP_BASE_PATH}/list`,
    params: { clusterUuid }
  })
}

// ========== 工具函数 ==========

/**
 * 获取应用类型的显示名称
 * @param type 应用类型值
 * @returns 应用类型的中文名称
 */
export function getAppTypeLabel(type: number): string {
  const typeMap: Record<number, string> = {
    [AppType.MONITORING]: '监控',
    [AppType.LOGGING]: '日志',
    [AppType.TRACING]: '链路追踪',
    [AppType.MESH]: '服务网格',
    [AppType.ALERT]: '告警'
  }
  return typeMap[type] || '未知'
}

/**
 * 获取认证类型的显示名称
 * @param authType 认证类型
 * @returns 认证类型的中文名称
 */
export function getAuthTypeLabel(authType: string): string {
  const authTypeMap: Record<string, string> = {
    none: '无认证',
    basic: '基础认证',
    bearer: 'Bearer Token',
    certificate: '证书认证'
  }
  return authTypeMap[authType] || '未知'
}

/**
 * 获取应用状态的显示信息
 * @param status 状态值
 * @returns 状态信息对象
 */
export function getAppStatusInfo(status: number): { label: string; color: string } {
  if (status === 1) {
    return { label: '正常', color: 'success' }
  }
  return { label: '异常', color: 'error' }
}

/**
 * 格式化应用URL
 * @param url 应用URL
 * @param protocol 协议类型
 * @returns 格式化后的完整URL
 */
export function formatAppUrl(url: string, protocol?: string): string {
  if (!url) return ''

  // 如果URL已经包含协议，直接返回
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('grpc://')) {
    return url
  }

  // 否则添加协议前缀
  const finalProtocol = protocol || 'http'
  return `${finalProtocol}://${url}`
}

/**
 * 验证端口号是否合法
 * @param port 端口号
 * @returns 是否合法
 */
export function isValidPort(port: number): boolean {
  return port >= 1 && port <= 65535
}

/**
 * 构建应用的完整访问地址
 * @param app 应用信息
 * @returns 完整的访问地址
 */
export function buildAppAccessUrl(app: ClusterAppDetail): string {
  const url = formatAppUrl(app.appUrl, app.protocol)
  if (app.port && app.port !== 80 && app.port !== 443) {
    const urlObj = new URL(url)
    urlObj.port = app.port.toString()
    return urlObj.toString()
  }
  return url
}
