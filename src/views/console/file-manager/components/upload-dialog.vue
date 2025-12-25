<template>
  <el-dialog
    v-model="visible"
    title="上传文件"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="upload-dialog-bright"
  >
    <div class="upload-dialog">
      <!-- 上传区域 -->
      <div
        v-if="fileList.length === 0"
        class="upload-area"
        :class="{ 'drag-over': dragOver }"
        @click="selectFiles"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <i class="mdi mdi-cloud-upload upload-icon"></i>
        <div class="upload-text">点击或拖拽文件到此处上传</div>
        <div class="upload-hint">
          支持批量上传 · 小文件 (&lt;100MB) 直接上传 · 大文件自动分块上传
        </div>
        <div class="upload-limit">单个文件最大 10GB</div>
      </div>

      <input
        ref="fileInput"
        type="file"
        multiple
        style="display: none"
        @change="handleFileSelect"
      />

      <!-- 文件列表 -->
      <div v-if="fileList.length > 0" class="file-list">
        <div class="file-list-header">
          <span>文件列表 ({{ fileList.length }})</span>
          <el-button v-if="!uploading" text size="small" @click="selectFiles">
            <i class="mdi mdi-plus"></i> 继续添加
          </el-button>
        </div>

        <div class="file-items">
          <div v-for="(item, index) in fileList" :key="index" class="file-item">
            <div class="file-icon-wrapper">
              <i class="mdi mdi-file file-icon"></i>
            </div>

            <div class="file-content">
              <div class="file-header">
                <div class="file-info">
                  <div class="file-name" :title="item.file.name">
                    {{ item.file.name }}
                  </div>
                  <div class="file-meta">
                    <span class="file-size">{{ formatFileSize(item.file.size) }}</span>
                    <span v-if="item.useChunked" class="upload-mode">
                      <i class="mdi mdi-package-variant"></i> 分块上传
                    </span>
                  </div>
                </div>

                <div class="file-actions">
                  <el-tag v-if="item.uploaded" type="success" size="small">
                    <i class="mdi mdi-check-circle"></i> 成功
                  </el-tag>

                  <el-tag v-else-if="item.error" type="danger" size="small" :title="item.error">
                    <i class="mdi mdi-alert-circle"></i> 失败
                  </el-tag>

                  <el-tag v-else-if="item.uploading" type="info" size="small">
                    <i class="mdi mdi-loading mdi-spin"></i> 上传中
                  </el-tag>

                  <el-tag v-else type="info" size="small">
                    <i class="mdi mdi-clock-outline"></i> 等待
                  </el-tag>

                  <el-button
                    v-if="!item.uploading && !item.uploaded"
                    text
                    size="small"
                    @click="removeFile(index)"
                  >
                    <i class="mdi mdi-close"></i>
                  </el-button>

                  <el-button
                    v-if="item.uploading && item.sessionId"
                    text
                    size="small"
                    type="danger"
                    @click="cancelUpload(item)"
                  >
                    <i class="mdi mdi-close"></i> 取消
                  </el-button>
                </div>
              </div>

              <!-- 进度条 -->
              <div v-if="item.uploading || item.uploaded" class="progress-wrapper">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :class="{ success: item.uploaded, error: item.error }"
                    :style="{ width: item.progress + '%' }"
                  ></div>
                </div>
                <div class="progress-text">
                  <span>{{ Math.round(item.progress) }}%</span>
                  <span v-if="item.uploading && item.speed" class="upload-speed">
                    {{ formatSpeed(item.speed) }}
                  </span>
                  <span v-if="item.uploading && item.eta" class="upload-eta">
                    剩余 {{ formatTime(item.eta) }}
                  </span>
                </div>
              </div>

              <!-- 分块上传详情 -->
              <div v-if="item.useChunked && item.uploading" class="chunk-details">
                <span>块: {{ item.uploadedChunks || 0 }} / {{ item.totalChunks || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传统计 -->
      <div v-if="fileList.length > 0" class="upload-summary">
        <div class="summary-item">
          <i class="mdi mdi-file-multiple"></i>
          总文件: {{ fileList.length }}
        </div>
        <div class="summary-item">
          <i class="mdi mdi-check-circle"></i>
          已完成: {{ uploadedCount }}
        </div>
        <div v-if="failedCount > 0" class="summary-item error">
          <i class="mdi mdi-alert-circle"></i>
          失败: {{ failedCount }}
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" :disabled="uploading">
          {{ uploading ? '上传中...' : '取消' }}
        </el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="fileList.length === 0 || allUploaded"
          @click="handleUpload"
        >
          {{
            uploading
              ? `上传中 (${uploadedCount}/${fileList.length})`
              : allUploaded
                ? '全部完成'
                : '开始上传'
          }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    uploadPodFileApi,
    initPodFileUploadApi,
    uploadPodFileChunkApi,
    completePodFileUploadApi,
    cancelPodFileUploadApi
  } from '@/api'

  interface FileItem {
    file: File
    progress: number
    uploading: boolean
    uploaded: boolean
    error: string | null
    useChunked: boolean
    sessionId?: string
    totalChunks?: number
    uploadedChunks?: number
    chunkSize?: number
    speed?: number
    eta?: number
    startTime?: number
    cancelRequested?: boolean
  }

  const props = defineProps<{
    modelValue: boolean
    workspaceId: number
    podName: string
    container: string
    currentPath: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    success: []
  }>()

  const visible = ref(false)
  const fileInput = ref<HTMLInputElement>()
  const dragOver = ref(false)
  const uploading = ref(false)
  const fileList = ref<FileItem[]>([])

  // 配置
  const CHUNK_THRESHOLD = 100 * 1024 * 1024 // 100MB
  const DEFAULT_CHUNK_SIZE = 1 * 1024 * 1024 // 1MB
  const MAX_RETRY = 3 // 最大重试次数
  const RETRY_DELAY = 2000 // 重试延迟 2 秒

  const uploadedCount = computed(() => fileList.value.filter((f) => f.uploaded).length)
  const failedCount = computed(() => fileList.value.filter((f) => f.error).length)
  const allUploaded = computed(
    () => fileList.value.length > 0 && fileList.value.every((f) => f.uploaded)
  )

  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val
      if (!val) {
        fileList.value = []
      }
    }
  )

  watch(visible, (val) => {
    emit('update:modelValue', val)
  })

  function selectFiles() {
    fileInput.value?.click()
  }

  function handleDragOver() {
    dragOver.value = true
  }

  function handleDragLeave() {
    dragOver.value = false
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files) {
      addFiles(Array.from(target.files))
    }
    target.value = ''
  }

  function handleDrop(event: DragEvent) {
    dragOver.value = false
    if (event.dataTransfer?.files) {
      addFiles(Array.from(event.dataTransfer.files))
    }
  }

  function addFiles(files: File[]) {
    const maxSize = 10 * 1024 * 1024 * 1024

    for (const file of files) {
      if (file.size > maxSize) {
        continue
      }

      if (!fileList.value.find((item) => item.file.name === file.name)) {
        const useChunked = file.size > CHUNK_THRESHOLD

        fileList.value.push({
          file,
          progress: 0,
          uploading: false,
          uploaded: false,
          error: null,
          useChunked
        })
      }
    }
  }

  function removeFile(index: number) {
    fileList.value.splice(index, 1)
  }

  async function handleUpload() {
    if (fileList.value.length === 0) return

    uploading.value = true

    // 串行上传每个文件
    for (const item of fileList.value) {
      if (item.uploaded || item.uploading) continue
      await uploadFile(item)
    }

    uploading.value = false

    const allSuccess = fileList.value.every((item) => item.uploaded)
    const anySuccess = fileList.value.some((item) => item.uploaded)

    if (allSuccess) {
      ElMessage.success('所有文件上传成功')
      emit('success')
      setTimeout(() => {
        handleClose()
      }, 1000)
    } else if (anySuccess) {
      emit('success')
    }
  }

  async function uploadFile(item: FileItem) {
    try {
      item.uploading = true
      item.error = null
      item.startTime = Date.now()
      item.cancelRequested = false

      if (item.useChunked) {
        await uploadFileChunked(item)
      } else {
        await uploadFileSimple(item)
      }

      item.uploaded = true
      item.progress = 100
    } catch (error: any) {
      console.error('上传失败:', error)
      item.error = error.message || '上传失败'

      if (!item.cancelRequested) {
      }
    } finally {
      item.uploading = false
    }
  }

  async function uploadFileSimple(item: FileItem) {
    const formData = new FormData()
    formData.append('file', item.file)
    formData.append('workloadId', String(props.workspaceId))
    formData.append('podName', props.podName)
    if (props.container) {
      formData.append('container', props.container)
    }
    formData.append('path', props.currentPath)
    formData.append('overwrite', 'true')

    const progressInterval = setInterval(() => {
      if (item.progress < 90) {
        item.progress += Math.random() * 15
        updateSpeed(item)
      }
    }, 200)

    try {
      await uploadPodFileApi(formData)
      clearInterval(progressInterval)
    } catch (error) {
      clearInterval(progressInterval)
      throw error
    }
  }

  async function uploadFileChunked(item: FileItem) {
    const SparkMD5Module = await import('spark-md5')
    const SparkMD5 = SparkMD5Module.default || SparkMD5Module

    const chunkSize = DEFAULT_CHUNK_SIZE
    const totalChunks = Math.ceil(item.file.size / chunkSize)

    item.totalChunks = totalChunks
    item.chunkSize = chunkSize
    item.uploadedChunks = 0

    // 1. 初始化
    const initResp = await initPodFileUploadApi({
      workloadId: props.workspaceId,
      podName: props.podName,
      container: props.container,
      path: props.currentPath,
      fileName: item.file.name,
      fileSize: item.file.size,
      chunkSize: chunkSize
    })

    item.sessionId = initResp.sessionId

    // 验证 sessionId
    if (!item.sessionId) {
      throw new Error('初始化失败: sessionId 为空')
    }

    // 2. 串行上传每个块
    for (let i = 0; i < totalChunks; i++) {
      if (item.cancelRequested) {
        throw new Error('用户取消上传')
      }

      // 带重试的上传单个块
      await uploadChunkWithRetry(item, i, SparkMD5)

      // 更新进度
      item.uploadedChunks = i + 1
      item.progress = ((i + 1) / totalChunks) * 95
      updateSpeed(item)
    }

    // 3. 计算文件 MD5
    item.progress = 96
    const fileMD5 = await calculateFileMD5(item.file, SparkMD5)

    // 4. 完成上传
    item.progress = 98
    await completePodFileUploadApi({
      sessionId: item.sessionId,
      finalChecksum: fileMD5
    })

    item.progress = 100
  }

  // 带重试的上传单个块
  async function uploadChunkWithRetry(item: FileItem, chunkIndex: number, SparkMD5: any) {
    let lastError: Error | null = null

    for (let retry = 0; retry <= MAX_RETRY; retry++) {
      try {
        const start = chunkIndex * item.chunkSize!
        const end = Math.min(start + item.chunkSize!, item.file.size)
        const chunk = item.file.slice(start, end)

        // 读取块数据
        const chunkData = await readFileAsArrayBuffer(chunk)
        const base64Data = arrayBufferToBase64(chunkData)
        const chunkMD5 = SparkMD5.ArrayBuffer.hash(chunkData)

        // 上传块
        await uploadPodFileChunkApi({
          sessionId: item.sessionId!,
          chunkIndex: chunkIndex,
          chunkData: base64Data,
          checksum: chunkMD5
        })

        // 成功
        return
      } catch (error: any) {
        lastError = error
        console.error(
          `块 ${chunkIndex} 上传失败 (尝试 ${retry + 1}/${MAX_RETRY + 1}):`,
          error.message
        )

        if (retry < MAX_RETRY) {
          // 等待后重试
          await sleep(RETRY_DELAY)
        }
      }
    }

    // 所有重试都失败
    throw new Error(`块 ${chunkIndex} 上传失败: ${lastError?.message || '未知错误'}`)
  }

  async function cancelUpload(item: FileItem) {
    item.cancelRequested = true

    if (!item.sessionId) {
      item.uploading = false
      item.error = '已取消'
      return
    }

    try {
      await cancelPodFileUploadApi({
        sessionId: item.sessionId
      })

      item.uploading = false
      item.error = '已取消'
      ElMessage.info(`已取消上传: ${item.file.name}`)
    } catch (error: any) {
      console.error('取消上传失败:', error)
    }
  }

  function updateSpeed(item: FileItem) {
    if (!item.startTime) return

    const elapsed = (Date.now() - item.startTime) / 1000
    const uploadedBytes = item.file.size * (item.progress / 100)
    item.speed = uploadedBytes / elapsed

    const remainingBytes = item.file.size - uploadedBytes
    item.eta = remainingBytes / item.speed
  }

  function handleClose() {
    if (uploading.value) {
      return
    }
    visible.value = false
    fileList.value = []
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function readFileAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target!.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(blob)
    })
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  async function calculateFileMD5(file: File, SparkMD5: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()
      const chunkSize = 2 * 1024 * 1024
      let currentChunk = 0
      const chunks = Math.ceil(file.size / chunkSize)

      fileReader.onload = (e) => {
        spark.append(e.target!.result as ArrayBuffer)
        currentChunk++

        if (currentChunk < chunks) {
          loadNext()
        } else {
          resolve(spark.end())
        }
      }

      fileReader.onerror = reject

      function loadNext() {
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        fileReader.readAsArrayBuffer(file.slice(start, end))
      }

      loadNext()
    })
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

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}时${minutes}分`
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`
    } else {
      return `${secs}秒`
    }
  }
</script>

<style lang="scss" scoped>
  .upload-dialog-bright {
    :deep(.el-dialog) {
      border-radius: 8px;
      box-shadow: 0 12px 24px 0 rgba(36, 46, 66, 0.2);
    }
  }

  .upload-dialog {
    min-height: 200px;
  }

  .upload-area {
    border: 2px dashed #d8dee5;
    border-radius: 8px;
    padding: 50px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #f9fbfd;

    &:hover,
    &.drag-over {
      border-color: #55bc8a;
      background: rgba(85, 188, 138, 0.05);

      .upload-icon {
        transform: scale(1.1);
      }
    }
  }

  .upload-icon {
    font-size: 72px;
    color: #55bc8a;
    margin-bottom: 16px;
    transition: transform 0.3s ease;
  }

  .upload-text {
    font-size: 16px;
    color: #242e42;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .upload-hint {
    font-size: 13px;
    color: #79879c;
    margin-bottom: 4px;
  }

  .upload-limit {
    font-size: 12px;
    color: #b6c2cd;
  }

  .file-list {
    margin-top: 20px;
  }

  .file-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 4px;

    span {
      font-size: 14px;
      font-weight: 500;
      color: #242e42;
    }

    .el-button {
      font-size: 13px;

      i {
        font-size: 16px;
      }
    }
  }

  .file-items {
    max-height: 400px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d8dee5;
      border-radius: 3px;
    }
  }

  .file-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #f9fbfd;
    border-radius: 8px;
    margin-bottom: 12px;
    border: 1px solid #e3e9ef;
    transition: all 0.2s ease;

    &:hover {
      border-color: #d8dee5;
      box-shadow: 0 2px 8px rgba(36, 46, 66, 0.08);
    }
  }

  .file-icon-wrapper {
    flex-shrink: 0;

    .file-icon {
      font-size: 32px;
      color: #79879c;
    }
  }

  .file-content {
    flex: 1;
    min-width: 0;
  }

  .file-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
  }

  .file-info {
    flex: 1;
    min-width: 0;
  }

  .file-name {
    font-size: 14px;
    font-weight: 500;
    color: #242e42;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  .file-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #79879c;

    .upload-mode {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: rgba(85, 188, 138, 0.1);
      color: #55bc8a;
      border-radius: 4px;

      i {
        font-size: 14px;
      }
    }
  }

  .file-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    .el-tag {
      display: flex;
      align-items: center;
      gap: 4px;

      i {
        font-size: 14px;
      }

      .mdi-spin {
        animation: spin 1s linear infinite;
      }
    }

    .el-button {
      padding: 4px 8px;

      i {
        font-size: 16px;
      }
    }
  }

  .progress-wrapper {
    margin-top: 8px;
  }

  .progress-bar {
    height: 6px;
    background: #e3e9ef;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #55bc8a 0%, #479e76 100%);
    transition: width 0.3s ease;
    border-radius: 3px;

    &.success {
      background: linear-gradient(90deg, #55bc8a 0%, #479e76 100%);
    }

    &.error {
      background: #ca2621;
    }
  }

  .progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #79879c;
    gap: 8px;

    .upload-speed,
    .upload-eta {
      color: #55bc8a;
      font-weight: 500;
    }
  }

  .chunk-details {
    margin-top: 4px;
    font-size: 11px;
    color: #b6c2cd;
  }

  .upload-summary {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    margin-top: 16px;
    background: #f9fbfd;
    border-radius: 6px;
    border: 1px solid #e3e9ef;
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #242e42;

    i {
      font-size: 16px;
      color: #55bc8a;
    }

    &.error i {
      color: #ca2621;
    }
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
