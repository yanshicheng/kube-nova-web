import request from '@/utils/http'

// 定义基础路径
const NODE_BASE_PATH = '/manager/v1/node'

// ========== 类型定义 ==========

/** 节点列表信息 */
export interface ClusterNodeInfo {
  id: number
  clusterUuid: string
  nodeName: string
  nodeIp: string
  nodeStatus: string
  cpuUsge: number
  memoryUsge: number
  podTotal: number
  podUsge: number
  createdAt: number
  updatedAt: number
  nodeRole: string
  architecture: string
  unschedulable: number
}

/** 节点详细信息 */
export interface ClusterNodeDetail {
  id: number
  clusterUuid: string
  nodeUuid: string
  name: string
  hostname: string
  roles: string
  osImage: string
  nodeIp: string
  kernelVersion: string
  operatingSystem: string
  architecture: string
  cpu: number
  memory: number
  pods: number
  isGpu: number
  runtime: string
  joinAt: number
  unschedulable: number
  kubeletVersion: string
  status: string
  podCidr: string
  podCidrs: string
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

/** 搜索节点请求 */
export interface SearchClusterNodeRequest {
  page?: number
  pageSize?: number
  orderField?: string
  isAsc?: boolean
  clusterUuid: string
}

/** 搜索节点响应 */
export interface SearchClusterNodeResponse {
  items: ClusterNodeInfo[]
  total: number
}

/** 节点标签项 */
export interface NodeLabelItem {
  key: string
  value: string
  isDelete: boolean
}

/** 节点注解项 */
export interface NodeAnnotationItem {
  key: string
  value: string
  isDelete: boolean
}

/** 节点污点项 */
export interface NodeTaint {
  key: string
  value: string
  effect: string
  time: number
  isDelete: boolean
}

// ========== API 接口 ==========

/**
 * 获取节点列表
 * @param params 搜索参数
 */
export async function getNodeListApi(params: SearchClusterNodeRequest) {
  return request.get<SearchClusterNodeResponse>({
    url: NODE_BASE_PATH,
    params
  })
}

/**
 * 获取节点详情
 * @param id 节点ID
 */
export async function getNodeDetailApi(id: number) {
  return request.get<ClusterNodeDetail>({
    url: `${NODE_BASE_PATH}/${id}`
  })
}

/**
 * 获取节点详情YAML
 * @param id 节点ID
 */
export async function getNodeDetailYamlApi(id: number) {
  return request.get<string>({
    url: `${NODE_BASE_PATH}/${id}/yaml`
  })
}

/**
 * 启用/禁用节点调度
 * @param id 节点ID
 * @param status 调度状态：1-可调度，2-不可调度
 */
export async function updateNodeScheduleApi(id: number, status: number) {
  return request.put<string>({
    url: `${NODE_BASE_PATH}/${id}/schedule`,
    data: { status }
  })
}

// ========== 标签相关操作 ==========

/**
 * 获取节点标签列表
 * @param id 节点ID
 */
export async function getNodeLabelsApi(id: number) {
  return request.get<NodeLabelItem[]>({
    url: `${NODE_BASE_PATH}/${id}/labels`
  })
}

/**
 * 添加节点标签
 * @param id 节点ID
 * @param data 标签数据
 */
export async function addNodeLabelApi(id: number, data: { key: string; value: string }) {
  return request.post<string>({
    url: `${NODE_BASE_PATH}/${id}/labels`,
    data
  })
}

/**
 * 删除节点标签
 * @param id 节点ID
 * @param key 标签键
 */
export async function deleteNodeLabelApi(id: number, key: string) {
  return request.del<string>({
    url: `${NODE_BASE_PATH}/${id}/labels`,
    data: { key }
  })
}

// ========== 注解相关操作 ==========

/**
 * 获取节点注解列表
 * @param id 节点ID
 */
export async function getNodeAnnotationsApi(id: number) {
  return request.get<NodeAnnotationItem[]>({
    url: `${NODE_BASE_PATH}/${id}/annotations`
  })
}

/**
 * 添加节点注解
 * @param id 节点ID
 * @param data 注解数据
 */
export async function addNodeAnnotationApi(id: number, data: { key: string; value: string }) {
  return request.post<string>({
    url: `${NODE_BASE_PATH}/${id}/annotations`,
    data
  })
}

/**
 * 删除节点注解
 * @param id 节点ID
 * @param key 注解键
 */
export async function deleteNodeAnnotationApi(id: number, key: string) {
  return request.del<string>({
    url: `${NODE_BASE_PATH}/${id}/annotations`,
    data: { key }
  })
}

// ========== 污点相关操作 ==========

/**
 * 获取节点污点列表
 * @param id 节点ID
 */
export async function getNodeTaintsApi(id: number) {
  return request.get<NodeTaint[]>({
    url: `${NODE_BASE_PATH}/${id}/taints`
  })
}

/**
 * 添加节点污点
 * @param id 节点ID
 * @param data 污点数据
 */
export async function addNodeTaintApi(
  id: number,
  data: { key: string; value: string; effect: string }
) {
  return request.post<string>({
    url: `${NODE_BASE_PATH}/${id}/taints`,
    data
  })
}

/**
 * 删除节点污点
 * @param id 节点ID
 * @param data 污点标识
 */
export async function deleteNodeTaintApi(id: number, data: { key: string; effect: string }) {
  return request.del<string>({
    url: `${NODE_BASE_PATH}/${id}/taints`,
    data
  })
}

/**
 * 驱逐节点
 * @param id 节点ID
 */
export async function evictNodeApi(id: number) {
  return request.post<string>({
    url: `${NODE_BASE_PATH}/${id}/evict`,
    data: {}
  })
}
