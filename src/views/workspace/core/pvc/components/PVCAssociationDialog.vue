<template>
  <ElDialog
    :model-value="visible"
    title="PVC 关联信息"
    width="700px"
    top="5vh"
    @update:model-value="handleClose"
  >
    <div v-if="loading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="6" animated />
    </div>

    <div v-else-if="association" class="association-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-header">
          <Database :size="16" />
          <span>基本信息</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>PVC 名称</label>
            <span>{{ association.pvcName }}</span>
          </div>
          <div class="info-item">
            <label>命名空间</label>
            <span>{{ association.namespace }}</span>
          </div>
          <div class="info-item">
            <label>绑定的 PV</label>
            <span :class="association.pvName ? 'pv-name' : 'no-pv'">
              {{ association.pvName || '未绑定' }}
            </span>
          </div>
          <div class="info-item">
            <label>使用的 Pod 数量</label>
            <ElTag :type="association.podCount > 0 ? 'success' : 'info'" size="small">
              {{ association.podCount }} 个
            </ElTag>
          </div>
        </div>
      </div>

      <!-- Pod 列表 -->
      <div class="info-section">
        <div class="section-header">
          <Package :size="16" />
          <span>使用此 PVC 的 Pod</span>
          <ElTag size="small" type="success">{{ association.podCount }} 个</ElTag>
        </div>

        <div v-if="association.pods.length > 0" class="pods-list">
          <div v-for="pod in association.pods" :key="pod" class="pod-item">
            <Package :size="14" />
            <span>{{ pod }}</span>
          </div>
        </div>
        <ElEmpty v-else description="没有 Pod 使用此 PVC" :image-size="60" />
      </div>

      <!-- 警告信息 -->
      <ElAlert
        v-if="association.podCount > 0"
        type="warning"
        :closable="false"
        show-icon
        style="margin-top: 16px"
      >
        <template #title>
          <div style="font-size: 13px">
            此 PVC 正在被 {{ association.podCount }} 个 Pod 使用，删除前请确保这些 Pod
            不再需要此存储
          </div>
        </template>
      </ElAlert>
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { Database, Package } from 'lucide-vue-next'
  import {
    getPVCAssociationApi,
    type ProjectWorkspace,
    type PVCAssociation
  } from '@/api/workload/core'

  interface Props {
    visible: boolean
    pvcName: string
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const association = ref<PVCAssociation | null>(null)

  const handleClose = () => {
    emit('close')
  }

  const loadAssociation = async () => {
    if (!props.workspace || !props.pvcName) {
      return
    }

    loading.value = true
    try {
      const result = await getPVCAssociationApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.pvcName
      })

      association.value = result
    } catch (error: any) {
      console.error('加载 PVC 关联信息失败:', error)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        loadAssociation()
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .association-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-section {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e4e7ed;
      font-size: 14px;
      font-weight: 600;
      color: #303133;

      svg {
        color: #409eff;
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 12px;
      color: #909399;
      font-weight: 500;
    }

    span {
      font-size: 13px;
      color: #303133;
      font-weight: 500;

      &.pv-name {
        color: #409eff;
        font-family: 'Consolas', 'Monaco', monospace;
      }

      &.no-pv {
        color: #909399;
      }
    }
  }

  .pods-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pod-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    font-size: 13px;
    color: #303133;
    transition: all 0.2s;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    svg {
      color: #67c23a;
      flex-shrink: 0;
    }

    span {
      font-family: 'Consolas', 'Monaco', monospace;
    }
  }

  :deep(.el-empty) {
    padding: 20px 0;
  }
</style>