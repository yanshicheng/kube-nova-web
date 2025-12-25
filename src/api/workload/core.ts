import request from '@/utils/http'

// 定义基础路径
const CONFIG_BASE_PATH = '/workload/v1/core'

// ==================== 基础类型定义（来自 base.api）====================

/** 默认ID请求参数 */
export interface DefaultIdRequest {
  id: number // ID
}

/** 通用分页请求参数 */
export interface PageRequest {
  page?: number // 当前页码，默认 1
  pageSize?: number // 每页条数，默认 10
  orderField?: string // 排序字段，默认 id
  isAsc?: boolean // 是否升序，默认 false
}

/** 目标引用信息 */
export interface TargetRefInfo {
  apiVersion: string // apps/v1
  kind: string // Deployment, DaemonSet
  name: string // 资源名称
}

/** 批量删除请求 */
export interface BatchDeleteRequest {
  ids: number[] // ID列表
}

/** 策略规则信息（Role 和 ClusterRole 共用）*/
export interface PolicyRuleInfo {
  apiGroups: string[] // "", apps, batch 等
  resources: string[] // pods, deployments 等
  verbs: string[] // get, list, watch, create, update, delete, patch
  resourceNames?: string[] // 资源名称（可选）
  nonResourceURLs?: string[] // 非资源 URL（可选）
}

/** 主体信息（RoleBinding 和 ClusterRoleBinding 共用）*/
export interface SubjectInfo {
  kind: string // User, Group, ServiceAccount
  name: string
  namespace?: string // 仅对 ServiceAccount 有效
  apiGroup?: string
}

/** 角色引用信息（RoleBinding 和 ClusterRoleBinding 共用）*/
export interface RoleRefInfo {
  kind: string // Role 或 ClusterRole
  name: string
  apiGroup: string // rbac.authorization.k8s.io
}

/** 事件信息 */
export interface EventInfo {
  type: string
  reason: string
  age: string
  from: string
  message: string
}

/** 标签选择器信息 */
export interface LabelSelectorInfo {
  matchLabels?: Record<string, string>
  matchExpressions?: LabelSelectorExpression[]
}

/** 标签选择器表达式 */
export interface LabelSelectorExpression {
  key: string
  operator: string // In, NotIn, Exists, DoesNotExist
  values?: string[]
}

// ==================== 通用请求类型（来自 config.api）====================

/** 列表查询请求（workloadId 模式）*/
export interface ListRequest {
  workloadId: number // 工作负载ID
  search?: string // 搜索关键字
  labelSelector?: string // 标签选择器，如: "app=nginx,env=prod"
}

/** 通用名称请求（workloadId 模式）*/
export interface DefaultNameRequest {
  workloadId: number // 工作负载ID
  name: string // 资源名称
}

/** 集群命名空间请求（用于 SA/Role/RoleBinding/PVC）*/
export interface ClusterNamespaceRequest {
  clusterUuid: string // 集群UUID
  namespace: string // 命名空间
  search?: string // 搜索关键字
  labelSelector?: string // 标签选择器
}

/** 集群命名空间资源请求 */
export interface ClusterNamespaceResourceRequest {
  clusterUuid: string // 集群UUID
  namespace: string // 命名空间
  name: string // 资源名称
}

/** 集群命名空间资源更新请求 */
export interface ClusterNamespaceResourceUpdateRequest {
  clusterUuid: string // 集群UUID
  namespace: string // 命名空间
  name: string // 资源名称
  yamlStr: string // YAML 字符串
}

/** 核心资源创建请求 */
export interface DefaultCoreCreateRequest {
  clusterUuid: string // 集群UUID
  namespace: string // 命名空间
  yamlStr: string // YAML 字符串
}

/** 获取应用服务请求 */
export interface GetAppServicesRequest {
  workloadId: number // 工作负载ID
  applicationId: number // 应用ID
}

/** 获取应用 Ingress 请求 */
export interface GetAppIngressRequest {
  workloadId: number // 工作负载ID
  applicationId: number // 应用ID
}

// ==================== ConfigMap 相关 ====================

/** ConfigMap 列表项 */
export interface ConfigMapListItem {
  name: string // 名称
  namespace: string // 命名空间
  dataCount: number // 数据项数量
  age: string // 年龄，如: "2d5h"
  creationTimestamp: number // 创建时间戳（毫秒）
}

/** ConfigMap 列表响应 */
export interface ConfigMapListResponse {
  total: number // 总数
  items: ConfigMapListItem[] // 列表项
}

/** ConfigMap 数据项 */
export interface ConfigMapDataItem {
  key: string // 键
  value: string // 值
}

/** ConfigMap 数据响应 */
export interface GetConfigMapDataResponse {
  name: string // 名称
  data: ConfigMapDataItem[] // 数据列表
}

/** ConfigMap 详细信息 */
export interface ConfigMapDetail {
  name: string // 名称
  data: Record<string, string> // 数据
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** ConfigMap 创建/更新请求 */
export interface ConfigMapRequest {
  workloadId: number // 工作负载ID
  name: string // 名称
  data: Record<string, string> // 数据
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
}

/** ConfigMap 引用信息 */
export interface ConfigMapUsageReference {
  resourceType: string // 资源类型: Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod
  resourceName: string // 资源名称
  namespace: string // 命名空间
  usageType: string[] // 使用类型: volume, env, envFrom
  usedKeys: string[] // 使用的具体 key
  containerNames: string[] // 使用的容器名称
}

/** ConfigMap 引用响应 */
export interface ConfigMapUsageResponse {
  configMapName: string // ConfigMap名称
  configMapNamespace: string // ConfigMap命名空间
  usedBy: ConfigMapUsageReference[] // 被使用情况
  totalUsageCount: number // 总使用次数
  canDelete: boolean // 是否可以删除
  deleteWarning?: string // 删除警告
}

// ==================== Secret 相关 ====================

/** Secret 列表请求 */
export interface SecretListRequest {
  workloadId: number // 工作负载ID
  search?: string // 搜索关键字
  type?: string // 查询类型。默认为空，表示所有类型
  labelSelector?: string // 标签选择器，如: "app=nginx,env=prod"
}

/** Secret 列表项 */
export interface SecretListItem {
  name: string // 名称
  namespace: string // 命名空间
  type: string // 类型: Opaque, kubernetes.io/tls, etc.
  dataCount: number // 数据项数量
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
  labels?: Record<string, string> // 标签
}

/** Secret 列表响应 */
export interface SecretListResponse {
  total: number // 总数
  items: SecretListItem[] // 列表项
}

/** Secret 数据项 */
export interface SecretDataItem {
  key: string // 键
  value: string // 值（base64 解码后）
}

/** Secret 数据响应 */
export interface GetSecretDataResponse {
  name: string // 名称
  namespace: string // 命名空间
  type: string // 类型
  data: SecretDataItem[] // 数据列表
}

/** Secret 详细信息 */
export interface SecretDetail {
  name: string // 名称
  namespace: string // 命名空间
  type: string // 类型
  data?: Record<string, number[]> // 数据（字节数组）
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** Secret 创建/更新请求 */
export interface SecretRequest {
  workloadId: number // 工作负载ID
  name: string // 名称
  secretYamlStr: string // Secret YAML 字符串
}

/** Secret 引用信息 */
export interface SecretUsageReference {
  resourceType: string // 资源类型: Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod, ServiceAccount
  resourceName: string // 资源名称
  namespace: string // 命名空间
  usageType: string[] // 使用类型: volume, env, envFrom, imagePullSecret, serviceAccountToken
  usedKeys: string[] // 使用的具体 key
  containerNames: string[] // 使用的容器名称
}

/** Secret 引用响应 */
export interface SecretUsageResponse {
  secretName: string // Secret名称
  secretNamespace: string // Secret命名空间
  secretType: string // Secret类型
  usedBy: SecretUsageReference[] // 被使用情况
  totalUsageCount: number // 总使用次数
  canDelete: boolean // 是否可以删除
  deleteWarning?: string // 删除警告
}

// ==================== Service 相关 ====================

/** Service 端口信息 */
export interface ServicePort {
  name: string // 端口名称
  protocol: string // 协议: TCP, UDP, SCTP
  port: number // Service 端口
  targetPort: string // 目标端口（数字或名称）
  nodePort?: number // NodePort（仅 NodePort/LoadBalancer 类型）
  appProtocol?: string // 应用层协议: HTTP, HTTPS, gRPC
}

/** ClientIP 配置 */
export interface ClientIPConfig {
  timeoutSeconds?: number // ClientIP 超时时间（秒），默认 10800
}

/** 会话亲和性配置 */
export interface SessionAffinityConfig {
  clientIP?: ClientIPConfig // ClientIP 配置
}

/** Service 列表项 */
export interface ServiceListItem {
  name: string // 名称
  namespace: string // 命名空间
  type: string // 类型: ClusterIP, NodePort, LoadBalancer, ExternalName
  clusterIP: string // 集群IP
  externalIP: string // 外部IP
  ports: string // 端口信息: "80:30080/TCP,443:30443/TCP"
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
  labels?: Record<string, string> // 标签
}

/** Service 列表响应 */
export interface ServiceListResponse {
  total: number // 总数
  items: ServiceListItem[] // 列表项
}

/** Service 详细信息 */
export interface ServiceDetail {
  name: string // 名称
  namespace: string // 命名空间
  type: string // 类型
  clusterIP: string // 集群IP
  externalIPs?: string[] // 外部IP列表
  loadBalancerIP?: string // 负载均衡IP
  loadBalancerStatus?: string // 负载均衡状态: Pending, Available
  ports: ServicePort[] // 端口列表
  selector?: Record<string, string> // 选择器
  sessionAffinity: string // 会话亲和性: None, ClientIP
  endpointCount: number // Endpoint 数量
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** Service 创建/更新请求 */
export interface ServiceRequest {
  workloadId: number // 工作负载ID
  name: string // 名称
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName' // 服务类型
  ports: ServicePort[] // 端口列表
  selector?: Record<string, string> // 选择器
  clusterIP?: string // 集群IP（可选，用于指定固定 ClusterIP）
  externalIPs?: string[] // 外部IP列表
  loadBalancerIP?: string // 负载均衡IP
  sessionAffinity?: string // 会话亲和性: None, ClientIP
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  clusterIPs?: string[] // 多个集群 IP（双栈）
  ipFamilies?: string[] // IP 协议族: IPv4, IPv6
  ipFamilyPolicy?: string // SingleStack, PreferDualStack, RequireDualStack
  externalName?: string // 外部名称（ExternalName 类型必需）
  loadBalancerClass?: string // 负载均衡器类: service.k8s.aws/nlb
  loadBalancerSourceRanges?: string[] // 限制访问源 IP CIDR
  allocateLoadBalancerNodePorts?: boolean // 是否分配 NodePort（默认 true）
  externalTrafficPolicy?: string // Cluster, Local（保留源 IP）
  internalTrafficPolicy?: string // Cluster, Local
  sessionAffinityConfig?: SessionAffinityConfig // 会话保持详细配置
  healthCheckNodePort?: number // 健康检查端口
  publishNotReadyAddresses?: boolean // 发布未就绪地址
}

/** Service Endpoint 信息 */
export interface ServiceEndpoint {
  podName: string // Pod名称
  podIP: string // Pod IP
  nodeName: string // 节点名称
  ready: boolean // 是否就绪
  ports: number[] // 端口列表
  addresses: string[] // 地址列表
}

/** Service Endpoints 响应 */
export interface ServiceEndpointsResponse {
  serviceName: string // Service名称
  namespace: string // 命名空间
  endpoints: ServiceEndpoint[] // Endpoint列表
  totalCount: number // 总数
}

/** 匹配的 Pod 信息 */
export interface MatchedPodInfo {
  name: string // 名称
  namespace: string // 命名空间
  podIP: string // Pod IP
  status: string // 状态
  nodeName: string // 节点名称
}

/** 服务获取资源响应 */
export interface ServicesGetResourceResponse {
  versionId: number // 版本ID
}

/** Service 端口请求 */
export interface ServicePortsRequest {
  workloadId: number // 工作负载ID
  applicationId?: number // 应用ID
  versionId?: number // 版本ID
}

/** Service 端口响应 */
export interface ServicePortsResponse {
  name: string // 名称
  ports: number[] // 端口列表
}

/** 应用级 Service 创建/更新请求 */
export interface ApplicationServiceRequest {
  workloadId: number // 工作负载ID
  applicationId: number // 应用ID
  isAppSvc: boolean // 是否为应用级 service
  isAllSvc: boolean // 是否为所有版本
  name: string // 名称
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName' // 服务类型
  ports: ServicePort[] // 端口列表
  selector?: Record<string, string> // 选择器
  clusterIP?: string // 集群IP
  externalIPs?: string[] // 外部IP列表
  loadBalancerIP?: string // 负载均衡IP
  sessionAffinity?: string // 会话亲和性
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  clusterIPs?: string[] // 多个集群 IP
  ipFamilies?: string[] // IP 协议族
  ipFamilyPolicy?: string // IP 协议族策略
  externalName?: string // 外部名称
  loadBalancerClass?: string // 负载均衡器类
  loadBalancerSourceRanges?: string[] // 限制访问源 IP CIDR
  allocateLoadBalancerNodePorts?: boolean // 是否分配 NodePort
  externalTrafficPolicy?: string // 外部流量策略
  internalTrafficPolicy?: string // 内部流量策略
  sessionAffinityConfig?: SessionAffinityConfig // 会话保持配置
  healthCheckNodePort?: number // 健康检查端口
  publishNotReadyAddresses?: boolean // 发布未就绪地址
}

/** 应用级 Service 列表响应项 */
export interface ApplicationServiceListResponse {
  name: string // 名称
  version: number // 所属版本
  versionName: string // 版本名称
  namespace: string // 命名空间
  type: string // 类型
  clusterIP: string // 集群IP
  externalIP: string // 外部IP
  ports: string // 端口信息
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
  labels?: Record<string, string> // 标签
  clusterIPs?: string[] // 多个 ClusterIP
  ipFamilies?: string[] // IP 协议族
  ipFamilyPolicy?: string // IP 协议族策略
  externalTrafficPolicy?: string // 外部流量策略
  sessionAffinity?: string // 会话亲和性
  loadBalancerClass?: string // 负载均衡器类
}

// ==================== PVC 相关 ====================

/** PVC 列表项 */
export interface PVCListItem {
  name: string // 名称
  namespace: string // 命名空间
  status: string // 状态: Pending, Bound, Lost
  volume: string // 绑定的 PV
  capacity: string // 容量，如: "10Gi"
  accessModes: string[] // 访问模式: ReadWriteOnce, ReadOnlyMany, ReadWriteMany
  storageClass: string // 存储类名称
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** PVC 列表响应 */
export interface PVCListResponse {
  total: number // 总数
  items: PVCListItem[] // 列表项
}

/** PVC 详情 */
export interface PVCDetail {
  name: string // 名称
  namespace: string // 命名空间
  status: string // 状态
  volume: string // 绑定的 PV
  capacity: string // 容量
  accessModes: string[] // 访问模式
  storageClass: string // 存储类名称
  volumeMode?: string // 卷模式: Filesystem, Block
  requestStorage: string // 请求的存储大小
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** PVC 关联信息 */
export interface PVCAssociation {
  pvcName: string // PVC名称
  namespace: string // 命名空间
  pvName: string // 绑定的 PV
  pods: string[] // 使用该 PVC 的 Pod 列表
  podCount: number // Pod 数量
}

// ==================== Ingress 相关 ====================

/** Ingress 资源引用 */
export interface IngressResourceRef {
  apiGroup?: string // API 组
  kind: string // 类型
  name: string // 名称
}

/** Ingress 后端信息 */
export interface IngressBackendInfo {
  serviceName: string // Service 名称
  servicePort: string // Service 端口
  resourceRef?: IngressResourceRef // 资源引用
}

/** Ingress 路径信息 */
export interface IngressPathInfo {
  path: string // 路径
  pathType: string // 路径类型: Exact, Prefix, ImplementationSpecific
  backend: IngressBackendInfo // 后端信息
}

/** Ingress 规则信息 */
export interface IngressRuleInfo {
  host: string // 主机
  paths: IngressPathInfo[] // 路径列表
}

/** Ingress TLS 信息 */
export interface IngressTLSInfo {
  hosts: string[] // 主机列表
  secretName: string // Secret 名称
}

/** Ingress 负载均衡器入口 */
export interface IngressLoadBalancerIngress {
  ip?: string // IP 地址
  hostname?: string // 主机名
}

/** Ingress 负载均衡器信息 */
export interface IngressLoadBalancerInfo {
  ingress?: IngressLoadBalancerIngress[] // 入口列表
}

/** Ingress 列表项 */
export interface IngressListItem {
  name: string // 名称
  namespace: string // 命名空间
  ingressClass: string // IngressClass 名称
  hosts: string[] // 主机列表
  address: string // 负载均衡器地址
  ports: string // 端口列表
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
  labels?: Record<string, string> // 标签
}

/** Ingress 列表响应 */
export interface IngressListResponse {
  total: number // 总数
  items: IngressListItem[] // 列表项
}

/** Ingress 详情 */
export interface IngressDetail {
  name: string // 名称
  namespace: string // 命名空间
  ingressClass: string // IngressClass 名称
  rules: IngressRuleInfo[] // 规则列表
  tls?: IngressTLSInfo[] // TLS 配置
  defaultBackend?: IngressBackendInfo // 默认后端
  loadBalancer: IngressLoadBalancerInfo // 负载均衡器信息
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  age: string // 年龄
  creationTimestamp: number // 创建时间戳
}

/** Ingress 创建/更新请求 */
export interface IngressRequest {
  workloadId: number // 工作负载ID
  name: string // 名称
  ingressYamlStr: string // Ingress YAML 字符串
}

// ==================== ServiceAccount 相关 ====================

/** ServiceAccount 列表项 */
export interface ServiceAccountListItem {
  name: string // 名称
  namespace: string // 命名空间
  secrets: number // Secrets 数量
  age: string // 年龄
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  creationTimestamp: number // 创建时间戳
}

/** ServiceAccount 列表响应 */
export interface ServiceAccountListResponse {
  total: number // 总数
  items: ServiceAccountListItem[] // 列表项
}

/** ServiceAccount 详情 */
export interface ServiceAccountDescribe {
  name: string // 名称
  namespace: string // 命名空间
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  imagePullSecrets?: string[] // ImagePullSecrets
  secrets?: string[] // Secrets
  automountServiceAccountToken?: boolean // 自动挂载 ServiceAccount Token
  creationTimestamp: string // 创建时间
  events?: EventInfo[] // 事件
}

/** ServiceAccount 关联信息 */
export interface ServiceAccountAssociation {
  serviceAccountName: string // ServiceAccount 名称
  namespace: string // 命名空间
  pods: string[] // 使用该 SA 的 Pod 列表
  podCount: number // Pod 数量
  secrets: string[] // 关联的 Secret 列表
  imagePullSecrets: string[] // ImagePullSecrets 列表
}

// ==================== Role 相关 ====================

/** Role 列表项 */
export interface RoleListItem {
  name: string // 名称
  namespace: string // 命名空间
  age: string // 年龄
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  creationTimestamp: number // 创建时间戳
}

/** Role 列表响应 */
export interface RoleListResponse {
  total: number // 总数
  items: RoleListItem[] // 列表项
}

/** Role 详情 */
export interface RoleDescribe {
  name: string // 名称
  namespace: string // 命名空间
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  policyRules: PolicyRuleInfo[] // 策略规则
  creationTimestamp: string // 创建时间
  events?: EventInfo[] // 事件
}

/** Role 关联信息 */
export interface RoleAssociation {
  roleName: string // Role 名称
  namespace: string // 命名空间
  roleBindings: string[] // 引用该 Role 的 RoleBinding 列表
  bindingCount: number // RoleBinding 数量
  subjects: string[] // 所有绑定的主体
}

// ==================== RoleBinding 相关 ====================

/** RoleBinding 列表项 */
export interface RoleBindingListItem {
  name: string // 名称
  namespace: string // 命名空间
  role: string // Role 名称（格式：Role/rolename 或 ClusterRole/clusterrolename）
  age: string // 年龄
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  creationTimestamp: number // 创建时间戳
}

/** RoleBinding 列表响应 */
export interface RoleBindingListResponse {
  total: number // 总数
  items: RoleBindingListItem[] // 列表项
}

/** RoleBinding 详情 */
export interface RoleBindingDescribe {
  name: string // 名称
  namespace: string // 命名空间
  labels?: Record<string, string> // 标签
  annotations?: Record<string, string> // 注解
  roleRef: RoleRefInfo // 角色引用
  subjects: SubjectInfo[] // 主体列表
  creationTimestamp: string // 创建时间
  events?: EventInfo[] // 事件
}

/** RoleBinding 关联信息 */
export interface RoleBindingAssociation {
  roleBindingName: string // RoleBinding 名称
  namespace: string // 命名空间
  roleName: string // 引用的 Role 名称
  roleKind: string // Role 或 ClusterRole
  subjects: SubjectInfo[] // 绑定的主体列表
  subjectCount: number // 主体数量
}

// ==================== API 接口 ====================

// ========== ConfigMap API ==========

/**
 * 获取 ConfigMap 列表
 * @param params 查询参数
 * @returns ConfigMap列表
 */
export async function getConfigMapListApi(params: ListRequest) {
  return request.get<ConfigMapListResponse>({
    url: `${CONFIG_BASE_PATH}/configmap`,
    params
  })
}

/**
 * 获取 ConfigMap 详情
 * @param params 查询参数
 * @returns ConfigMap详情
 */
export async function getConfigMapDetailApi(params: DefaultNameRequest) {
  return request.get<ConfigMapDetail>({
    url: `${CONFIG_BASE_PATH}/configmap/detail`,
    params
  })
}

/**
 * 获取 ConfigMap 数据（key-value 列表）
 * @param params 查询参数
 * @returns ConfigMap数据
 */
export async function getConfigMapDataApi(params: DefaultNameRequest) {
  return request.get<GetConfigMapDataResponse>({
    url: `${CONFIG_BASE_PATH}/configmap/data`,
    params
  })
}

/**
 * 获取 ConfigMap YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getConfigMapYamlApi(params: DefaultNameRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/configmap/yaml`,
    params
  })
}

/**
 * 创建 ConfigMap
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createConfigMapApi(data: ConfigMapRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/configmap`,
    data
  })
}

/**
 * 更新 ConfigMap
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateConfigMapApi(data: ConfigMapRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/configmap`,
    data
  })
}

/**
 * 删除 ConfigMap
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteConfigMapApi(params: DefaultNameRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/configmap`,
    params
  })
}

/**
 * 获取 ConfigMap 引用情况
 * @param params 查询参数
 * @returns ConfigMap引用情况
 */
export async function getConfigMapUsageApi(params: DefaultNameRequest) {
  return request.get<ConfigMapUsageResponse>({
    url: `${CONFIG_BASE_PATH}/configmap/usage`,
    params
  })
}

// ========== Secret API ==========

/**
 * 获取 Secret 列表
 * @param params 查询参数
 * @returns Secret列表
 */
export async function getSecretListApi(params: SecretListRequest) {
  return request.get<SecretListResponse>({
    url: `${CONFIG_BASE_PATH}/secret`,
    params
  })
}

/**
 * 获取 Secret 详情
 * @param params 查询参数
 * @returns Secret详情
 */
export async function getSecretDetailApi(params: DefaultNameRequest) {
  return request.get<SecretDetail>({
    url: `${CONFIG_BASE_PATH}/secret/detail`,
    params
  })
}

/**
 * 获取 Secret 数据（key-value 列表）
 * @param params 查询参数
 * @returns Secret数据
 */
export async function getSecretDataApi(params: DefaultNameRequest) {
  return request.get<GetSecretDataResponse>({
    url: `${CONFIG_BASE_PATH}/secret/data`,
    params
  })
}

/**
 * 获取 Secret YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getSecretYamlApi(params: DefaultNameRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/secret/yaml`,
    params
  })
}

/**
 * 创建 Secret
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createSecretApi(data: SecretRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/secret`,
    data
  })
}

/**
 * 更新 Secret
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateSecretApi(data: SecretRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/secret`,
    data
  })
}

/**
 * 删除 Secret
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteSecretApi(params: DefaultNameRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/secret`,
    params
  })
}

/**
 * 获取 Secret 引用情况
 * @param params 查询参数
 * @returns Secret引用情况
 */
export async function getSecretUsageApi(params: DefaultNameRequest) {
  return request.get<SecretUsageResponse>({
    url: `${CONFIG_BASE_PATH}/secret/usage`,
    params
  })
}

// ========== Service API ==========

/**
 * 获取 Service 列表
 * @param params 查询参数
 * @returns Service列表
 */
export async function getServiceListApi(params: ListRequest) {
  return request.get<ServiceListResponse>({
    url: `${CONFIG_BASE_PATH}/service`,
    params
  })
}

/**
 * 获取 Service 详情
 * @param params 查询参数
 * @returns Service详情
 */
export async function getServiceDetailApi(params: DefaultNameRequest) {
  return request.get<ServiceDetail>({
    url: `${CONFIG_BASE_PATH}/service/detail`,
    params
  })
}

/**
 * 获取 Service 端口
 * @param params 查询参数
 * @returns Service端口列表
 */
export async function getServicePortsApi(params: ServicePortsRequest) {
  return request.get<ServicePortsResponse[]>({
    url: `${CONFIG_BASE_PATH}/service/ports`,
    params
  })
}

/**
 * 获取 Service YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getServiceYamlApi(params: DefaultNameRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/service/yaml`,
    params
  })
}

/**
 * 创建 Service
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createServiceApi(data: ServiceRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/service`,
    data
  })
}

/**
 * 更新 Service
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateServiceApi(data: ServiceRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/service`,
    data
  })
}

/**
 * 删除 Service
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteServiceApi(params: DefaultNameRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/service`,
    params
  })
}

/**
 * 获取 Service Endpoints
 * @param params 查询参数
 * @returns Service Endpoints信息
 */
export async function getServiceEndpointsApi(params: DefaultNameRequest) {
  return request.get<ServiceEndpointsResponse>({
    url: `${CONFIG_BASE_PATH}/service/endpoints`,
    params
  })
}

/**
 * 获取 Service 选择器匹配的 Pods
 * @param params 查询参数
 * @returns 匹配的Pod列表
 */
export async function getServiceMatchingPodsApi(params: DefaultNameRequest) {
  return request.get<MatchedPodInfo[]>({
    url: `${CONFIG_BASE_PATH}/service/matching-pods`,
    params
  })
}

/**
 * 获取资源关联的 Service 列表
 * @param params 查询参数
 * @returns Service列表
 */
export async function getResourceServicesApi(params: ServicesGetResourceResponse) {
  return request.get<ServiceListItem[]>({
    url: `${CONFIG_BASE_PATH}/service/resource-services`,
    params
  })
}

/**
 * 创建应用级 Service
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createApplicationServiceApi(data: ApplicationServiceRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/service/application`,
    data
  })
}

/**
 * 获取应用级 Service 列表
 * @param params 查询参数
 * @returns Service列表
 */
export async function getApplicationServiceListApi(params: GetAppServicesRequest) {
  return request.get<ApplicationServiceListResponse[]>({
    url: `${CONFIG_BASE_PATH}/service/application`,
    params
  })
}

/**
 * 更新应用级 Service
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateApplicationServiceApi(data: ApplicationServiceRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/service/application`,
    data
  })
}

// ========== PVC API ==========

/**
 * 创建 PVC
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createPVCApi(data: DefaultCoreCreateRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/pvc`,
    data
  })
}

/**
 * 获取 PVC 列表
 * @param params 查询参数
 * @returns PVC列表
 */
export async function getPVCListApi(params: ClusterNamespaceRequest) {
  return request.get<PVCListResponse>({
    url: `${CONFIG_BASE_PATH}/pvc`,
    params
  })
}

/**
 * 获取 PVC 详情
 * @param params 查询参数
 * @returns PVC详情
 */
export async function getPVCDetailApi(params: ClusterNamespaceResourceRequest) {
  return request.get<PVCDetail>({
    url: `${CONFIG_BASE_PATH}/pvc/detail`,
    params
  })
}

/**
 * 获取 PVC YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getPVCYamlApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/pvc/yaml`,
    params
  })
}

/**
 * 更新 PVC
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updatePVCApi(data: ClusterNamespaceResourceUpdateRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/pvc`,
    data
  })
}

/**
 * 删除 PVC
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deletePVCApi(params: ClusterNamespaceResourceRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/pvc`,
    params
  })
}

/**
 * 获取 PVC 详细描述
 * @param params 查询参数
 * @returns PVC描述信息
 */
export async function getPVCDescribeApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/pvc/describe`,
    params
  })
}

/**
 * 获取 PVC 关联信息
 * @param params 查询参数
 * @returns PVC关联信息
 */
export async function getPVCAssociationApi(params: ClusterNamespaceResourceRequest) {
  return request.get<PVCAssociation>({
    url: `${CONFIG_BASE_PATH}/pvc/association`,
    params
  })
}

// ========== Ingress API ==========

/**
 * 获取应用级 Ingress 列表
 * @param params 查询参数
 * @returns Ingress列表
 */
export async function getApplicationIngressListApi(params: GetAppIngressRequest) {
  return request.get<IngressListItem[]>({
    url: `${CONFIG_BASE_PATH}/ingress/application`,
    params
  })
}

/**
 * 获取 Ingress 列表
 * @param params 查询参数
 * @returns Ingress列表
 */
export async function getIngressListApi(params: ListRequest) {
  return request.get<IngressListResponse>({
    url: `${CONFIG_BASE_PATH}/ingress`,
    params
  })
}

/**
 * 获取 Ingress 详情
 * @param params 查询参数
 * @returns Ingress详情
 */
export async function getIngressDetailApi(params: DefaultNameRequest) {
  return request.get<IngressDetail>({
    url: `${CONFIG_BASE_PATH}/ingress/detail`,
    params
  })
}

/**
 * 获取 Ingress YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getIngressYamlApi(params: DefaultNameRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/ingress/yaml`,
    params
  })
}

/**
 * 创建 Ingress
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createIngressApi(data: IngressRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/ingress`,
    data
  })
}

/**
 * 更新 Ingress
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateIngressApi(data: IngressRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/ingress`,
    data
  })
}

/**
 * 删除 Ingress
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteIngressApi(params: DefaultNameRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/ingress`,
    params
  })
}

// ========== ServiceAccount API ==========

/**
 * 创建 ServiceAccount
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createServiceAccountApi(data: DefaultCoreCreateRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/serviceaccount`,
    data
  })
}

/**
 * 获取 ServiceAccount 列表
 * @param params 查询参数
 * @returns ServiceAccount列表
 */
export async function getServiceAccountListApi(params: ClusterNamespaceRequest) {
  return request.get<ServiceAccountListResponse>({
    url: `${CONFIG_BASE_PATH}/serviceaccount`,
    params
  })
}

/**
 * 获取 ServiceAccount YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getServiceAccountYamlApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/serviceaccount/yaml`,
    params
  })
}

/**
 * 更新 ServiceAccount
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateServiceAccountApi(data: ClusterNamespaceResourceUpdateRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/serviceaccount`,
    data
  })
}

/**
 * 删除 ServiceAccount
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteServiceAccountApi(params: ClusterNamespaceResourceRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/serviceaccount`,
    params
  })
}

/**
 * 获取 ServiceAccount 详细描述
 * @param params 查询参数
 * @returns ServiceAccount描述信息
 */
export async function getServiceAccountDescribeApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/serviceaccount/describe`,
    params
  })
}

/**
 * 获取 ServiceAccount 关联信息
 * @param params 查询参数
 * @returns ServiceAccount关联信息
 */
export async function getServiceAccountAssociationApi(params: ClusterNamespaceResourceRequest) {
  return request.get<ServiceAccountAssociation>({
    url: `${CONFIG_BASE_PATH}/serviceaccount/association`,
    params
  })
}

// ========== Role API ==========

/**
 * 创建 Role
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createRoleApi(data: DefaultCoreCreateRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/role`,
    data
  })
}

/**
 * 获取 Role 列表
 * @param params 查询参数
 * @returns Role列表
 */
export async function getRoleListApi(params: ClusterNamespaceRequest) {
  return request.get<RoleListResponse>({
    url: `${CONFIG_BASE_PATH}/role`,
    params
  })
}

/**
 * 获取 Role YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getRoleYamlApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/role/yaml`,
    params
  })
}

/**
 * 更新 Role
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateRoleApi(data: ClusterNamespaceResourceUpdateRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/role`,
    data
  })
}

/**
 * 删除 Role
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteRoleApi(params: ClusterNamespaceResourceRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/role`,
    params
  })
}

/**
 * 获取 Role 详细描述
 * @param params 查询参数
 * @returns Role描述信息
 */
export async function getRoleDescribeApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/role/describe`,
    params
  })
}

/**
 * 获取 Role 关联信息
 * @param params 查询参数
 * @returns Role关联信息
 */
export async function getRoleAssociationApi(params: ClusterNamespaceResourceRequest) {
  return request.get<RoleAssociation>({
    url: `${CONFIG_BASE_PATH}/role/association`,
    params
  })
}

// ========== RoleBinding API ==========

/**
 * 创建 RoleBinding
 * @param data 创建参数
 * @returns 操作结果
 */
export async function createRoleBindingApi(data: DefaultCoreCreateRequest) {
  return request.post<string>({
    url: `${CONFIG_BASE_PATH}/rolebinding`,
    data
  })
}

/**
 * 获取 RoleBinding 列表
 * @param params 查询参数
 * @returns RoleBinding列表
 */
export async function getRoleBindingListApi(params: ClusterNamespaceRequest) {
  return request.get<RoleBindingListResponse>({
    url: `${CONFIG_BASE_PATH}/rolebinding`,
    params
  })
}

/**
 * 获取 RoleBinding YAML
 * @param params 查询参数
 * @returns YAML字符串
 */
export async function getRoleBindingYamlApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/rolebinding/yaml`,
    params
  })
}

/**
 * 更新 RoleBinding
 * @param data 更新参数
 * @returns 操作结果
 */
export async function updateRoleBindingApi(data: ClusterNamespaceResourceUpdateRequest) {
  return request.put<string>({
    url: `${CONFIG_BASE_PATH}/rolebinding`,
    data
  })
}

/**
 * 删除 RoleBinding
 * @param params 删除参数
 * @returns 操作结果
 */
export async function deleteRoleBindingApi(params: ClusterNamespaceResourceRequest) {
  return request.del<string>({
    url: `${CONFIG_BASE_PATH}/rolebinding`,
    params
  })
}

/**
 * 获取 RoleBinding 详细描述
 * @param params 查询参数
 * @returns RoleBinding描述信息
 */
export async function getRoleBindingDescribeApi(params: ClusterNamespaceResourceRequest) {
  return request.get<string>({
    url: `${CONFIG_BASE_PATH}/rolebinding/describe`,
    params
  })
}

/**
 * 获取 RoleBinding 关联信息
 * @param params 查询参数
 * @returns RoleBinding关联信息
 */
export async function getRoleBindingAssociationApi(params: ClusterNamespaceResourceRequest) {
  return request.get<RoleBindingAssociation>({
    url: `${CONFIG_BASE_PATH}/rolebinding/association`,
    params
  })
}
