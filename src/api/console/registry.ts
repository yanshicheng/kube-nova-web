import request from '@/utils/http'

// 定义基础路径
const REGISTRY_BASE_PATH = '/console/v1/registry'

// ========== 类型定义 ==========

// ==================== 镜像仓库基础数据结构 ====================

/** 容器镜像仓库 */
export interface ContainerRegistry {
  id: number
  name: string
  uuid: string
  type: string
  env: string
  url: string
  username: string
  password?: string
  insecure: boolean
  caCert?: string
  config?: string
  status: number
  description?: string
  createdBy?: string
  updatedBy?: string
  createdAt: number
  updatedAt: number
  storageTotal?: number
  totalRepositories?: number
  totalProjects?: number
}

/** 容器镜像仓库详情 */
export interface ContainerRegistryDetails {
  id: number
  name: string
  uuid: string
  type: string
  env: string
  url: string
  username: string
  password?: string
  insecure: boolean
  caCert?: string
  config?: string
  status: number
  description?: string
  createdBy?: string
  updatedBy?: string
  createdAt: number
  updatedAt: number
  storageTotal?: number
  storageUsed?: number
  storageFree?: number
  totalProjects?: number
  publicProjects?: number
  privateProjects?: number
  totalRepositories?: number
  publicRepositories?: number
  privateRepositories?: number
}

// ==================== 仓库与集群关联数据结构 ====================

/** 仓库与集群关联 */
export interface RegistryCluster {
  id: number
  registryId: number
  clusterUuid: string
  createdAt: number
  updatedAt: number
  registry?: ContainerRegistry
}

// ==================== 仓库项目与应用项目绑定数据结构 ====================

/** 仓库项目绑定 */
export interface RegistryProjectBinding {
  id: number
  registryId: number
  appProjectId: number
  registryProjectName: string
  registryProjectId?: string
  createdAt: number
  updatedAt: number
  registry?: ContainerRegistry
  clusterUuid?: string
}

// ==================== 镜像仓库 CRUD ====================

/** 创建镜像仓库请求 */
export interface CreateRegistryRequest {
  name: string
  type: string
  env: string
  url: string
  username: string
  password: string
  insecure: boolean
  caCert?: string
  config?: string
  status: number
  description?: string
  createdBy: string
}

/** 更新镜像仓库请求 */
export interface UpdateRegistryRequest {
  name: string
  type: string
  env: string
  url: string
  username: string
  password: string
  insecure: boolean
  caCert?: string
  config?: string
  status: number
  description?: string
  updatedBy: string
}

/** 测试仓库连接请求 */
export interface TestRegistryConnectionRequest {
  url: string
  username: string
  password: string
  insecure: boolean
  caCert?: string
  type: string
}

/** 测试仓库连接响应 */
export interface TestRegistryConnectionResponse {
  success: boolean
  message: string
}

// ==================== 仓库查询 ====================

/** 查询仓库列表请求参数 */
export interface ListRegistriesParams {
  page?: number
  pageSize?: number
  orderBy?: string
  isAsc?: boolean
  name?: string
  uuid?: string
  env?: string
  type?: string
  status?: number
}

/** 查询仓库列表响应 */
export interface ListRegistriesResponse {
  data: ContainerRegistry[]
  total: number
}

/** 按项目查询仓库请求参数 */
export interface ListRegistriesByProjectParams {
  appProjectId: number
  clusterUuid: string
  page?: number
  pageSize?: number
  orderBy?: string
  isAsc?: boolean
  name?: string
  env?: string
  type?: string
}

/** 按项目查询仓库响应 */
export interface ListRegistriesByProjectResponse {
  data: ContainerRegistry[]
  total: number
}

// ==================== 仓库与集群关联 ====================

/** 绑定仓库到集群请求 */
export interface BindRegistryToClusterRequest {
  registryId: number
  clusterUuid: string
}

/** 查询集群仓库列表参数 */
export interface ListClusterRegistriesParams {
  clusterUuid: string
  registryId?: number
}

/** 查询集群仓库列表响应 */
export interface ListClusterRegistriesResponse {
  data: RegistryCluster[]
}

/** 查询仓库的集群列表参数 */
export interface ListRegistryClustersParams {
  registryId: number
}

/** 查询仓库的集群列表响应 */
export interface ListRegistryClustersResponse {
  data: RegistryCluster[]
}

// ==================== 仓库项目与应用项目绑定 ====================

/** 绑定仓库项目请求 */
export interface BindRegistryProjectRequest {
  registryId: number
  appProjectId: number
  registryProjectName: string
  registryProjectId?: string
}

/** 查询项目仓库绑定列表参数 */
export interface ListProjectRegistryBindingsParams {
  registryId: number
  registryProjectName: string
}

/** 查询项目仓库绑定列表响应 */
export interface ListProjectRegistryBindingsResponse {
  data: number[]
}

// ==================== 仓库项目操作 ====================

/** 仓库项目 */
export interface RegistryProject {
  projectId: number
  name: string
  ownerName?: string
  isPublic: boolean
  repoCount: number
  creationTime: number
  updateTime: number
  StorageLimit?: number
  StorageUsed?: number
  StorageLimitDisplay?: string
  StorageUsedDisplay?: string
}

/** 查询项目列表参数 */
export interface ListProjectsParams {
  registryUuid: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}

/** 查询项目列表响应 */
export interface ListProjectsResponse {
  items: RegistryProject[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 按应用查询项目列表参数 */
export interface ListProjectsByAppParams {
  appProjectId: number
  clusterUuid: string
  registryUuid: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}

/** 按应用查询项目列表响应 */
export interface ListProjectsByAppResponse {
  items: RegistryProject[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取项目详情响应 */
export interface GetProjectResponse {
  data: RegistryProject
}

/** 创建仓库项目请求 */
export interface CreateProjectRequest {
  registryUuid: string
  projectName: string
  isPublic: boolean
  storageLimit?: number
  storageUnit?: string
  appProjectId?: number
  clusterUuid?: string
}

/** 更新仓库项目请求 */
export interface UpdateProjectRequest {
  registryUuid: string
  isPublic: boolean
  storageLimit?: number
  storageUnit?: string
}

// ==================== Repository 操作 ====================

/** 仓库 */
export interface Repository {
  id: number
  name: string
  projectId: number
  projectName: string
  description?: string
  artifactCount: number
  pullCount: number
  creationTime: number
  updateTime: number
}

/** 查询仓库列表参数 */
export interface ListRepositoriesParams {
  registryUuid: string
  projectName: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}

/** 查询仓库列表响应 */
export interface ListRepositoriesResponse {
  items: Repository[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取仓库详情响应 */
export interface GetRepositoryResponse {
  data: Repository
}

// ==================== 制品/标签操作 ====================

/** 标签 */
export interface Tag {
  id: number
  name: string
  pushTime: number
  pullTime: number
  immutable: boolean
  signed: boolean
}

/** 制品 */
export interface Artifact {
  id: number
  type: string
  digest: string
  tags: Tag[]
  pushTime: number
  pullTime: number
  size: number
  manifestMediaType: string
}

/** 查询制品列表参数 */
export interface ListArtifactsParams {
  registryUuid: string
  projectName: string
  repoName: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}

/** 查询制品列表响应 */
export interface ListArtifactsResponse {
  items: Artifact[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取制品详情响应 */
export interface GetArtifactResponse {
  data: Artifact
}

// ==================== 镜像搜索 ====================

/** 镜像搜索结果 */
export interface ImageSearchResult {
  projectName: string
  repoName: string
  tags: string[]
  artifactCount: number
  pullCount: number
}

/** 仓库镜像搜索结果 */
export interface RegistryImageSearchResult {
  registryName: string
  registryUuid: string
  registryUrl: string
  images: ImageSearchResult[]
}

/** 全局搜索镜像参数 */
export interface SearchImagesGlobalParams {
  imageName: string
  registryType?: string
  env?: string
  page?: number
  pageSize?: number
}

/** 全局搜索镜像响应 */
export interface SearchImagesGlobalResponse {
  data: RegistryImageSearchResult[]
  total: number
}

/** 全局搜索镜像（按项目）参数 */
export interface SearchImagesGlobalByProjectParams {
  appProjectId: number
  clusterUuid: string
  imageName: string
  page?: number
  pageSize?: number
}

/** 全局搜索镜像（按项目）响应 */
export interface SearchImagesGlobalByProjectResponse {
  data: RegistryImageSearchResult[]
  total: number
}

/** 仓库内搜索镜像参数 */
export interface SearchImagesInRegistryParams {
  registryUuid: string
  imageName: string
  page?: number
  pageSize?: number
}

/** 仓库内搜索镜像响应 */
export interface SearchImagesInRegistryResponse {
  data: ImageSearchResult[]
  total: number
}

/** 仓库内搜索镜像（按项目）参数 */
export interface SearchImagesInRegistryByProjectParams {
  appProjectId: number
  clusterUuid: string
  registryUuid: string
  imageName: string
  page?: number
  pageSize?: number
}

/** 仓库内搜索镜像（按项目）响应 */
export interface SearchImagesInRegistryByProjectResponse {
  data: ImageSearchResult[]
  total: number
}

// ==================== 配额管理 ====================

/** 项目配额 */
export interface ProjectQuota {
  storageLimit: number
  storageUsed?: number
  countLimit?: number
  countUsed?: number
}

/** 获取项目配额响应 */
export interface GetProjectQuotaResponse {
  data: ProjectQuota
}

/** 更新项目配额请求 */
export interface UpdateProjectQuotaRequest {
  registryUuid: string
  storageLimit: number
  storageUnit?: string
  countLimit?: number
}

// ==================== 项目成员管理 ====================

/** 项目成员 */
export interface ProjectMember {
  id: number
  projectId: number
  entityName: string
  entityType: string
  roleId: number
  roleName: string
  creationTime: number
  updateTime: number
}

/** 查询项目成员列表参数 */
export interface ListProjectMembersParams {
  registryUuid: string
  projectName: string
  search?: string
  page?: number
  pageSize?: number
}

/** 查询项目成员列表响应 */
export interface ListProjectMembersResponse {
  items: ProjectMember[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取项目成员详情响应 */
export interface GetProjectMemberResponse {
  data: ProjectMember
}

/** 添加项目成员请求 */
export interface AddProjectMemberRequest {
  registryUuid: string
  projectName: string
  memberUser: string
  roleId: number
}

/** 更新项目成员请求 */
export interface UpdateProjectMemberRequest {
  registryUuid: string
  projectName: string
  roleId: number
}

// ==================== 全局用户管理 ====================

/** Harbor用户 */
export interface HarborUser {
  userId: number
  username: string
  email: string
  realname: string
  comment: string
  creationTime: number
  updateTime: number
  sysadminFlag: boolean
  adminRoleInAuth: string
}

/** 创建用户请求 */
export interface CreateUserRequest {
  registryUuid: string
  username: string
  email: string
  realname: string
  password: string
  comment?: string
}

/** 查询用户列表参数 */
export interface ListUsersParams {
  registryUuid: string
  search?: string
  page?: number
  pageSize?: number
}

/** 查询用户列表响应 */
export interface ListUsersResponse {
  items: HarborUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取用户详情响应 */
export interface GetUserResponse {
  data: HarborUser
}

/** 更新用户请求 */
export interface UpdateUserRequest {
  registryUuid: string
  email?: string
  realname?: string
  comment?: string
}

/** 修改用户密码请求 */
export interface ChangeUserPasswordRequest {
  registryUuid: string
  oldPassword: string
  newPassword: string
}

/** 设置用户管理员权限请求 */
export interface SetUserAdminRequest {
  registryUuid: string
  sysadminFlag: boolean
}

// ========== API 接口 ==========

// ==================== 镜像仓库管理（管理员操作）====================

/**
 * 创建镜像仓库
 * @param data 创建仓库请求参数
 * @returns 操作结果
 */
export async function createRegistryApi(data: CreateRegistryRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/registries`,
    data
  })
}

/**
 * 更新镜像仓库
 * @param id 仓库ID
 * @param data 更新仓库请求参数
 * @returns 操作结果
 */
export async function updateRegistryApi(id: number, data: UpdateRegistryRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/registries/${id}`,
    data
  })
}

/**
 * 删除镜像仓库
 * @param id 仓库ID
 * @returns 操作结果
 */
export async function deleteRegistryApi(id: number) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/registries/${id}`
  })
}

/**
 * 根据UUID查询仓库
 * @param uuid 仓库UUID
 * @returns 仓库信息
 */
export async function getRegistryByUuidApi(uuid: string) {
  return request.get<ContainerRegistry>({
    url: `${REGISTRY_BASE_PATH}/registries/uuid/${uuid}`
  })
}

/**
 * 获取仓库详情
 * @param uuid 仓库UUID
 * @returns 仓库详情
 */
export async function getRegistryDetailsApi(uuid: string) {
  return request.get<ContainerRegistryDetails>({
    url: `${REGISTRY_BASE_PATH}/registries/${uuid}/details`
  })
}

/**
 * 测试仓库连接
 * @param data 测试连接请求参数
 * @returns 操作结果
 */
export async function testRegistryConnectionApi(data: TestRegistryConnectionRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/registries/test-connection`,
    data
  })
}

// ==================== 仓库查询（管理员视角 + 项目视角）====================

/**
 * 查询所有仓库（管理员）
 * @param params 查询参数
 * @returns 仓库列表
 */
export async function listRegistriesApi(params?: ListRegistriesParams) {
  return request.get<ListRegistriesResponse>({
    url: `${REGISTRY_BASE_PATH}/registries`,
    params
  })
}

/**
 * 查询项目关联的仓库（项目视角）
 * @param params 查询参数
 * @returns 仓库列表
 */
export async function listRegistriesByProjectApi(params: ListRegistriesByProjectParams) {
  return request.get<ListRegistriesByProjectResponse>({
    url: `${REGISTRY_BASE_PATH}/registries/by-project`,
    params
  })
}

// ==================== 仓库与集群关联（管理员操作）====================

/**
 * 绑定仓库到集群
 * @param data 绑定请求参数
 * @returns 操作结果
 */
export async function bindRegistryToClusterApi(data: BindRegistryToClusterRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/registry-clusters`,
    data
  })
}

/**
 * 解绑仓库与集群
 * @param id 关联ID
 * @returns 操作结果
 */
export async function unbindRegistryFromClusterApi(id: number) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/registry-clusters/${id}`
  })
}

/**
 * 查询集群的仓库列表
 * @param params 查询参数
 * @returns 集群仓库列表
 */
export async function listClusterRegistriesApi(params: ListClusterRegistriesParams) {
  return request.get<ListClusterRegistriesResponse>({
    url: `${REGISTRY_BASE_PATH}/registry-clusters/by-cluster`,
    params
  })
}

/**
 * 查询仓库的集群列表
 * @param params 查询参数
 * @returns 仓库集群列表
 */
export async function listRegistryClustersApi(params: ListRegistryClustersParams) {
  return request.get<ListRegistryClustersResponse>({
    url: `${REGISTRY_BASE_PATH}/registry-clusters/by-registry`,
    params
  })
}

// ==================== 仓库项目与应用项目绑定（管理员操作）====================

/**
 * 绑定仓库项目到应用项目
 * @param data 绑定请求参数
 * @returns 操作结果
 */
export async function bindRegistryProjectApi(data: BindRegistryProjectRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/project-bindings`,
    data
  })
}

/**
 * 解绑仓库项目
 * @param id 绑定ID
 * @returns 操作结果
 */
export async function unbindRegistryProjectApi(id: number) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/project-bindings/${id}`
  })
}

/**
 * 查询应用项目的仓库项目绑定
 * @param params 查询参数
 * @returns 绑定列表
 */
export async function listProjectRegistryBindingsApi(params: ListProjectRegistryBindingsParams) {
  return request.get<ListProjectRegistryBindingsResponse>({
    url: `${REGISTRY_BASE_PATH}/project-bindings`,
    params
  })
}

// ==================== 仓库项目操作 ====================

/**
 * 查询仓库所有项目（管理员）
 * @param params 查询参数
 * @returns 项目列表
 */
export async function listRegistryProjectsApi(params: ListProjectsParams) {
  return request.get<ListProjectsResponse>({
    url: `${REGISTRY_BASE_PATH}/projects`,
    params
  })
}

/**
 * 查询应用项目关联的仓库项目（项目视角）
 * @param params 查询参数
 * @returns 项目列表
 */
export async function listProjectsByAppApi(params: ListProjectsByAppParams) {
  return request.get<ListProjectsByAppResponse>({
    url: `${REGISTRY_BASE_PATH}/projects/by-app`,
    params
  })
}

/**
 * 获取项目详情
 * @param projectName 项目名称
 * @param registryUuid 仓库UUID
 * @returns 项目详情
 */
export async function getProjectApi(projectName: string, registryUuid: string) {
  return request.get<GetProjectResponse>({
    url: `${REGISTRY_BASE_PATH}/projects/${projectName}`,
    params: { registryUuid }
  })
}

/**
 * 创建仓库项目
 * @param data 创建项目请求参数
 * @returns 操作结果
 */
export async function createProjectApi(data: CreateProjectRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/projects`,
    data
  })
}

/**
 * 更新仓库项目
 * @param projectName 项目名称
 * @param data 更新项目请求参数
 * @returns 操作结果
 */
export async function updateRegistryProjectApi(projectName: string, data: UpdateProjectRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/projects/${projectName}`,
    data
  })
}

/**
 * 删除仓库项目
 * @param projectName 项目名称
 * @param registryUuid 仓库UUID
 * @returns 操作结果
 */
export async function deleteRegistryProjectApi(projectName: string, registryUuid: string) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/projects/${projectName}`,
    params: { registryUuid }
  })
}

// ==================== Repository 操作 ====================

/**
 * 查询仓库列表
 * @param params 查询参数
 * @returns 仓库列表
 */
export async function listRepositoriesApi(params: ListRepositoriesParams) {
  return request.get<ListRepositoriesResponse>({
    url: `${REGISTRY_BASE_PATH}/repositories`,
    params
  })
}

/**
 * 获取仓库详情
 * @param repoName 仓库名称
 * @param registryUuid 仓库UUID
 * @param projectName 项目名称
 * @returns 仓库详情
 */
export async function getRepositoryApi(
  repoName: string,
  registryUuid: string,
  projectName: string
) {
  return request.get<GetRepositoryResponse>({
    url: `${REGISTRY_BASE_PATH}/repositories/${repoName}`,
    params: { registryUuid, projectName }
  })
}

/**
 * 删除仓库
 * @param repoName 仓库名称
 * @param registryUuid 仓库UUID
 * @param projectName 项目名称
 * @returns 操作结果
 */
export async function deleteRepositoryApi(
  repoName: string,
  registryUuid: string,
  projectName: string
) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/repositories/${repoName}`,
    params: { registryUuid, projectName }
  })
}

// ==================== 制品/标签操作 ====================

/**
 * 查询制品列表
 * @param params 查询参数
 * @returns 制品列表
 */
export async function listArtifactsApi(params: ListArtifactsParams) {
  return request.get<ListArtifactsResponse>({
    url: `${REGISTRY_BASE_PATH}/artifacts`,
    params
  })
}

/**
 * 获取制品详情
 * @param reference 制品引用
 * @param registryUuid 仓库UUID
 * @param projectName 项目名称
 * @param repoName 仓库名称
 * @returns 制品详情
 */
export async function getArtifactApi(
  reference: string,
  registryUuid: string,
  projectName: string,
  repoName: string
) {
  return request.get<GetArtifactResponse>({
    url: `${REGISTRY_BASE_PATH}/artifacts/${reference}`,
    params: { registryUuid, projectName, repoName }
  })
}

/**
 * 删除制品
 * @param reference 制品引用
 * @param registryUuid 仓库UUID
 * @param projectName 项目名称
 * @param repoName 仓库名称
 * @returns 操作结果
 */
export async function deleteArtifactApi(
  reference: string,
  registryUuid: string,
  projectName: string,
  repoName: string
) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/artifacts/${reference}`,
    params: { registryUuid, projectName, repoName }
  })
}

/**
 * 删除标签
 * @param tagName 标签名称
 * @param registryUuid 仓库UUID
 * @param projectName 项目名称
 * @param repoName 仓库名称
 * @returns 操作结果
 */
export async function deleteTagApi(
  tagName: string,
  registryUuid: string,
  projectName: string,
  repoName: string
) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/tags/${tagName}`,
    params: { registryUuid, projectName, repoName }
  })
}

// ==================== 镜像搜索 ====================

/**
 * 全局搜索镜像（管理员）
 * @param params 搜索参数
 * @returns 搜索结果
 */
export async function searchImagesGlobalApi(params: SearchImagesGlobalParams) {
  return request.get<SearchImagesGlobalResponse>({
    url: `${REGISTRY_BASE_PATH}/images/search/global`,
    params
  })
}

/**
 * 全局搜索镜像（项目视角）
 * @param params 搜索参数
 * @returns 搜索结果
 */
export async function searchImagesGlobalByProjectApi(params: SearchImagesGlobalByProjectParams) {
  return request.get<SearchImagesGlobalByProjectResponse>({
    url: `${REGISTRY_BASE_PATH}/images/search/global-by-project`,
    params
  })
}

/**
 * 仓库内搜索镜像（管理员）
 * @param params 搜索参数
 * @returns 搜索结果
 */
export async function searchImagesInRegistryApi(params: SearchImagesInRegistryParams) {
  return request.get<SearchImagesInRegistryResponse>({
    url: `${REGISTRY_BASE_PATH}/images/search/in-registry`,
    params
  })
}

/**
 * 仓库内搜索镜像（项目视角）
 * @param params 搜索参数
 * @returns 搜索结果
 */
export async function searchImagesInRegistryByProjectApi(
  params: SearchImagesInRegistryByProjectParams
) {
  return request.get<SearchImagesInRegistryByProjectResponse>({
    url: `${REGISTRY_BASE_PATH}/images/search/in-registry-by-project`,
    params
  })
}

// ==================== 配额管理 ====================

/**
 * 获取项目配额
 * @param projectName 项目名称
 * @param registryUuid 仓库UUID
 * @returns 项目配额信息
 */
export async function getProjectQuotaApi(projectName: string, registryUuid: string) {
  return request.get<GetProjectQuotaResponse>({
    url: `${REGISTRY_BASE_PATH}/quota/${projectName}`,
    params: { registryUuid }
  })
}

/**
 * 更新项目配额
 * @param projectName 项目名称
 * @param data 更新配额请求参数
 * @returns 操作结果
 */
export async function updateProjectQuotaApi(projectName: string, data: UpdateProjectQuotaRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/quota/${projectName}`,
    data
  })
}

// ==================== 项目成员管理 ====================

/**
 * 列出项目成员
 * @param params 查询参数
 * @returns 项目成员列表
 */
export async function listProjectMembersApi(params: ListProjectMembersParams) {
  return request.get<ListProjectMembersResponse>({
    url: `${REGISTRY_BASE_PATH}/project-members`,
    params
  })
}

/**
 * 获取项目成员详情
 * @param memberId 成员ID
 * @param registryUuid 仓库UUID
 * @param projectName 项目名称
 * @returns 成员详情
 */
export async function getProjectMemberApi(
  memberId: number,
  registryUuid: string,
  projectName: string
) {
  return request.get<GetProjectMemberResponse>({
    url: `${REGISTRY_BASE_PATH}/project-members/${memberId}`,
    params: { registryUuid, projectName }
  })
}

/**
 * 添加项目成员
 * @param data 添加成员请求参数
 * @returns 操作结果
 */
export async function addProjectMemberApi(data: AddProjectMemberRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/project-members`,
    data
  })
}

/**
 * 更新项目成员角色
 * @param memberId 成员ID
 * @param data 更新成员请求参数
 * @returns 操作结果
 */
export async function updateProjectMemberApi(memberId: number, data: UpdateProjectMemberRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/project-members/${memberId}`,
    data
  })
}

/**
 * 删除项目成员
 * @param memberId 成员ID
 * @param registryUuid 仓库UUID
 * @param projectName 项目名称
 * @returns 操作结果
 */
export async function deleteProjectMemberApi(
  memberId: number,
  registryUuid: string,
  projectName: string
) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/project-members/${memberId}`,
    params: { registryUuid, projectName }
  })
}

// ==================== 全局用户管理 ====================

/**
 * 创建Harbor用户
 * @param data 创建用户请求参数
 * @returns 操作结果
 */
export async function registryCreateUserApi(data: CreateUserRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/users`,
    data
  })
}

/**
 * 列出Harbor用户
 * @param params 查询参数
 * @returns 用户列表
 */
export async function registryListUsersApi(params: ListUsersParams) {
  return request.get<ListUsersResponse>({
    url: `${REGISTRY_BASE_PATH}/users`,
    params
  })
}

/**
 * 获取Harbor用户详情
 * @param userId 用户ID
 * @param registryUuid 仓库UUID
 * @returns 用户详情
 */
export async function registryGetUserApi(userId: number, registryUuid: string) {
  return request.get<GetUserResponse>({
    url: `${REGISTRY_BASE_PATH}/users/${userId}`,
    params: { registryUuid }
  })
}

/**
 * 更新Harbor用户
 * @param userId 用户ID
 * @param data 更新用户请求参数
 * @returns 操作结果
 */
export async function registryUpdateUserApi(userId: number, data: UpdateUserRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/users/${userId}`,
    data
  })
}

/**
 * 删除Harbor用户
 * @param userId 用户ID
 * @param registryUuid 仓库UUID
 * @returns 操作结果
 */
export async function registryDeleteUserApi(userId: number, registryUuid: string) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/users/${userId}`,
    params: { registryUuid }
  })
}

/**
 * 修改用户密码
 * @param userId 用户ID
 * @param data 修改密码请求参数
 * @returns 操作结果
 */
export async function registryChangeUserPasswordApi(
  userId: number,
  data: ChangeUserPasswordRequest
) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/users/${userId}/password`,
    data
  })
}

/**
 * 设置用户管理员权限
 * @param userId 用户ID
 * @param data 设置管理员请求参数
 * @returns 操作结果
 */
export async function registrySetUserAdminApi(userId: number, data: SetUserAdminRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/users/${userId}/admin`,
    data
  })
}

// ========== 枚举定义 ==========

/**
 * 仓库类型枚举
 */
export enum RegistryType {
  HARBOR = 'harbor',
  DOCKER_REGISTRY = 'docker-registry',
  NEXUS = 'nexus'
}

/**
 * 环境类型枚举
 */
export enum EnvironmentType {
  DEV = 'dev',
  TEST = 'test',
  STAGING = 'staging',
  PROD = 'prod'
}

/**
 * 仓库状态枚举
 */
export enum RegistryStatus {
  DISABLED = 0,
  ENABLED = 1
}

/**
 * 存储单位枚举
 */
export enum StorageUnit {
  B = 'B',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
  TB = 'TB'
}


// ==================== 垃圾回收管理 ====================

/** GC 历史记录 */
export interface GCHistory {
  id: number
  jobName: string
  jobKind: string
  jobStatus: string // Pending, Running, Success, Error
  creationTime: number
  updateTime: number
  deleteUntagged: boolean
  jobParameters?: Record<string, string>
}

/** GC 调度配置 */
export interface GCSchedule {
  schedule: string // cron 表达式
  parameters: Record<string, string>
}

/** 查询 GC 历史参数 */
export interface ListGCHistoryParams {
  registryUuid: string
  page?: number
  pageSize?: number
}

/** 查询 GC 历史响应 */
export interface ListGCHistoryResponse {
  items: GCHistory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取 GC 详情响应 */
export interface GetGCResponse {
  data: GCHistory
}

/** 获取 GC 日志响应 */
export interface GetGCLogResponse {
  log: string
}

/** 获取 GC 调度配置响应 */
export interface GetGCScheduleResponse {
  data: GCSchedule
}

/** 更新 GC 调度配置请求 */
export interface UpdateGCScheduleRequest {
  registryUuid: string
  schedule: string // cron 表达式
  deleteUntagged: boolean
}

/** 触发 GC 请求 */
export interface TriggerGCRequest {
  registryUuid: string
  deleteUntagged: boolean
  workers?: number
}

/** 触发 GC 响应 */
export interface TriggerGCResponse {
  jobId: number
  message: string
}

// ==================== 保留策略管理 ====================

/** 保留规则 */
export interface RetentionRule {
  id?: number
  priority: number
  disabled: boolean
  action: string
  template: string
  params: Record<string, string>
  tagSelectors: string
  scopeSelectors: string
}

/** 保留策略 */
export interface RetentionPolicy {
  id: number
  algorithm: string
  rules: RetentionRule[]
  trigger: string
  scope: string
  createTime: number
  updateTime: number
}

/** 保留策略执行记录 */
export interface RetentionExecution {
  id: number
  policyId: number
  status: string
  trigger: string
  startTime: number
  endTime: number
  dryRun: number
}

/** 获取保留策略参数 */
export interface GetRetentionPolicyParams {
  registryUuid: string
  projectName: string
}

/** 获取保留策略响应 */
export interface GetRetentionPolicyResponse {
  data: RetentionPolicy
}

/** 创建保留策略请求 */
export interface CreateRetentionPolicyRequest {
  registryUuid: string
  projectName: string
  algorithm: string
  rules: RetentionRule[]
  schedule?: string
}

/** 创建保留策略响应 */
export interface CreateRetentionPolicyResponse {
  id: number
  message: string
}

/** 更新保留策略请求 */
export interface UpdateRetentionPolicyRequest {
  registryUuid: string
  policyId: number
  algorithm: string
  rules: RetentionRule[]
  schedule?: string
}

/** 执行保留策略请求 */
export interface ExecuteRetentionPolicyRequest {
  registryUuid: string
  policyId: number
  dryRun: boolean
}

/** 执行保留策略响应 */
export interface ExecuteRetentionPolicyResponse {
  executionId: number
  message: string
}

/** 查询保留策略执行历史参数 */
export interface ListRetentionExecutionsParams {
  registryUuid: string
  policyId: number
  page?: number
  pageSize?: number
}

/** 查询保留策略执行历史响应 */
export interface ListRetentionExecutionsResponse {
  items: RetentionExecution[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== 复制策略管理 ====================

/** 复制过滤器 */
export interface ReplicationFilter {
  type: string
  value: string
  decoration?: string
}

/** 复制触发器 */
export interface ReplicationTrigger {
  type: string
  triggerSettings?: Record<string, string>
}

/** 复制策略 */
export interface ReplicationPolicy {
  id: number
  name: string
  description?: string
  srcRegistry: number
  destRegistry: number
  destNamespace?: string
  filters?: ReplicationFilter[]
  trigger: ReplicationTrigger
  deletion: boolean
  override: boolean
  enabled: boolean
  creationTime: number
  updateTime: number
}

/** 复制执行记录 */
export interface ReplicationExecution {
  id: number
  policyId: number
  status: string
  trigger: string
  startTime: number
  endTime: number
  succeed: number
  failed: number
  inProgress: number
  stopped: number
}

/** 查询复制策略参数 */
export interface ListReplicationPoliciesParams {
  registryUuid: string
  name?: string
  page?: number
  pageSize?: number
}

/** 查询复制策略响应 */
export interface ListReplicationPoliciesResponse {
  items: ReplicationPolicy[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取复制策略响应 */
export interface GetReplicationPolicyResponse {
  data: ReplicationPolicy
}

/** 创建复制策略请求 */
export interface CreateReplicationPolicyRequest {
  registryUuid: string
  name: string
  description?: string
  srcRegistry: number
  destRegistry: number
  destNamespace?: string
  filters?: ReplicationFilter[]
  trigger: ReplicationTrigger
  deletion: boolean
  override: boolean
  enabled: boolean
}

/** 创建复制策略响应 */
export interface CreateReplicationPolicyResponse {
  id: number
  message: string
}

/** 更新复制策略请求 */
export interface UpdateReplicationPolicyRequest {
  registryUuid: string
  name: string
  description?: string
  srcRegistry: number
  destRegistry: number
  destNamespace?: string
  filters?: ReplicationFilter[]
  trigger: ReplicationTrigger
  deletion: boolean
  override: boolean
  enabled: boolean
}

/** 执行复制策略请求 */
export interface ExecuteReplicationPolicyRequest {
  registryUuid: string
  policyId: number
}

/** 执行复制策略响应 */
export interface ExecuteReplicationPolicyResponse {
  executionId: number
  message: string
}

/** 查询复制执行历史参数 */
export interface ListReplicationExecutionsParams {
  registryUuid: string
  policyId: number
  page?: number
  pageSize?: number
}

/** 查询复制执行历史响应 */
export interface ListReplicationExecutionsResponse {
  items: ReplicationExecution[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== 垃圾回收 API ====================

/**
 * 列出 GC 历史
 * @param params 查询参数
 * @returns GC 历史列表
 */
export async function listGCHistoryApi(params: ListGCHistoryParams) {
  return request.get<ListGCHistoryResponse>({
    url: `${REGISTRY_BASE_PATH}/gc/history`,
    params
  })
}

/**
 * 获取 GC 详情
 * @param gcId GC ID
 * @param registryUuid 仓库 UUID
 * @returns GC 详情
 */
export async function getGCApi(gcId: number, registryUuid: string) {
  return request.get<GetGCResponse>({
    url: `${REGISTRY_BASE_PATH}/gc/${gcId}`,
    params: { registryUuid }
  })
}

/**
 * 获取 GC 日志
 * @param gcId GC ID
 * @param registryUuid 仓库 UUID
 * @returns GC 日志
 */
export async function getGCLogApi(gcId: number, registryUuid: string) {
  return request.get<GetGCLogResponse>({
    url: `${REGISTRY_BASE_PATH}/gc/${gcId}/log`,
    params: { registryUuid }
  })
}

/**
 * 获取 GC 调度配置
 * @param registryUuid 仓库 UUID
 * @returns GC 调度配置
 */
export async function getGCScheduleApi(registryUuid: string) {
  return request.get<GetGCScheduleResponse>({
    url: `${REGISTRY_BASE_PATH}/gc/schedule`,
    params: { registryUuid }
  })
}

/**
 * 更新 GC 调度配置
 * @param data 更新配置请求
 * @returns 操作结果
 */
export async function updateGCScheduleApi(data: UpdateGCScheduleRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/gc/schedule`,
    data
  })
}

/**
 * 手动触发 GC
 * @param data 触发 GC 请求
 * @returns 操作结果
 */
export async function triggerGCApi(data: TriggerGCRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/gc/trigger`,
    data
  })
}

// ==================== 保留策略 API ====================

/**
 * 获取项目保留策略
 * @param params 查询参数
 * @returns 保留策略
 */
export async function getRetentionPolicyApi(params: GetRetentionPolicyParams) {
  return request.get<GetRetentionPolicyResponse>({
    url: `${REGISTRY_BASE_PATH}/retention/policy`,
    params
  })
}

/**
 * 创建保留策略
 * @param data 创建请求
 * @returns 操作结果
 */
export async function createRetentionPolicyApi(data: CreateRetentionPolicyRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/retention/policy`,
    data
  })
}

/**
 * 更新保留策略
 * @param data 更新请求
 * @returns 操作结果
 */
export async function updateRetentionPolicyApi(data: UpdateRetentionPolicyRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/retention/policy`,
    data
  })
}

/**
 * 执行保留策略
 * @param data 执行请求
 * @returns 操作结果
 */
export async function executeRetentionPolicyApi(data: ExecuteRetentionPolicyRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/retention/policy/execute`,
    data
  })
}

/**
 * 列出保留策略执行历史
 * @param params 查询参数
 * @returns 执行历史列表
 */
export async function listRetentionExecutionsApi(params: ListRetentionExecutionsParams) {
  return request.get<ListRetentionExecutionsResponse>({
    url: `${REGISTRY_BASE_PATH}/retention/executions`,
    params
  })
}

// ==================== 复制策略 API ====================

/**
 * 列出复制策略
 * @param params 查询参数
 * @returns 复制策略列表
 */
export async function listReplicationPoliciesApi(params: ListReplicationPoliciesParams) {
  return request.get<ListReplicationPoliciesResponse>({
    url: `${REGISTRY_BASE_PATH}/replication/policies`,
    params
  })
}

/**
 * 获取复制策略
 * @param policyId 策略 ID
 * @param registryUuid 仓库 UUID
 * @returns 复制策略
 */
export async function getReplicationPolicyApi(policyId: number, registryUuid: string) {
  return request.get<GetReplicationPolicyResponse>({
    url: `${REGISTRY_BASE_PATH}/replication/policies/${policyId}`,
    params: { registryUuid }
  })
}

/**
 * 创建复制策略
 * @param data 创建请求
 * @returns 操作结果
 */
export async function createReplicationPolicyApi(data: CreateReplicationPolicyRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/replication/policies`,
    data
  })
}

/**
 * 更新复制策略
 * @param policyId 策略 ID
 * @param data 更新请求
 * @returns 操作结果
 */
export async function updateReplicationPolicyApi(policyId: number, data: UpdateReplicationPolicyRequest) {
  return request.put<string>({
    url: `${REGISTRY_BASE_PATH}/replication/policies/${policyId}`,
    data
  })
}

/**
 * 删除复制策略
 * @param policyId 策略 ID
 * @param registryUuid 仓库 UUID
 * @returns 操作结果
 */
export async function deleteReplicationPolicyApi(policyId: number, registryUuid: string) {
  return request.del<string>({
    url: `${REGISTRY_BASE_PATH}/replication/policies/${policyId}`,
    params: { registryUuid }
  })
}

/**
 * 执行复制策略
 * @param data 执行请求
 * @returns 操作结果
 */
export async function executeReplicationPolicyApi(data: ExecuteReplicationPolicyRequest) {
  return request.post<string>({
    url: `${REGISTRY_BASE_PATH}/replication/policies/execute`,
    data
  })
}

/**
 * 列出复制执行历史
 * @param params 查询参数
 * @returns 执行历史列表
 */
export async function listReplicationExecutionsApi(params: ListReplicationExecutionsParams) {
  return request.get<ListReplicationExecutionsResponse>({
    url: `${REGISTRY_BASE_PATH}/replication/executions`,
    params
  })
}
