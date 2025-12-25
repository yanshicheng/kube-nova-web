<template>
  <ElDialog
    :model-value="visible"
    title="Role 详情"
    width="800px"
    top="5vh"
    @update:model-value="handleClose"
  >
    <div v-if="loading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="8" animated />
    </div>

    <div v-else-if="roleDetail" class="detail-content">
      <ArtYamlEditor v-model="yamlContent" height="600px" :readOnly="true" />
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { getRoleDescribeApi, type ProjectWorkspace } from '@/api/workload/core'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    roleName: string
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const roleDetail = ref<any>(null)
  const yamlContent = ref('')

  const handleClose = () => {
    emit('close')
  }

  const loadRoleDetail = async () => {
    if (!props.workspace || !props.roleName) {
      return
    }

    loading.value = true
    try {
      const describe = await getRoleDescribeApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.roleName
      })

      roleDetail.value = describe
      yamlContent.value = describe
    } catch (error: any) {
      console.error('加载 Role 详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        loadRoleDetail()
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