<template>
  <ElDialog
    :model-value="visible"
    title="配置预览"
    width="800px"
    @close="handleClose"
  >
    <div class="preview-content">
      <div class="preview-toolbar">
        <span class="toolbar-title">
          <Eye :size="14" />
          YAML 配置预览
        </span>
        <ElButton size="small" @click="copyConfig" :icon="Copy">
          复制配置
        </ElButton>
      </div>

      <div class="yaml-preview">
        <pre><code>{{ yamlContent }}</code></pre>
      </div>

      <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
        <template #title>
          <span style="font-size: 13px">
            以上是最终将要提交的 YAML 配置，请仔细检查后再提交
          </span>
        </template>
      </ElAlert>
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Eye, Copy } from 'lucide-vue-next'

interface Props {
  visible: boolean
  yamlContent: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const copyConfig = async () => {
  try {
    await navigator.clipboard.writeText(props.yamlContent)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.preview-content {
  min-height: 400px;

  .preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px 6px 0 0;
    border: 1px solid #e4e7ed;
    border-bottom: none;

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }
  }

  .yaml-preview {
    max-height: 500px;
    overflow: auto;
    background: #282c34;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 0 0 6px 6px;

    pre {
      margin: 0;
      padding: 0;

      code {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #abb2bf;
      }
    }

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: #4e5561;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-track {
      background: #21252b;
    }
  }
}
</style>