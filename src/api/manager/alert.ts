import request from '@/utils/http'

// 定义基础路径
const ALERT_BASE_PATH = '/manager/v1/alert'

// ===================== 告警规则文件相关 =====================

/** 告警规则文件信息 */
export interface AlertRuleFile {
  id: number // 主键ID
  fileCode: string // 文件代码
  fileName: string // 文件名称
  description: string // 文件描述
  namespace: string // 命名空间
  labels: string // 标签(JSON格式)
  isEnabled: boolean // 是否启用
  sortOrder: number // 排序序号
  groupCount: number // 关联的分组数量
  ruleCount: number // 关联的规则数量
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加告警规则文件请求 */
export interface AddAlertRuleFileRequest {
  fileCode: string // 文件代码
  fileName: string // 文件名称
  description?: string // 文件描述
  namespace: string // 命名空间
  labels?: string // 标签
  isEnabled?: boolean // 是否启用
  sortOrder?: number // 排序序号
}

/** 更新告警规则文件请求 */
export interface UpdateAlertRuleFileRequest {
  id: number // 主键ID
  fileCode: string // 文件代码
  fileName: string // 文件名称
  description?: string // 文件描述
  namespace: string // 命名空间
  labels?: string // 标签
  isEnabled?: boolean // 是否启用
  sortOrder?: number // 排序序号
}

/** 删除告警规则文件请求 */
export interface DeleteAlertRuleFileRequest {
  id: number // 主键ID
  cascade?: boolean // 是否级联删除
}

/** 搜索告警规则文件请求 */
export interface SearchAlertRuleFileRequest {
  page?: number // 页码
  pageSize?: number // 每页数量
  orderField?: string // 排序字段
  isAsc?: boolean // 是否升序
  fileCode?: string // 文件代码
  fileName?: string // 文件名称
  namespace?: string // 命名空间
}

/** 搜索告警规则文件响应 */
export interface SearchAlertRuleFileResponse {
  items: AlertRuleFile[] // 告警规则文件列表
  total: number // 总数
}

/** 列表查询告警规则文件请求(无分页) */
export interface ListAlertRuleFileRequest {
  namespace?: string // 命名空间
}

// ===================== 告警规则分组相关 =====================

/** 告警规则分组信息 */
export interface AlertRuleGroup {
  id: number // 主键ID
  fileId: number // 文件ID
  groupCode: string // 分组代码
  groupName: string // 分组名称
  description: string // 分组描述
  interval: string // 告警间隔
  isEnabled: boolean // 是否启用
  sortOrder: number // 排序序号
  ruleCount: number // 关联的规则数量
  fileCode: string // 所属文件代码
  fileName: string // 所属文件名称
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加告警规则分组请求 */
export interface AddAlertRuleGroupRequest {
  fileId: number // 文件ID
  groupCode: string // 分组代码
  groupName: string // 分组名称
  description?: string // 分组描述
  interval: string // 告警间隔
  isEnabled?: boolean // 是否启用
  sortOrder?: number // 排序序号
}

/** 更新告警规则分组请求 */
export interface UpdateAlertRuleGroupRequest {
  id: number // 主键ID
  groupCode: string // 分组代码
  groupName: string // 分组名称
  description?: string // 分组描述
  interval: string // 告警间隔
  isEnabled?: boolean // 是否启用
  sortOrder?: number // 排序序号
}

/** 删除告警规则分组请求 */
export interface DeleteAlertRuleGroupRequest {
  id: number // 主键ID
  cascade?: boolean // 是否级联删除
}

/** 搜索告警规则分组请求 */
export interface SearchAlertRuleGroupRequest {
  page?: number // 页码
  pageSize?: number // 每页数量
  orderField?: string // 排序字段
  isAsc?: boolean // 是否升序
  fileId?: number // 文件ID
  groupCode?: string // 分组代码
  groupName?: string // 分组名称
}

/** 搜索告警规则分组响应 */
export interface SearchAlertRuleGroupResponse {
  items: AlertRuleGroup[] // 告警规则分组列表
  total: number // 总数
}

/** 列表查询告警规则分组请求(无分页) */
export interface ListAlertRuleGroupRequest {
  fileId?: number // 文件ID
}

// ===================== 告警规则相关 =====================

/** 告警规则信息 */
export interface AlertRule {
  id: number // 主键ID
  groupId: number // 分组ID
  alertName: string // 告警名称(英文)
  ruleNameCn: string // 规则中文名
  expr: string // PromQL表达式
  forDuration: string // 持续时间
  severity: 'critical' | 'warning' | 'info' // 告警级别
  summary: string // 告警摘要
  description: string // 告警详细描述
  labels: string // 额外标签(JSON格式)
  annotations: string // 额外注解(JSON格式)
  isEnabled: boolean // 是否启用
  sortOrder: number // 排序序号
  groupCode: string // 所属分组代码
  groupName: string // 所属分组名称
  fileId: number // 所属文件ID
  fileCode: string // 所属文件代码
  createdBy: string // 创建人
  updatedBy: string // 更新人
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

/** 添加告警规则请求 */
export interface AddAlertRuleRequest {
  groupId: number // 分组ID
  alertName: string // 告警名称
  ruleNameCn: string // 规则中文名
  expr: string // PromQL表达式
  forDuration: string // 持续时间
  severity: 'critical' | 'warning' | 'info' // 告警级别
  summary: string // 告警摘要
  description?: string // 告警详细描述
  labels?: string // 额外标签
  annotations?: string // 额外注解
  isEnabled?: boolean // 是否启用
  sortOrder?: number // 排序序号
}

/** 更新告警规则请求 */
export interface UpdateAlertRuleRequest {
  id: number // 主键ID
  alertName: string // 告警名称
  ruleNameCn: string // 规则中文名
  expr: string // PromQL表达式
  forDuration: string // 持续时间
  severity: 'critical' | 'warning' | 'info' // 告警级别
  summary: string // 告警摘要
  description?: string // 告警详细描述
  labels?: string // 额外标签
  annotations?: string // 额外注解
  isEnabled?: boolean // 是否启用
  sortOrder?: number // 排序序号
}

/** 搜索告警规则请求 */
export interface SearchAlertRuleRequest {
  page?: number // 页码
  pageSize?: number // 每页数量
  orderField?: string // 排序字段
  isAsc?: boolean // 是否升序
  fileId?: number // 文件ID
  groupId?: number // 分组ID
  alertName?: string // 告警名称
  ruleNameCn?: string // 规则中文名
  severity?: 'critical' | 'warning' | 'info' // 告警级别
}

/** 搜索告警规则响应 */
export interface SearchAlertRuleResponse {
  items: AlertRule[] // 告警规则列表
  total: number // 总数
}

/** 批量删除告警规则请求 */
export interface BatchDeleteAlertRuleRequest {
  ids: number[] // 要删除的ID列表
}

/** 批量导入告警规则请求 */
export interface BatchImportAlertRulesRequest {
  yamlStr: string // YAML字符串
  overwrite?: boolean // 是否覆盖已存在的file
}

/** 批量导入告警规则响应 */
export interface BatchImportAlertRulesResponse {
  fileId: number // 文件ID
  groupCount: number // 导入的分组数量
  ruleCount: number // 导入的规则数量
}

/** 批量导出告警规则请求 */
export interface BatchExportAlertRulesRequest {
  fileId: number // 文件ID
  groupIds?: number[] // 分组ID列表(可选)
}

/** 批量导出告警规则响应 */
export interface BatchExportAlertRulesResponse {
  yamlStr: string // YAML字符串
}

/** 部署告警规则到集群请求 */
export interface DeployAlertRulesRequest {
  fileId: number // 文件ID
  clusterUuid: string // 集群UUID
  namespace: string // 命名空间
  groupIds?: number[] // 分组ID列表
  ruleIds?: number[] // 规则ID列表
}

/** 部署告警规则响应 */
export interface DeployAlertRulesResponse {
  yamlStr: string // 生成的YAML字符串
}

/** 部署全部告警规则请求 - 只需要集群和命名空间 */
export interface DeployAllAlertRulesRequest {
  clusterUuid: string // 集群UUID
  namespace: string // 命名空间
}

/** 部署全部告警规则响应 */
export interface DeployAllAlertRulesResponse {
  fileCount: number // 部署的文件数量
  groupCount: number // 部署的分组数量
  ruleCount: number // 部署的规则数量
}

/** 预览告警规则YAML请求 */
export interface PreviewAlertRulesYamlRequest {
  fileId: number // 文件ID
  namespace: string // 命名空间
  groupIds?: number[] // 分组ID列表
  ruleIds?: number[] // 规则ID列表
}

/** 预览告警规则YAML响应 */
export interface PreviewAlertRulesYamlResponse {
  yamlStr: string // YAML字符串
}

/** 获取告警规则树形结构请求 */
export interface GetAlertRuleTreeRequest {
  fileId?: number // 文件ID(可选)
}

/** 告警规则树节点 */
export interface AlertRuleTreeNode {
  id: number // 节点ID
  code: string // 节点代码
  name: string // 节点名称
  type: 'file' | 'group' | 'rule' // 节点类型
  isEnabled: boolean // 是否启用
  severity?: string // 告警级别(仅rule类型)
  children: AlertRuleTreeNode[] // 子节点
}

/** 获取告警规则树形结构响应 */
export interface GetAlertRuleTreeResponse {
  data: AlertRuleTreeNode[] // 树形结构数据
}

// ===================== 告警实例相关 =====================

/** 告警实例信息 */
export interface AlertInstance {
  id: number // 主键ID
  instance: string // 告警实例
  fingerprint: string // 告警指纹
  clusterUuid: string // 集群UUID
  clusterName: string // 集群名称
  projectId: number // 项目ID
  projectName: string // 项目名称
  workspaceId: number // 工作空间ID
  workspaceName: string // 工作空间名称
  alertName: string // 告警名称
  severity: string // 严重级别
  status: string // 告警状态
  labels: string // 告警标签
  annotations: string // 告警注解
  generatorUrl: string // 生成器URL
  startsAt: number // 告警开始时间
  endsAt: number // 告警结束时间
  resolvedAt: number // 告警恢复时间
  duration: number // 持续时长
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
  severity?: 'info' | 'warning' | 'critical' // 严重级别
  status?: 'firing' | 'resolved' // 告警状态
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

// ===================== 告警实例相关接口 =====================

/**
 * 删除告警实例
 * @param id 告警实例ID
 * @returns 操作结果
 */
export async function deleteAlertInstanceApi(id: number) {
  return request.del<string>({
    url: `${ALERT_BASE_PATH}/instance/${id}`
  })
}

/**
 * 获取告警实例详情
 * @param id 告警实例ID
 * @returns 告警实例详细信息
 */
export async function getAlertInstanceApi(id: number) {
  return request.get<AlertInstance>({
    url: `${ALERT_BASE_PATH}/instance/${id}`
  })
}

/**
 * 搜索告警实例列表
 * @param params 搜索参数
 * @returns 告警实例列表及总数
 */
export async function searchAlertInstanceApi(params?: SearchAlertInstanceRequest) {
  return request.get<SearchAlertInstanceResponse>({
    url: `${ALERT_BASE_PATH}/instance/search`,
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
    url: `${ALERT_BASE_PATH}/instance/batch/delete`,
    data
  })
}

// ===================== 告警规则文件相关接口 =====================

/**
 * 添加告警规则文件
 * @param data 添加告警规则文件请求参数
 * @returns 操作结果
 */
export async function addAlertRuleFileApi(data: AddAlertRuleFileRequest) {
  return request.post<string>({
    url: `${ALERT_BASE_PATH}/file`,
    data
  })
}

/**
 * 更新告警规则文件
 * @param data 更新告警规则文件请求参数
 * @returns 操作结果
 */
export async function updateAlertRuleFileApi(data: UpdateAlertRuleFileRequest) {
  const { id, ...params } = data

  return request.put<string>({
    url: `${ALERT_BASE_PATH}/file/${id}`,
    data: params
  })
}

/**
 * 删除告警规则文件
 * @param id 告警规则文件ID
 * @param cascade 是否级联删除
 * @returns 操作结果
 */
export async function deleteAlertRuleFileApi(id: number, cascade?: boolean) {
  return request.del<string>({
    url: `${ALERT_BASE_PATH}/file/${id}`,
    params: { cascade }
  })
}

/**
 * 获取告警规则文件详情
 * @param id 告警规则文件ID
 * @returns 告警规则文件详细信息
 */
export async function getAlertRuleFileApi(id: number) {
  return request.get<AlertRuleFile>({
    url: `${ALERT_BASE_PATH}/file/${id}`
  })
}

/**
 * 搜索告警规则文件列表
 * @param params 搜索参数
 * @returns 告警规则文件列表及总数
 */
export async function searchAlertRuleFileApi(params?: SearchAlertRuleFileRequest) {
  return request.get<SearchAlertRuleFileResponse>({
    url: `${ALERT_BASE_PATH}/file/search`,
    params
  })
}

/**
 * 列表查询告警规则文件(无分页)
 * @param params 列表查询参数
 * @returns 告警规则文件列表
 */
export async function listAlertRuleFileApi(params?: ListAlertRuleFileRequest) {
  return request.get<AlertRuleFile[]>({
    url: `${ALERT_BASE_PATH}/file/list`,
    params
  })
}

// ===================== 告警规则分组相关接口 =====================

/**
 * 添加告警规则分组
 * @param data 添加告警规则分组请求参数
 * @returns 操作结果
 */
export async function addAlertRuleGroupApi(data: AddAlertRuleGroupRequest) {
  return request.post<string>({
    url: `${ALERT_BASE_PATH}/group`,
    data
  })
}

/**
 * 更新告警规则分组
 * @param data 更新告警规则分组请求参数
 * @returns 操作结果
 */
export async function updateAlertRuleGroupApi(data: UpdateAlertRuleGroupRequest) {
  const { id, ...params } = data

  return request.put<string>({
    url: `${ALERT_BASE_PATH}/group/${id}`,
    data: params
  })
}

/**
 * 删除告警规则分组
 * @param id 告警规则分组ID
 * @param cascade 是否级联删除
 * @returns 操作结果
 */
export async function deleteAlertRuleGroupApi(id: number, cascade?: boolean) {
  return request.del<string>({
    url: `${ALERT_BASE_PATH}/group/${id}`,
    params: { cascade }
  })
}

/**
 * 获取告警规则分组详情
 * @param id 告警规则分组ID
 * @returns 告警规则分组详细信息
 */
export async function getAlertRuleGroupApi(id: number) {
  return request.get<AlertRuleGroup>({
    url: `${ALERT_BASE_PATH}/group/${id}`
  })
}

/**
 * 搜索告警规则分组列表
 * @param params 搜索参数
 * @returns 告警规则分组列表及总数
 */
export async function searchAlertRuleGroupApi(params?: SearchAlertRuleGroupRequest) {
  return request.get<SearchAlertRuleGroupResponse>({
    url: `${ALERT_BASE_PATH}/group/search`,
    params
  })
}

/**
 * 列表查询告警规则分组(无分页)
 * @param params 列表查询参数
 * @returns 告警规则分组列表
 */
export async function listAlertRuleGroupApi(params?: ListAlertRuleGroupRequest) {
  return request.get<AlertRuleGroup[]>({
    url: `${ALERT_BASE_PATH}/group/list`,
    params
  })
}

// ===================== 告警规则相关接口 =====================

/**
 * 添加告警规则
 * @param data 添加告警规则请求参数
 * @returns 操作结果
 */
export async function addAlertRuleApi(data: AddAlertRuleRequest) {
  return request.post<string>({
    url: `${ALERT_BASE_PATH}/rule`,
    data
  })
}

/**
 * 更新告警规则
 * @param data 更新告警规则请求参数
 * @returns 操作结果
 */
export async function updateAlertRuleApi(data: UpdateAlertRuleRequest) {
  const { id, ...params } = data

  return request.put<string>({
    url: `${ALERT_BASE_PATH}/rule/${id}`,
    data: params
  })
}

/**
 * 删除告警规则
 * @param id 告警规则ID
 * @returns 操作结果
 */
export async function deleteAlertRuleApi(id: number) {
  return request.del<string>({
    url: `${ALERT_BASE_PATH}/rule/${id}`
  })
}

/**
 * 获取告警规则详情
 * @param id 告警规则ID
 * @returns 告警规则详细信息
 */
export async function getAlertRuleApi(id: number) {
  return request.get<AlertRule>({
    url: `${ALERT_BASE_PATH}/rule/${id}`
  })
}

/**
 * 搜索告警规则列表
 * @param params 搜索参数
 * @returns 告警规则列表及总数
 */
export async function searchAlertRuleApi(params?: SearchAlertRuleRequest) {
  return request.get<SearchAlertRuleResponse>({
    url: `${ALERT_BASE_PATH}/rule/search`,
    params
  })
}

/**
 * 批量删除告警规则
 * @param data 批量删除请求参数
 * @returns 操作结果
 */
export async function batchDeleteAlertRuleApi(data: BatchDeleteAlertRuleRequest) {
  return request.post<string>({
    url: `${ALERT_BASE_PATH}/rule/batch/delete`,
    data
  })
}

/**
 * 批量导入告警规则
 * @param data 批量导入请求参数
 * @returns 导入结果
 */
export async function batchImportAlertRulesApi(data: BatchImportAlertRulesRequest) {
  return request.post<BatchImportAlertRulesResponse>({
    url: `${ALERT_BASE_PATH}/rule/batch/import`,
    data
  })
}

/**
 * 批量导出告警规则
 * @param params 批量导出请求参数
 * @returns YAML字符串
 */
export async function batchExportAlertRulesApi(params: BatchExportAlertRulesRequest) {
  return request.get<BatchExportAlertRulesResponse>({
    url: `${ALERT_BASE_PATH}/rule/batch/export`,
    params
  })
}


/**
 * 导出全部告警规则（返回压缩包）
 */
export async function exportAllAlertRulesApi(): Promise<Blob> {
  return request.get<Blob>({
    url: `${ALERT_BASE_PATH}/rule/export/all`,
    responseType: 'blob'
  })
}
/**
 * 部署告警规则到集群
 * @param data 部署请求参数
 * @returns 部署结果
 */
export async function deployAlertRulesApi(data: DeployAlertRulesRequest) {
  return request.post<DeployAlertRulesResponse>({
    url: `${ALERT_BASE_PATH}/rule/deploy`,
    data
  })
}

/**
 * 部署全部告警规则到集群
 * 只需要集群UUID和命名空间，后端会处理所有启用的规则
 * @param data 部署请求参数（只包含 clusterUuid 和 namespace）
 * @returns 部署结果
 */
export async function deployAllAlertRulesApi(data: DeployAllAlertRulesRequest) {
  return request.post<DeployAllAlertRulesResponse>({
    url: `${ALERT_BASE_PATH}/rule/deploy/all`,
    data
  })
}

/**
 * 预览告警规则YAML
 * @param params 预览请求参数
 * @returns YAML字符串
 */
export async function previewAlertRulesYamlApi(params: PreviewAlertRulesYamlRequest) {
  return request.get<PreviewAlertRulesYamlResponse>({
    url: `${ALERT_BASE_PATH}/rule/preview`,
    params
  })
}

/**
 * 获取告警规则树形结构
 * @param params 树形结构请求参数
 * @returns 树形结构数据
 */
export async function getAlertRuleTreeApi(params?: GetAlertRuleTreeRequest) {
  return request.get<GetAlertRuleTreeResponse>({
    url: `${ALERT_BASE_PATH}/rule/tree`,
    params
  })
}
