import request from '@/utils/http'

// 定义基础路径
const CLUSTER_BASE_PATH = '/manager/v1/cluster'

// ========== 类型定义 ==========

/** 集群基本信息 */
export interface Cluster {
  id: number // 自增主键
  name: string // 集群名称
  uuid: string // 集群唯一标识UUID
  avatar: string // 头像URL
  environment: string // 环境类型
  clusterType: string // 集群类型
  version: string // Kubernetes版本
  status: number // 集群状态: 1-同步中 2-同步异常 3-同步正常
  healthStatus: number // 健康状态: 1-健康 2-不健康 3-降级 4-未知
  cpuUsage: number // CPU使用率
  memoryUsage: number // 内存使用率
  podUsage: number // Pod使用率
  storageUsage: number // 存储使用率
  createdAt: number
}

/** 集群详细信息 */
export interface ClusterDetail {
  id: number // 自增主键
  name: string // 集群名称
  avatar: string // 头像URL
  uuid: string // 集群唯一标识UUID
  description: string // 集群描述信息
  clusterType: string // 集群类型: standard/edge/serverless
  environment: string // 环境类型: development/testing/staging/production
  region: string // 地域信息
  zone: string // 可用区信息
  datacenter: string // 数据中心名称
  provider: string // 云提供商
  isManaged: number // 是否为云厂商托管集群
  nodeLb: string // Node负载均衡IP地址 支持 ipv4 ipv6 多个逗号分隔
  masterLb: string // Master负载均衡IP地址 支持 ipv4 ipv6 多个逗号分隔
  ingressDomain: string // 配置可用的域名前缀，例如 ikubeops.com 多个逗号分隔
  status: number // 集群状态
  healthStatus: number // 健康状态
  lastSyncAt: number // 最后同步时间
  version: string // Kubernetes版本
  gitCommit: string // Kubernetes Git提交版本
  platform: string // 集群平台
  versionBuildAt: number // Kubernetes版本构建时间
  clusterCreatedAt: number // 集群创建时间
  costCenter: string // 成本中心编码
  businessUnit: string // 业务单元名称
  ownerTeam: string // 负责团队名称
  ownerEmail: string // 负责人邮箱
  priority: number // 集群优先级
  createdBy: string // 记录创建人
  updatedBy: string // 记录最后更新人
  createdAt: number // 记录创建时间
  updatedAt: number // 记录更新时间
}

/** 添加集群请求 - multipart/form-data 格式 */
export interface AddClusterRequest {
  name: string // 集群名称，全局唯一
  description?: string // 集群描述信息
  clusterType: 'standard' | 'edge' | 'serverless' // 集群类型
  environment: string // 环境类型
  region?: string // 地域信息
  zone?: string // 可用区信息
  datacenter?: string // 数据中心名称
  provider: 'aws' | 'azure' | 'gcp' | 'alibaba' | 'tencent' | 'huawei' | 'self-hosted' // 云提供商
  isManaged?: number // 是否为云厂商托管集群: 0-否, 1-是
  nodeLb?: string // Node负载均衡IP地址
  masterLb?: string // Master负载均衡IP地址
  ingressDomain?: string // 配置可用的域名前缀，例如 ikubeops.com 多个逗号分隔
  authType: 'kubeconfig' | 'token' | 'certificate' | 'incluster' // 认证类型
  apiServerHost?: string // API Server地址
  kubeFile?: string // KubeConfig文件内容
  token?: string // Bearer Token
  caCert?: string // CA证书内容
  caFile?: string // CA证书文件路径
  clientCert?: string // 客户端证书内容
  certFile?: string // 客户端证书文件路径
  clientKey?: string // 客户端密钥内容
  keyFile?: string // 客户端密钥文件路径
  insecureSkipVerify?: number // 是否跳过TLS证书验证: 0-否, 1-是
}

/** 更新集群请求 - JSON 格式 */
export interface UpdateClusterRequest {
  id: number // 集群ID
  name?: string // 集群名称
  description?: string // 集群描述信息
  clusterType?: 'standard' | 'edge' | 'serverless' // 集群类型
  environment?: string // 环境类型
  region?: string // 地域信息
  zone?: string // 可用区信息
  datacenter?: string // 数据中心名称
  provider?: 'aws' | 'azure' | 'gcp' | 'alibaba' | 'tencent' | 'huawei' | 'self-hosted' // 云提供商
  isManaged?: number // 是否为云厂商托管集群: 0-否, 1-是
  nodeLb?: string // Node负载均衡IP地址
  masterLb?: string // Master负载均衡IP地址
  ingressDomain?: string // 配置可用的域名前缀，例如 ikubeops.com 多个逗号分隔
}

/** 修改集群头像请求 */
export interface ClusterUpdateAvatarRequest {
  id: number // 集群ID
  avatar?: string | File // 头像文件或URL
}

/** 更新集群认证信息请求 */
export interface UpdateClusterAuthInfoRequest {
  id: number // 集群ID
  authType: 'kubeconfig' | 'token' | 'certificate' | 'incluster' // 认证类型
  apiServerHost?: string // API Server地址
  kubeFile?: string // KubeConfig文件内容
  token?: string // Bearer Token
  caCert?: string // CA证书内容
  caFile?: string // CA证书文件路径
  clientCert?: string // 客户端证书内容
  certFile?: string // 客户端证书文件路径
  clientKey?: string // 客户端密钥内容
  keyFile?: string // 客户端密钥文件路径
  insecureSkipVerify?: number // 是否跳过TLS证书验证: 0-否, 1-是
}

/** 搜索集群请求 */
export interface SearchClusterRequest {
  page?: number // 当前页码，默认1
  pageSize?: number // 每页条数，默认10，最大200
  orderStr?: string // 排序字段，默认id
  isAsc?: boolean // 是否升序，默认false
  name?: string // 集群名称
  uuid?: string // 集群UUID
  environment?: string // 环境类型
}

/** 搜索集群响应 */
export interface SearchClusterResponse {
  items: Cluster[] // 集群列表
  total: number // 总条数
}

/** 集群审计日志 */
export interface ClusterAudit {
  id: number // 自增主键
  clusterUuid: string // 关联的集群UUID
  operator: string // 操作人
  auditType: string // 审计类型
  auditContent: string // 审计内容
  color: number // 颜色模式: 1-绿色, 2-黄色, 3-红色
  createdAt: number // 审计时间
}

/** 搜索集群审计日志请求 */
export interface SearchClusterAuditRequest {
  page?: number // 当前页码，默认1
  pageSize?: number // 每页条数，默认10，最大200
  orderStr?: string // 排序字段，默认id
  isAsc?: boolean // 是否升序，默认false
  clusterUuid: string // 集群UUID，必填
}

/** 搜索集群审计日志响应 */
export interface SearchClusterAuditResponse {
  items: ClusterAudit[] // 审计日志列表
  total: number // 总条数
}

/** 集群认证信息 */
export interface ClusterAuthInfo {
  id: number // 自增主键
  clusterUuid: string // 关联的集群UUID
  authType: string // 认证类型
  apiServerHost: string // API Server地址
  kubeFile: string // KubeConfig文件内容
  token: string // Token
  caCert: string // CA证书内容
  caFile: string // CA证书文件路径
  clientCert: string // 客户端证书内容
  certFile: string // 客户端证书文件路径
  clientKey: string // 客户端密钥内容
  keyFile: string // 客户端密钥文件路径
  insecureSkipVerify: number // 是否跳过TLS证书验证
  createdAt: number // 记录创建时间
  updatedAt: number // 记录更新时间
}

/** 集群资源信息 */
export interface ClusterResourceInfo {
  id: number // 自增主键
  clusterUuid: string // 关联的集群UUID
  cpuPhysicalCapacity: number // CPU物理总容量（核数）
  cpuAllocatedTotal: number // CPU实际分配总量
  cpuCapacityTotal: number // CPU超分后总容量
  memPhysicalCapacity: number // 内存物理总容量（GiB）
  memAllocatedTotal: number // 内存实际分配总量
  memCapacityTotal: number // 内存超分后总容量
  storagePhysicalCapacity: number // 存储物理总容量（GiB）
  storageAllocatedTotal: number // 存储分配总量
  gpuPhysicalCapacity: number // GPU物理总容量（个）
  gpuAllocatedTotal: number // GPU实际分配总量
  gpuCapacityTotal: number // GPU超分后总容量
  gpuUsedTotal: number // GPU实际使用总量（个）
  podsPhysicalCapacity: number // Pod物理总容量（个）
  podsAllocatedTotal: number // Pod分配总量
}

/** 测试集群连通性请求 */
export interface TestClusterConnectivityRequest {
  authType: 'kubeconfig' | 'token' | 'certificate' | 'incluster' // 认证类型
  apiServerHost?: string // API Server地址
  kubeFile?: string // KubeConfig文件内容
  token?: string // Bearer Token
  caCert?: string // CA证书内容
  caFile?: string // CA证书文件路径
  clientCert?: string // 客户端证书内容
  certFile?: string // 客户端证书文件路径
  clientKey?: string // 客户端密钥内容
  keyFile?: string // 客户端密钥文件路径
  insecureSkipVerify?: number // 是否跳过TLS证书验证: 0-否, 1-是
}

/** 修改集群资源的存储容量请求 */
export interface UpdateClusterStorageCapacityRequest {
  resourceId: number // 资源ID
  storagePhysicalCapacity: number // 存储物理总容量
}

/** 集群网络配置信息 */
export interface ClusterNetwork {
  id: number // 自增主键
  clusterUuid: string // 关联的集群UUID
  // 网络CIDR配置
  clusterCidr: string // Pod网络CIDR
  serviceCidr: string // Service网络CIDR
  nodeCidrMaskSize: number // 节点CIDR掩码大小
  // DNS配置
  dnsDomain: string // DNS域名后缀
  dnsServiceIp: string // DNS服务IP地址
  dnsProvider: string // DNS提供者
  // 网络插件配置
  cniPlugin: string // CNI网络插件
  cniVersion: string // CNI插件版本
  proxyMode: string // 代理模式
  // Ingress配置
  ingressController: string // Ingress控制器
  ingressClass: string // 默认Ingress类
  // 高级网络配置
  ipv6Enabled: boolean // 是否启用IPv6
  dualStackEnabled: boolean // 是否启用双栈网络
  mtuSize: number // MTU大小
  enableNodePort: boolean // 是否启用NodePort
  nodePortRange: string // NodePort端口范围
  // 审计字段
  createdBy: string // 记录创建人
  updatedBy: string // 记录更新人
  createdAt: number // 记录创建时间
  updatedAt: number // 记录更新时间
}

// ========== API 接口 ==========

/**
 * 添加集群
 * @param data 添加集群请求参数（multipart/form-data格式）
 * @returns 操作结果
 */
export async function addClusterApi(data: AddClusterRequest) {
  // 创建FormData对象用于发送multipart/form-data格式的数据
  const formData = new FormData()
  Object.keys(data).forEach((key) => {
    const value = data[key as keyof AddClusterRequest]
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })

  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 更新集群基本信息
 * @param data 更新集群请求参数（JSON格式）
 * @returns 操作结果
 */
export async function updateClusterApi(data: UpdateClusterRequest) {
  const { id, ...params } = data

  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/${id}`,
    data: params
  })
}

/**
 * 修改集群头像
 * @param data 修改头像请求参数（multipart/form-data格式）
 * @returns 操作结果
 */
export async function updateClusterAvatarApi(data: ClusterUpdateAvatarRequest) {
  const { id, avatar } = data

  // 创建FormData对象用于发送multipart/form-data格式的数据
  const formData = new FormData()

  // 检查avatar是否存在
  if (avatar) {
    // 检查avatar是否是File对象（上传文件）
    if (typeof avatar === 'object' && avatar instanceof File) {
      formData.append('avatar', avatar)
    } else {
      // 如果avatar是字符串（URL或base64等）
      formData.append('avatar', avatar as string)
    }
  }

  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/${id}/avatar`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 更新集群认证信息
 * @param data 更新认证信息请求参数
 * @returns 操作结果
 */
export async function updateClusterAuthInfoApi(data: UpdateClusterAuthInfoRequest) {
  const { id, ...params } = data

  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/${id}/auth`,
    data: params
  })
}

/**
 * 删除集群
 * @param id 集群ID
 * @returns 操作结果
 */
export async function deleteClusterApi(id: number) {
  return request.del<string>({
    url: `${CLUSTER_BASE_PATH}/${id}`
  })
}

/**
 * 获取集群详情
 * @param id 集群ID
 * @returns 集群详细信息
 */
export async function getClusterDetailApi(id: number) {
  return request.get<ClusterDetail>({
    url: `${CLUSTER_BASE_PATH}/${id}`
  })
}

/**
 * 搜索集群列表
 * @param params 搜索参数
 * @returns 集群列表及总数
 */
export async function searchClusterApi(params?: SearchClusterRequest) {
  return request.get<SearchClusterResponse>({
    url: `${CLUSTER_BASE_PATH}`,
    params
  })
}

export async function getClusterNamespaceListApi(clusterUuid: string) {
  return request.get<string[]>({
    url: `${CLUSTER_BASE_PATH}/${clusterUuid}/namespaces`
  })
}

/**
 * 获取集群审计日志
 * @param params 搜索审计日志参数
 * @returns 审计日志列表及总数
 */
export async function searchClusterAuditApi(params: SearchClusterAuditRequest) {
  return request.get<SearchClusterAuditResponse>({
    url: `${CLUSTER_BASE_PATH}/audit`,
    params
  })
}

/**
 * 获取集群认证信息
 * @param id 集群ID
 * @returns 集群认证信息
 */
export async function getClusterAuthInfoApi(id: number) {
  return request.get<ClusterAuthInfo>({
    url: `${CLUSTER_BASE_PATH}/${id}/auth`
  })
}

/**
 * 获取集群资源信息
 * @param id 集群ID
 * @returns 集群资源使用情况信息
 */
export async function getClusterResourceInfoApi(id: number) {
  return request.get<ClusterResourceInfo>({
    url: `${CLUSTER_BASE_PATH}/${id}/resource`
  })
}

/**
 * 测试集群连通性
 * @param data 测试集群连通性参数
 * @returns 操作结果
 */
export async function testClusterConnectivityApi(data: TestClusterConnectivityRequest) {
  return request.post<string>({
    url: `${CLUSTER_BASE_PATH}/test`,
    data
  })
}

/**
 * 获取某个集群的Ingress域名列表
 * @returns Ingress域名列表
 * @param uuid
 */
export async function getClusterIngressDomainsApi(uuid: string) {
  return request.get<string[]>({
    url: `${CLUSTER_BASE_PATH}/${uuid}/ingress`
  })
}

/**
 * 设置集群的存储容量
 * @param data 更新存储容量请求参数
 * @returns 操作结果
 */
export async function updateClusterStorageCapacityApi(data: UpdateClusterStorageCapacityRequest) {
  const { resourceId, ...params } = data

  return request.put<string>({
    url: `${CLUSTER_BASE_PATH}/${resourceId}/storage`,
    data: params
  })
}

/**
 * 获取集群网络配置
 * @param clusterUuid 集群UUID
 * @returns 集群网络配置信息
 */
export async function getClusterNetworkApi(clusterUuid: string) {
  return request.get<ClusterNetwork>({
    url: `${CLUSTER_BASE_PATH}/${clusterUuid}/network`
  })
}
