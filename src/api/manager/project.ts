import request from '@/utils/http'

// 定义基础路径
const PROJECT_BASE_PATH = '/manager/v1/project'

// ========== 类型定义 ==========
/** 项目信息 */
export interface Project {
  id: number // 主键ID
  name: string // 项目中文名称
  uuid: string // 项目唯一标识（英文）
  description: string // 项目描述信息
  isSystem: number // 是否为系统级别项目
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 记录创建时间
  updatedAt: number // 记录更新时间
  adminCount: number // 管理员数量
  resourceCount: number // 资源数量
}

/** 添加项目请求 */
export interface AddProjectRequest {
  name: string // 项目名称
  description?: string // 项目描述
  isSystem?: number // 是否系统项目（0或1）
}

/** 更新项目请求 */
export interface UpdateProjectRequest {
  name: string // 项目名称
  description?: string // 项目描述
}

/** 搜索项目请求 */
export interface SearchProjectRequest {
  page?: number // 页码
  pageSize?: number // 每页数量
  name?: string // 项目名称（模糊搜索）
  uuid?: string // 项目UUID
}

/** 搜索项目响应 */
export interface SearchProjectResponse {
  items: Project[] // 项目列表
  total: number // 总数
}

/** 项目管理员信息 */
export interface ProjectAdmin {
  id: number // 主键ID
  projectId: number // 关联的项目ID
  userId: number // 关联的用户ID
  createdAt: number // 记录创建时间
}

/** 项目集群配额信息 */
export interface ProjectCluster {
  id: number // 主键ID
  clusterUuid: string // 关联的集群UUID
  clusterName: string // 集群名称
  projectId: number // 关联的项目ID
  cpuLimit: number // 上级分配的CPU配额（核心数）
  cpuOvercommitRatio: number // CPU超分比例
  cpuCapacity: number // CPU超分后总容量 (limit * overcommit_ratio)
  cpuAllocated: number // 已分配给工作空间的CPU总量
  memLimit: number // 上级分配的内存配额（单位：GiB）
  memOvercommitRatio: number // 内存超分比例
  memCapacity: number // 内存超分后总容量 (limit * overcommit_ratio)
  memAllocated: number // 已分配给工作空间的内存总量
  storageLimit: number // 存储配额上限（单位：GiB）
  storageAllocated: number // 已分配给工作空间的存储总量
  gpuLimit: number // 上级分配的GPU配额（个数）
  gpuOvercommitRatio: number // GPU超分比例
  gpuCapacity: number // GPU超分后总容量 (limit * overcommit_ratio)
  gpuAllocated: number // 已分配给工作空间的GPU总量
  podsLimit: number // Pod配额上限
  podsAllocated: number // 已分配给工作空间的Pod总量
  configmapLimit: number // ConfigMap配额上限
  configmapAllocated: number // 已分配给工作空间的ConfigMap总量
  secretLimit: number // Secret配额上限
  secretAllocated: number // 已分配给工作空间的Secret总量
  pvcLimit: number // PVC配额上限
  pvcAllocated: number // 已分配给工作空间的PVC总量
  ephemeralStorageLimit: number // 临时存储配额上限（单位：GiB）
  ephemeralStorageAllocated: number // 已分配给工作空间的临时存储总量
  serviceLimit: number // Service配额上限
  serviceAllocated: number // 已分配给工作空间的Service总量
  loadbalancersLimit: number // LoadBalancer配额上限
  loadbalancersAllocated: number // 已分配给工作空间的LoadBalancer总量
  nodeportsLimit: number // NodePort配额上限
  nodeportsAllocated: number // 已分配给工作空间的NodePort总量
  deploymentsLimit: number // Deployment配额上限
  deploymentsAllocated: number // 已分配给工作空间的Deployment总量
  jobsLimit: number // Job配额上限
  jobsAllocated: number // 已分配给工作空间的Job总量
  cronjobsLimit: number // CronJob配额上限
  cronjobsAllocated: number // 已分配给工作空间的CronJob总量
  daemonsetsLimit: number // DaemonSet配额上限
  daemonsetsAllocated: number // 已分配给工作空间的DaemonSet总量
  statefulsetsLimit: number // StatefulSet配额上限
  statefulsetsAllocated: number // 已分配给工作空间的StatefulSet总量
  ingressesLimit: number // Ingress配额上限
  ingressesAllocated: number // 已分配给工作空间的Ingress总量
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 记录创建时间
  updatedAt: number // 记录更新时间
}

/** 项目工作空间信息 */
export interface ProjectWorkspace {
  id: number // 主键ID
  projectClusterId: number // 关联的项目集群ID
  clusterUuid: string // 集群UUID
  clusterName: string // 集群名称
  name: string // 工作空间中文名称
  namespace: string // Kubernetes命名空间
  description: string // 工作空间描述
  cpuAllocated: string // 分配的CPU核心数
  memAllocated: string // 分配的内存（GiB）
  storageAllocated: string // 分配的存储（GiB）
  gpuAllocated: string // 分配的GPU数量
  podsAllocated: number // 分配的Pod数量
  configmapAllocated: number // 分配的ConfigMap数量上限
  secretAllocated: number // 分配的Secret数量上限
  pvcAllocated: number // 分配的PVC数量上限
  ephemeralStorageAllocated: string // 分配的临时存储数量上限
  serviceAllocated: number // 分配的Service数量上限
  loadbalancersAllocated: number // 分配的LoadBalancer数量上限
  nodeportsAllocated: number // 分配的NodePort数量上限
  deploymentsAllocated: number // 分配的Deployment数量上限
  jobsAllocated: number // 分配的Job数量上限
  cronjobsAllocated: number // 分配的CronJob数量上限
  daemonsetsAllocated: number // 分配的DaemonSet数量上限
  statefulsetsAllocated: number // 分配的StatefulSet数量上限
  ingressesAllocated: number // 分配的Ingress数量上限
  podMaxCpu: string // Pod级别最大CPU限制（单位：核）
  podMaxMemory: string // Pod级别最大内存限制（单位：GiB）
  podMaxEphemeralStorage: string // Pod级别最大临时存储限制（单位：GiB）
  podMinCpu: string // Pod级别最小CPU请求（单位：核，支持毫核）
  podMinMemory: string // Pod级别最小内存请求（单位：MiB）
  podMinEphemeralStorage: string // Pod级别最小临时存储请求（单位：MiB）
  containerMaxCpu: string // Container级别最大CPU限制（单位：核）
  containerMaxMemory: string // Container级别最大内存限制（单位：GiB）
  containerMaxEphemeralStorage: string // Container级别最大临时存储限制（单位：GiB）
  containerMinCpu: string // Container级别最小CPU请求（单位：核，支持毫核）
  containerMinMemory: string // Container级别最小内存请求（单位：MiB）
  containerMinEphemeralStorage: string // Container级别最小临时存储请求（单位：MiB）
  containerDefaultCpu: string // Container默认CPU限制（单位：核）
  containerDefaultMemory: string // Container默认内存限制（单位：MiB）
  containerDefaultEphemeralStorage: string // Container默认临时存储限制（单位：GiB）
  containerDefaultRequestCpu: string // Container默认CPU请求（单位：核）
  containerDefaultRequestMemory: string // Container默认内存请求（单位：MiB）
  containerDefaultRequestEphemeralStorage: string // Container默认临时存储请求（单位：MiB）
  isSystem: number // 是否为系统级别项目，如果是则不需要资源限制
  status: number // namespace pod 全是正常则true 否则false 后台管理字段
  appCreateTime: number // 应用创建时间，标识该应用在业务系统中首次创建的时间
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 记录创建时间
  updatedAt: number // 记录更新时间
}

/** 添加项目管理员请求 */
export interface AddProjectAdminRequest {
  projectId: number // 项目ID
  userIds: number[] // 用户ID列表，最多100个
}

/** 获取项目管理员请求 */
export interface GetProjectAdminsRequest {
  projectId: number // 项目ID
}

/** 添加项目集群配额请求 */
export interface AddProjectClusterRequest {
  clusterUuid: string // 关联的集群UUID
  projectId: number // 关联的项目ID
  cpuLimit: number // 上级分配的CPU配额（核心数）
  cpuOvercommitRatio?: number // CPU超分比例
  cpuCapacity?: number // CPU超分后总容量
  memLimit: number // 上级分配的内存配额（单位：GiB）
  memOvercommitRatio?: number // 内存超分比例
  memCapacity?: number // 内存超分后总容量
  storageLimit?: number // 存储配额上限（单位：GiB）
  gpuLimit?: number // 上级分配的GPU配额（个数）
  gpuOvercommitRatio?: number // GPU超分比例
  gpuCapacity?: number // GPU超分后总容量
  podsLimit?: number // Pod配额上限
  configmapLimit?: number // ConfigMap配额上限
  secretLimit?: number // Secret配额上限
  pvcLimit?: number // PVC配额上限
  ephemeralStorageLimit?: number // 临时存储配额上限（单位：GiB）
  serviceLimit?: number // Service配额上限
  loadbalancersLimit?: number // LoadBalancer配额上限
  nodeportsLimit?: number // NodePort配额上限
  deploymentsLimit?: number // Deployment配额上限
  jobsLimit?: number // Job配额上限
  cronjobsLimit?: number // CronJob配额上限
  daemonsetsLimit?: number // DaemonSet配额上限
  statefulsetsLimit?: number // StatefulSet配额上限
  ingressesLimit?: number // Ingress配额上限
}

/** 更新项目集群配额请求 */
export interface UpdateProjectClusterRequest {
  cpuLimit: number // 上级分配的CPU配额（核心数）
  cpuOvercommitRatio?: number // CPU超分比例
  cpuCapacity?: number // CPU超分后总容量
  memLimit: number // 上级分配的内存配额（单位：GiB）
  memOvercommitRatio?: number // 内存超分比例
  memCapacity?: number // 内存超分后总容量
  storageLimit?: number // 存储配额上限（单位：GiB）
  gpuLimit?: number // 上级分配的GPU配额（个数）
  gpuOvercommitRatio?: number // GPU超分比例
  gpuCapacity?: number // GPU超分后总容量
  podsLimit?: number // Pod配额上限
  configmapLimit?: number // ConfigMap配额上限
  secretLimit?: number // Secret配额上限
  pvcLimit?: number // PVC配额上限
  ephemeralStorageLimit?: number // 临时存储配额上限（单位：GiB）
  serviceLimit?: number // Service配额上限
  loadbalancersLimit?: number // LoadBalancer配额上限
  nodeportsLimit?: number // NodePort配额上限
  deploymentsLimit?: number // Deployment配额上限
  jobsLimit?: number // Job配额上限
  cronjobsLimit?: number // CronJob配额上限
  daemonsetsLimit?: number // DaemonSet配额上限
  statefulsetsLimit?: number // StatefulSet配额上限
  ingressesLimit?: number // Ingress配额上限
}

/** 搜索项目集群配额请求 */
export interface SearchProjectClusterRequest {
  projectId: number // 项目ID（必传）
  clusterUuid?: string // 集群UUID（可选）
}

/** 添加项目工作空间请求 */
export interface AddProjectWorkspaceRequest {
  projectClusterId: number // 项目集群ID
  clusterUuid: string // 集群UUID
  name: string // 工作空间名称
  namespace: string // Kubernetes命名空间
  description?: string // 工作空间描述
  cpuAllocated: string // CPU核心数
  memAllocated: string // 内存（GiB）
  storageAllocated?: string // 存储（GiB）
  gpuAllocated?: string // GPU数量
  podsAllocated: number // Pod配额
  configmapAllocated?: number // ConfigMap配额
  secretAllocated?: number // Secret配额
  pvcAllocated?: number // PVC配额
  ephemeralStorageAllocated?: string // 临时存储配额
  serviceAllocated?: number // Service配额
  loadbalancersAllocated?: number // LoadBalancer配额
  nodeportsAllocated?: number // NodePort配额
  deploymentsAllocated?: number // Deployment配额
  jobsAllocated?: number // Job配额
  cronjobsAllocated?: number // CronJob配额
  daemonsetsAllocated?: number // DaemonSet配额
  statefulsetsAllocated?: number // StatefulSet配额
  ingressesAllocated?: number // Ingress配额
  podMaxCpu?: string // Pod最大CPU
  podMaxMemory?: string // Pod最大内存
  podMaxEphemeralStorage?: string // Pod最大临时存储
  podMinCpu?: string // Pod最小CPU
  podMinMemory?: string // Pod最小内存
  podMinEphemeralStorage?: string // Pod最小临时存储
  containerMaxCpu?: string // 容器最大CPU
  containerMaxMemory?: string // 容器最大内存
  containerMaxEphemeralStorage?: string // 容器最大临时存储
  containerMinCpu?: string // 容器最小CPU
  containerMinMemory?: string // 容器最小内存
  containerMinEphemeralStorage?: string // 容器最小临时存储
  containerDefaultCpu?: string // 容器默认CPU
  containerDefaultMemory?: string // 容器默认内存
  containerDefaultEphemeralStorage?: string // 容器默认临时存储
  containerDefaultRequestCpu?: string // 容器默认CPU请求
  containerDefaultRequestMemory?: string // 容器默认内存请求
  containerDefaultRequestEphemeralStorage?: string // 容器默认临时存储请求
}

/** 更新项目工作空间请求 */
export interface UpdateProjectWorkspaceRequest {
  name: string // 工作空间名称
  description?: string // 工作空间描述
  cpuAllocated: string // CPU核心数
  memAllocated: string // 内存（GiB）
  storageAllocated?: string // 存储（GiB）
  gpuAllocated?: string // GPU数量
  podsAllocated: number // Pod配额
  configmapAllocated?: number // ConfigMap配额
  secretAllocated?: number // Secret配额
  pvcAllocated?: number // PVC配额
  ephemeralStorageAllocated?: string // 临时存储配额
  serviceAllocated?: number // Service配额
  loadbalancersAllocated?: number // LoadBalancer配额
  nodeportsAllocated?: number // NodePort配额
  deploymentsAllocated?: number // Deployment配额
  jobsAllocated?: number // Job配额
  cronjobsAllocated?: number // CronJob配额
  daemonsetsAllocated?: number // DaemonSet配额
  statefulsetsAllocated?: number // StatefulSet配额
  ingressesAllocated?: number // Ingress配额
  podMaxCpu?: string // Pod最大CPU
  podMaxMemory?: string // Pod最大内存
  podMaxEphemeralStorage?: string // Pod最大临时存储
  podMinCpu?: string // Pod最小CPU
  podMinMemory?: string // Pod最小内存
  podMinEphemeralStorage?: string // Pod最小临时存储
  containerMaxCpu?: string // 容器最大CPU
  containerMaxMemory?: string // 容器最大内存
  containerMaxEphemeralStorage?: string // 容器最大临时存储
  containerMinCpu?: string // 容器最小CPU
  containerMinMemory?: string // 容器最小内存
  containerMinEphemeralStorage?: string // 容器最小临时存储
  containerDefaultCpu?: string // 容器默认CPU
  containerDefaultMemory?: string // 容器默认内存
  containerDefaultEphemeralStorage?: string // 容器默认临时存储
  containerDefaultRequestCpu?: string // 容器默认CPU请求
  containerDefaultRequestMemory?: string // 容器默认内存请求
  containerDefaultRequestEphemeralStorage?: string // 容器默认临时存储请求
}

/** 搜索项目工作空间请求 */
export interface SearchProjectWorkspaceRequest {
  projectClusterId: number // 项目集群ID（必传）
  name?: string // 工作空间名称（可选）
  namespace?: string // 命名空间（可选）
}

// ========== API 接口 ==========

// ============= 项目基础信息相关接口 =============

/**
 * 添加项目
 * @description 创建新项目
 * @param data 项目信息
 * @returns 操作结果消息
 */
export async function addProjectApi(data: AddProjectRequest) {
  return request.post<string>({
    url: `${PROJECT_BASE_PATH}`,
    data
  })
}

/**
 * 更新项目
 * @description 更新项目基本信息
 * @param id 项目ID
 * @param data 更新数据
 * @returns 操作结果消息
 */
export async function updateProjectApi(id: number, data: UpdateProjectRequest) {
  return request.put<string>({
    url: `${PROJECT_BASE_PATH}/${id}`,
    data
  })
}

/**
 * 删除项目
 * @description 软删除项目
 * @param id 项目ID
 * @returns 操作结果消息
 */
export async function deleteProjectApi(id: number) {
  return request.del<string>({
    url: `${PROJECT_BASE_PATH}/${id}`
  })
}

/**
 * 获取项目详情
 * @description 根据ID获取项目详细信息
 * @param id 项目ID
 * @returns 项目详细信息
 */
export async function getProjectApi(id: number) {
  return request.get<Project>({
    url: `${PROJECT_BASE_PATH}/${id}`
  })
}

/**
 * 根据用户ID获取项目列表
 * @description 获取某一个用户的所有项目
 * @param params 查询参数
 * @returns 项目列表
 */
export async function getProjectsByUserApi(params?: { name?: string }) {
  return request.get<Project[]>({
    url: `${PROJECT_BASE_PATH}/user`,
    params
  })
}

/**
 * 搜索项目
 * @description 搜索项目列表，支持分页和条件筛选
 * @param params 搜索参数
 * @returns 项目列表和总数
 */
export async function searchProjectApi(params: SearchProjectRequest) {
  return request.get<SearchProjectResponse>({
    url: `${PROJECT_BASE_PATH}/search`,
    params
  })
}



// ============= 项目管理员相关接口 =============

/**
 * 批量添加项目管理员
 * @description 使用事务先删除所有管理员再批量添加
 * @param data 项目管理员信息
 * @returns 操作结果消息
 */
export async function addProjectAdminApi(data: AddProjectAdminRequest) {
  return request.post<string>({
    url: `${PROJECT_BASE_PATH}/admin`,
    data
  })
}

/**
 * 获取项目管理员列表
 * @description 根据项目ID获取所有管理员列表
 * @param params 查询参数
 * @returns 管理员列表
 */
export async function getProjectAdminsApi(params: GetProjectAdminsRequest) {
  return request.get<ProjectAdmin[]>({
    url: `${PROJECT_BASE_PATH}/admin/list`,
    params
  })
}

// ============= 项目集群配额相关接口 =============

/**
 * 添加项目集群配额
 * @description 为项目分配集群资源配额
 * @param data 集群配额信息
 * @returns 操作结果消息
 */
export async function addProjectClusterApi(data: AddProjectClusterRequest) {
  return request.post<string>({
    url: `${PROJECT_BASE_PATH}/cluster`,
    data
  })
}

/**
 * 更新项目集群配额
 * @description 更新项目集群资源配额，不能小于已使用量
 * @param id 集群配额ID
 * @param data 更新数据
 * @returns 操作结果消息
 */
export async function updateProjectClusterApi(id: number, data: UpdateProjectClusterRequest) {
  return request.put<string>({
    url: `${PROJECT_BASE_PATH}/cluster/${id}`,
    data
  })
}

/**
 * 删除项目集群配额
 * @description 软删除项目集群配额，需确保没有工作空间在使用
 * @param id 集群配额ID
 * @returns 操作结果消息
 */
export async function deleteProjectClusterApi(id: number) {
  return request.del<string>({
    url: `${PROJECT_BASE_PATH}/cluster/${id}`
  })
}

/**
 * 获取项目集群配额详情
 * @description 根据ID获取项目集群配额详细信息
 * @param id 集群配额ID
 * @returns 集群配额详细信息
 */
export async function getProjectClusterApi(id: number) {
  return request.get<ProjectCluster>({
    url: `${PROJECT_BASE_PATH}/cluster/${id}`
  })
}

/**
 * 搜索项目集群配额
 * @description 搜索项目的集群配额列表，projectId为必传参数
 * @param params 搜索参数
 * @returns 集群配额列表
 */
export async function searchProjectClusterApi(params: SearchProjectClusterRequest) {
  return request.get<ProjectCluster[]>({
    url: `${PROJECT_BASE_PATH}/cluster/search`,
    params
  })
}





// ============= 项目工作空间相关接口 =============

/**
 * 添加项目工作空间
 * @description 创建新的项目工作空间（Kubernetes命名空间）
 * @param data 工作空间信息
 * @returns 操作结果消息
 */
export async function addProjectWorkspaceApi(data: AddProjectWorkspaceRequest) {
  return request.post<string>({
    url: `${PROJECT_BASE_PATH}/workspace`,
    data
  })
}

/**
 * 更新项目工作空间
 * @description 更新工作空间配置，资源配额不能超过项目集群限制
 * @param id 工作空间ID
 * @param data 更新数据
 * @returns 操作结果消息
 */
export async function updateProjectWorkspaceApi(id: number, data: UpdateProjectWorkspaceRequest) {
  return request.put<string>({
    url: `${PROJECT_BASE_PATH}/workspace/${id}`,
    data
  })
}

/**
 * 删除项目工作空间
 * @description 软删除工作空间，并同步更新项目集群资源使用量
 * @param id 工作空间ID
 * @returns 操作结果消息
 */
export async function deleteProjectWorkspaceApi(id: number) {
  return request.del<string>({
    url: `${PROJECT_BASE_PATH}/workspace/${id}`
  })
}

/**
 * 获取工作空间详情
 * @description 根据ID获取工作空间详细信息
 * @param id 工作空间ID
 * @returns 工作空间详细信息
 */
export async function getProjectWorkspaceApi(id: number) {
  return request.get<ProjectWorkspace>({
    url: `${PROJECT_BASE_PATH}/workspace/${id}`
  })
}

/**
 * 搜索工作空间
 * @description 搜索项目的工作空间列表，projectClusterId为必传参数
 * @param params 搜索参数
 * @returns 工作空间列表
 */
export async function searchProjectWorkspaceApi(params: SearchProjectWorkspaceRequest) {
  return request.get<ProjectWorkspace[]>({
    url: `${PROJECT_BASE_PATH}/workspace/search`,
    params
  })
}



// ========== 工具函数 ==========

/**
 * 获取项目类型标签
 * @param isSystem 是否为系统项目
 * @returns 项目类型信息
 */
export function getProjectTypeInfo(isSystem: number): { label: string; color: string } {
  if (isSystem === 1) {
    return { label: '系统项目', color: 'warning' }
  }
  return { label: '普通项目', color: 'primary' }
}

/**
 * 验证项目名称格式
 * @param name 项目名称
 * @returns 是否符合命名规范
 */
export function isValidProjectName(name: string): boolean {
  // 1-100个字符，支持中英文、数字、下划线、中划线
  const regex = /^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,100}$/
  return regex.test(name)
}

/**
 * 计算资源使用率
 * @param allocated 已分配量
 * @param capacity 总容量
 * @returns 使用率百分比
 */
export function calculateUsageRate(allocated: number, capacity: number): number {
  if (capacity === 0) return 0
  return Math.round((allocated / capacity) * 100)
}

/**
 * 格式化存储容量显示
 * @param sizeInGiB 以GiB为单位的容量（可以是字符串或数字）
 * @returns 格式化后的容量字符串
 */
export function formatStorageSize(sizeInGiB: string | number): string {
  const size = typeof sizeInGiB === 'string' ? parseFloat(sizeInGiB) : sizeInGiB
  if (isNaN(size)) return '0GiB'

  if (size < 1) {
    return `${Math.round(size * 1024)}MiB`
  } else if (size < 1024) {
    return `${size}GiB`
  } else {
    return `${Math.round((size / 1024) * 100) / 100}TiB`
  }
}

/**
 * 格式化CPU显示
 * @param cpuCores CPU核心数（可以是字符串或数字）
 * @returns 格式化后的CPU字符串
 */
export function formatCpuSize(cpuCores: string | number): string {
  const cores = typeof cpuCores === 'string' ? parseFloat(cpuCores) : cpuCores
  if (isNaN(cores)) return '0核'

  if (cores < 1) {
    return `${Math.round(cores * 1000)}m`
  }
  return `${cores}核`
}

/**
 * 格式化内存显示
 * @param memoryInGiB 以GiB为单位的内存（可以是字符串或数字）
 * @returns 格式化后的内存字符串
 */
export function formatMemorySize(memoryInGiB: string | number): string {
  return formatStorageSize(memoryInGiB)
}

/**
 * 获取工作空间状态信息
 * @param status 状态值
 * @returns 状态信息对象
 */
export function getWorkspaceStatusInfo(status: number): { label: string; color: string } {
  if (status === 1) {
    return { label: '正常', color: 'success' }
  }
  return { label: '异常', color: 'error' }
}

/**
 * 验证命名空间名称格式
 * @param namespace 命名空间名称
 * @returns 是否符合Kubernetes命名空间命名规范
 */
export function isValidNamespace(namespace: string): boolean {
  // Kubernetes namespace naming rules:
  // - lowercase letters, numbers, and hyphens only
  // - start and end with alphanumeric character
  // - max 63 characters
  const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
  return regex.test(namespace)
}

/**
 * 检查资源配额是否充足
 * @param requested 请求的资源量（可以是字符串或数字）
 * @param available 可用的资源量（可以是字符串或数字）
 * @returns 是否有足够资源
 */
export function hasEnoughResources(requested: string | number, available: string | number): boolean {
  const req = typeof requested === 'string' ? parseFloat(requested) : requested
  const avail = typeof available === 'string' ? parseFloat(available) : available
  return req <= avail
}

/**
 * 计算超分后的容量
 * @param limit 基础限制
 * @param overcommitRatio 超分比例
 * @returns 超分后的总容量
 */
export function calculateOvercommitCapacity(limit: number, overcommitRatio: number = 1): number {
  return limit * overcommitRatio
}

/**
 * 获取资源状态颜色
 * @param usageRate 使用率百分比
 * @returns 状态颜色
 */
export function getResourceStatusColor(usageRate: number): string {
  if (usageRate < 70) return 'success'
  if (usageRate < 90) return 'warning'
  return 'error'
}

/**
 * 格式化时间戳为可读时间
 * @param timestamp 时间戳（秒）
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

/**
 * 解析资源字符串为数字
 * @param resourceStr 资源字符串（如 "2", "500m", "1.5Gi"）
 * @returns 解析后的数字值
 */
export function parseResourceString(resourceStr: string): number {
  if (!resourceStr) return 0

  // 处理 CPU 的 millicores (m)
  if (resourceStr.endsWith('m')) {
    return parseFloat(resourceStr.slice(0, -1)) / 1000
  }

  // 处理内存单位
  if (resourceStr.endsWith('Gi')) {
    return parseFloat(resourceStr.slice(0, -2))
  }
  if (resourceStr.endsWith('Mi')) {
    return parseFloat(resourceStr.slice(0, -2)) / 1024
  }
  if (resourceStr.endsWith('Ki')) {
    return parseFloat(resourceStr.slice(0, -2)) / (1024 * 1024)
  }

  // 纯数字
  return parseFloat(resourceStr)
}