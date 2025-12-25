<template>
  <div class="download-manager-panel">
    <!-- 操作栏 -->
    <div class="download-toolbar">
      <div class="toolbar-info">
        <span class="info-text">
          <strong>{{ downloads.length }}</strong> 个任务
        </span>
        <span v-if="activeDownloads > 0" class="info-text active">
          <strong>{{ activeDownloads }}</strong> 个进行中
        </span>
      </div>
      <div class="toolbar-actions">
        <ElButton size="small" @click="clearCompleted" :disabled="completedDownloads.length === 0">
          <Trash2 :size="14" />
          清除已完成
        </ElButton>
        <ElButton size="small" @click="cancelAll" :disabled="activeDownloads === 0" type="danger">
          <XCircle :size="14" />
          取消全部
        </ElButton>
      </div>
    </div>

    <!-- 下载项列表 -->
    <div class="download-items">
      <div
        v-for="item in downloads"
        :key="item.id"
        class="download-item"
        :class="{ completed: item.status === 'completed' }"
      >
        <!-- 文件图标和信息 -->
        <div class="item-header">
          <component :is="getFileIcon(item.fileName)" :size="32" class="file-icon" />
          <div class="file-info">
            <div class="file-name" :title="item.fileName">
              {{ item.fileName }}
            </div>
            <div class="file-meta">
              <span>{{ formatFileSize(item.fileSize) }}</span>
              <span v-if="item.status === 'downloading' && item.speed">
                {{ formatSpeed(item.speed) }}
              </span>
            </div>
          </div>

          <!-- 状态图标 -->
          <div class="item-status">
            <Loader2 v-if="item.status === 'downloading'" :size="20" class="loading-icon" />
            <CheckCircle v-else-if="item.status === 'completed'" :size="20" class="success-icon" />
            <XCircle v-else-if="item.status === 'failed'" :size="20" class="error-icon" />
            <PauseCircle v-else-if="item.status === 'paused'" :size="20" class="pause-icon" />
          </div>
        </div>

        <!-- 进度条 -->
        <div v-if="item.status !== 'completed'" class="item-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{
                success: item.status === 'completed',
                error: item.status === 'failed'
              }"
              :style="{ width: item.progress + '%' }"
            ></div>
          </div>
          <div class="progress-info">
            <span>{{ Math.round(item.progress) }}%</span>
            <span v-if="item.status === 'downloading' && item.eta">
              剩余 {{ formatTime(item.eta) }}
            </span>
          </div>
        </div>

        <!-- 成功提示 -->
        <div v-if="item.status === 'completed'" class="item-success">
          <CheckCircle :size="14" />
          下载完成
        </div>

        <!-- 错误信息 -->
        <div v-if="item.error" class="item-error">
          <AlertCircle :size="14" />
          {{ item.error }}
        </div>

        <!-- 操作按钮 -->
        <div class="item-actions">
          <ElButton
            v-if="item.status === 'downloading'"
            text
            size="small"
            @click="pauseDownload(item.id)"
          >
            <Pause :size="14" />
            暂停
          </ElButton>
          <ElButton
            v-if="item.status === 'paused'"
            text
            size="small"
            @click="resumeDownload(item.id)"
          >
            <Play :size="14" />
            继续
          </ElButton>
          <ElButton
            v-if="item.status === 'failed'"
            text
            size="small"
            @click="retryDownload(item.id)"
          >
            <RefreshCw :size="14" />
            重试
          </ElButton>
          <ElButton
            v-if="['downloading', 'paused'].includes(item.status)"
            text
            size="small"
            type="danger"
            @click="cancelDownload(item.id)"
          >
            <X :size="14" />
            取消
          </ElButton>
          <ElButton
            v-if="['completed', 'failed', 'cancelled'].includes(item.status)"
            text
            size="small"
            @click="removeDownload(item.id)"
          >
            <X :size="14" />
            移除
          </ElButton>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="downloads.length === 0" class="empty-state">
        <Download :size="64" class="empty-icon" />
        <div class="empty-text">暂无下载任务</div>
        <div class="empty-hint">下载文件将显示在这里</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Download,
    File,
    FileText,
    FileCode,
    FileImage,
    Trash2,
    XCircle,
    CheckCircle,
    PauseCircle,
    AlertCircle,
    Pause,
    Play,
    RefreshCw,
    X,
    Loader2
  } from 'lucide-vue-next'
  import { getPodFileDownloadUrl, downloadPodFileChunkApi, type PodFileDownloadReq } from '@/api'

  interface DownloadItem {
    id: string
    fileName: string
    filePath: string
    fileSize: number
    progress: number
    status: 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'
    error?: string
    speed?: number
    eta?: number
    startTime: number
    downloadedBytes: number
    blobUrl?: string
    xhr?: XMLHttpRequest
    useChunked: boolean
    totalChunks?: number
    downloadedChunks?: number
    chunks?: Blob[]
    abortControllers?: AbortController[]
  }

  interface DownloadOptions extends PodFileDownloadReq {
    fileName: string
    fileSize: number
  }

  const props = defineProps<{
    isPanelMode?: boolean
  }>()

  const emit = defineEmits<{
    activeCountChange: [count: number]
  }>()

  const downloads = ref<DownloadItem[]>([])

  const activeDownloads = computed(() => {
    return downloads.value.filter((d) => d.status === 'downloading').length
  })

  const completedDownloads = computed(() => {
    return downloads.value.filter((d) => d.status === 'completed')
  })

  // 监听活跃下载数量变化
  watch(activeDownloads, (count) => {
    emit('activeCountChange', count)
  })

  const CHUNK_THRESHOLD = 100 * 1024 * 1024
  const CHUNK_SIZE = 2 * 1024 * 1024
  const MAX_CONCURRENT_CHUNKS = 6

  function updateDownloadItem(id: string, updates: Partial<DownloadItem>) {
    const index = downloads.value.findIndex((d) => d.id === id)
    if (index > -1) {
      Object.assign(downloads.value[index], updates)
      downloads.value = [...downloads.value]
    }
  }

  function startDownload(options: DownloadOptions) {
    const useChunked = options.fileSize > CHUNK_THRESHOLD

    const item: DownloadItem = {
      id: generateId(),
      fileName: options.fileName,
      filePath: options.path,
      fileSize: options.fileSize,
      progress: 0,
      status: 'downloading',
      speed: 0,
      startTime: Date.now(),
      downloadedBytes: 0,
      useChunked,
      chunks: useChunked ? [] : undefined,
      abortControllers: useChunked ? [] : undefined
    }

    downloads.value.unshift(item)

    if (useChunked) {
      downloadWithChunks(item, options)
    } else {
      downloadWithXHR(item, options)
    }

    ElMessage.success(`开始下载: ${options.fileName}`)
  }

  function downloadWithXHR(item: DownloadItem, options: DownloadOptions) {
    const url = getPodFileDownloadUrl(options)
    const xhr = new XMLHttpRequest()
    item.xhr = xhr

    xhr.open('GET', url, true)
    xhr.responseType = 'blob'

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const now = Date.now()
        const elapsed = (now - item.startTime) / 1000
        const downloadedBytes = event.loaded
        const progress = (event.loaded / event.total) * 100
        const speed = event.loaded / elapsed
        const remaining = event.total - event.loaded
        const eta = remaining / speed

        updateDownloadItem(item.id, {
          downloadedBytes,
          progress,
          speed,
          eta
        })
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response as Blob
        const blobUrl = URL.createObjectURL(blob)

        triggerDownload(blobUrl, item.fileName)

        updateDownloadItem(item.id, {
          blobUrl,
          progress: 100,
          status: 'completed'
        })

        ElMessage.success(`下载完成: ${item.fileName}`)
      } else {
        updateDownloadItem(item.id, {
          status: 'failed',
          error: `下载失败: HTTP ${xhr.status}`
        })
      }
    }

    xhr.onerror = () => {
      updateDownloadItem(item.id, {
        status: 'failed',
        error: '网络错误'
      })
    }

    xhr.onabort = () => {
      const currentItem = downloads.value.find((d) => d.id === item.id)
      if (currentItem && currentItem.status === 'downloading') {
        updateDownloadItem(item.id, {
          status: 'cancelled'
        })
      }
    }

    xhr.send()
  }

  async function downloadWithChunks(item: DownloadItem, options: DownloadOptions) {
    const totalChunks = Math.ceil(options.fileSize / CHUNK_SIZE)

    updateDownloadItem(item.id, {
      totalChunks,
      downloadedChunks: 0,
      chunks: new Array(totalChunks),
      abortControllers: new Array(totalChunks)
    })

    try {
      for (let i = 0; i < totalChunks; i += MAX_CONCURRENT_CHUNKS) {
        const batch = []
        for (let j = i; j < Math.min(i + MAX_CONCURRENT_CHUNKS, totalChunks); j++) {
          batch.push(downloadChunk(item, options, j))
        }
        await Promise.all(batch)

        const currentItem = downloads.value.find((d) => d.id === item.id)
        if (!currentItem || currentItem.status !== 'downloading') {
          throw new Error('下载已取消')
        }
      }

      const currentItem = downloads.value.find((d) => d.id === item.id)
      if (currentItem && currentItem.status === 'downloading') {
        await mergeChunks(item)
      }
    } catch (error: any) {
      console.error('分块下载失败:', error)
      updateDownloadItem(item.id, {
        status: 'failed',
        error: error.message || '下载失败'
      })
    }
  }

  async function downloadChunk(
    item: DownloadItem,
    options: DownloadOptions,
    chunkIndex: number
  ): Promise<void> {
    const currentItem = downloads.value.find((d) => d.id === item.id)
    if (!currentItem || currentItem.status !== 'downloading') {
      throw new Error('下载已取消')
    }

    try {
      const response = await downloadPodFileChunkApi({
        workloadId: options.workloadId,
        podName: options.podName,
        container: options.container,
        path: options.path,
        chunkIndex,
        chunkSize: CHUNK_SIZE
      })

      const binaryString = atob(response.data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes])

      if (currentItem.chunks) {
        currentItem.chunks[chunkIndex] = blob
      }

      const downloadedChunks = (currentItem.downloadedChunks || 0) + 1
      const progress = (downloadedChunks / currentItem.totalChunks!) * 100
      const downloadedBytes = downloadedChunks * CHUNK_SIZE

      const elapsed = (Date.now() - currentItem.startTime) / 1000
      const speed = downloadedBytes / elapsed
      const remaining = currentItem.fileSize - downloadedBytes
      const eta = remaining / speed

      updateDownloadItem(item.id, {
        downloadedChunks,
        progress,
        downloadedBytes,
        speed,
        eta
      })
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('下载已取消')
      }
      throw error
    }
  }

  async function mergeChunks(item: DownloadItem) {
    const currentItem = downloads.value.find((d) => d.id === item.id)
    if (!currentItem || !currentItem.chunks) {
      throw new Error('块数据丢失')
    }

    const blob = new Blob(currentItem.chunks, { type: 'application/octet-stream' })
    const blobUrl = URL.createObjectURL(blob)

    triggerDownload(blobUrl, item.fileName)

    updateDownloadItem(item.id, {
      blobUrl,
      progress: 100,
      status: 'completed',
      chunks: undefined,
      abortControllers: undefined
    })

    ElMessage.success(`下载完成: ${item.fileName}`)
  }

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function pauseDownload(id: string) {
    const item = downloads.value.find((d) => d.id === id)
    if (!item || item.status !== 'downloading') return

    if (item.xhr) {
      item.xhr.abort()
    } else if (item.abortControllers) {
      item.abortControllers.forEach((controller) => controller?.abort())
    }

    updateDownloadItem(id, { status: 'paused' })
    ElMessage.info(`已暂停: ${item.fileName}`)
  }

  function resumeDownload(id: string) {
    const item = downloads.value.find((d) => d.id === id)
    if (!item || item.status !== 'paused') return

    ElMessage.info('恢复下载功能开发中...')
  }

  function retryDownload(id: string) {
    const item = downloads.value.find((d) => d.id === id)
    if (!item || item.status !== 'failed') return

    ElMessage.info('重试下载功能开发中...')
  }

  function cancelDownload(id: string) {
    const item = downloads.value.find((d) => d.id === id)
    if (!item) return

    if (item.xhr) {
      item.xhr.abort()
    } else if (item.abortControllers) {
      item.abortControllers.forEach((controller) => controller?.abort())
    }

    updateDownloadItem(id, {
      status: 'cancelled',
      error: '已取消'
    })
  }

  function cancelAll() {
    downloads.value.filter((d) => d.status === 'downloading').forEach((d) => cancelDownload(d.id))
  }

  function removeDownload(id: string) {
    const index = downloads.value.findIndex((d) => d.id === id)
    if (index > -1) {
      const item = downloads.value[index]
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl)
      }
      downloads.value.splice(index, 1)
    }
  }

  function clearCompleted() {
    const completed = downloads.value.filter((d) => d.status === 'completed')
    completed.forEach((item) => {
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl)
      }
    })
    downloads.value = downloads.value.filter((d) => d.status !== 'completed')
    ElMessage.success('已清除完成的下载')
  }

  function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const codeExts = ['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'go', 'java']
    if (codeExts.includes(ext)) return FileCode

    const textExts = ['txt', 'md', 'log']
    if (textExts.includes(ext)) return FileText

    const imageExts = ['jpg', 'jpeg', 'png', 'gif']
    if (imageExts.includes(ext)) return FileImage

    return File
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s'
  }

  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '--'

    if (seconds < 60) {
      return `${Math.round(seconds)}秒`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}分钟`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}小时${minutes}分钟`
    }
  }

  function generateId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  defineExpose({
    startDownload
  })
</script>

<style lang="scss" scoped>
  .download-manager-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .download-toolbar {
    padding: 16px 20px;
    border-bottom: 1px solid #e3e9ef;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    background: #f9fbfd;
  }

  .toolbar-info {
    display: flex;
    gap: 16px;
  }

  .info-text {
    font-size: 13px;
    color: #606266;

    strong {
      color: #303133;
      font-size: 16px;
    }

    &.active strong {
      color: #409eff;
    }
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }

  .download-items {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 3px;
    }
  }

  .download-item {
    padding: 16px;
    background: #f9fbfd;
    border-radius: 8px;
    margin-bottom: 12px;
    border: 1px solid #e3e9ef;
    transition: all 0.3s ease;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 169, 255, 0.1);
    }

    &.completed {
      background: rgba(103, 194, 58, 0.05);
      border-color: rgba(103, 194, 58, 0.2);
    }
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .file-icon {
    flex-shrink: 0;
    color: #409eff;
  }

  .file-info {
    flex: 1;
    min-width: 0;
  }

  .file-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  .file-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #909399;
  }

  .item-status {
    flex-shrink: 0;

    .loading-icon {
      color: #409eff;
      animation: spin 1s linear infinite;
    }

    .success-icon {
      color: #67c23a;
    }

    .error-icon {
      color: #f56c6c;
    }

    .pause-icon {
      color: #e6a23c;
    }
  }

  .item-progress {
    margin-bottom: 12px;
  }

  .progress-bar {
    height: 6px;
    background: #e3e9ef;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 6px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
    transition: width 0.3s ease;
    border-radius: 3px;

    &.success {
      background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
    }

    &.error {
      background: #f56c6c;
    }
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #606266;

    span:last-child {
      color: #409eff;
    }
  }

  .item-success {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(103, 194, 58, 0.1);
    border-radius: 4px;
    color: #67c23a;
    font-size: 12px;
    margin-bottom: 12px;
  }

  .item-error {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(245, 108, 108, 0.1);
    border-radius: 4px;
    color: #f56c6c;
    font-size: 12px;
    margin-bottom: 12px;
  }

  .item-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #c0c4cc;
  }

  .empty-icon {
    opacity: 0.5;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 16px;
    color: #909399;
    margin-bottom: 8px;
  }

  .empty-hint {
    font-size: 14px;
    color: #c0c4cc;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
