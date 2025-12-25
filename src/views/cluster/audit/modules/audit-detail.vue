<template>
  <el-dialog
    v-model="visible"
    title="审计日志详情"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="日志ID" label-align="right">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="操作状态" label-align="right">
        <el-tag :type="getStatusType(detailData.status)" size="small">
          {{ getStatusLabel(detailData.status) }}
        </el-tag>
      </el-descriptions-item>

      <el-descriptions-item label="集群名称" label-align="right">
        {{ detailData.clusterName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="集群UUID" label-align="right">
        {{ detailData.clusterUuid || '-' }}
      </el-descriptions-item>

      <el-descriptions-item label="项目名称" label-align="right">
        {{ detailData.projectName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="项目ID" label-align="right">
        {{ detailData.projectId || '-' }}
      </el-descriptions-item>

      <el-descriptions-item label="工作空间" label-align="right">
        {{ getWorkspaceDisplay(detailData.workspaceName, detailData.workspaceId) }}
      </el-descriptions-item>
      <el-descriptions-item label="工作空间ID" label-align="right">
        {{ detailData.workspaceId }}
      </el-descriptions-item>

      <el-descriptions-item label="应用名称" label-align="right">
        {{ detailData.applicationName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="应用ID" label-align="right">
        {{ detailData.applicationId || '-' }}
      </el-descriptions-item>

      <el-descriptions-item label="操作简称" label-align="right" :span="2">
        {{ detailData.title || '-' }}
      </el-descriptions-item>

      <el-descriptions-item label="操作详情" label-align="right" :span="2">
        <div class="detail-content">{{ detailData.actionDetail || '-' }}</div>
      </el-descriptions-item>

      <el-descriptions-item label="操作人" label-align="right">
        {{ detailData.operatorName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人ID" label-align="right">
        {{ detailData.operatorId || '-' }}
      </el-descriptions-item>

      <el-descriptions-item label="操作时间" label-align="right">
        {{ formatTimestamp(detailData.createdAt) }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间" label-align="right">
        {{ formatTimestamp(detailData.updatedAt) }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { ProjectAuditLog } from '@/api/manager/audit'
  import { getAuditStatusInfo, getWorkspaceDisplayName } from '@/api/manager/audit'
  import { formatTimestamp } from '@/utils/format'

  interface Props {
    modelValue: boolean
    data: ProjectAuditLog | null
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

  const detailData = computed(() => props.data || ({} as ProjectAuditLog))

  const getStatusType = (status: number) => {
    return getAuditStatusInfo(status).type
  }

  const getStatusLabel = (status: number) => {
    return getAuditStatusInfo(status).label
  }

  const getWorkspaceDisplay = (name: string, id: number) => {
    return getWorkspaceDisplayName(name, id)
  }

  const handleClose = () => {
    visible.value = false
  }
</script>

<style scoped lang="scss">
  .detail-content {
    max-height: 200px;
    overflow-y: auto;
    word-break: break-all;
    white-space: pre-wrap;
    line-height: 1.6;
  }

  :deep(.el-descriptions__label) {
    width: 120px;
    font-weight: 500;
  }

  :deep(.el-descriptions__content) {
    word-break: break-all;
  }
</style>
