<template>
  <ElDialog
    v-model="visible"
    :title="`${resourceName} - Describe`"
    width="900px"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="describe-viewer-container">
      <pre class="describe-content">{{ describe }}</pre>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCopy">
          <template #icon><CopyIcon :size="16" /></template>
          复制
        </ElButton>
        <ElButton type="primary" @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Copy as CopyIcon } from 'lucide-vue-next'

  interface Props {
    modelValue: boolean
    describe: string
    resourceName: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const handleClose = () => {
    visible.value = false
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.describe)
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }
</script>

<style lang="scss" scoped>
  .describe-viewer-container {
    max-height: 600px;
    overflow: auto;
    background: #1e1e1e;
    border-radius: 8px;
    padding: 16px;

    .describe-content {
      margin: 0;
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #d4d4d4;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>