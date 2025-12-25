<!-- /views/workspace/components/ResourceUsage.vue -->
<template>
  <div class="resource-usage">
    <ElTooltip placement="bottom">
      <template #content>
        <div class="usage-tooltip">
          <div class="usage-item">
            <span>CPU:</span>
            <span>{{ cluster?.cpuAllocated || 0 }} / {{ cluster?.cpuLimit || 0 }} 核</span>
          </div>
          <div class="usage-item">
            <span>内存:</span>
            <span>{{ cluster?.memAllocated || 0 }} / {{ cluster?.memLimit || 0 }} GB</span>
          </div>
          <div class="usage-item">
            <span>存储:</span>
            <span>{{ cluster?.storageAllocated || 0 }} / {{ cluster?.storageLimit || 0 }} GB</span>
          </div>
        </div>
      </template>
      <div class="usage-summary">
        <span class="usage-label">CPU {{ cpuUsage }}%</span>
        <ElProgress
          :percentage="cpuUsage"
          :stroke-width="4"
          :show-text="false"
          :color="getColor(cpuUsage)"
          style="width: 60px"
        />
        <ElDivider direction="vertical" />
        <span class="usage-label">内存 {{ memUsage }}%</span>
        <ElProgress
          :percentage="memUsage"
          :stroke-width="4"
          :show-text="false"
          :color="getColor(memUsage)"
          style="width: 60px"
        />
      </div>
    </ElTooltip>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { ProjectCluster } from '@/api'

  interface Props {
    cluster: ProjectCluster | null
  }

  const props = defineProps<Props>()

  const cpuUsage = computed(() => {
    if (!props.cluster) return 0
    return Math.round((props.cluster.cpuAllocated / props.cluster.cpuLimit) * 100)
  })

  const memUsage = computed(() => {
    if (!props.cluster) return 0
    return Math.round((props.cluster.memAllocated / props.cluster.memLimit) * 100)
  })

  const getColor = (percentage: number): string => {
    if (percentage < 60) return '#67c23a'
    if (percentage < 80) return '#e6a23c'
    return '#f56c6c'
  }
</script>

<style lang="scss" scoped>
  .resource-usage {
    .usage-summary {
      display: flex;
      align-items: center;
      gap: 12px;

      .usage-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }

      :deep(.el-divider--vertical) {
        height: 14px;
      }
    }
  }

  .usage-tooltip {
    .usage-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;

      &:last-child {
        margin-bottom: 0;
      }

      span:first-child {
        margin-right: 16px;
      }
    }
  }
</style>