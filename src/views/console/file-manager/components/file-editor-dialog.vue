<template>
  <el-dialog
    v-model="visible"
    :title="file?.name || '编辑文件'"
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="editor-container">
      <!-- 工具栏 -->
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <el-tag :type="hasChanges ? 'warning' : 'info'" size="small">
            {{ hasChanges ? '已修改' : '未修改' }}
          </el-tag>
          <span class="file-info">{{ formatFileSize(content.length) }} | {{ lineCount }} 行</span>
        </div>
        <div class="toolbar-right">
          <el-button size="small" @click="handleReload">
            <i class="mdi mdi-refresh"></i>
            重新加载
          </el-button>
          <el-button size="small" @click="handleFormat" v-if="canFormat">
            <i class="mdi mdi-code-braces"></i>
            格式化
          </el-button>
        </div>
      </div>

      <!-- 编辑器 -->
      <div v-if="loading" class="editor-loading">
        <el-icon class="is-loading">
          <i class="mdi mdi-loading mdi-spin"></i>
        </el-icon>
        <div>加载中...</div>
      </div>

      <div v-else-if="error" class="editor-error">
        <i class="mdi mdi-alert-circle"></i>
        <div>{{ error }}</div>
        <el-button @click="loadContent">重试</el-button>
      </div>

      <textarea
        v-else
        v-model="content"
        class="editor-textarea"
        :placeholder="'编辑 ' + file?.name"
        spellcheck="false"
        @input="handleInput"
      ></textarea>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="!hasChanges" @click="handleSave">
          <i class="mdi mdi-content-save"></i>
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { readPodFileApi, savePodFileApi, type FileInfo } from '@/api'

const props = defineProps<{
  modelValue: boolean
  workspaceId: number
  podName: string
  container: string
  file: FileInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const visible = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const content = ref('')
const originalContent = ref('')

const hasChanges = computed(() => content.value !== originalContent.value)

const lineCount = computed(() => {
  return content.value.split('\n').length
})

const canFormat = computed(() => {
  if (!props.file) return false
  const ext = props.file.name.split('.').pop()?.toLowerCase() || ''
  return ['json', 'xml', 'html', 'css', 'js'].includes(ext)
})

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val && props.file) {
      loadContent()
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetEditor()
  }
})

function resetEditor() {
  content.value = ''
  originalContent.value = ''
  error.value = ''
}

async function loadContent() {
  if (!props.file) return

  loading.value = true
  error.value = ''

  try {
    // 限制编辑文件大小为 5MB
    if (props.file.size > 5 * 1024 * 1024) {
      error.value = '文件过大，无法编辑（最大 5MB）'
      loading.value = false
      return
    }

    const response = await readPodFileApi({
      workloadId: props.workspaceId,
      podName: props.podName,
      container: props.container || undefined,
      path: props.file.path,
      limit: 5 * 1024 * 1024
    })

    content.value = response.content || ''
    originalContent.value = response.content || ''
  } catch (err: any) {
    console.error('加载失败:', err)
    error.value = err.message || '加载文件内容失败'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.file || !hasChanges.value) return

  saving.value = true

  try {
    await savePodFileApi({
      workloadId: props.workspaceId,
      podName: props.podName,
      container: props.container || undefined,
      path: props.file.path,
      content: content.value,
      backup: true
    })

    originalContent.value = content.value
    ElMessage.success('保存成功')
    emit('saved')
  } catch (err: any) {
    console.error('保存失败:', err)
  } finally {
    saving.value = false
  }
}

async function handleReload() {
  if (hasChanges.value) {
    try {
      await ElMessageBox.confirm('当前有未保存的修改，确定要重新加载吗？', '提示', {
        type: 'warning'
      })
    } catch {
      return
    }
  }

  loadContent()
}

function handleFormat() {
  if (!props.file) return

  const ext = props.file.name.split('.').pop()?.toLowerCase() || ''

  try {
    if (ext === 'json') {
      const obj = JSON.parse(content.value)
      content.value = JSON.stringify(obj, null, 2)
      ElMessage.success('格式化成功')
    } else {
      ElMessage.info('该文件类型暂不支持自动格式化')
    }
  } catch (err: any) {
  }
}

function handleInput() {
  // 可以在这里添加自动保存等功能
}

async function handleClose() {
  if (hasChanges.value) {
    try {
      await ElMessageBox.confirm('当前有未保存的修改，确定要关闭吗？', '提示', {
        type: 'warning',
        distinguishCancelAndClose: true,
        confirmButtonText: '放弃修改',
        cancelButtonText: '继续编辑'
      })
    } catch {
      return
    }
  }

  visible.value = false
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style lang="scss" scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 75vh;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e3e9ef;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fbfd;
  border-bottom: 1px solid #e3e9ef;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.file-info {
  font-size: 13px;
  color: #79879c;
}

.editor-loading,
.editor-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #79879c;

  i {
    font-size: 48px;
    margin-bottom: 16px;
  }

  div {
    font-size: 16px;
    margin-bottom: 16px;
  }
}

.editor-error i {
  color: #ca2621;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 20px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Courier New', Consolas, Monaco, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #242e42;
  background: #ffffff;
  tab-size: 4;

  &::placeholder {
    color: #b6c2cd;
  }

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d8dee5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #b6c2cd;
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