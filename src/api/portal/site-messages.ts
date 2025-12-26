import request from '@/utils/http'
import { useUserStore } from '@/store/modules/user'
// 定义基础路径
const SITE_MESSAGES_BASE_PATH = '/portal/v1/site-messages'

// ========== 站内消息相关 ==========

/** 站内消息信息 */
export interface SiteMessages {
  id: number // 主键ID
  uuid: string // 消息UUID
  notificationId: number // 关联的通知记录ID(0=平台消息无关联)
  instanceId: number // 关联的告警实例ID(0=无关联)
  userId: number // 接收用户ID
  title: string // 消息标题
  content: string // 消息内容(支持Markdown)
  messageType: string // 消息类型(alert=告警, notification=通知, system=系统消息)
  severity: string // 严重级别(info, warning, critical)
  category: string // 消息分类(便于筛选)
  extraData: string // 扩展数据(JSON格式)
  actionUrl: string // 操作链接
  actionText: string // 操作按钮文本
  isRead: number // 是否已读
  readAt: number // 阅读时间
  isStarred: number // 是否标星
  expireAt: number // 过期时间
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 根据ID获取站内消息响应 */
export interface GetSiteMessagesByIdResponse {
  data: SiteMessages // 消息详情
}

/** 搜索站内消息请求 */
export interface SearchSiteMessagesRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  uuid?: string // 消息UUID
  title?: string // 消息标题(模糊查询)
  severity?: string // 严重级别
  category?: string // 消息分类
  isRead?: number // 是否已读(-1=全部,0=未读,1=已读)
}

/** 搜索站内消息响应 */
export interface SearchSiteMessagesResponse {
  items: SiteMessages[] // 消息列表
  total: number // 总条数
}

/** 批量删除站内消息请求 */
export interface BatchDelSiteMessagesRequest {
  ids: number[] // 消息ID列表
}

/** 批量已读站内消息请求 */
export interface BatchReadSiteMessagesRequest {
  ids: number[] // 消息ID列表
}

/** 获取未读消息数量响应 */
export interface GetUnreadCountResponse {
  count: number // 未读消息数量
}

// ========== API 接口 ==========

/**
 * 删除站内消息
 * @param id 消息ID
 * @returns 操作结果
 */
export async function delSiteMessagesApi(id: number) {
  return request.del<string>({
    url: `${SITE_MESSAGES_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取站内消息
 * @param id 消息ID
 * @returns 消息详情
 */
export async function getSiteMessagesByIdApi(id: number) {
  return request.get<GetSiteMessagesByIdResponse>({
    url: `${SITE_MESSAGES_BASE_PATH}/${id}`
  })
}

/**
 * 搜索站内消息
 * @param params 搜索参数
 * @returns 消息列表
 */
export async function searchSiteMessagesApi(params?: SearchSiteMessagesRequest) {
  return request.get<SearchSiteMessagesResponse>({
    url: `${SITE_MESSAGES_BASE_PATH}`,
    params
  })
}

/**
 * 设置全部已读
 * @returns 操作结果
 */
export async function setAllReadApi() {
  return request.post<string>({
    url: `${SITE_MESSAGES_BASE_PATH}/set-all-read`
  })
}

/**
 * 批量删除站内消息
 * @param data 批量删除请求参数
 * @returns 操作结果
 */
export async function batchDelSiteMessagesApi(data: BatchDelSiteMessagesRequest) {
  return request.post<string>({
    url: `${SITE_MESSAGES_BASE_PATH}/batch-delete`,
    data
  })
}

/**
 * 批量已读站内消息
 * @param data 批量已读请求参数
 * @returns 操作结果
 */
export async function batchReadSiteMessagesApi(data: BatchReadSiteMessagesRequest) {
  return request.post<string>({
    url: `${SITE_MESSAGES_BASE_PATH}/batch-read`,
    data
  })
}

/**
 * 获取未读消息数量
 * @returns 未读消息数量
 */
export async function getUnreadCountApi() {
  return request.get<GetUnreadCountResponse>({
    url: `${SITE_MESSAGES_BASE_PATH}/unread-count`
  })
}

// ========== 扩展的枚举和工具定义 ==========

/** 消息类型枚举 */
export enum MessageType {
  ALERT = 'alert',
  NOTIFICATION = 'notification',
  SYSTEM = 'system'
}

/** 消息类型显示名称映射 */
export const MessageTypeNames: Record<MessageType, string> = {
  [MessageType.ALERT]: '告警',
  [MessageType.NOTIFICATION]: '通知',
  [MessageType.SYSTEM]: '系统消息'
}

/** 消息严重级别枚举 */
export enum MessageSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/** 消息严重级别显示名称映射 */
export const MessageSeverityNames: Record<MessageSeverity, string> = {
  [MessageSeverity.INFO]: '提示',
  [MessageSeverity.WARNING]: '警告',
  [MessageSeverity.CRITICAL]: '严重'
}

/** 消息严重级别颜色映射 */
export const MessageSeverityColors: Record<MessageSeverity, string> = {
  [MessageSeverity.INFO]: '#409EFF',
  [MessageSeverity.WARNING]: '#E6A23C',
  [MessageSeverity.CRITICAL]: '#F56C6C'
}

/** 消息阅读状态枚举 */
export enum ReadStatus {
  ALL = -1,
  UNREAD = 0,
  READ = 1
}

/** 消息阅读状态显示名称映射 */
export const ReadStatusNames: Record<ReadStatus, string> = {
  [ReadStatus.ALL]: '全部',
  [ReadStatus.UNREAD]: '未读',
  [ReadStatus.READ]: '已读'
}

/** 格式化扩展数据 */
export function formatExtraData(extraDataJson: string): Record<string, any> {
  try {
    return JSON.parse(extraDataJson || '{}')
  } catch {
    return {}
  }
}

/** 格式化Unix时间戳为可读时间 */
export function formatMessageTimestamp(timestamp: number): string {
  if (!timestamp || timestamp === 0) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/** 判断消息是否已读 */
export function isMessageRead(isRead: number): boolean {
  return isRead === 1
}

/** 判断消息是否已标星 */
export function isMessageStarred(isStarred: number): boolean {
  return isStarred === 1
}

/** 判断消息是否已过期 */
export function isMessageExpired(expireAt: number): boolean {
  if (!expireAt || expireAt === 0) return false
  return expireAt < Math.floor(Date.now() / 1000)
}

/** 获取消息严重级别标签类型 */
export function getMessageSeverityTagType(severity: string): 'info' | 'warning' | 'danger' {
  switch (severity) {
    case 'info':
      return 'info'
    case 'warning':
      return 'warning'
    case 'critical':
      return 'danger'
    default:
      return 'info'
  }
}

/** 获取消息类型图标 */
export function getMessageTypeIcon(messageType: string): string {
  switch (messageType) {
    case 'alert':
      return 'warning'
    case 'notification':
      return 'bell'
    case 'system':
      return 'info-filled'
    default:
      return 'message'
  }
}

/** 计算相对时间 */
export function getRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) return '-'

  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`

  return formatMessageTimestamp(timestamp)
}

// ========== WebSocket 连接相关 ==========

/**
 * 获取 WebSocket 基础 URL
 * 如果配置了 VITE_WEBSOCKET_URL 环境变量，则使用配置的地址
 * 否则根据当前页面协议和主机自动生成
 */
function getWebSocketBaseUrl(): string {
  const envWsUrl = import.meta.env.VITE_WEBSOCKET_URL

  if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim()) {
    let baseUrl = envWsUrl.trim()
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }
    return baseUrl
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  return `${protocol}//${host}`
}

/**
 * 构建站内消息 WebSocket URL（自动携带 token）
 * 支持通过 VITE_WEBSOCKET_URL 环境变量配置自定义 WebSocket 地址
 * @returns WebSocket URL
 */
export function getSiteMessageWSUrl(): string {
  const { accessToken } = useUserStore()

  const baseUrl = getWebSocketBaseUrl()

  const params = new URLSearchParams()
  if (accessToken) {
    params.append('token', accessToken)
  }

  const path = '/ws/v1/site-messages/connect'
  const query = params.toString()
  const wsUrl = `${baseUrl}${path}${query ? `?${query}` : ''}`

  return wsUrl
}

/**
 * WebSocket 消息类型枚举
 */
export enum WSSiteMessageType {
  // 通用消息类型
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  SUCCESS = 'success',

  // 站内消息类型
  INITIAL = 'initial', // 初始数据
  NEW_MESSAGE = 'new_message', // 新消息推送
  GLOBAL_MESSAGE = 'global_message' // 全局消息
}

/**
 * WebSocket 消息结构
 */
export interface WSMessage<T = any> {
  type: WSSiteMessageType | string
  data: T
}

/**
 * 初始数据消息
 */
export interface InitialDataMessage {
  messages: SiteMessages[]
  total: number
  count: number
}

/**
 * 创建站内消息 WebSocket 连接（自动处理 token）
 * @param onMessage 消息处理函数
 * @param onError 错误处理函数
 * @param onClose 关闭处理函数
 * @param onOpen 连接成功处理函数
 * @returns WebSocket 实例
 */
export function createSiteMessageWS(
  onMessage: (data: WSMessage) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void,
  onOpen?: (event: Event) => void
): WebSocket {
  const wsUrl = getSiteMessageWSUrl()

  console.log('[站内消息 WebSocket] 连接到:', wsUrl)

  const ws = new WebSocket(wsUrl)

  ws.onopen = (event) => {
    console.log('[站内消息 WebSocket] 连接成功')
    if (onOpen) {
      onOpen(event)
    }
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WSMessage
      console.log('[站内消息 WebSocket] 收到消息:', data)
      onMessage(data)
    } catch (e) {
      console.error('[站内消息 WebSocket] 解析消息失败:', e)
      // 如果不是 JSON，直接传递原始数据
      onMessage({ type: 'unknown', data: event.data })
    }
  }

  ws.onerror = (error) => {
    console.error('[站内消息 WebSocket] 连接错误:', error)
    if (onError) {
      onError(error)
    }
  }

  ws.onclose = (event) => {
    console.log('[站内消息 WebSocket] 连接关闭:', event.code, event.reason)
    if (onClose) {
      onClose(event)
    }
  }

  return ws
}

/**
 * 发送 WebSocket 消息
 * @param ws WebSocket 实例
 * @param type 消息类型
 * @param data 消息数据
 */
export function sendWSMessage(ws: WebSocket, type: string, data?: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    const message: WSMessage = { type, data }
    ws.send(JSON.stringify(message))
  } else {
    console.warn('[站内消息 WebSocket] 连接未就绪，无法发送消息')
  }
}

/**
 * 安全关闭 WebSocket 连接
 * @param ws WebSocket 实例
 */
export function closeSiteMessageWS(ws: WebSocket | null): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close(1000, 'Client closing')
  }
}
