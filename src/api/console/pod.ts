import request from '@/utils/http'
import { useUserStore } from '@/store/modules/user'

// 定义基础路径
const POD_BASE_PATH = '/console/v1/pod'

// ========== 工具函数 ==========/ws/v1/pod/file/download

/**
 * 构建查询参数，过滤掉 undefined、null 和空字符串
 */
function buildQueryParams(params: Record<string, any>): string {
  const filtered: Record<string, string> = {}

  Object.entries(params).forEach(([key, value]) => {
    // 跳过 undefined、null、空字符串
    if (value === undefined || value === null || value === '') {
      return
    }
    // 跳过值为 0 的 sinceSeconds 和 tailLines（表示不限制）
    if ((key === 'sinceSeconds' || key === 'tailLines') && value === 0) {
      return
    }
    // 转换为字符串
    filtered[key] = String(value)
  })

  return new URLSearchParams(filtered).toString()
}

/**
 * 获取 API 基础路径（开发环境加上 /api 前缀）
 */
function getApiBasePath(): string {
  // const isDev = import.meta.env.DEV

  // 开发环境需要 /api 前缀来匹配 Vite 代理配置
  return '/ws/v1/pod'
}

// ========== 类型定义 ==========

/** 容器状态 - Running */
export interface ContainerStateRunning {
  startedAt: number
}

/** 容器状态 - Waiting */
export interface ContainerStateWaiting {
  reason?: string
  message?: string
}

/** 容器状态 - Terminated */
export interface ContainerStateTerminated {
  exitCode: number
  reason?: string
  message?: string
  startedAt?: number
  finishedAt?: number
}

/** 容器状态信息 */
export interface ContainerStateInfo {
  type: string
  running?: ContainerStateRunning
  waiting?: ContainerStateWaiting
  terminated?: ContainerStateTerminated
}

/** 容器状态详情 */
export interface ContainerStatusDetails {
  state: ContainerStateInfo
  lastState?: ContainerStateInfo
  ready: boolean
  restartCount: number
  image: string
  imageID: string
  containerID?: string
  started?: boolean
}

/** 容器信息 */
export interface ContainerInfo {
  name: string
  image: string
  ready: boolean
  restartCount: number
  state: string
  status?: ContainerStatusDetails
}

/** 容器信息列表 */
export interface ContainerInfoList {
  initContainers: ContainerInfo[]
  containers: ContainerInfo[]
  ephemeralContainers?: ContainerInfo[]
}

/** 权限位 */
export interface PermissionBits {
  read: boolean
  write: boolean
  execute: boolean
}

/** 文件权限 */
export interface FilePermission {
  user: PermissionBits
  group: PermissionBits
  other: PermissionBits
}

/** 面包屑导航项 */
export interface BreadcrumbItem {
  name: string
  path: string
}

/** 文件信息 */
export interface FileInfo {
  name: string
  path: string
  isDir: boolean
  size: number
  mode: string
  modTime: string
  owner: string
  group: string
  isLink: boolean
  linkTarget?: string
  isReadable: boolean
  isWritable: boolean
  isExecutable: boolean
  mimeType?: string
  children?: number
  permissions: FilePermission
}

/** 内容匹配 */
export interface ContentMatch {
  lineNumber: number
  line: string
  preview: string
}

/** 文件搜索结果 */
export interface FileSearchResult {
  path: string
  name: string
  size: number
  modTime: string
  isDir: boolean
  matches?: ContentMatch[]
}

// ==================== Container 操作 ====================

/** 获取 Pod 所有容器请求 */
export interface PodGetContainersReq {
  workloadId: number
  podName: string
}

/** 获取 Pod 所有容器响应 */
export interface PodGetContainersResp {
  items: ContainerInfoList
}

/** 获取 Pod 默认容器请求 */
export interface PodGetDefaultContainerReq {
  workloadId: number
  podName: string
}

/** 获取 Pod 默认容器响应 */
export interface PodGetDefaultContainerResp {
  containerName: string
}

// ==================== Pod 日志操作 ====================

/** 获取 Pod 日志请求 */
export interface PodLogsGetReq {
  workloadId: number
  podName: string
  container?: string
  previous?: boolean
  sinceSeconds?: number
  sinceTime?: string
  timestamps?: boolean
  tailLines?: number
  limitBytes?: number
}

/** 获取 Pod 日志响应 */
export interface PodLogsGetResp {
  logs: string
  container: string
  totalLines?: number
}

/** 实时日志流请求 (WebSocket) */
export interface PodLogsStreamReq {
  workloadId: number
  podName: string
  container?: string
  previous?: boolean
  sinceSeconds?: number
  timestamps?: boolean
  tailLines?: number
}

/** 下载 Pod 日志请求 */
export interface PodLogsDownloadReq {
  workloadId: number
  podName: string
  container?: string
  allContainers?: boolean
  previous?: boolean
  timestamps?: boolean
  tailLines?: number
  maxSize?: number
  startTime?: string
  endTime?: string
}

// ==================== Pod Exec 操作 ====================

/** 交互式执行命令请求 (WebSocket) */
export interface PodExecReq {
  workloadId: number
  podName: string
  container?: string
  command?: string[]
  rows?: number
  cols?: number
}

/** 终端窗口大小调整请求 */
export interface PodExecResizeReq {
  rows: number
  cols: number
}

/** 非交互式执行命令请求 */
export interface PodExecCommandReq {
  workloadId: number
  podName: string
  container?: string
  command: string[]
  timeout?: number
  workingDir?: string
  env?: Record<string, string>
}

/** 非交互式执行命令响应 */
export interface PodExecCommandResp {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
  error?: string
}

/** Exec 会话心跳检查请求 */
export interface PodExecPingReq {
  workloadId: number
  podName: string
  container?: string
}

/** Exec 会话心跳检查响应 */
export interface PodExecPingResp {
  status: string
  containerStatus: string
}

// ==================== Pod 文件操作 ====================

/** 文件列表请求 */
export interface PodFileListReq {
  workloadId: number
  podName: string
  container?: string
  path?: string
  showHidden?: boolean
  sortBy?: string
  sortDesc?: boolean
  search?: string
  fileTypes?: string[]
  recursive?: boolean
  maxDepth?: number
  limit?: number
  offset?: number
}

/** 文件列表响应 */
export interface PodFileListResp {
  files: FileInfo[]
  currentPath: string
  breadcrumbs: BreadcrumbItem[]
  totalCount: number
  totalSize: number
  container: string
  hasMore: boolean
}

/** 文件信息请求 */
export interface PodFileInfoReq {
  workloadId: number
  podName: string
  container?: string
  path: string
}

/** 文件统计信息请求 */
export interface PodFileStatsReq {
  workloadId: number
  podName: string
  container?: string
  path: string
}

/** 文件统计信息响应 */
export interface PodFileStatsResp {
  fileInfo: FileInfo
  diskUsage: number
  fileCount: number
  dirCount: number
  totalSize: number
  checksum?: string
  lastAccess?: string
}

/** 文件读取请求 */
export interface PodFileReadReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  offset?: number
  limit?: number
  encoding?: string
  tail?: boolean
  tailLines?: number
}

/** 文件读取响应 */
export interface PodFileReadResp {
  content?: string
  fileSize: number
  bytesRead: number
  isText: boolean
  encoding: string
  isTruncated: boolean
  lineCount?: number
}

/** 文件保存请求 */
export interface PodFileSaveReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  content: string
  createIfNotExists?: boolean
  backup?: boolean
  encoding?: string
  fileMode?: string
}

/** 文件保存响应 */
export interface PodFileSaveResp {
  filePath: string
  fileSize: number
  backupPath?: string
}

/** 实时跟踪文件请求 (WebSocket) */
export interface PodFileTailReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  lines?: number
  follow?: boolean
  retry?: boolean
}

/** 文件下载请求 */
export interface PodFileDownloadReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  compress?: boolean
}

/** 分块下载文件请求 */
export interface PodFileDownloadChunkReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  chunkIndex: number
  chunkSize?: number
}

/** 分块下载文件响应 */
export interface PodFileDownloadChunkResp {
  data: string
  chunkIndex: number
  chunkSize: number
  totalChunks: number
  fileSize: number
  isLast: boolean
  checksum: string
}

/** 文件上传请求（简单上传，小文件）*/
export interface PodFileUploadReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  fileName?: string
  fileMode?: string
  overwrite?: boolean
  createDirs?: boolean
}

/** 文件上传响应 */
export interface PodFileUploadResp {
  filePath: string
  fileSize: number
  checksum?: string
}

/** 分块上传初始化请求 */
export interface PodFileUploadInitReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  fileName: string
  fileSize: number
  chunkSize?: number
  fileMode?: string
}

/** 分块上传初始化响应 */
export interface PodFileUploadInitResp {
  sessionId: string
  chunkSize: number
  totalChunks: number
  expiresAt: number
}

/** 上传文件块请求 */
export interface PodFileUploadChunkReq {
  sessionId: string
  chunkIndex: number
  chunkData: string // Base64 编码
  checksum?: string
}

/** 上传文件块响应 */
export interface PodFileUploadChunkResp {
  chunkIndex: number
  uploaded: boolean
  progress: number
}

/** 完成分块上传请求 */
export interface PodFileUploadCompleteReq {
  sessionId: string
  finalChecksum?: string
}

/** 完成分块上传响应 */
export interface PodFileUploadCompleteResp {
  filePath: string
  fileSize: number
  checksum: string
  uploadTime: number
}

/** 查询上传状态请求（新增）*/
export interface PodFileUploadStatusReq {
  sessionId: string
}

/** 查询上传状态响应（新增）*/
export interface PodFileUploadStatusResp {
  sessionId: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadedChunks: number[]
  missingChunks: number[]
  progress: number
  status: string
  expiresAt: number
  createdAt: number
}

/** 取消上传请求（新增）*/
export interface PodFileUploadCancelReq {
  sessionId: string
}

/** 取消上传响应（新增）*/
export interface PodFileUploadCancelResp {
  sessionId: string
  canceled: boolean
  message: string
}

/** 文件删除请求 */
export interface PodFileDeleteReq {
  workloadId: number
  podName: string
  container?: string
  paths: string[]
  recursive?: boolean
  force?: boolean
}

/** 文件删除响应 */
export interface PodFileDeleteResp {
  deletedCount: number
  failedPaths?: string[]
  errors?: string[]
}

/** 文件移动/重命名请求 */
export interface PodFileMoveReq {
  workloadId: number
  podName: string
  container?: string
  sourcePath: string
  destPath: string
  overwrite?: boolean
}

/** 文件移动/重命名响应 */
export interface PodFileMoveResp {
  sourcePath: string
  destPath: string
  success: boolean
}

/** 文件复制请求 */
export interface PodFileCopyReq {
  workloadId: number
  podName: string
  container?: string
  sourcePath: string
  destPath: string
  overwrite?: boolean
  recursive?: boolean
  preserveAttrs?: boolean
}

/** 文件复制响应 */
export interface PodFileCopyResp {
  sourcePath: string
  destPath: string
  filesCopied: number
  totalSize: number
}

/** 创建目录请求 */
export interface PodFileCreateDirReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  mode?: string
  createParents?: boolean
}

/** 创建目录响应 */
export interface PodFileCreateDirResp {
  path: string
  created: boolean
}

/** 检查文件权限请求 */
export interface PodFileCheckPermissionReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  permission: string
}

/** 检查文件权限响应 */
export interface PodFileCheckPermissionResp {
  hasPermission: boolean
  currentMode: string
  owner: string
  group: string
}

/** 修改文件权限请求 */
export interface PodFileChmodReq {
  workloadId: number
  podName: string
  container?: string
  path: string
  mode: string
  recursive?: boolean
}

/** 修改文件权限响应 */
export interface PodFileChmodResp {
  path: string
  oldMode: string
  newMode: string
  success: boolean
}

/** 文件压缩请求 */
export interface PodFileCompressReq {
  workloadId: number
  podName: string
  container?: string
  paths: string[]
  destPath: string
  format?: string
  compressionLevel?: number
}

/** 文件压缩响应 */
export interface PodFileCompressResp {
  archivePath: string
  fileCount: number
  originalSize: number
  compressedSize: number
  compressionRatio: number
  duration: number
}

/** 文件解压请求 */
export interface PodFileExtractReq {
  workloadId: number
  podName: string
  container?: string
  archivePath: string
  destPath: string
  overwrite?: boolean
}

/** 文件解压响应 */
export interface PodFileExtractResp {
  destPath: string
  extractedFiles: number
  totalSize: number
  duration: number
}

/** 文件搜索请求 */
export interface PodFileSearchReq {
  workloadId: number
  podName: string
  container?: string
  path?: string
  pattern: string
  contentSearch?: string
  fileTypes?: string[]
  minSize?: number
  maxSize?: number
  modifiedAfter?: string
  modifiedBefore?: string
  maxDepth?: number
  maxResults?: number
  caseSensitive?: boolean
}

/** 文件搜索响应 */
export interface PodFileSearchResp {
  results: FileSearchResult[]
  totalFound: number
  searchTime: number
  truncated: boolean
}

// ========== API 接口 ==========

// ==================== Container 操作 ====================

/**
 * 获取 Pod 默认容器
 */
export async function getPodDefaultContainerApi(
  params: PodGetDefaultContainerReq
): Promise<PodGetDefaultContainerResp> {
  return request.get<PodGetDefaultContainerResp>({
    url: `${POD_BASE_PATH}/default-container`,
    params
  })
}

// ==================== Pod 日志操作 ====================

/**
 * 获取 Pod 日志（一次性，不跟踪）
 */
export async function getPodLogsApi(params: PodLogsGetReq) {
  return request.get<PodLogsGetResp>({
    url: `${POD_BASE_PATH}/logs/get`,
    params
  })
}

/**
 * 实时日志流（WebSocket）
 * @description 需要使用 WebSocket 连接，自动携带 token
 */
export function getPodLogsStreamUrl(params: PodLogsStreamReq): string {
  const query = buildQueryParams(params as any)
  const basePath = getApiBasePath()
  const baseUrl = `${basePath}/logs/stream${query ? `?${query}` : ''}`

  // ✅ 添加 token
  return addTokenToWsUrl(baseUrl)
}

/**
 * 下载 Pod 日志
 * @description 返回文件流，建议使用 window.open 或创建 a 标签下载
 */
export function getPodLogsDownloadUrl(params: PodLogsDownloadReq): string {
  const query = buildQueryParams(params as any)
  const basePath = getApiBasePath()
  return `${basePath}/logs/download${query ? `?${query}` : ''}`
}

// ==================== Pod Exec 操作 ====================

/**
 * 交互式执行命令（WebSocket）
 * @description 需要使用 WebSocket 连接，自动携带 token
 */
export function getPodExecTerminalUrl(params: PodExecReq): string {
  const query = buildQueryParams(params as any)
  const basePath = getApiBasePath()
  const baseUrl = `${basePath}/exec/terminal${query ? `?${query}` : ''}`

  // ✅ 添加 token
  return addTokenToWsUrl(baseUrl)
}

/**
 * 非交互式执行命令
 */
export async function execPodCommandApi(data: PodExecCommandReq) {
  return request.post<PodExecCommandResp>({
    url: `${POD_BASE_PATH}/exec/command`,
    data
  })
}

/**
 * Exec 会话心跳检查
 */
export async function podExecPingApi(params: PodExecPingReq) {
  return request.get<PodExecPingResp>({
    url: `${POD_BASE_PATH}/exec/ping`,
    params
  })
}

// ==================== Pod 文件操作 ====================

/**
 * 列出文件和目录
 */
export async function getPodFileListApi(params: PodFileListReq) {
  return request.get<PodFileListResp>({
    url: `${POD_BASE_PATH}/file/list`,
    params
  })
}

/**
 * 获取文件详细信息
 */
export async function getPodFileInfoApi(params: PodFileInfoReq) {
  return request.get<FileInfo>({
    url: `${POD_BASE_PATH}/file/info`,
    params
  })
}

/**
 * 获取文件统计信息
 */
export async function getPodFileStatsApi(params: PodFileStatsReq) {
  return request.get<PodFileStatsResp>({
    url: `${POD_BASE_PATH}/file/stats`,
    params
  })
}

/**
 * 搜索文件
 */
export async function searchPodFilesApi(data: PodFileSearchReq) {
  return request.post<PodFileSearchResp>({
    url: `${POD_BASE_PATH}/file/search`,
    data
  })
}

/**
 * 读取文件内容
 */
export async function readPodFileApi(data: PodFileReadReq) {
  return request.post<PodFileReadResp>({
    url: `${POD_BASE_PATH}/file/read`,
    data
  })
}

/**
 * 保存文件内容
 */
export async function savePodFileApi(data: PodFileSaveReq) {
  return request.post<PodFileSaveResp>({
    url: `${POD_BASE_PATH}/file/save`,
    data
  })
}
/**
 * 实时跟踪文件（WebSocket）
 * @description 需要使用 WebSocket 连接，自动携带 token
 */
export function getPodFileTailUrl(params: PodFileTailReq): string {
  const query = buildQueryParams(params as any)
  const basePath = getApiBasePath()
  const baseUrl = `${basePath}/file/tail${query ? `?${query}` : ''}`

  // ✅ 添加 token
  return addTokenToWsUrl(baseUrl)
}

/**
 * 下载文件
 * @description 返回文件流，建议使用 window.open 或创建 a 标签下载
 */
export function getPodFileDownloadUrl(params: PodFileDownloadReq): string {
  const query = buildQueryParams(params as any)
  const basePath = getApiBasePath()
  return `${basePath}/file/download${query ? `?${query}` : ''}`
}

/**
 * 分块下载文件
 */
export async function downloadPodFileChunkApi(
  params: PodFileDownloadChunkReq,
  onProgress?: (progress: number) => void
) {
  return request.get<PodFileDownloadChunkResp>({
    url: `${POD_BASE_PATH}/file/download/chunk`,
    params,
    timeout: 120000, // 2分钟超时
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100
        onProgress(progress)
      }
    }
  })
}

/**
 * 上传文件（简单上传，适用于小文件 < 100MB）
 * @description 需要使用 FormData 上传
 */
export async function uploadPodFileApi(formData: FormData) {
  return request.post<PodFileUploadResp>({
    url: `${POD_BASE_PATH}/file/upload`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 初始化分块上传（适用于大文件）
 */
export async function initPodFileUploadApi(data: PodFileUploadInitReq) {
  return request.post<PodFileUploadInitResp>({
    url: `${POD_BASE_PATH}/file/upload/init`,
    data,
    timeout: 60000 // 1 分钟
  })
}

/**
 * 上传文件块
 */
export async function uploadPodFileChunkApi(data: PodFileUploadChunkReq) {
  return request.post<PodFileUploadChunkResp>({
    url: `${POD_BASE_PATH}/file/upload/chunk`,
    data,
    timeout: 60000 // 1 分钟
  })
}

/**
 * 完成分块上传
 */
export async function completePodFileUploadApi(data: PodFileUploadCompleteReq) {
  return request.post<PodFileUploadCompleteResp>({
    url: `${POD_BASE_PATH}/file/upload/complete`,
    data,
    timeout: 300000, // 5 分钟超时
  })
}

/**
 * 查询上传状态（新增）
 */
export async function getPodFileUploadStatusApi(params: PodFileUploadStatusReq) {
  return request.get<PodFileUploadStatusResp>({
    url: `${POD_BASE_PATH}/file/upload/status`,
    params
  })
}

/**
 * 取消上传（新增）
 */
export async function cancelPodFileUploadApi(data: PodFileUploadCancelReq) {
  return request.post<PodFileUploadCancelResp>({
    url: `${POD_BASE_PATH}/file/upload/cancel`,
    data,
    timeout: 30000 // 30 秒
  })
}

/**
 * 删除文件或目录
 */
export async function deletePodFileApi(data: PodFileDeleteReq) {
  return request.post<PodFileDeleteResp>({
    url: `${POD_BASE_PATH}/file/delete`,
    data
  })
}

/**
 * 移动或重命名文件
 */
export async function movePodFileApi(data: PodFileMoveReq) {
  return request.post<PodFileMoveResp>({
    url: `${POD_BASE_PATH}/file/move`,
    data
  })
}

/**
 * 复制文件或目录
 */
export async function copyPodFileApi(data: PodFileCopyReq) {
  return request.post<PodFileCopyResp>({
    url: `${POD_BASE_PATH}/file/copy`,
    data
  })
}

/**
 * 创建目录
 */
export async function createPodDirApi(data: PodFileCreateDirReq) {
  return request.post<PodFileCreateDirResp>({
    url: `${POD_BASE_PATH}/file/mkdir`,
    data
  })
}

/**
 * 检查文件权限
 */
export async function checkPodFilePermissionApi(data: PodFileCheckPermissionReq) {
  return request.post<PodFileCheckPermissionResp>({
    url: `${POD_BASE_PATH}/file/check-permission`,
    data
  })
}

/**
 * 修改文件权限
 */
export async function chmodPodFileApi(data: PodFileChmodReq) {
  return request.post<PodFileChmodResp>({
    url: `${POD_BASE_PATH}/file/chmod`,
    data
  })
}

/**
 * 压缩文件或目录
 */
export async function compressPodFilesApi(data: PodFileCompressReq) {
  return request.post<PodFileCompressResp>({
    url: `${POD_BASE_PATH}/file/compress`,
    data
  })
}

/**
 * 解压文件
 */
export async function extractPodFileApi(data: PodFileExtractReq) {
  return request.post<PodFileExtractResp>({
    url: `${POD_BASE_PATH}/file/extract`,
    data
  })
}

// ========== WebSocket 工具函数 ==========

/**
 * 创建 WebSocket 连接的通用函数
 * @param url WebSocket 相对路径（会自动添加协议和主机）
 * @param onMessage 消息处理函数
 * @param onError 错误处理函数
 * @param onClose 关闭处理函数
 */
export function createWebSocket(
  url: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket {
  // 确定 WebSocket 协议
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host

  // 确保 URL 以 / 开头
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`

  // 构建完整的 WebSocket URL
  const wsUrl = `${protocol}//${host}${normalizedUrl}`

  console.log('[WebSocket] 连接到:', wsUrl)

  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {
      // 如果不是 JSON，直接传递原始数据
      onMessage(event.data)
    }
  }

  if (onError) {
    ws.onerror = onError
  }

  if (onClose) {
    ws.onclose = onClose
  }

  return ws
}

/**
 * WebSocket 消息类型
 */
export enum WSMessageType {
  // 通用消息类型
  SUCCESS = 'success',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',

  // 日志流消息类型
  LOG_INIT = 'log_init',
  LOG_DATA = 'log_data',
  LOG_END = 'log_end',
  LOG_ERROR = 'log_error',

  // Exec 消息类型
  EXEC_INIT = 'exec_init',
  EXEC_STDIN = 'exec_stdin',
  EXEC_STDOUT = 'exec_stdout',
  EXEC_STDERR = 'exec_stderr',
  EXEC_RESIZE = 'exec_resize',
  EXEC_EXIT = 'exec_exit',

  // 文件跟踪消息类型
  FILE_TAIL_INIT = 'tail_init',
  FILE_TAIL_DATA = 'tail_data',
  FILE_TAIL_END = 'tail_end'
}

/**
 * WebSocket 消息结构
 */
export interface WSMessage<T = any> {
  type: WSMessageType | string
  data: T
}


/**
 * 为 WebSocket URL 添加 token 参数
 * @param url 原始 URL（可能已经包含其他查询参数）
 * @returns 添加了 token 的 URL
 */
function addTokenToWsUrl(url: string): string {
  const { accessToken } = useUserStore()

  if (!accessToken) {
    console.warn('[WebSocket] 未找到 token，可能需要重新登录')
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(accessToken)}`
}