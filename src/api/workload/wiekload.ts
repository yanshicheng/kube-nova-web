import request from '@/utils/http'

// 定义基础路径
const RESOURCE_BASE_PATH = '/workload/v1/resource'

// ========== 类型定义 ==========

/** 容器信息 */
export interface ContainerInfo {
  name: string
  image: string
}

/** 容器信息列表 */
export interface ContainerInfoList {
  initContainers: ContainerInfo[]
  containers: ContainerInfo[]
  ephemeralContainers?: ContainerInfo[]
}

/** 调整资源副本数请求 */
export interface ScaleResourceRequest {
  replicas: number
}

/** 更新单个镜像请求 */
export interface UpdateImageRequest {
  containerName: string
  image: string
}

/** 更新多个镜像请求 */
export interface UpdateImagesRequest {
  containerInfoList: ContainerInfoList
}

/** 版本历史信息（Deployment 专用） */
export interface RevisionInfo {
  revision: number
  creationTimestamp: number
  images: string[]
  replicas: number
  reason: string
}

/** 配置历史记录（StatefulSet/DaemonSet 使用） */
export interface ConfigHistoryInfo {
  id: number
  revision: number
  images: string[]
  createdAt: number
  updatedBy: string
  reason: string
  specPreview: string
  isCurrent: boolean
}

/** 注入临时容器请求 */
export interface InjectEphemeralContainerRequest {
  podName: string
  containerName?: string
  image?: string
  command?: string[]
  args?: string[]
}

/** 通过 clusterUuid 获取 Pod YAML 请求 */
export interface GetPodYamlWithClusterUuidRequest {
  clusterUuid: string
  namespace: string
  podName: string
}

/** 通过 clusterUuid 获取 Pod 详情请求 */
export interface GetPodDetailWithClusterUuidRequest {
  clusterUuid: string
  namespace: string
  podName: string
}

/** 通过 clusterUuid 注入临时容器请求 */
export interface InjectEphemeralContainerWithClusterUuidRequest {
  clusterUuid: string
  namespace: string
  podName: string
  containerName?: string
  image?: string
  command?: string[]
  args?: string[]
}

/** Pod 资源列表 */
export interface PodResourceList {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
  node: string
  podIP: string
  labels: Record<string, string>
  creationTime: number
  containers: ContainerInfoList
}

/** 默认 Pod 名称请求 */
export interface DefaultPodNameRequest {
  podName: string
}

// ==================== 滚动更新策略相关 ====================

/** 滚动更新配置 */
export interface RollingUpdateConfig {
  maxUnavailable?: string
  maxSurge?: string
  partition?: number
}

/** 更新策略响应 */
export interface UpdateStrategyResponse {
  type: string
  rollingUpdate?: RollingUpdateConfig
}

/** 更新策略请求 */
export interface UpdateStrategyRequest {
  type: string // RollingUpdate, Recreate, OnDelete
  rollingUpdate?: RollingUpdateConfig
}

// ==================== 回滚相关 ====================

/** 回滚到指定版本请求（Deployment） */
export interface RollbackToRevisionRequest {
  revision: number
}

/** 回滚到历史配置请求（StatefulSet/DaemonSet） */
export interface RollbackToConfigRequest {
  configHistoryId: number
}

// ==================== 环境变量相关 ====================

/** ConfigMap Key 选择器 */
export interface ConfigMapKeySelector {
  name: string
  key: string
  optional: boolean
}

/** Secret Key 选择器 */
export interface SecretKeySelector {
  name: string
  key: string
  optional: boolean
}

/** 对象字段选择器 */
export interface ObjectFieldSelector {
  fieldPath: string
}

/** 资源字段选择器 */
export interface ResourceFieldSelector {
  containerName?: string
  resource: string
  divisor?: string
}

/** 环境变量值来源 */
export interface EnvVarSource {
  type: string // value, configMapKeyRef, secretKeyRef, fieldRef, resourceFieldRef
  value?: string
  configMapKeyRef?: ConfigMapKeySelector
  secretKeyRef?: SecretKeySelector
  fieldRef?: ObjectFieldSelector
  resourceFieldRef?: ResourceFieldSelector
}

/** 环境变量定义 */
export interface EnvVar {
  name: string
  source: EnvVarSource
}

/** 容器环境变量列表 */
export interface ContainerEnvVars {
  containerName: string
  env: EnvVar[]
}

/** 查询环境变量响应 */
export interface EnvVarsResponse {
  containers: ContainerEnvVars[]
}

/** 修改环境变量请求 */
export interface UpdateEnvVarsRequest {
  containerName: string
  env: EnvVar[]
}

// ==================== 暂停/恢复更新 ====================

/** 暂停/恢复状态响应 */
export interface PauseStatusResponse {
  paused: boolean
  supportType: string // pause(Deployment), suspend(Job/CronJob), none
}

// ==================== 资源配额相关 ====================

/** 资源列表 */
export interface ResourceList {
  cpu?: string
  memory?: string
}

/** 资源需求 */
export interface ResourceRequirements {
  limits?: ResourceList
  requests?: ResourceList
}

/** 容器资源配额 */
export interface ContainerResources {
  containerName: string
  resources: ResourceRequirements
}

/** 查询资源配额响应 */
export interface ResourcesResponse {
  containers: ContainerResources[]
}

/** 修改资源配额请求 */
export interface UpdateResourcesRequest {
  containerName: string
  resources: ResourceRequirements
}

// ==================== 健康检查相关 ====================

/** HTTP Header */
export interface HTTPHeader {
  name: string
  value: string
}

/** HTTP 健康检查 */
export interface HTTPGetAction {
  path: string
  port: number
  host?: string
  scheme?: string // HTTP, HTTPS
  httpHeaders?: HTTPHeader[]
}

/** TCP 健康检查 */
export interface TCPSocketAction {
  port: number
  host?: string
}

/** 执行命令健康检查 */
export interface ExecAction {
  command: string[]
}

/** gRPC 健康检查 */
export interface GRPCAction {
  port: number
  service?: string
}

/** 健康检查探针 */
export interface Probe {
  type: string // httpGet, tcpSocket, exec, grpc
  httpGet?: HTTPGetAction
  tcpSocket?: TCPSocketAction
  exec?: ExecAction
  grpc?: GRPCAction
  initialDelaySeconds?: number
  timeoutSeconds?: number
  periodSeconds?: number
  successThreshold?: number
  failureThreshold?: number
}

/** 容器健康检查 */
export interface ContainerProbes {
  containerName: string
  livenessProbe?: Probe
  readinessProbe?: Probe
  startupProbe?: Probe
}

/** 查询健康检查响应 */
export interface ProbesResponse {
  containers: ContainerProbes[]
}

/** 修改健康检查请求 */
export interface UpdateProbesRequest {
  containerName: string
  livenessProbe?: Probe
  readinessProbe?: Probe
  startupProbe?: Probe
}

// ==================== Job 相关 ====================

/** Job 并行度配置 */
export interface JobParallelismConfig {
  parallelism: number
  completions: number
  backoffLimit: number
  activeDeadlineSeconds?: number
}

/** 修改 Job 并行度请求 */
export interface UpdateJobParallelismRequest {
  parallelism?: number
  completions?: number
  backoffLimit?: number
  activeDeadlineSeconds?: number
}

// ==================== CronJob 相关 ====================

/** CronJob 调度配置 */
export interface CronJobScheduleConfig {
  schedule: string
  timezone?: string
  concurrencyPolicy: string // Allow, Forbid, Replace
  suspend: boolean
  startingDeadlineSeconds?: number
  successfulJobsHistoryLimit: number
  failedJobsHistoryLimit: number
}

/** 修改 CronJob 调度配置请求 */
export interface UpdateCronJobScheduleRequest {
  schedule?: string
  timezone?: string
  concurrencyPolicy?: string
  startingDeadlineSeconds?: number
  successfulJobsHistoryLimit?: number
  failedJobsHistoryLimit?: number
}

/** CronJob 历史 Job 列表项 */
export interface CronJobHistoryItem {
  name: string // Job 名称
  status: string // 状态: Completed, Failed, Running, Suspended
  completions: number // 期望完成数
  succeeded: number // 已成功数
  active: number // 运行中数
  failed: number // 失败数
  startTime?: number // 开始时间（时间戳，秒）
  completionTime?: number // 完成时间（时间戳，秒）
  duration?: string // 持续时间（格式化字符串，如 "2m30s"）
  creationTimestamp: number // 创建时间（时间戳，秒）
}

/** CronJob 历史响应 */
export interface CronJobHistoryResponse {
  jobs: CronJobHistoryItem[]
}

// ==================== 调度配置相关 ====================

/** 标签选择器配置 */
export interface LabelSelectorConfig {
  matchLabels?: Record<string, string>
  matchExpressions?: LabelSelectorRequirementConfig[]
}

/** 标签选择器需求配置 */
export interface LabelSelectorRequirementConfig {
  key: string
  operator: string
  values?: string[]
}

/** 节点选择器需求配置 */
export interface NodeSelectorRequirementConfig {
  key: string
  operator: string
  values?: string[]
}

/** 节点选择器条件配置 */
export interface NodeSelectorTermConfig {
  matchExpressions?: NodeSelectorRequirementConfig[]
  matchFields?: NodeSelectorRequirementConfig[]
}

/** 节点选择器配置 */
export interface NodeSelectorConfig {
  nodeSelectorTerms: NodeSelectorTermConfig[]
}

/** 首选调度条件配置 */
export interface PreferredSchedulingTermConfig {
  weight: number
  preference: NodeSelectorTermConfig
}

/** 节点亲和性配置 */
export interface NodeAffinityConfig {
  requiredDuringSchedulingIgnoredDuringExecution?: NodeSelectorConfig
  preferredDuringSchedulingIgnoredDuringExecution?: PreferredSchedulingTermConfig[]
}

/** Pod 亲和性条件配置 */
export interface PodAffinityTermConfig {
  labelSelector?: LabelSelectorConfig
  namespaces?: string[]
  topologyKey: string
  namespaceSelector?: LabelSelectorConfig
}

/** 加权 Pod 亲和性条件配置 */
export interface WeightedPodAffinityTermConfig {
  weight: number
  podAffinityTerm: PodAffinityTermConfig
}

/** Pod 亲和性配置 */
export interface PodAffinityConfig {
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTermConfig[]
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTermConfig[]
}

/** Pod 反亲和性配置 */
export interface PodAntiAffinityConfig {
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTermConfig[]
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTermConfig[]
}

/** 亲和性配置 */
export interface AffinityConfig {
  nodeAffinity?: NodeAffinityConfig
  podAffinity?: PodAffinityConfig
  podAntiAffinity?: PodAntiAffinityConfig
}

/** 容忍配置 */
export interface TolerationConfig {
  key?: string
  operator?: string
  value?: string
  effect?: string
  tolerationSeconds?: number
}

/** 拓扑分布约束配置 */
export interface TopologySpreadConstraintConfig {
  maxSkew: number
  topologyKey: string
  whenUnsatisfiable: string
  labelSelector?: LabelSelectorConfig
  minDomains?: number
  nodeAffinityPolicy?: string
  nodeTaintsPolicy?: string
}

/** 调度配置 */
export interface SchedulingConfig {
  nodeSelector?: Record<string, string>
  nodeName?: string
  affinity?: AffinityConfig
  tolerations?: TolerationConfig[]
  topologySpreadConstraints?: TopologySpreadConstraintConfig[]
  schedulerName?: string
  priorityClassName?: string
  priority?: number
  runtimeClassName?: string
}

/** 修改调度配置请求 */
export interface UpdateSchedulingConfigRequest {
  nodeName?: string
  nodeSelector?: Record<string, string>
  affinity?: AffinityConfig
  tolerations?: TolerationConfig[]
  topologySpreadConstraints?: TopologySpreadConstraintConfig[]
  schedulerName?: string
  priorityClassName?: string
  priority?: number
  runtimeClassName?: string
}

// ==================== 存储配置相关 ====================

/** Key 到路径映射配置 */
export interface KeyToPathConfig {
  key: string
  path: string
  mode?: number
}

/** EmptyDir 卷配置 */
export interface EmptyDirVolumeConfig {
  medium?: string
  sizeLimit?: string
}

/** HostPath 卷配置 */
export interface HostPathVolumeConfig {
  path: string
  type?: string
}

/** ConfigMap 卷配置 */
export interface ConfigMapVolumeConfig {
  name: string
  items?: KeyToPathConfig[]
  defaultMode?: number
  optional?: boolean
}

/** Secret 卷配置 */
export interface SecretVolumeConfig {
  secretName: string
  items?: KeyToPathConfig[]
  defaultMode?: number
  optional?: boolean
}

/** PVC 卷配置 */
export interface PVCVolumeConfig {
  claimName: string
  readOnly?: boolean
}

/** NFS 卷配置 */
export interface NFSVolumeConfig {
  server: string
  path: string
  readOnly?: boolean
}

/** 卷配置 */
export interface VolumeConfig {
  name: string
  type: string
  emptyDir?: EmptyDirVolumeConfig
  hostPath?: HostPathVolumeConfig
  configMap?: ConfigMapVolumeConfig
  secret?: SecretVolumeConfig
  persistentVolumeClaim?: PVCVolumeConfig
  nfs?: NFSVolumeConfig
}

/** 卷挂载 */
export interface VolumeMount {
  name: string
  mountPath: string
  subPath?: string
  subPathExpr?: string
  readOnly?: boolean
  mountPropagation?: string
}

/** 卷挂载配置 */
export interface VolumeMountConfig {
  containerName: string
  mounts: VolumeMount[]
}

/** 存储资源列表 */
export interface StorageResourceList {
  storage: string
}

/** 持久卷声明资源 */
export interface PersistentVolumeClaimResources {
  requests: StorageResourceList
  limits?: StorageResourceList
}

/** 持久卷声明配置 */
export interface PersistentVolumeClaimConfig {
  name: string
  storageClassName?: string
  accessModes: string[]
  resources: PersistentVolumeClaimResources
  volumeMode?: string
  selector?: LabelSelectorConfig
}

/** 存储配置 */
export interface StorageConfig {
  volumes?: VolumeConfig[]
  volumeMounts?: VolumeMountConfig[]
  volumeClaimTemplates?: PersistentVolumeClaimConfig[]
}

/** 修改存储配置请求 */
export interface UpdateStorageConfigRequest {
  volumes?: VolumeConfig[]
  volumeMounts?: VolumeMountConfig[]
  volumeClaimTemplates?: PersistentVolumeClaimConfig[]
}

// ==================== 事件相关 ====================

/** 事件信息 */
export interface EventInfo {
  type: string
  reason: string
  message: string
  count: number
  firstTimestamp: number
  lastTimestamp: number
  source: string
  involvedObjectKind: string
  involvedObjectName: string
  involvedObjectUid: string
  reportingComponent: string
  reportingInstance: string
  action: string
  eventTime: number
}

/** 事件列表响应 */
export interface EventsListResponse {
  items: EventInfo[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 事件查询请求参数 */
export interface EventsQueryParams {
  namespace?: string
  involvedObjectKind?: string
  involvedObjectName?: string
  involvedObjectUid?: string
  type?: string
  page?: number
  pageSize?: number
}

/** Pod 事件查询参数 */
export interface PodEventsQueryParams {
  page?: number
  pageSize?: number
}

/** 命名空间事件查询参数 */
export interface NamespaceEventsQueryParams {
  page?: number
  pageSize?: number
}

// ========== API 接口 ==========

// ==================== 基础操作 ====================

/**
 * 获取 Pod 列表
 * @param id 资源ID
 * @returns Pod列表
 */
export async function getPodListApi(id: number) {
  return request.get<PodResourceList[]>({
    url: `${RESOURCE_BASE_PATH}/${id}/pods`
  })
}

/**
 * 获取 Pod containers 列表
 * @param id 资源ID
 * @param params Pod名称参数
 * @returns Pod containers 列表
 */
export async function getPodContainerListApi(id: number, params: { podName: string }) {
  return request.get<ContainerInfoList>({
    url: `${RESOURCE_BASE_PATH}/${id}/pod/containers`,
    params
  })
}

/**
 * 获取 Pod containers 列表
 * @param id 资源ID
 * @param params Pod名称参数
 * @returns Pod containers 列表
 */
export async function getPodContainerListInWorkloadApi(id: number, params: { podName: string }) {
  return request.get<ContainerInfoList>({
    url: `${RESOURCE_BASE_PATH}/workload/${id}/pod/containers`,
    params
  })
}
/**
 * 获取 Pod containers 列表
 * @param params 获取参数
 * @returns Pod containers 列表
 */
export async function GetPodContainersWithClusterNamespaceApi(params: {
  podName: string
  clusterUuid: string
  namespace: string
}) {
  return request.get<ContainerInfoList>({
    url: `${RESOURCE_BASE_PATH}/pod/containers-with-cluster-namespace`,
    params
  })
}

/**
 * 通过 clusterUuid 获取 Pod YAML
 * @param params 包含 clusterUuid, namespace, podName 的参数
 * @returns YAML字符串
 */
export async function getPodYamlWithClusterUuidApi(params: GetPodYamlWithClusterUuidRequest) {
  return request.get<string>({
    url: `${RESOURCE_BASE_PATH}/pod/yaml-with-cluster-uuid`,
    params
  })
}

/**
 * 通过 clusterUuid 获取 Pod 详情
 * @param params 包含 clusterUuid, namespace, podName 的参数
 * @returns Pod详情
 */
export async function getPodDetailWithClusterUuidApi(params: GetPodDetailWithClusterUuidRequest) {
  return request.get<string>({
    url: `${RESOURCE_BASE_PATH}/pod/detail-with-cluster-uuid`,
    params
  })
}

/**
 * 通过 clusterUuid 注入临时容器
 * @param data 注入临时容器请求参数（包含 clusterUuid, namespace, podName 等）
 * @returns 操作结果
 */
export async function injectEphemeralContainerWithClusterUuidApi(
  data: InjectEphemeralContainerWithClusterUuidRequest
) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/pod/inject-with-cluster-uuid`,
    data
  })
}

/**
 * 通过 clusterUuid 驱逐 Pod
 * @param data 包含 clusterUuid, namespace, podName 的参数
 * @returns 操作结果
 */
export async function evictPodWithClusterUuidApi(data: GetPodDetailWithClusterUuidRequest) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/pod/evict-with-cluster-uuid`,
    data
  })
}

/**
 * 通过 clusterUuid 删除 Pod
 * @param data 包含 clusterUuid, namespace, podName 的参数
 * @returns 操作结果
 */
export async function deletePodWithClusterUuidApi(data: GetPodDetailWithClusterUuidRequest) {
  return request.del<string>({
    url: `${RESOURCE_BASE_PATH}/pod/delete-with-cluster-uuid`,
    data
  })
}

/**
 * 停止资源
 * @param id 资源ID
 * @returns 操作结果
 */
export async function stopResourceApi(id: number) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/stop`
  })
}

/**
 * 启动资源
 * @param id 资源ID
 * @returns 操作结果
 */
export async function startResourceApi(id: number) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/start`
  })
}

/**
 * 重启资源
 * @param id 资源ID
 * @returns 操作结果
 */
export async function restartResourceApi(id: number) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/restart`
  })
}

/**
 * 获取资源YAML
 * @param id 资源ID
 * @returns YAML字符串
 */
export async function getResourceYamlApi(id: number) {
  return request.get<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/yaml`
  })
}

/**
 * 获取资源YAML
 * @param id 资源版本ID
 * @returns YAML字符串
 */
// 获取资源的 详情yaml
export async function getResourceDetailYamlApi(id: number) {
  return request.get<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/detail`
  })
}
/**
 * 查询 Pod 详情
 * @param id 资源ID
 * @param params Pod名称参数
 * @returns Pod详情
 */
export async function getPodDetailApi(id: number, params: { podName: string }) {
  return request.get<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/pod/detail`,
    params
  })
}

/**
 * 获取 Pod YAML
 * @param id 资源ID
 * @param params Pod名称参数
 * @returns YAML字符串
 */
export async function getPodYamlApi(id: number, params: { podName: string }) {
  return request.get<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/pod/yaml`,
    params
  })
}

/**
 * 注入临时容器（用于调试）
 * @param id 资源ID
 * @param data 注入临时容器请求参数
 * @returns 操作结果
 */
export async function injectEphemeralContainerApi(
  id: number,
  data: InjectEphemeralContainerRequest
) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/pod/inject`,
    data
  })
}

/**
 * Pod 驱逐
 * @param id 资源ID
 * @param data Pod名称请求
 * @returns 操作结果
 */
export async function evictPodApi(id: number, data: DefaultPodNameRequest) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/pod/evict`,
    data
  })
}

/**
 * 删除 Pod
 * @param id 资源ID
 * @param data Pod名称请求
 * @returns 操作结果
 */
export async function deletePodApi(id: number, data: DefaultPodNameRequest) {
  return request.del<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/pod`,
    data
  })
}

// ==================== 镜像相关 ====================

/**
 * 查询资源使用的镜像
 * @param id 资源ID
 * @returns 容器镜像信息列表
 */
export async function getResourceImagesApi(id: number) {
  return request.get<ContainerInfoList>({
    url: `${RESOURCE_BASE_PATH}/${id}/images`
  })
}

/**
 * 更新资源镜像（单个）
 * @param id 资源ID
 * @param data 更新镜像请求参数
 * @returns 操作结果
 */
export async function updateImageApi(id: number, data: UpdateImageRequest) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/image`,
    data
  })
}

/**
 * 更新多个镜像
 * @param id 资源ID
 * @param data 更新多个镜像请求参数
 * @returns 操作结果
 */
export async function updateImagesApi(id: number, data: UpdateImagesRequest) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/images`,
    data
  })
}

// ==================== 副本数调整 ====================

/**
 * 查询资源副本数
 * @param id 资源ID
 * @returns 副本数
 */
export async function getResourceReplicasApi(id: number) {
  return request.get<number>({
    url: `${RESOURCE_BASE_PATH}/${id}/replicas`
  })
}

/**
 * 调整资源副本数
 * @param id 资源ID
 * @param data 调整副本数请求参数
 * @returns 操作结果
 */
export async function scaleResourceApi(id: number, data: ScaleResourceRequest) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/replicas`,
    data
  })
}

// ==================== 滚动更新策略 ====================

/**
 * 查询资源滚动更新策略
 * @param id 资源ID
 * @returns 更新策略信息
 */
export async function getUpdateStrategyApi(id: number) {
  return request.get<UpdateStrategyResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/update-strategy`
  })
}

/**
 * 修改资源滚动更新策略
 * @param id 资源ID
 * @param data 更新策略请求参数
 * @returns 操作结果
 */
export async function updateUpdateStrategyApi(id: number, data: UpdateStrategyRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/update-strategy`,
    data
  })
}

// ==================== 版本历史与回滚 ====================

/**
 * 获取版本历史（Deployment）
 * @param id 资源ID
 * @returns 历史版本列表
 */
export async function getResourceHistoryApi(id: number) {
  return request.get<RevisionInfo[]>({
    url: `${RESOURCE_BASE_PATH}/${id}/history`
  })
}

/**
 * 获取配置历史（StatefulSet/DaemonSet）
 * @param id 资源ID
 * @returns 配置历史列表
 */
export async function getConfigHistoryApi(id: number) {
  return request.get<ConfigHistoryInfo[]>({
    url: `${RESOURCE_BASE_PATH}/${id}/config-history`
  })
}

/**
 * 回滚到指定版本（Deployment）
 * @param id 资源ID
 * @param data 回滚请求参数
 * @returns 操作结果
 */
export async function rollbackToRevisionApi(id: number, data: RollbackToRevisionRequest) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/rollback`,
    data
  })
}

/**
 * 回滚到历史配置（StatefulSet/DaemonSet）
 * @param id 资源ID
 * @param data 回滚请求参数
 * @returns 操作结果
 */
export async function rollbackToConfigApi(id: number, data: RollbackToConfigRequest) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/rollback-config`,
    data
  })
}

// ==================== 环境变量管理 ====================

/**
 * 查询环境变量
 * @param id 资源ID
 * @returns 环境变量信息
 */
export async function getEnvVarsApi(id: number) {
  return request.get<EnvVarsResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/env`
  })
}

/**
 * 修改环境变量
 * @param id 资源ID
 * @param data 环境变量请求参数
 * @returns 操作结果
 */
export async function updateEnvVarsApi(id: number, data: UpdateEnvVarsRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/env`,
    data
  })
}

// ==================== 暂停/恢复更新 ====================

/**
 * 查询暂停状态
 * @param id 资源ID
 * @returns 暂停状态信息
 */
export async function getPauseStatusApi(id: number) {
  return request.get<PauseStatusResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/pause-status`
  })
}

/**
 * 暂停更新
 * @param id 资源ID
 * @returns 操作结果
 */
export async function pauseResourceApi(id: number) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/pause`
  })
}

/**
 * 恢复更新
 * @param id 资源ID
 * @returns 操作结果
 */
export async function resumeResourceApi(id: number) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/resume`
  })
}

// ==================== 资源配额管理 ====================

/**
 * 查询资源配额
 * @param id 资源ID
 * @returns 资源配额信息
 */
export async function getResourceQuotaApi(id: number) {
  return request.get<ResourcesResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/resources`
  })
}

/**
 * 修改资源配额
 * @param id 资源ID
 * @param data 资源配额请求参数
 * @returns 操作结果
 */
export async function updateResourceQuotaApi(id: number, data: UpdateResourcesRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/resources`,
    data
  })
}

// ==================== 健康检查管理 ====================

/**
 * 查询健康检查配置
 * @param id 资源ID
 * @returns 健康检查配置信息
 */
export async function getProbesApi(id: number) {
  return request.get<ProbesResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/probes`
  })
}

/**
 * 修改健康检查配置
 * @param id 资源ID
 * @param data 健康检查请求参数
 * @returns 操作结果
 */
export async function updateProbesApi(id: number, data: UpdateProbesRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/probes`,
    data
  })
}

// ==================== 调度配置管理 ====================

/**
 * 查询调度配置
 * @param id 资源ID
 * @returns 调度配置信息
 */
export async function getSchedulingConfigApi(id: number) {
  return request.get<SchedulingConfig>({
    url: `${RESOURCE_BASE_PATH}/${id}/scheduling`
  })
}

/**
 * 修改调度配置
 * @param id 资源ID
 * @param data 调度配置请求参数
 * @returns 操作结果
 */
export async function updateSchedulingConfigApi(id: number, data: UpdateSchedulingConfigRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/scheduling`,
    data
  })
}

// ==================== 存储配置管理 ====================

/**
 * 查询存储配置
 * @param id 资源ID
 * @returns 存储配置信息
 */
export async function getStorageConfigApi(id: number) {
  return request.get<StorageConfig>({
    url: `${RESOURCE_BASE_PATH}/${id}/storage`
  })
}

/**
 * 修改存储配置
 * @param id 资源ID
 * @param data 存储配置请求参数
 * @returns 操作结果
 */
export async function updateStorageConfigApi(id: number, data: UpdateStorageConfigRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/storage`,
    data
  })
}

// ==================== Job 特有操作 ====================

/**
 * 手动运行一次（Job）
 * @param id 资源ID
 * @returns 操作结果
 */
export async function runJobOnceApi(id: number) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/run-once`
  })
}

/**
 * 查询 Job 并行度配置
 * @param id 资源ID
 * @returns Job 并行度配置
 */
export async function getJobParallelismApi(id: number) {
  return request.get<JobParallelismConfig>({
    url: `${RESOURCE_BASE_PATH}/${id}/parallelism`
  })
}

/**
 * 修改 Job 并行度配置
 * @param id 资源ID
 * @param data Job 并行度请求参数
 * @returns 操作结果
 */
export async function updateJobParallelismApi(id: number, data: UpdateJobParallelismRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/parallelism`,
    data
  })
}

// ==================== CronJob 特有操作 ====================

/**
 * 查询 CronJob 历史 Job 列表
 * @param id 资源ID
 * @returns CronJob 历史列表
 */
export async function getCronJobHistoryApi(id: number) {
  return request.get<CronJobHistoryResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/cronjob-history`
  })
}

/**
 * 查询 CronJob 调度配置
 * @param id 资源ID
 * @returns CronJob 调度配置
 */
export async function getCronJobScheduleApi(id: number) {
  return request.get<CronJobScheduleConfig>({
    url: `${RESOURCE_BASE_PATH}/${id}/schedule`
  })
}

/**
 * 修改 CronJob 调度配置
 * @param id 资源ID
 * @param data CronJob 调度配置请求参数
 * @returns 操作结果
 */
export async function updateCronJobScheduleApi(id: number, data: UpdateCronJobScheduleRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/schedule`,
    data
  })
}

/**
 * 手动触发一次（CronJob）
 * @param id 资源ID
 * @returns 操作结果
 */
export async function triggerCronJobApi(id: number) {
  return request.post<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/trigger`
  })
}

// ==================== 事件相关 ====================

/**
 * 查询资源事件
 * @param id 资源ID
 * @param params 事件查询参数
 * @returns 事件列表响应
 */
export async function queryEventsApi(id: number, params?: EventsQueryParams) {
  return request.get<EventsListResponse>({
    url: `${RESOURCE_BASE_PATH}/events/${id}/query`,
    params
  })
}

/**
 * 获取 Pod 事件
 * @param id 资源ID
 * @param podName Pod名称
 * @param params 查询参数
 * @returns 事件列表响应
 */
export async function getPodEventsApi(id: number, podName: string, params?: PodEventsQueryParams) {
  return request.get<EventsListResponse>({
    url: `${RESOURCE_BASE_PATH}/events/pod/${id}/${podName}`,
    params
  })
}

/**
 * 获取命名空间事件
 * @param id 资源ID
 * @param params 查询参数
 * @returns 事件列表响应
 */
export async function getNamespaceEventsApi(id: number, params?: NamespaceEventsQueryParams) {
  return request.get<EventsListResponse>({
    url: `${RESOURCE_BASE_PATH}/events/namespace/${id}`,
    params
  })
}

// ========== 枚举定义 ==========

/**
 * 事件类型枚举
 */
export enum EventType {
  NORMAL = 'Normal',
  WARNING = 'Warning'
}

/**
 * Pod 状态枚举
 */
export enum PodStatus {
  PENDING = 'Pending',
  RUNNING = 'Running',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown'
}

/**
 * 更新策略类型枚举
 */
export enum UpdateStrategyType {
  ROLLING_UPDATE = 'RollingUpdate',
  RECREATE = 'Recreate',
  ON_DELETE = 'OnDelete'
}

/**
 * 探针类型枚举
 */
export enum ProbeType {
  HTTP_GET = 'httpGet',
  TCP_SOCKET = 'tcpSocket',
  EXEC = 'exec',
  GRPC = 'grpc'
}

/**
 * 环境变量来源类型枚举
 */
export enum EnvVarSourceType {
  VALUE = 'value',
  CONFIG_MAP_KEY_REF = 'configMapKeyRef',
  SECRET_KEY_REF = 'secretKeyRef',
  FIELD_REF = 'fieldRef',
  RESOURCE_FIELD_REF = 'resourceFieldRef'
}

/**
 * CronJob 并发策略枚举
 */
export enum ConcurrencyPolicy {
  ALLOW = 'Allow',
  FORBID = 'Forbid',
  REPLACE = 'Replace'
}

/**
 * Job 状态枚举
 */
export enum JobStatus {
  COMPLETE = 'Complete',
  FAILED = 'Failed',
  RUNNING = 'Running'
}

/** Pod Labels 响应 */
export interface PodLabelsResponse {
  labels: Record<string, string>
}

// ========== API 接口 ========== 部分添加

/**
 * 获取资源的 labels
 * @param id 资源ID
 * @returns 标签信息
 */
export async function getResourceLabelsApi(id: number) {
  return request.get<PodLabelsResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/labels`
  })
}

/** CronJob Job 详情查询请求 */
export interface GetCronJobJobDetailsRequest {
  jobName: string
}

/** 删除 CronJob Job 请求 */
export interface DeleteCronJobJobRequest {
  jobName: string
}

// 在 CronJob 特有操作部分添加以下两个接口：

/**
 * 查询 CronJob Job 详情（YAML）
 * @param id CronJob 资源ID
 * @param jobName Job名称
 * @returns Job 详情 YAML
 */
export async function getCronJobJobDetailsApi(id: number, jobName: string) {
  return request.get<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/cronjob-job/job-details`,
    params: { jobName }
  })
}

/**
 * 删除 CronJob Job
 * @param id CronJob 资源ID
 * @param jobName Job名称
 * @returns 操作结果
 */
export async function deleteCronJobJobApi(id: number, jobName: string) {
  return request.del<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/cronjob-job/job`,
    params: { jobName }
  })
}

// ==================== Job Spec 配置相关类型定义 ====================

/** Pod 失败策略退出码要求 */
export interface PodFailurePolicyOnExitCodesRequirement {
  containerName?: string // 容器名称，为空表示所有容器
  operator: string // In, NotIn
  values: number[] // 退出码列表
}

/** Pod 失败策略条件模式 */
export interface PodFailurePolicyOnPodConditionsPattern {
  type: string // Pod 条件类型
  status: string // 条件状态
}

/** Pod 失败策略规则 */
export interface PodFailurePolicyRule {
  action: string // FailJob, Ignore, Count, FailIndex
  onExitCodes?: PodFailurePolicyOnExitCodesRequirement
  onPodConditions?: PodFailurePolicyOnPodConditionsPattern[]
}

/** Pod 失败策略配置 */
export interface PodFailurePolicyConfig {
  rules: PodFailurePolicyRule[]
}

/** Job Spec 完整配置 */
export interface JobSpecConfig {
  // 基础配置（K8s 1.0+）
  parallelism?: number // 并行度
  completions?: number // 完成数
  backoffLimit?: number // 失败重试次数
  activeDeadlineSeconds?: number // 活跃截止时间
  ttlSecondsAfterFinished?: number // 完成后保留时间（K8s 1.12+）

  // 完成模式（K8s 1.21+）
  completionMode: string // NonIndexed, Indexed

  // Job 暂停（K8s 1.21+）
  suspend: boolean // Job 是否暂停

  // Pod 替换策略（K8s 1.28+）
  podReplacementPolicy: string // TerminatingOrFailed, Failed

  // Indexed 模式专用（K8s 1.28+）
  backoffLimitPerIndex?: number // 每索引失败限制
  maxFailedIndexes?: number // 最大失败索引数

  // Pod 失败策略（K8s 1.25+）
  podFailurePolicy?: PodFailurePolicyConfig
}

/** 更新 Job Spec 请求 */
export interface UpdateJobSpecRequest {
  parallelism?: number
  completions?: number
  backoffLimit?: number
  activeDeadlineSeconds?: number
  ttlSecondsAfterFinished?: number
  completionMode?: string
  suspend?: boolean
  podReplacementPolicy?: string
  backoffLimitPerIndex?: number
  maxFailedIndexes?: number
  podFailurePolicy?: PodFailurePolicyConfig
}

// ==================== 下次执行时间相关类型定义 ====================

/** 下次调度时间响应 */
export interface NextScheduleTimeResponse {
  nextScheduleTime?: number // 下次调度时间（Unix 时间戳，毫秒）
  schedule: string // Cron 表达式
  timezone?: string // 时区
  isSuspended: boolean // 是否已挂起
  currentTime: number // 当前时间（Unix 时间戳，毫秒）
}

// ==================== API 接口方法 ====================

/**
 * 获取 CronJob Job Spec 配置
 * @param id 资源ID
 * @returns Job Spec 配置
 */
export async function getJobSpecApi(id: number) {
  return request.get<JobSpecConfig>({
    url: `${RESOURCE_BASE_PATH}/${id}/job-spec`
  })
}

/**
 * 更新 CronJob Job Spec 配置
 * @param id 资源ID
 * @param data 更新 Job Spec 请求参数
 * @returns 操作结果
 */
export async function updateJobSpecApi(id: number, data: UpdateJobSpecRequest) {
  return request.put<string>({
    url: `${RESOURCE_BASE_PATH}/${id}/job-spec`,
    data
  })
}

/**
 * 获取 CronJob 下次执行时间
 * @param id 资源ID
 * @returns 下次调度时间信息
 */
export async function getNextScheduleTimeApi(id: number) {
  return request.get<NextScheduleTimeResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/next-schedule-time`
  })
}

// ==================== 枚举定义 ====================

/**
 * Job 完成模式枚举
 */
export enum JobCompletionMode {
  NON_INDEXED = 'NonIndexed',
  INDEXED = 'Indexed'
}

/**
 * Pod 替换策略枚举
 */
export enum PodReplacementPolicy {
  TERMINATING_OR_FAILED = 'TerminatingOrFailed',
  FAILED = 'Failed'
}

/**
 * Pod 失败策略动作枚举
 */
export enum PodFailurePolicyAction {
  FAIL_JOB = 'FailJob',
  IGNORE = 'Ignore',
  COUNT = 'Count',
  FAIL_INDEX = 'FailIndex'
}

/**
 * Pod 失败策略操作符枚举
 */
export enum PodFailurePolicyOperator {
  IN = 'In',
  NOT_IN = 'NotIn'
}

// ==================== 通用列表查询参数 ====================

/** 通用列表查询参数 */
export interface ListQueryParams {
  namespace?: string
  page?: number
  pageSize?: number
  search?: string // 搜索关键字（支持名称模糊匹配）
  labels?: string // 标签选择器，如 "env=prod,tier=frontend"
  sortBy?: string // 排序字段: name, creationTime, status
  sortDesc?: boolean // 是否降序排序
}

/** 通用分页响应基类 */
export interface PaginationResponse {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== Job 列表相关 ====================

/** Job 信息 */
export interface JobInfo {
  name: string
  namespace: string
  completions: number // 期望完成的 Pod 数
  parallelism: number // 并行运行的 Pod 数
  succeeded: number // 成功完成的 Pod 数
  failed: number // 失败的 Pod 数
  active: number // 运行中的 Pod 数
  startTime?: number // Unix 时间戳（秒）
  completionTime?: number // Unix 时间戳（秒）
  duration: string // 运行时长
  status: string // Running, Completed, Failed, Suspended
  creationTimestamp: number // Unix 时间戳（秒）
}

/** Job 列表响应 */
export interface ListJobsResponse extends PaginationResponse {
  items: JobInfo[]
}

// ==================== Pod 详细列表相关 ====================

/** Pod 详细信息 */
export interface PodDetailInfo {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
  node: string
  podIP: string
  labels: Record<string, string>
  creationTime: number // Unix 时间戳（毫秒）
}

/** Pod 列表响应（带分页） */
export interface ListPodsWithPaginationResponse extends PaginationResponse {
  items: PodDetailInfo[]
}

/**
 * 获取 Job 列表（带分页、过滤、排序）
 * @param id 资源ID
 * @param params 查询参数
 * @returns Job列表响应
 */
export async function listJobsApi(id: number, params?: ListQueryParams) {
  return request.get<ListJobsResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/jobs`,
    params
  })
}

/**
 * 获取 Pod 列表（带分页、过滤、排序）
 * @param id 资源ID
 * @param params 查询参数
 * @returns Pod列表响应
 */
export async function listPodsWithPaginationApi(id: number, params?: ListQueryParams) {
  return request.get<ListPodsWithPaginationResponse>({
    url: `${RESOURCE_BASE_PATH}/${id}/pods-list`,
    params
  })
}

/** 获取 Job Pod 列表请求 */
export interface GetJobPodListRequest {
  jobName: string
}

/**
 * 获取指定 Job 的 Pod 列表
 * @param id 资源ID
 * @param params Job名称参数
 * @returns Job的Pod列表
 */
export async function listJobPodsApi(id: number, params: { jobName: string }) {
  return request.get<PodResourceList[]>({
    url: `${RESOURCE_BASE_PATH}/${id}/job-pods`,
    params
  })
}

// ==================== 应用摘要相关 ====================

/** Service 访问汇总 */
export interface ApplicationAccessSummary {
  internalAccessList: string[] // 内部访问域名列表（ClusterIP）
  externalAccessList: string[] // 外部访问域名列表（LoadBalancer）
  nodePortList: string[] // NodePort 访问列表
}

/** 应用摘要（工作负载资源摘要） */
export interface ApplicationSummary {
  podCount: number // Pod 总数
  abnormalPodCount: number // 异常 Pod 数量
  serviceCount: number // 关联的 Service 数量
  ingressCount: number // 关联的 Ingress 数量
  service: ApplicationAccessSummary // Service 访问汇总
  ingressDomains: string[] // Ingress 域名列表
}

/** 获取应用摘要请求参数 */
export interface GetApplicationSummaryParams {
  clusterUuid: string
  namespace: string
}

// ==================== API 接口方法 ====================

/**
 * 获取应用摘要
 * @param applicationId 应用ID
 * @param params 查询参数（集群UUID和命名空间）
 * @returns 应用摘要信息
 */
export async function getApplicationSummaryApi(
  applicationId: number,
  params: GetApplicationSummaryParams
) {
  return request.get<ApplicationSummary>({
    url: `${RESOURCE_BASE_PATH}/${applicationId}/summary`,
    params
  })
}
