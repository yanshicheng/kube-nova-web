import request from '@/utils/http'

// 定义基础路径
const ALERT_CHANNELS_BASE_PATH = '/portal/v1/alert/channels'
const ALERT_GROUPS_BASE_PATH = '/portal/v1/alert/groups'
const ALERT_GROUP_MEMBERS_BASE_PATH = '/portal/v1/alert/group-members'
const ALERT_GROUP_APPS_BASE_PATH = '/portal/v1/alert/group-apps'
const ALERT_GROUP_LEVEL_CHANNELS_BASE_PATH = '/portal/v1/alert/group-level-channels'
const ALERT_NOTIFICATIONS_BASE_PATH = '/portal/v1/alert/notifications'

// ========== 告警渠道相关 ==========

/** 告警渠道信息 */
export interface AlertChannels {
  id: number // 主键ID
  uuid: string // 渠道唯一标识UUID
  channelName: string // 渠道名称
  channelType: string // 渠道类型(dingtalk, wechat, feishu, email, sms, voice_call, webhook, site_message)
  config: string // 渠道配置(JSON格式)
  description: string // 渠道描述
  retryTimes: number // 重试次数
  timeout: number // 超时时间(秒)
  rateLimit: number // 速率限制(每分钟最多发送数,0=无限制)
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加告警渠道请求 */
export interface AddAlertChannelsRequest {
  channelName: string // 渠道名称
  channelType: string // 渠道类型(dingtalk, wechat, feishu, email, sms, voice_call, webhook, site_message)
  config: string // 渠道配置(JSON格式)
  description?: string // 渠道描述
  retryTimes?: number // 重试次数
  timeout?: number // 超时时间(秒)
  rateLimit?: number // 速率限制(每分钟最多发送数,0=无限制)
}

/** 更新告警渠道请求 */
export interface UpdateAlertChannelsRequest {
  id: number // 主键ID
  channelName: string // 渠道名称
  channelType: string // 渠道类型(dingtalk, wechat, feishu, email, sms, voice_call, webhook, site_message)
  config: string // 渠道配置(JSON格式)
  description?: string // 渠道描述
  retryTimes?: number // 重试次数
  timeout?: number // 超时时间(秒)
  rateLimit?: number // 速率限制(每分钟最多发送数,0=无限制)
}

/** 搜索告警渠道请求（不分页） */
export interface SearchAlertChannelsRequest {
  uuid?: string // 渠道唯一标识UUID
  channelName?: string // 渠道名称
  channelType?: string // 渠道类型
}

/** 搜索告警渠道响应（不分页） */
export interface SearchAlertChannelsResponse {
  items: AlertChannels[] // 告警渠道列表
}

/** 测试连接请求 */
export interface TestLinkRequest {
  channelType: string // 渠道类型(dingtalk, wechat, feishu, email, sms, voice_call, webhook, site_message)
  config: string // 渠道配置(JSON格式)
  toUser?: string // 接收人
}

// ========== 告警组相关 ==========

/** 告警组信息 */
export interface AlertGroups {
  id: number // 主键ID
  uuid: string // 告警组UUID
  groupName: string // 告警组名称
  groupType: string // 组类型(normal=普通, duty=值班)
  description: string // 告警组描述
  filterRules: string // 告警过滤规则(标签匹配规则)
  dutySchedule: string // 值班排班表
  sortOrder: number // 排序序号
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加告警组用户 */
export interface AddRAlertGroupUser {
  userId: number // 用户ID
  role: string // 角色(owner, admin, member)
}

/** 添加告警组级别渠道 */
export interface AddGroupLevelChannels {
  severity: string // 严重级别(default, info, warning, critical, notification)
  channelId: string // 告警渠道IDs, 逗号分隔
}

/** 添加告警组请求 */
export interface AddAlertGroupsRequest {
  groupName: string // 告警组名称
  groupType: string // 组类型(normal=普通, duty=值班)
  description?: string // 告警组描述
  filterRules?: string // 告警过滤规则(标签匹配规则)
  dutySchedule?: string // 值班排班表
  sortOrder?: number // 排序序号
  users?: AddRAlertGroupUser[] // 用户列表
  channels: AddGroupLevelChannels[] // 渠道列表
}

/** 更新告警组请求 */
export interface UpdateAlertGroupsRequest {
  id: number // 主键ID
  groupName: string // 告警组名称
  groupType: string // 组类型(normal=普通, duty=值班)
  description?: string // 告警组描述
  filterRules?: string // 告警过滤规则(标签匹配规则)
  dutySchedule?: string // 值班排班表
  sortOrder?: number // 排序序号
}

/** 搜索告警组请求 */
export interface SearchAlertGroupsRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderField?: string // 排序字段
  isAsc?: boolean // 是否升序
  uuid?: string // 告警组UUID
  groupName?: string // 告警组名称
  groupType?: string // 组类型(normal=普通, duty=值班)
}

/** 搜索告警组响应 */
export interface SearchAlertGroupsResponse {
  items: AlertGroups[] // 告警组列表
  total: number // 总条数
}

// ========== 告警组成员相关 ==========

/** 告警组成员信息 */
export interface AlertGroupMembers {
  id: number // 主键ID
  groupId: number // 告警组ID
  userId: number // 用户ID
  userName: string // 用户名
  userAccount: string // 用户账号
  role: string // 角色(owner, admin, member)
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加告警组成员请求 */
export interface AddAlertGroupMembersRequest {
  groupId: number // 告警组ID
  userId: number // 用户ID
  role: string // 角色(owner, admin, member)
}

/** 更新告警组成员请求 */
export interface UpdateAlertGroupMembersRequest {
  id: number // 主键ID
  groupId: number // 告警组ID
  userId: number // 用户ID
  role: string // 角色(owner, admin, member)
}

/** 搜索告警组成员请求 */
export interface SearchAlertGroupMembersRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  groupId?: number // 告警组ID
  userId?: number // 用户ID
  role?: string // 角色(owner, admin, member)
}

/** 搜索告警组成员响应 */
export interface SearchAlertGroupMembersResponse {
  items: AlertGroupMembers[] // 告警组成员列表
  total: number // 总条数
}

// ========== 告警组应用关联相关 ==========

/** 告警组应用关联信息 */
export interface AlertGroupApps {
  id: number // 主键ID
  groupId: number // 告警组ID
  appId: number // 应用ID
  appType: string // 应用类型
  createdBy: string // 创建人
  updatedBy: string // 更新人
}

/** 绑定告警组应用请求 */
export interface BindAlertGroupAppsRequest {
  groupId: number // 告警组ID
  appId: number // 应用ID
  appType: string // 应用类型
}

/** 搜索告警组应用请求 */
export interface SearchAlertGroupAppsRequest {
  groupId?: number // 告警组ID
  appType?: string // 应用类型
}

/** 搜索告警组应用响应 */
export interface SearchAlertGroupAppsResponse {
  items: AlertGroupApps[] // 告警组应用列表
}

// ========== 告警组级别渠道相关 ==========

/** 告警组级别渠道关联信息 */
export interface AlertGroupLevelChannels {
  id: number // 主键ID
  groupId: number // 告警组ID
  severity: string // 严重级别
  channelId: string // 告警渠道IDs, 逗号分隔
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加告警组级别渠道请求 */
export interface AddAlertGroupLevelChannelsRequest {
  groupId: number // 告警组ID
  severity: string // 严重级别(default, info, warning, critical, notification)
  channelId: string // 告警渠道IDs, 逗号分隔
}

/** 更新告警组级别渠道请求 */
export interface UpdateAlertGroupLevelChannelsRequest {
  id: number // 主键ID
  groupId: number // 告警组ID
  severity: string // 严重级别(default, info, warning, critical, notification)
  channelId: string // 告警渠道IDs, 逗号分隔
}

/** 搜索告警组级别渠道请求 */
export interface SearchAlertGroupLevelChannelsRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderStr?: string // 排序字段
  isAsc?: boolean // 是否升序
  groupId?: number // 告警组ID
  severity?: string // 严重级别(default, info, warning, critical, notification)
}

/** 搜索告警组级别渠道响应 */
export interface SearchAlertGroupLevelChannelsResponse {
  items: AlertGroupLevelChannels[] // 告警组级别渠道列表
}

// ========== 告警通知记录相关 ==========

/** 告警通知记录信息 */
export interface AlertNotifications {
  id: number // 主键ID
  uuid: string // 通知记录UUID
  instanceId: number // 告警实例ID
  groupId: number // 告警组ID
  severity: string // 告警级别
  channelId: number // 告警渠道ID
  channelType: string // 渠道类型
  sendFormat: string // 发送格式(markdown, html, text)
  recipients: string // 接收人列表(JSON格式)
  subject: string // 通知主题
  content: string // 发送内容
  status: string // 发送状态(pending, sending, success, failed, cancelled)
  errorMsg: string // 错误信息
  sentAt: number // 发送时间
  response: string // 渠道响应信息
  costMs: number // 发送耗时(毫秒)
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 搜索告警通知记录请求 */
export interface SearchAlertNotificationsRequest {
  page?: number // 当前页码
  pageSize?: number // 每页条数
  orderField?: string // 排序字段
  isAsc?: boolean // 是否升序
  uuid?: string // 通知记录UUID
  severity?: string // 告警级别
  channelId?: number // 告警渠道ID
  channelType?: string // 渠道类型
  subject?: string // 通知主题
  status?: string // 发送状态(pending, sending, success, failed, cancelled)
}

/** 搜索告警通知记录响应 */
export interface SearchAlertNotificationsResponse {
  items: AlertNotifications[] // 告警通知记录列表
  total: number // 总条数
}

/** 批量删除告警通知记录请求 */
export interface BatchDelAlertNotificationsRequest {
  ids: number[] // IDs
}

// ========== API 接口 ==========

// ========== 告警渠道接口 ==========

/**
 * 添加告警渠道
 * @param data 添加告警渠道请求参数
 * @returns 操作结果
 */
export async function addAlertChannelsApi(data: AddAlertChannelsRequest) {
  return request.post<string>({
    url: `${ALERT_CHANNELS_BASE_PATH}`,
    data
  })
}

/**
 * 更新告警渠道
 * @param data 更新告警渠道请求参数
 * @returns 操作结果
 */
export async function updateAlertChannelsApi(data: UpdateAlertChannelsRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${ALERT_CHANNELS_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除告警渠道
 * @param id 告警渠道ID
 * @returns 操作结果
 */
export async function deleteAlertChannelsApi(id: number) {
  return request.del<string>({
    url: `${ALERT_CHANNELS_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取告警渠道
 * @param id 告警渠道ID
 * @returns 告警渠道信息
 */
export async function getAlertChannelsByIdApi(id: number) {
  return request.get<AlertChannels>({
    url: `${ALERT_CHANNELS_BASE_PATH}/${id}`
  })
}

/**
 * 搜索告警渠道（不分页）
 * @param params 搜索参数
 * @returns 告警渠道列表
 */
export async function searchAlertChannelsApi(params?: SearchAlertChannelsRequest) {
  return request.get<SearchAlertChannelsResponse>({
    url: `${ALERT_CHANNELS_BASE_PATH}`,
    params
  })
}

/**
 * 测试连接
 * @param data 测试连接请求参数
 * @returns 操作结果
 */
export async function testLinkApi(data: TestLinkRequest) {
  return request.post<string>({
    url: `${ALERT_CHANNELS_BASE_PATH}/test-link`,
    data
  })
}

// ========== 告警组接口 ==========

/**
 * 添加告警组
 * @param data 添加告警组请求参数
 * @returns 操作结果
 */
export async function addAlertGroupsApi(data: AddAlertGroupsRequest) {
  return request.post<string>({
    url: `${ALERT_GROUPS_BASE_PATH}`,
    data
  })
}

/**
 * 更新告警组
 * @param data 更新告警组请求参数
 * @returns 操作结果
 */
export async function updateAlertGroupsApi(data: UpdateAlertGroupsRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${ALERT_GROUPS_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除告警组
 * @param id 告警组ID
 * @returns 操作结果
 */
export async function deleteAlertGroupsApi(id: number) {
  return request.del<string>({
    url: `${ALERT_GROUPS_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取告警组
 * @param id 告警组ID
 * @returns 告警组信息
 */
export async function getAlertGroupsByIdApi(id: number) {
  return request.get<AlertGroups>({
    url: `${ALERT_GROUPS_BASE_PATH}/${id}`
  })
}

/**
 * 搜索告警组
 * @param params 搜索参数
 * @returns 告警组列表
 */
export async function searchAlertGroupsApi(params?: SearchAlertGroupsRequest) {
  return request.get<SearchAlertGroupsResponse>({
    url: `${ALERT_GROUPS_BASE_PATH}`,
    params
  })
}

// ========== 告警组成员接口 ==========

/**
 * 添加告警组成员
 * @param data 添加告警组成员请求参数
 * @returns 操作结果
 */
export async function addAlertGroupMembersApi(data: AddAlertGroupMembersRequest) {
  return request.post<string>({
    url: `${ALERT_GROUP_MEMBERS_BASE_PATH}`,
    data
  })
}

/**
 * 更新告警组成员
 * @param data 更新告警组成员请求参数
 * @returns 操作结果
 */
export async function updateAlertGroupMembersApi(data: UpdateAlertGroupMembersRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${ALERT_GROUP_MEMBERS_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除告警组成员
 * @param id 告警组成员ID
 * @returns 操作结果
 */
export async function deleteAlertGroupMembersApi(id: number) {
  return request.del<string>({
    url: `${ALERT_GROUP_MEMBERS_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取告警组成员
 * @param id 告警组成员ID
 * @returns 告警组成员信息
 */
export async function getAlertGroupMembersByIdApi(id: number) {
  return request.get<AlertGroupMembers>({
    url: `${ALERT_GROUP_MEMBERS_BASE_PATH}/${id}`
  })
}

/**
 * 搜索告警组成员
 * @param params 搜索参数
 * @returns 告警组成员列表
 */
export async function searchAlertGroupMembersApi(params?: SearchAlertGroupMembersRequest) {
  return request.get<SearchAlertGroupMembersResponse>({
    url: `${ALERT_GROUP_MEMBERS_BASE_PATH}`,
    params
  })
}

// ========== 告警组应用关联接口 ==========

/**
 * 绑定告警组应用
 * @param data 绑定请求参数
 * @returns 操作结果
 */
export async function bindAlertGroupAppsApi(data: BindAlertGroupAppsRequest) {
  return request.post<string>({
    url: `${ALERT_GROUP_APPS_BASE_PATH}`,
    data
  })
}

/**
 * 解绑告警组应用
 * @param id 关联ID
 * @returns 操作结果
 */
export async function unbindAlertGroupAppsApi(id: number) {
  return request.del<string>({
    url: `${ALERT_GROUP_APPS_BASE_PATH}/${id}`
  })
}

/**
 * 搜索告警组应用
 * @param params 搜索参数
 * @returns 告警组应用列表
 */
export async function searchAlertGroupAppsApi(params?: SearchAlertGroupAppsRequest) {
  return request.get<SearchAlertGroupAppsResponse>({
    url: `${ALERT_GROUP_APPS_BASE_PATH}`,
    params
  })
}

// ========== 告警组级别渠道接口 ==========

/**
 * 添加告警组级别渠道
 * @param data 添加告警组级别渠道请求参数
 * @returns 操作结果
 */
export async function addAlertGroupLevelChannelsApi(data: AddAlertGroupLevelChannelsRequest) {
  return request.post<string>({
    url: `${ALERT_GROUP_LEVEL_CHANNELS_BASE_PATH}`,
    data
  })
}

/**
 * 更新告警组级别渠道
 * @param data 更新告警组级别渠道请求参数
 * @returns 操作结果
 */
export async function updateAlertGroupLevelChannelsApi(data: UpdateAlertGroupLevelChannelsRequest) {
  const { id, ...params } = data
  return request.put<string>({
    url: `${ALERT_GROUP_LEVEL_CHANNELS_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 删除告警组级别渠道
 * @param id 告警组级别渠道ID
 * @returns 操作结果
 */
export async function deleteAlertGroupLevelChannelsApi(id: number) {
  return request.del<string>({
    url: `${ALERT_GROUP_LEVEL_CHANNELS_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取告警组级别渠道
 * @param id 告警组级别渠道ID
 * @returns 告警组级别渠道信息
 */
export async function getAlertGroupLevelChannelsByIdApi(id: number) {
  return request.get<AlertGroupLevelChannels>({
    url: `${ALERT_GROUP_LEVEL_CHANNELS_BASE_PATH}/${id}`
  })
}

/**
 * 搜索告警组级别渠道
 * @param params 搜索参数
 * @returns 告警组级别渠道列表
 */
export async function searchAlertGroupLevelChannelsApi(
  params?: SearchAlertGroupLevelChannelsRequest
) {
  return request.get<SearchAlertGroupLevelChannelsResponse>({
    url: `${ALERT_GROUP_LEVEL_CHANNELS_BASE_PATH}`,
    params
  })
}

// ========== 告警通知记录接口 ==========

/**
 * 删除告警通知记录
 * @param id 告警通知记录ID
 * @returns 操作结果
 */
export async function deleteAlertNotificationsApi(id: number) {
  return request.del<string>({
    url: `${ALERT_NOTIFICATIONS_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取告警通知记录
 * @param id 告警通知记录ID
 * @returns 告警通知记录信息
 */
export async function getAlertNotificationsByIdApi(id: number) {
  return request.get<AlertNotifications>({
    url: `${ALERT_NOTIFICATIONS_BASE_PATH}/${id}`
  })
}

/**
 * 搜索告警通知记录
 * @param params 搜索参数
 * @returns 告警通知记录列表
 */
export async function searchAlertNotificationsApi(params?: SearchAlertNotificationsRequest) {
  return request.get<SearchAlertNotificationsResponse>({
    url: `${ALERT_NOTIFICATIONS_BASE_PATH}`,
    params
  })
}

/**
 * 批量删除告警通知记录
 * @param data 批量删除请求参数
 * @returns 操作结果
 */
export async function batchDeleteAlertNotificationsApi(data: BatchDelAlertNotificationsRequest) {
  return request.post<string>({
    url: `${ALERT_NOTIFICATIONS_BASE_PATH}/batch-delete`,
    data
  })
}

// ========== 扩展的渠道配置类型定义 ==========

/** 钉钉渠道配置 */
export interface DingTalkConfig {
  webhook: string
  secret?: string
}

/** 企业微信渠道配置 */
export interface WeChatConfig {
  webhook: string
}

/** 飞书渠道配置 */
export interface FeishuConfig {
  webhook: string
  secret?: string
}

/** 邮件渠道配置 */
export interface EmailConfig {
  smtpHost: string
  smtpPort: number
  username: string
  password: string
  fromEmail?: string
  useTLS?: boolean
  useSSL?: boolean
}

/** Webhook渠道配置 */
export interface WebhookConfig {
  url: string
  authType: 'none' | 'basic' | 'bearer'
  username?: string
  password?: string
  token?: string
  headers?: Record<string, string>
  method?: 'POST' | 'PUT' | 'PATCH'
}

/** 短信渠道配置 */
export interface SmsConfig {
  provider: string // 短信服务商
  accessKey: string
  accessSecret: string
  signName: string
  templateCode: string
}

/** 语音电话渠道配置 */
export interface VoiceCallConfig {
  provider: string
  accessKey: string
  accessSecret: string
  callerNumber: string
}

/** 渠道配置联合类型 */
export type ChannelConfig =
  | DingTalkConfig
  | WeChatConfig
  | FeishuConfig
  | EmailConfig
  | WebhookConfig
  | SmsConfig
  | VoiceCallConfig

/** 渠道类型枚举 */
export enum ChannelType {
  DINGTALK = 'dingtalk',
  WECHAT = 'wechat',
  FEISHU = 'feishu',
  EMAIL = 'email',
  SMS = 'sms',
  VOICE_CALL = 'voice_call',
  WEBHOOK = 'webhook',
  SITE_MESSAGE = 'site_message'
}

/** 渠道类型显示名称映射 */
export const ChannelTypeNames: Record<ChannelType, string> = {
  [ChannelType.DINGTALK]: '钉钉',
  [ChannelType.WECHAT]: '企业微信',
  [ChannelType.FEISHU]: '飞书',
  [ChannelType.EMAIL]: '邮件',
  [ChannelType.SMS]: '短信',
  [ChannelType.VOICE_CALL]: '语音电话',
  [ChannelType.WEBHOOK]: 'Webhook',
  [ChannelType.SITE_MESSAGE]: '站内消息'
}

/** 渠道状态 */
export enum ChannelStatus {
  ACTIVE = 1,
  INACTIVE = 0
}

/** 告警级别 */
export enum AlertSeverity {
  DEFAULT = 'default',
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  NOTIFICATION = 'notification'
}

/** 告警级别显示名称映射 */
export const AlertSeverityNames: Record<AlertSeverity, string> = {
  [AlertSeverity.DEFAULT]: '默认',
  [AlertSeverity.INFO]: '提示',
  [AlertSeverity.WARNING]: '警告',
  [AlertSeverity.CRITICAL]: '严重',
  [AlertSeverity.NOTIFICATION]: '通知'
}

/** 告警级别颜色映射 */
export const AlertSeverityColors: Record<AlertSeverity, string> = {
  [AlertSeverity.DEFAULT]: '#909399',
  [AlertSeverity.INFO]: '#409EFF',
  [AlertSeverity.WARNING]: '#E6A23C',
  [AlertSeverity.CRITICAL]: '#F56C6C',
  [AlertSeverity.NOTIFICATION]: '#67C23A'
}

/** 成员角色 */
export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

/** 成员角色显示名称映射 */
export const MemberRoleNames: Record<MemberRole, string> = {
  [MemberRole.OWNER]: '所有者',
  [MemberRole.ADMIN]: '管理员',
  [MemberRole.MEMBER]: '成员'
}

/** 告警组类型 */
export enum GroupType {
  NORMAL = 'normal',
  DUTY = 'duty'
}

/** 告警组类型显示名称映射 */
export const GroupTypeNames: Record<GroupType, string> = {
  [GroupType.NORMAL]: '普通组',
  [GroupType.DUTY]: '值班组'
}



// 定义基础路径
const ALERT_INSTANCE_BASE_PATH = '/manager/v1/alert/instance'

// ========== 告警实例相关 ==========

/** 告警实例信息 */
export interface AlertInstance {
  id: number // 主键ID
  instance: string // 告警实例
  fingerprint: string // 告警指纹(用于去重和关联)
  clusterUuid: string // 关联的集群UUID
  clusterName: string // 关联的集群名称
  projectId: number // 关联的项目ID
  projectName: string // 关联的项目名称
  workspaceId: number // 关联的工作空间ID
  workspaceName: string // 关联的工作空间名称
  alertName: string // 告警名称
  severity: string // 严重级别(info, warning, critical)
  status: string // 告警状态(firing, resolved)
  labels: string // 告警标签(JSON格式)
  annotations: string // 告警注解(JSON格式)
  generatorUrl: string // 生成器URL
  startsAt: number // 告警开始时间
  endsAt: number // 告警结束时间
  resolvedAt: number // 告警恢复时间
  duration: number // 持续时长(秒)
  repeatCount: number // 告警重复次数
  notifiedGroups: string // 已通知的告警组ID列表
  notificationCount: number // 通知次数
  lastNotifiedAt: number // 最后通知时间
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 搜索告警实例请求 */
export interface SearchAlertInstanceRequest {
  page?: number // 页码
  pageSize?: number // 每页数量
  orderField?: string // 排序字段
  isAsc?: boolean // 是否升序
  instance?: string // 告警实例
  fingerprint?: string // 告警指纹
  clusterUuid?: string // 集群UUID
  clusterName?: string // 集群名称
  projectId?: number // 项目ID
  projectName?: string // 项目名称
  workspaceId?: number // 工作空间ID
  workspaceName?: string // 工作空间名称
  alertName?: string // 告警名称
  severity?: string // 严重级别(info, warning, critical)
  status?: string // 告警状态(firing, resolved)
  repeatCount?: number // 告警重复次数
}

/** 搜索告警实例响应 */
export interface SearchAlertInstanceResponse {
  items: AlertInstance[] // 告警实例列表
  total: number // 总数
}

/** 批量删除告警实例请求 */
export interface BatchDeleteAlertInstanceRequest {
  ids: number[] // 要删除的ID列表
}

// ========== API 接口 ==========

/**
 * 删除告警实例
 * @param id 告警实例ID
 * @returns 操作结果
 */
export async function deleteAlertInstanceApi(id: number) {
  return request.del<string>({
    url: `${ALERT_INSTANCE_BASE_PATH}/${id}`
  })
}

/**
 * 根据ID获取告警实例详情
 * @param id 告警实例ID
 * @returns 告警实例信息
 */
export async function getAlertInstanceByIdApi(id: number) {
  return request.get<AlertInstance>({
    url: `${ALERT_INSTANCE_BASE_PATH}/${id}`
  })
}

/**
 * 搜索告警实例
 * @param params 搜索参数
 * @returns 告警实例列表
 */
export async function searchAlertInstanceApi(params?: SearchAlertInstanceRequest) {
  return request.get<SearchAlertInstanceResponse>({
    url: `${ALERT_INSTANCE_BASE_PATH}/search`,
    params
  })
}

/**
 * 批量删除告警实例
 * @param data 批量删除请求参数
 * @returns 操作结果
 */
export async function batchDeleteAlertInstanceApi(data: BatchDeleteAlertInstanceRequest) {
  return request.post<string>({
    url: `${ALERT_INSTANCE_BASE_PATH}/batch/delete`,
    data
  })
}

// ========== 扩展的枚举和工具定义 ==========

/** 告警状态枚举 */
export enum AlertStatus {
  FIRING = 'firing',
  RESOLVED = 'resolved'
}

/** 告警状态显示名称映射 */
export const AlertStatusNames: Record<AlertStatus, string> = {
  [AlertStatus.FIRING]: '告警中',
  [AlertStatus.RESOLVED]: '已恢复'
}

/** 告警状态颜色映射 */
export const AlertStatusColors: Record<AlertStatus, string> = {
  [AlertStatus.FIRING]: '#F56C6C',
  [AlertStatus.RESOLVED]: '#67C23A'
}

/** 告警严重级别枚举 */
export enum AlertInstanceSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/** 告警严重级别显示名称映射 */
export const AlertInstanceSeverityNames: Record<AlertInstanceSeverity, string> = {
  [AlertInstanceSeverity.INFO]: '提示',
  [AlertInstanceSeverity.WARNING]: '警告',
  [AlertInstanceSeverity.CRITICAL]: '严重'
}

/** 告警严重级别颜色映射 */
export const AlertInstanceSeverityColors: Record<AlertInstanceSeverity, string> = {
  [AlertInstanceSeverity.INFO]: '#409EFF',
  [AlertInstanceSeverity.WARNING]: '#E6A23C',
  [AlertInstanceSeverity.CRITICAL]: '#F56C6C'
}

/** 格式化持续时长 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return '-'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)

  return parts.join(' ')
}

/** 格式化告警标签 */
export function formatLabels(labelsJson: string): Record<string, string> {
  try {
    return JSON.parse(labelsJson || '{}')
  } catch {
    return {}
  }
}

/** 格式化告警注解 */
export function formatAnnotations(annotationsJson: string): Record<string, string> {
  try {
    return JSON.parse(annotationsJson || '{}')
  } catch {
    return {}
  }
}

/** 获取通知组ID列表 */
export function getNotifiedGroupIds(notifiedGroups: string): number[] {
  if (!notifiedGroups) return []
  return notifiedGroups.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
}

/** 格式化Unix时间戳为可读时间 */
export function formatTimestamp(timestamp: number): string {
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

/** 计算告警持续时间（从开始到现在或结束时间） */
export function calculateAlertDuration(startsAt: number, endsAt?: number, resolvedAt?: number): number {
  const start = startsAt
  const end = resolvedAt || endsAt || Math.floor(Date.now() / 1000)
  return Math.max(0, end - start)
}

/** 获取告警严重级别标签类型 */
export function getSeverityTagType(severity: string): 'info' | 'warning' | 'danger' {
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

/** 获取告警状态标签类型 */
export function getStatusTagType(status: string): 'danger' | 'success' | 'info' {
  switch (status) {
    case 'firing':
      return 'danger'
    case 'resolved':
      return 'success'
    default:
      return 'info'
  }
}
