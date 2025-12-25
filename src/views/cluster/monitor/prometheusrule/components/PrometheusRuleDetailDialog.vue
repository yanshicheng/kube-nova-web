<template>
  <ElDialog
    :model-value="visible"
    title="PrometheusRule 详情"
    width="900px"
    top="5vh"
    class="prometheusrule-detail-dialog"
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-content">
      <template v-if="!loading && ruleYaml">
        <ArtYamlEditor v-model="ruleYaml" height="600px" :readonly="true" />
      </template>

      <ElEmpty v-if="!loading && !ruleYaml" description="加载失败或数据不存在" :image-size="100" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton size="default" @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { getPrometheusRuleYamlApi } from '@/api/workload/monitor'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    ruleName?: string
    namespace?: string
    clusterUuid?: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const ruleYaml = ref('')

  const loadDetail = async () => {
    if (!props.ruleName || !props.namespace || !props.clusterUuid) return

    loading.value = true
    try {
      ruleYaml.value = await getPrometheusRuleYamlApi({
        clusterUuid: props.clusterUuid,
        namespace: props.namespace,
        name: props.ruleName
      })
    } catch (error: any) {
      console.error('加载详情失败:', error)
      ruleYaml.value = ''
    } finally {
      loading.value = false
    }
  }

  const handleClose = () => {
    emit('close')
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        loadDetail()
      } else {
        ruleYaml.value = ''
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .prometheusrule-detail-dialog {
    :deep(.el-dialog__body) {
      padding: 20px 24px;
      max-height: 70vh;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;
      }
    }
  }

  .detail-content {
    min-height: 200px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>