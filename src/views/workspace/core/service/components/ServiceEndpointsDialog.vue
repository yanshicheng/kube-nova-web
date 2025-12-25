<template>
  <ElDialog
    :model-value="visible"
    title="Service Endpoints"
    width="900px"
    top="8vh"
    @close="handleClose"
  >
    <div v-loading="loading" class="endpoints-content">
      <template v-if="!loading && endpoints">
        <div class="info-bar">
          <div class="info-item">
            <span class="info-label">Service:</span>
            <span class="info-value">{{ endpoints.serviceName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Namespace:</span>
            <span class="info-value">{{ endpoints.namespace }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总数:</span>
            <ElTag type="success" size="default">{{ endpoints.totalCount }}</ElTag>
          </div>
        </div>

        <ElTable
          :data="endpoints.endpoints"
          border
          stripe
          :header-cell-style="{ background: '#fafafa', color: '#606266' }"
        >
          <ElTableColumn prop="podName" label="Pod 名称" min-width="200" show-overflow-tooltip />
          <ElTableColumn prop="podIP" label="Pod IP" width="140" align="center" />
          <ElTableColumn prop="nodeName" label="节点名称" width="160" show-overflow-tooltip />
          <ElTableColumn prop="ready" label="状态" width="100" align="center">
            <template #default="{ row }">
              <ElTag :type="row.ready ? 'success' : 'danger'" size="default">
                {{ row.ready ? '就绪' : '未就绪' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="ports" label="端口" width="120" align="center">
            <template #default="{ row }">
              {{ row.ports.join(', ') }}
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty
          v-if="endpoints.endpoints.length === 0"
          description="暂无 Endpoint"
          :image-size="100"
        />
      </template>
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    getServiceEndpointsApi,
    type ServiceEndpointsResponse,
    type ProjectWorkspace
  } from '@/api'

  interface Props {
    visible: boolean
    serviceName?: string
    workspace?: ProjectWorkspace
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const endpoints = ref<ServiceEndpointsResponse | null>(null)

  const loadEndpoints = async () => {
    if (!props.serviceName || !props.workspace) return

    loading.value = true
    try {
      endpoints.value = await getServiceEndpointsApi({
        workloadId: props.workspace.id,
        name: props.serviceName
      })
    } catch (error: any) {
      console.error('加载 Endpoints 失败:', error)
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
        loadEndpoints()
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .endpoints-content {
    min-height: 200px;
  }

  .info-bar {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 16px;
    margin-bottom: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .info-label {
        font-size: 13px;
        color: #909399;
        font-weight: 500;
      }

      .info-value {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
    }
  }
</style>
