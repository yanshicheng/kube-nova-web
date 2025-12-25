import request from '@/utils/http'

// 定义基础路径
const CLUSTER_BASE_PATH = '/workload/v1/cluster'

// ==================== 通用请求类型 ====================

/** 集群级资源列表请求（无 namespace） */
export interface ClusterResourceListRequest {
  clusterUuid: string
  search?: string // 搜索关键字
  labelSelector?: string // 标签选择器
}

/** 集群级资源名称请求 */
export interface ClusterResourceNameRequest {
  clusterUuid: string
  name: string
}

/** 集群级资源 YAML 创建/更新请求 */
export interface ClusterResourceYamlRequest {
  clusterUuid: string
  yamlStr: string
}

/** 通用删除检查响应 */
export interface CanDeleteResponse {
  canDelete: boolean
  warning?: string
}

// ==================== StorageClass 相关类型定义 ====================

/** StorageClass 列表项 */
export interface StorageClassListItem {
  name: string
  provisioner: string // 供应商
  reclaimPolicy: string // Delete, Retain, Recycle
  volumeBindingMode: string // Immediate, WaitForFirstConsumer
  allowVolumeExpansion: boolean // 是否允许扩容
  isDefault: boolean // 是否为默认
  age: string
  creationTimestamp: number
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

/** StorageClass 列表响应 */
export interface StorageClassListResponse {
  total: number
  items: StorageClassListItem[]
}

/** 拓扑信息 */
export interface TopologyInfo {
  key: string
  values: string[]
}

/** StorageClass 详情 */
export interface StorageClassDetail {
  name: string
  provisioner: string
  reclaimPolicy: string
  volumeBindingMode: string
  allowVolumeExpansion: boolean
  isDefault: boolean
  parameters?: Record<string, string>
  mountOptions?: string[]
  allowedTopologies?: TopologyInfo[]
  labels?: Record<string, string>
  annotations?: Record<string, string>
  age: string
  creationTimestamp: number
}

/** StorageClass 关联的 PV 信息 */
export interface StorageClassPVItem {
  name: string
  capacity: string
  accessModes: string
  status: string
  claim: string // namespace/pvcName
  age: string
}

/** StorageClass 关联 PV 响应 */
export interface StorageClassPVResponse {
  storageClassName: string
  pvCount: number
  boundPVCount: number
  availablePVCount: number
  totalCapacity: string
  pvs: StorageClassPVItem[]
}

/** 设置默认 StorageClass 请求 */
export interface SetDefaultStorageClassRequest {
  clusterUuid: string
  name: string
}

// ==================== PersistentVolume 相关类型定义 ====================

/** PV 列表请求 */
export interface PVListRequest {
  clusterUuid: string
  search?: string
  labelSelector?: string
  status?: string // Available, Bound, Released, Failed
  storageClass?: string // 按 StorageClass 过滤
}

/** PV 列表项 */
export interface PVListItem {
  name: string
  capacity: string // 5Gi
  accessModes: string // RWO, ROX, RWX, RWOP
  reclaimPolicy: string // Delete, Retain, Recycle
  status: string // Available, Bound, Released, Failed
  claim: string // namespace/pvc-name
  storageClass: string
  volumeAttributesClass: string
  reason?: string
  volumeMode: string // Filesystem, Block
  age: string
  creationTimestamp: number
  labels?: Record<string, string>
}

/** PV 列表响应 */
export interface PVListResponse {
  total: number
  items: PVListItem[]
}

/** PV 存储源信息 */
export interface PVSourceInfo {
  type: string // NFS, HostPath, CSI, Local, ISCSI, FC, RBD 等
  details?: Record<string, string>
}

/** PV 详情 */
export interface PVDetail {
  name: string
  capacity: string
  accessModes: string[]
  reclaimPolicy: string
  status: string
  claim?: string
  storageClass: string
  volumeAttributesClass?: string
  volumeMode: string
  reason?: string
  message?: string
  finalizers?: string[]
  source: PVSourceInfo
  nodeAffinity?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  age: string
  creationTimestamp: number
}

/** PV 绑定的 PVC 信息 */
export interface PVClaimInfo {
  name: string
  namespace: string
  status: string
  capacity: string
  accessModes: string
  storageClass: string
  labels?: Record<string, string>
  age: string
}

/** Pod 引用信息 */
export interface PodRefInfo {
  name: string
  namespace: string
  nodeName: string
  status: string
  volumeName: string
}

/** PV 使用情况响应 */
export interface PVUsageResponse {
  pvName: string
  status: string
  claimInfo?: PVClaimInfo
  usedByPods: PodRefInfo[]
  canDelete: boolean
  deleteReason?: string
}

// ==================== ClusterRole 相关类型定义 ====================

/** ClusterRole 列表项 */
export interface ClusterRoleListItem {
  name: string
  ruleCount: number // 规则数量
  aggregationLabels?: string[] // 聚合标签
  age: string
  creationTimestamp: number
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

/** ClusterRole 列表响应 */
export interface ClusterRoleListResponse {
  total: number
  items: ClusterRoleListItem[]
}

/** 策略规则信息 */
export interface PolicyRuleInfo {
  verbs: string[] // get, list, watch, create, update, delete, patch
  apiGroups: string[] // "", apps, batch 等
  resources: string[] // pods, deployments 等
  resourceNames?: string[] // 资源名称（可选）
  nonResourceURLs?: string[] // 非资源 URL（可选）
}

/** 标签选择器表达式 */
export interface LabelSelectorExpression {
  key: string
  operator: string // In, NotIn, Exists, DoesNotExist
  values?: string[]
}

/** 标签选择器信息 */
export interface LabelSelectorInfo {
  matchLabels?: Record<string, string>
  matchExpressions?: LabelSelectorExpression[]
}

/** 聚合规则信息 */
export interface AggregationRuleInfo {
  clusterRoleSelectors: LabelSelectorInfo[]
}

/** ClusterRole 详情 */
export interface ClusterRoleDetail {
  name: string
  rules: PolicyRuleInfo[]
  aggregationRule?: AggregationRuleInfo
  labels?: Record<string, string>
  annotations?: Record<string, string>
  age: string
  creationTimestamp: number
}

/** 主体信息 */
export interface SubjectInfo {
  kind: string // User, Group, ServiceAccount
  name: string
  namespace?: string // 仅 ServiceAccount 有
  apiGroup?: string
}

/** ClusterRoleBinding 引用 */
export interface ClusterRoleBindingRef {
  name: string
  subjects: SubjectInfo[]
  age: string
}

/** RoleBinding 引用 */
export interface RoleBindingRef {
  name: string
  namespace: string
  subjects: SubjectInfo[]
  age: string
}

/** ClusterRole 使用情况响应 */
export interface ClusterRoleUsageResponse {
  clusterRoleName: string
  bindingCount: number // ClusterRoleBinding 数量
  roleBindingCount: number // RoleBinding 数量
  clusterRoleBindings: ClusterRoleBindingRef[]
  roleBindings: RoleBindingRef[]
  totalSubjects: number
  serviceAccountCount: number
  userCount: number
  groupCount: number
  canDelete: boolean
  deleteWarning?: string
}

/** ClusterRole 权限摘要 */
export interface ClusterRolePermissionSummary {
  clusterRoleName: string
  hasAllVerbs: boolean // 是否有 * 权限
  hasAllResources: boolean // 是否有所有资源权限
  verbSummary: Record<string, string[]> // 按动作分组的资源
  resourceSummary: Record<string, string[]> // 按资源分组的动作
  isSuperAdmin: boolean // 是否是超级管理员角色
  riskLevel: string // low, medium, high, critical
}

/** 添加规则请求 */
export interface AddClusterRoleRuleRequest {
  clusterUuid: string
  name: string
  rule: PolicyRuleInfo
}

/** 移除规则请求 */
export interface RemoveClusterRoleRuleRequest {
  clusterUuid: string
  name: string
  ruleIndex: number
}

// ==================== ClusterRoleBinding 相关类型定义 ====================

/** ClusterRoleBinding 列表项 */
export interface ClusterRoleBindingListItem {
  name: string
  role: string // ClusterRole/xxx
  users: string // 用户列表
  groups: string // 组列表
  serviceAccounts: string // namespace/sa
  subjectCount: number
  age: string
  creationTimestamp: number
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

/** ClusterRoleBinding 列表响应 */
export interface ClusterRoleBindingListResponse {
  total: number
  items: ClusterRoleBindingListItem[]
}

/** 角色引用信息 */
export interface RoleRefInfo {
  kind: string // ClusterRole
  name: string
  apiGroup: string // rbac.authorization.k8s.io
}

/** ClusterRoleBinding 详情 */
export interface ClusterRoleBindingDetail {
  name: string
  roleRef: RoleRefInfo
  subjects: SubjectInfo[]
  labels?: Record<string, string>
  annotations?: Record<string, string>
  age: string
  creationTimestamp: number
}

/** 根据 ClusterRole 查询请求 */
export interface GetByClusterRoleRequest {
  clusterUuid: string
  clusterRoleName: string
}

/** 根据主体查询请求 */
export interface GetBySubjectRequest {
  clusterUuid: string
  subjectKind: 'User' | 'Group' | 'ServiceAccount'
  subjectName: string
  subjectNamespace?: string // 仅 ServiceAccount 需要
}

/** RoleBinding 信息 */
export interface RoleBindingInfo {
  name: string
  namespace: string
  roleName: string
  roleKind: string // Role 或 ClusterRole
  age: string
}

/** 命名空间角色信息 */
export interface NamespacedRoleInfo {
  roleName: string
  roleKind: string
  namespace: string
}

/** 主体绑定响应 */
export interface SubjectBindingsResponse {
  subjectKind: string
  subjectName: string
  subjectNamespace?: string
  clusterRoleBindings: ClusterRoleBindingListItem[]
  roleBindings: RoleBindingInfo[]
  effectiveClusterRoles: string[]
  effectiveRoles: NamespacedRoleInfo[]
  totalBindings: number
}

/** ClusterRoleBinding 实际权限响应 */
export interface ClusterRoleBindingPermissionsResponse {
  bindingName: string
  roleName: string
  roleExists: boolean
  subjects: SubjectInfo[]
  rules?: PolicyRuleInfo[]
  effectiveScopes: string[]
  isSuperAdmin: boolean
  riskLevel: string
}

/** 添加主体请求 */
export interface AddSubjectRequest {
  clusterUuid: string
  name: string
  subject: SubjectInfo
}

/** 移除主体请求 */
export interface RemoveSubjectRequest {
  clusterUuid: string
  name: string
  subjectKind: string
  subjectName: string
  subjectNamespace?: string
}

/** 验证角色引用响应 */
export interface ValidateRoleRefResponse {
  valid: boolean
  message: string
}

// ==================== IngressClass 相关类型定义 ====================

/** IngressClass 列表请求 */
export interface IngressClassListRequest {
  clusterUuid: string
  search?: string
  labelSelector?: string
}

/** IngressClass 列表项 */
export interface IngressClassListItem {
  name: string
  controller: string
  parameters: string // <none> 或 Kind/Name
  isDefault: boolean
  age: string
  creationTimestamp: number
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

/** IngressClass 列表响应 */
export interface IngressClassListResponse {
  total: number
  items: IngressClassListItem[]
}

/** IngressClass 参数 */
export interface IngressClassParameters {
  apiGroup?: string
  kind: string
  name: string
  namespace?: string
  scope?: string // Cluster 或 Namespace
}

/** IngressClass 详情 */
export interface IngressClassDetail {
  name: string
  controller: string
  isDefault: boolean
  parameters?: IngressClassParameters
  labels?: Record<string, string>
  annotations?: Record<string, string>
  age: string
  creationTimestamp: number
}

/** IngressClass 名称请求 */
export interface IngressClassNameRequest {
  clusterUuid: string
  name: string
}

/** Ingress 引用信息 */
export interface IngressRefInfo {
  name: string
  namespace: string
  hosts: string[]
  address: string
  tlsEnabled: boolean
  rulesCount: number
  backendCount: number
  age: string
}

/** IngressClass 使用情况响应 */
export interface IngressClassUsageResponse {
  ingressClassName: string
  isDefault: boolean
  ingressCount: number
  namespaceCount: number
  ingresses: IngressRefInfo[]
  namespaceStats: Record<string, number> // 每个命名空间的 Ingress 数量
  canDelete: boolean
  deleteWarning?: string
}

/** 设置默认 IngressClass 请求 */
export interface SetDefaultIngressClassRequest {
  clusterUuid: string
  name: string
}

/** IngressClass 控制器状态 */
export interface IngressClassControllerStatus {
  ingressClassName: string
  controllerName: string
  controllerPods?: string[]
  controllerReady: boolean
  controllerReplicas?: number
  namespace?: string
}

// ==================== StorageClass API 接口 ====================

/**
 * 获取 StorageClass 列表
 * @param params 查询参数
 * @returns StorageClass列表
 */
export async function getStorageClassListApi(params: ClusterResourceListRequest) {
  return request.get<StorageClassListResponse>({
    url: `${CLUSTER_BASE_PATH}/storageclass`,
    params
  })
}

/**
 * 获取 StorageClass 详情
 * @param params 查询参数
 * @returns StorageClass详情
 */
export async function getStorageClassDetailApi(params: ClusterResourceNameRequest) {
  return request.get<StorageClassDetail>({
    url: `${CLUSTER_BASE_PATH}/storageclass/detail`,
    params
  })
}

/**
 * 获取 StorageClass YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getStorageClassYamlApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/storageclass/yaml`,
    params
  })
}

/**
 * 获取 StorageClass Describe
 * @param params 查询参数
 * @returns Describe字符串
 */
export async function getStorageClassDescribeApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/storageclass/describe`,
    params
  })
}

/**
 * 创建 StorageClass
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createStorageClassApi(data: ClusterResourceYamlRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/storageclass`,
    data
  })
}

/**
 * 更新 StorageClass
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateStorageClassApi(data: ClusterResourceYamlRequest) {
  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/storageclass`,
    data
  })
}

/**
 * 删除 StorageClass
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteStorageClassApi(params: ClusterResourceNameRequest) {
  return request.del<string>({
    url: `${CLUSTER_BASE_PATH}/storageclass`,
    params
  })
}

/**
 * 获取 StorageClass 关联的 PV
 * @param params 查询参数
 * @returns 关联PV信息
 */
export async function getStorageClassPVsApi(params: ClusterResourceNameRequest) {
  return request.get<StorageClassPVResponse>({
    url: `${CLUSTER_BASE_PATH}/storageclass/pvs`,
    params
  })
}

/**
 * 检查 StorageClass 是否可删除
 * @param params 查询参数
 * @returns 是否可删除
 */
export async function canDeleteStorageClassApi(params: ClusterResourceNameRequest) {
  return request.get<CanDeleteResponse>({
    url: `${CLUSTER_BASE_PATH}/storageclass/can-delete`,
    params
  })
}

/**
 * 设置默认 StorageClass
 * @param data 设置参数
 * @returns 操作结果
 */
export async function setDefaultStorageClassApi(data: SetDefaultStorageClassRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/storageclass/set-default`,
    data
  })
}

/**
 * 取消默认 StorageClass
 * @param params 取消参数
 * @returns 操作结果
 */
export async function unsetDefaultStorageClassApi(params: ClusterResourceNameRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/storageclass/unset-default`,
    params
  })
}

// ==================== PersistentVolume API 接口 ====================

/**
 * 获取 PV 列表
 * @param params 查询参数
 * @returns PV列表
 */
export async function getPVListApi(params: PVListRequest) {
  return request.get<PVListResponse>({
    url: `${CLUSTER_BASE_PATH}/pv`,
    params
  })
}

/**
 * 获取 PV 详情
 * @param params 查询参数
 * @returns PV详情
 */
export async function getPVDetailApi(params: ClusterResourceNameRequest) {
  return request.get<PVDetail>({
    url: `${CLUSTER_BASE_PATH}/pv/detail`,
    params
  })
}

/**
 * 获取 PV YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getPVYamlApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/pv/yaml`,
    params
  })
}

/**
 * 获取 PV Describe
 * @param params 查询参数
 * @returns Describe字符串
 */
export async function getPVDescribeApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/pv/describe`,
    params
  })
}

/**
 * 创建 PV
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createPVApi(data: ClusterResourceYamlRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/pv`,
    data
  })
}

/**
 * 更新 PV
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updatePVApi(data: ClusterResourceYamlRequest) {
  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/pv`,
    data
  })
}

/**
 * 删除 PV
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deletePVApi(params: ClusterResourceNameRequest) {
  return request.del<string>({
    url: `${CLUSTER_BASE_PATH}/pv`,
    params
  })
}

/**
 * 获取 PV 使用情况
 * @param params 查询参数
 * @returns PV使用情况
 */
export async function getPVUsageApi(params: ClusterResourceNameRequest) {
  return request.get<PVUsageResponse>({
    url: `${CLUSTER_BASE_PATH}/pv/usage`,
    params
  })
}

/**
 * 检查 PV 是否可删除
 * @param params 查询参数
 * @returns 是否可删除
 */
export async function canDeletePVApi(params: ClusterResourceNameRequest) {
  return request.get<CanDeleteResponse>({
    url: `${CLUSTER_BASE_PATH}/pv/can-delete`,
    params
  })
}

// ==================== ClusterRole API 接口 ====================

/**
 * 获取 ClusterRole 列表
 * @param params 查询参数
 * @returns ClusterRole列表
 */
export async function getClusterRoleListApi(params: ClusterResourceListRequest) {
  return request.get<ClusterRoleListResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrole`,
    params
  })
}

/**
 * 获取 ClusterRole 详情
 * @param params 查询参数
 * @returns ClusterRole详情
 */
export async function getClusterRoleDetailApi(params: ClusterResourceNameRequest) {
  return request.get<ClusterRoleDetail>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/detail`,
    params
  })
}

/**
 * 获取 ClusterRole YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getClusterRoleYamlApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/yaml`,
    params
  })
}

/**
 * 获取 ClusterRole Describe
 * @param params 查询参数
 * @returns Describe字符串
 */
export async function getClusterRoleDescribeApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/describe`,
    params
  })
}

/**
 * 创建 ClusterRole
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createClusterRoleApi(data: ClusterResourceYamlRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrole`,
    data
  })
}

/**
 * 更新 ClusterRole
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateClusterRoleApi(data: ClusterResourceYamlRequest) {
  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrole`,
    data
  })
}

/**
 * 删除 ClusterRole
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteClusterRoleApi(params: ClusterResourceNameRequest) {
  return request.del<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrole`,
    params
  })
}

/**
 * 获取 ClusterRole 使用情况（被哪些绑定引用）
 * @param params 查询参数
 * @returns ClusterRole使用情况
 */
export async function getClusterRoleUsageApi(params: ClusterResourceNameRequest) {
  return request.get<ClusterRoleUsageResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/usage`,
    params
  })
}

/**
 * 获取 ClusterRole 权限摘要
 * @param params 查询参数
 * @returns 权限摘要
 */
export async function getClusterRolePermissionSummaryApi(params: ClusterResourceNameRequest) {
  return request.get<ClusterRolePermissionSummary>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/permission-summary`,
    params
  })
}

/**
 * 检查 ClusterRole 是否可删除
 * @param params 查询参数
 * @returns 是否可删除
 */
export async function canDeleteClusterRoleApi(params: ClusterResourceNameRequest) {
  return request.get<CanDeleteResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/can-delete`,
    params
  })
}

/**
 * 添加 ClusterRole 规则
 * @param data 添加规则参数
 * @returns 操作结果
 */
export async function addClusterRoleRuleApi(data: AddClusterRoleRuleRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/add-rule`,
    data
  })
}

/**
 * 移除 ClusterRole 规则
 * @param data 移除规则参数
 * @returns 操作结果
 */
export async function removeClusterRoleRuleApi(data: RemoveClusterRoleRuleRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrole/remove-rule`,
    data
  })
}

// ==================== ClusterRoleBinding API 接口 ====================

/**
 * 获取 ClusterRoleBinding 列表
 * @param params 查询参数
 * @returns ClusterRoleBinding列表
 */
export async function getClusterRoleBindingListApi(params: ClusterResourceListRequest) {
  return request.get<ClusterRoleBindingListResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding`,
    params
  })
}

/**
 * 获取 ClusterRoleBinding 详情
 * @param params 查询参数
 * @returns ClusterRoleBinding详情
 */
export async function getClusterRoleBindingDetailApi(params: ClusterResourceNameRequest) {
  return request.get<ClusterRoleBindingDetail>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/detail`,
    params
  })
}

/**
 * 获取 ClusterRoleBinding YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getClusterRoleBindingYamlApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/yaml`,
    params
  })
}

/**
 * 获取 ClusterRoleBinding Describe
 * @param params 查询参数
 * @returns Describe字符串
 */
export async function getClusterRoleBindingDescribeApi(params: ClusterResourceNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/describe`,
    params
  })
}

/**
 * 创建 ClusterRoleBinding
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createClusterRoleBindingApi(data: ClusterResourceYamlRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding`,
    data
  })
}

/**
 * 更新 ClusterRoleBinding
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateClusterRoleBindingApi(data: ClusterResourceYamlRequest) {
  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding`,
    data
  })
}

/**
 * 删除 ClusterRoleBinding
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteClusterRoleBindingApi(params: ClusterResourceNameRequest) {
  return request.del<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding`,
    params
  })
}

/**
 * 获取 ClusterRoleBinding 实际权限
 * @param params 查询参数
 * @returns 实际权限
 */
export async function getClusterRoleBindingPermissionsApi(params: ClusterResourceNameRequest) {
  return request.get<ClusterRoleBindingPermissionsResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/permissions`,
    params
  })
}

/**
 * 根据 ClusterRole 获取绑定列表
 * @param params 查询参数
 * @returns 绑定列表
 */
export async function getClusterRoleBindingByRoleApi(params: GetByClusterRoleRequest) {
  return request.get<ClusterRoleBindingListResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/by-role`,
    params
  })
}

/**
 * 根据主体获取绑定列表
 * @param params 查询参数
 * @returns 主体绑定信息
 */
export async function getClusterRoleBindingBySubjectApi(params: GetBySubjectRequest) {
  return request.get<SubjectBindingsResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/by-subject`,
    params
  })
}

/**
 * 检查 ClusterRoleBinding 是否可删除
 * @param params 查询参数
 * @returns 是否可删除
 */
export async function canDeleteClusterRoleBindingApi(params: ClusterResourceNameRequest) {
  return request.get<CanDeleteResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/can-delete`,
    params
  })
}

/**
 * 验证角色引用是否有效
 * @param params 查询参数
 * @returns 验证结果
 */
export async function validateClusterRoleBindingRoleRefApi(params: ClusterResourceNameRequest) {
  return request.get<ValidateRoleRefResponse>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/validate-roleref`,
    params
  })
}

/**
 * 添加主体
 * @param data 添加主体参数
 * @returns 操作结果
 */
export async function addClusterRoleBindingSubjectApi(data: AddSubjectRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/add-subject`,
    data
  })
}

/**
 * 移除主体
 * @param data 移除主体参数
 * @returns 操作结果
 */
export async function removeClusterRoleBindingSubjectApi(data: RemoveSubjectRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/clusterrolebinding/remove-subject`,
    data
  })
}

// ==================== IngressClass API 接口 ====================

/**
 * 获取 IngressClass 列表
 * @param params 查询参数
 * @returns IngressClass列表
 */
export async function getIngressClassListApi(params: IngressClassListRequest) {
  return request.get<IngressClassListResponse>({
    url: `${CLUSTER_BASE_PATH}/ingressclass`,
    params
  })
}

/**
 * 获取 IngressClass 详情
 * @param params 查询参数
 * @returns IngressClass详情
 */
export async function getIngressClassDetailApi(params: IngressClassNameRequest) {
  return request.get<IngressClassDetail>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/detail`,
    params
  })
}

/**
 * 获取 IngressClass YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getIngressClassYamlApi(params: IngressClassNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/yaml`,
    params
  })
}

/**
 * 获取 IngressClass Describe
 * @param params 查询参数
 * @returns Describe字符串
 */
export async function getIngressClassDescribeApi(params: IngressClassNameRequest) {
  return request.get<string>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/describe`,
    params
  })
}

/**
 * 创建 IngressClass
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createIngressClassApi(data: ClusterResourceYamlRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/ingressclass`,
    data
  })
}

/**
 * 更新 IngressClass
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateIngressClassApi(data: ClusterResourceYamlRequest) {
  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/ingressclass`,
    data
  })
}

/**
 * 删除 IngressClass
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteIngressClassApi(params: IngressClassNameRequest) {
  return request.del<string>({
    url: `${CLUSTER_BASE_PATH}/ingressclass`,
    params
  })
}

/**
 * 获取 IngressClass 使用情况（哪些 Ingress 使用）
 * @param params 查询参数
 * @returns IngressClass使用情况
 */
export async function getIngressClassUsageApi(params: IngressClassNameRequest) {
  return request.get<IngressClassUsageResponse>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/usage`,
    params
  })
}

/**
 * 检查 IngressClass 是否可删除
 * @param params 查询参数
 * @returns 是否可删除
 */
export async function canDeleteIngressClassApi(params: IngressClassNameRequest) {
  return request.get<CanDeleteResponse>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/can-delete`,
    params
  })
}

/**
 * 设置默认 IngressClass
 * @param data 设置参数
 * @returns 操作结果
 */
export async function setDefaultIngressClassApi(data: SetDefaultIngressClassRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/set-default`,
    data
  })
}

/**
 * 取消默认 IngressClass
 * @param params 取消参数
 * @returns 操作结果
 */
export async function unsetDefaultIngressClassApi(params: IngressClassNameRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/unset-default`,
    params
  })
}

/**
 * 获取 IngressClass 控制器状态
 * @param params 查询参数
 * @returns 控制器状态
 */
export async function getIngressClassControllerStatusApi(params: IngressClassNameRequest) {
  return request.get<IngressClassControllerStatus>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/controller-status`,
    params
  })
}

/**
 * 获取默认 IngressClass
 * @param params 查询参数
 * @returns 默认IngressClass详情
 */
export async function getDefaultIngressClassApi(params: ClusterResourceListRequest) {
  return request.get<IngressClassDetail>({
    url: `${CLUSTER_BASE_PATH}/ingressclass/default`,
    params
  })
}