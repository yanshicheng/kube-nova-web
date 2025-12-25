<template>
  <ElDialog
    v-model="visible"
    :title="`${resourceName} - 详情`"
    width="1000px"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="detail-viewer-container">
      <!-- 工具栏 -->
      <div class="viewer-toolbar">
        <div class="toolbar-left">
          <ElTag type="info" size="large">
            <FileTextIcon :size="14" />
            <span style="margin-left: 6px">kubectl describe 输出</span>
          </ElTag>
        </div>
        <div class="toolbar-right">
          <ElTooltip content="复制到剪贴板">
            <ElButton :icon="CopyIcon" circle @click="handleCopy" />
          </ElTooltip>
          <ElTooltip content="下载文件">
            <ElButton :icon="DownloadIcon" circle @click="handleDownload" />
          </ElTooltip>
          <ElTooltip content="全屏查看">
            <ElButton :icon="MaximizeIcon" circle @click="toggleFullscreen" />
          </ElTooltip>
        </div>
      </div>

      <!-- 使用 YAML 编辑器展示，带语法高亮 -->
      <div class="editor-wrapper" :class="{ fullscreen: isFullscreen }">
        <YamlEditorPro
          v-model="localContent"
          :readonly="true"
          :filename="`${resourceName}-describe.txt`"
          :show-toolbar="false"
          :show-status-bar="true"
          :height="editorHeight"
          language="yaml"
        />
      </div>

      <!-- 快捷信息面板 -->
      <div v-if="parsedInfo" class="quick-info-panel">
        <div class="info-grid">
          <div class="info-item" v-if="parsedInfo.name">
            <span class="label">名称</span>
            <span class="value">{{ parsedInfo.name }}</span>
          </div>
          <div class="info-item" v-if="parsedInfo.provisioner">
            <span class="label">供应商</span>
            <span class="value code">{{ parsedInfo.provisioner }}</span>
          </div>
          <div class="info-item" v-if="parsedInfo.reclaimPolicy">
            <span class="label">回收策略</span>
            <ElTag
              :type="parsedInfo.reclaimPolicy === 'Delete' ? 'danger' : 'success'"
              size="small"
            >
              {{ parsedInfo.reclaimPolicy }}
            </ElTag>
          </div>
          <div class="info-item" v-if="parsedInfo.volumeBindingMode">
            <span class="label">绑定模式</span>
            <ElTag type="info" size="small">{{ parsedInfo.volumeBindingMode }}</ElTag>
          </div>
          <div class="info-item" v-if="parsedInfo.allowVolumeExpansion !== undefined">
            <span class="label">允许扩容</span>
            <ElTag :type="parsedInfo.allowVolumeExpansion ? 'success' : 'info'" size="small">
              {{ parsedInfo.allowVolumeExpansion ? '是' : '否' }}
            </ElTag>
          </div>
          <div class="info-item" v-if="parsedInfo.isDefault">
            <span class="label">默认</span>
            <ElTag type="primary" size="small" effect="dark">是</ElTag>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCopy">
          <template #icon><CopyIcon :size="16" /></template>
          复制
        </ElButton>
        <ElButton @click="handleDownload">
          <template #icon><DownloadIcon :size="16" /></template>
          下载
        </ElButton>
        <ElButton type="primary" @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Copy as CopyIcon,
    Download as DownloadIcon,
    Maximize as MaximizeIcon,
    FileText as FileTextIcon
  } from 'lucide-vue-next'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    modelValue: boolean
    content: string
    resourceName: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const localContent = ref('')
  const isFullscreen = ref(false)

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const editorHeight = computed(() => {
    return isFullscreen.value ? 'calc(100vh - 200px)' : '500px'
  })

  // 解析描述信息中的关键字段
  const parsedInfo = computed(() => {
    if (!props.content) return null

    const info: Record<string, any> = {}
    const lines = props.content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('Name:')) {
        info.name = trimmed.replace('Name:', '').trim()
      } else if (trimmed.startsWith('Provisioner:')) {
        info.provisioner = trimmed.replace('Provisioner:', '').trim()
      } else if (trimmed.startsWith('ReclaimPolicy:')) {
        info.reclaimPolicy = trimmed.replace('ReclaimPolicy:', '').trim()
      } else if (trimmed.startsWith('VolumeBindingMode:')) {
        info.volumeBindingMode = trimmed.replace('VolumeBindingMode:', '').trim()
      } else if (trimmed.startsWith('AllowVolumeExpansion:')) {
        const value = trimmed.replace('AllowVolumeExpansion:', '').trim()
        info.allowVolumeExpansion = value.toLowerCase() === 'true'
      } else if (trimmed.includes('is-default-class') && trimmed.includes('true')) {
        info.isDefault = true
      }
    }

    return Object.keys(info).length > 0 ? info : null
  })

  watch(
    () => props.content,
    (val) => {
      localContent.value = val
    },
    { immediate: true }
  )

  const handleClose = () => {
    visible.value = false
    isFullscreen.value = false
  }

  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localContent.value)
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([localContent.value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.resourceName}-describe.txt`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('文件已下载')
  }
</script>

<style lang="scss" scoped>
  .detail-viewer-container {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .viewer-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f5f7fa;
      border-radius: 8px;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .toolbar-right {
        display: flex;
        gap: 8px;
      }
    }

    .editor-wrapper {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e4e7ed;
      transition: all 0.3s;

      &.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        border-radius: 0;
        background: #1e1e1e;
      }
    }

    .quick-info-panel {
      padding: 16px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 8px;
      border: 1px solid #bae6fd;

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .label {
            font-size: 12px;
            color: #64748b;
            min-width: 60px;
          }

          .value {
            font-weight: 500;
            color: #334155;

            &.code {
              font-family: 'SF Mono', Monaco, Consolas, monospace;
              font-size: 12px;
              background: #e2e8f0;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
