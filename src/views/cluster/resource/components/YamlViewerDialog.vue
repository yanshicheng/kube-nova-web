<template>
  <ElDialog
    v-model="visible"
    :title="`${resourceName} - YAML`"
    width="900px"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="yaml-viewer-container">
      <YamlEditorPro
        v-model="localYaml"
        :readonly="true"
        :filename="`${resourceName}.yaml`"
        :show-toolbar="true"
        :show-status-bar="true"
        height="600px"
      />
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
  import { Copy as CopyIcon, Download as DownloadIcon } from 'lucide-vue-next'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    modelValue: boolean
    yaml: string
    resourceName: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const localYaml = ref('')

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  watch(() => props.yaml, (val) => {
    localYaml.value = val
  }, { immediate: true })

  const handleClose = () => {
    visible.value = false
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localYaml.value)
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([localYaml.value], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.resourceName}.yaml`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('文件已下载')
  }
</script>

<style lang="scss" scoped>
  .yaml-viewer-container {
    border-radius: 8px;
    overflow: hidden;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>