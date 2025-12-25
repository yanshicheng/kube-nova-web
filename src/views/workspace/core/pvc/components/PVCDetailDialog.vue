<template>
  <ElDialog
    :model-value="visible"
    title="PVC 详情"
    width="800px"
    top="5vh"
    @update:model-value="handleClose"
  >
    <div v-if="loading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="8" animated />
    </div>

    <div v-else-if="pvcDetail" class="detail-content">
      <ArtYamlEditor v-model="yamlContent" height="550" :readOnly="true" />
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { getPVCDescribeApi, type ProjectWorkspace } from '@/api/workload/core'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    pvcName: string
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const pvcDetail = ref<any>(null)
  const yamlContent = ref('')

  const handleClose = () => {
    emit('close')
  }

  const loadPVCDetail = async () => {
    if (!props.workspace || !props.pvcName) {
      return
    }

    loading.value = true
    try {
      const describe = await getPVCDescribeApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.pvcName
      })

      pvcDetail.value = describe
      yamlContent.value = describe
    } catch (error: any) {
      console.error('加载 PVC 详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        loadPVCDetail()
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .detail-content {
    padding: 0;
  }
</style>