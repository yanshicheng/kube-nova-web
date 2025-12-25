<template>
  <el-dialog
    v-model="visible"
    :title="file?.name || '文件预览'"
    width="80%"
    top="5vh"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="preview-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="preview-loading">
        <el-icon class="is-loading">
          <i class="mdi mdi-loading mdi-spin"></i>
        </el-icon>
        <div>加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="preview-error">
        <i class="mdi mdi-alert-circle"></i>
        <div class="error-text">{{ error }}</div>
        <el-button @click="loadPreview">重试</el-button>
      </div>

      <!-- 图片预览 -->
      <div v-else-if="previewType === 'image'" class="preview-image">
        <img :src="previewContent" :alt="file?.name" />
      </div>

      <!-- 文本预览 -->
      <div v-else-if="previewType === 'text'" class="preview-text">
        <pre>{{ previewContent }}</pre>
      </div>

      <!-- PDF 预览 -->
      <div v-else-if="previewType === 'pdf'" class="preview-pdf">
        <iframe :src="previewContent" width="100%" height="100%"></iframe>
      </div>

      <!-- 不支持预览 -->
      <div v-else class="preview-unsupported">
        <i class="mdi mdi-file-alert-outline"></i>
        <div class="unsupported-text">该文件类型不支持预览</div>
        <el-button type="primary" @click="handleDownload">
          <i class="mdi mdi-download"></i>
          下载文件
        </el-button>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button v-if="canDownload" type="primary" @click="handleDownload">
          <i class="mdi mdi-download"></i>
          下载
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { readPodFileApi, getPodFileDownloadUrl, type FileInfo } from '@/api'

  const props = defineProps<{
    modelValue: boolean
    workspaceId: number
    podName: string
    container: string
    file: FileInfo | null
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const visible = ref(false)
  const loading = ref(false)
  const error = ref('')
  const previewType = ref<'image' | 'text' | 'pdf' | 'unsupported'>('unsupported')
  const previewContent = ref('')

  const canDownload = computed(() => {
    return props.file && !props.file.isDir
  })

  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val
      if (val && props.file) {
        loadPreview()
      }
    }
  )

  watch(visible, (val) => {
    emit('update:modelValue', val)
    if (!val) {
      resetPreview()
    }
  })

  function resetPreview() {
    previewType.value = 'unsupported'
    previewContent.value = ''
    error.value = ''
  }

  async function loadPreview() {
    if (!props.file) return

    loading.value = true
    error.value = ''

    try {
      const mimeType = props.file.mimeType || ''
      const [mainType] = mimeType.split('/')

      // 判断文件类型（使用 mimeType）
      if (mainType === 'image') {
        // 图片预览
        previewType.value = 'image'
        const url = getPodFileDownloadUrl({
          workloadId: props.workspaceId,
          podName: props.podName,
          container: props.container || undefined,
          path: props.file.path
        })
        previewContent.value = url
      } else if (mimeType === 'application/pdf') {
        // PDF 预览
        previewType.value = 'pdf'
        const url = getPodFileDownloadUrl({
          workloadId: props.workspaceId,
          podName: props.podName,
          container: props.container || undefined,
          path: props.file.path
        })
        previewContent.value = url
      } else if (
        mimeType === 'text/plain' ||
        mimeType === 'text/markdown' ||
        mimeType === 'application/json' ||
        mimeType === 'text/yaml' ||
        mimeType === 'text/yml' ||
        mimeType === 'application/xml' ||
        mimeType === 'text/toml' ||
        mimeType === 'text/csv'
      ) {
        // 文本预览
        previewType.value = 'text'

        // 限制预览大小为 1MB
        if (props.file.size > 1024 * 1024) {
          error.value = '文件过大，无法预览（最大 1MB）'
          return
        }

        const response = await readPodFileApi({
          workloadId: props.workspaceId,
          podName: props.podName,
          container: props.container || undefined,
          path: props.file.path,
          limit: 1024 * 1024 // 1MB
        })

        previewContent.value = response.content || ''
      } else {
        // 不支持预览
        previewType.value = 'unsupported'
      }
    } catch (err: any) {
      console.error('预览失败:', err)
      error.value = err.message || '加载预览失败'
    } finally {
      loading.value = false
    }
  }

  function handleDownload() {
    if (!props.file) return

    const url = getPodFileDownloadUrl({
      workloadId: props.workspaceId,
      podName: props.podName,
      container: props.container || undefined,
      path: props.file.path
    })

    window.open(url, '_blank')
    ElMessage.success('开始下载')
  }

  function handleClose() {
    visible.value = false
  }
</script>

<style lang="scss" scoped>
  .preview-container {
    min-height: 400px;
    max-height: 70vh;
    background: #f9fbfd;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-loading,
  .preview-error,
  .preview-unsupported {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #79879c;

    i {
      font-size: 64px;
      margin-bottom: 20px;
    }

    div {
      font-size: 16px;
      margin-bottom: 20px;
    }
  }

  .preview-error {
    i {
      color: #ca2621;
    }

    .error-text {
      color: #ca2621;
    }
  }

  .preview-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #242e42;

    img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 4px;
    }
  }

  .preview-text {
    width: 100%;
    height: 100%;
    overflow: auto;
    background: #ffffff;

    pre {
      margin: 0;
      padding: 20px;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #242e42;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d8dee5;
      border-radius: 4px;
    }
  }

  .preview-pdf {
    width: 100%;
    height: 70vh;

    iframe {
      border: none;
    }
  }

  .mdi-spin {
    animation: spin 1s linear infinite;
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