import { ref, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElButton, ElProgress } from 'element-plus'
import type { ProjectCluster } from '@/api'

interface TableConfigHandlers {
  handleEditResource: (row: ProjectCluster) => void
  handleSyncResource: (row: ProjectCluster) => void
  handleDeleteResource: (row: ProjectCluster) => void
}

export function useResourceTableConfig() {
  // 状态管理
  const loading = ref(false)
  const showSearchBar = ref(false)
  const submitLoading = ref(false)
  const syncLoadingMap = ref<Record<number, boolean>>({})

  // 格式化日期
  const formatDate = (timestamp: number) => {
    if (!timestamp) return ''
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 计算使用率百分比
  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0
    return Math.min(100, Math.round((used / total) * 100))
  }

  // 创建表格列配置
  const createTableColumns = (handlers: TableConfigHandlers) => {
    const { handleEditResource, handleSyncResource, handleDeleteResource } = handlers

    const allColumns = [
      {
        prop: 'clusterName',
        label: '集群名称',
        minWidth: 150,
        fixed: 'left' as const,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'clusterUuid',
        label: '集群UUID',
        minWidth: 200,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const resource = row as ProjectCluster
          return h(ElTag, {}, () => resource.clusterUuid)
        }
      },
      {
        prop: 'cpu',
        label: 'CPU',
        width: 180,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const resource = row as ProjectCluster
          return h('div', { class: 'resource-cell' }, [
            h(ElProgress, {
              percentage: getUsagePercentage(resource.cpuAllocated, resource.cpuLimit),
              width: 100,
              showText: false
            }),
            h(
              'span',
              { class: 'resource-text' },
              `${resource.cpuAllocated}/${resource.cpuLimit}核`
            )
          ])
        }
      },
      {
        prop: 'memory',
        label: '内存',
        width: 180,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const resource = row as ProjectCluster
          return h('div', { class: 'resource-cell' }, [
            h(ElProgress, {
              percentage: getUsagePercentage(resource.memAllocated, resource.memLimit),
              width: 100,
              showText: false
            }),
            h(
              'span',
              { class: 'resource-text' },
              `${resource.memAllocated}/${resource.memLimit}GiB`
            )
          ])
        }
      },
      {
        prop: 'storage',
        label: '存储',
        width: 180,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const resource = row as ProjectCluster
          return h('div', { class: 'resource-cell' }, [
            h(ElProgress, {
              percentage: getUsagePercentage(resource.storageAllocated, resource.storageLimit),
              width: 100,
              showText: false
            }),
            h(
              'span',
              { class: 'resource-text' },
              `${resource.storageAllocated}/${resource.storageLimit}GiB`
            )
          ])
        }
      },
      {
        prop: 'gpu',
        label: 'GPU',
        width: 150,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const resource = row as ProjectCluster
          if (resource.gpuLimit > 0) {
            return h('span', {}, `${resource.gpuAllocated}/${resource.gpuLimit}个`)
          }
          return h('span', { class: 'text-gray-400' }, '-')
        }
      },
      {
        prop: 'pods',
        label: 'Pods',
        width: 150,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const resource = row as ProjectCluster
          return h('span', {}, `${resource.podsAllocated}/${resource.podsLimit}个`)
        }
      },
      {
        prop: 'updatedAt',
        label: '更新时间',
        width: 180,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const resource = row as ProjectCluster
          return formatDate(resource.updatedAt)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 240,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const resource = row as ProjectCluster
          const isSyncing = syncLoadingMap.value[resource.id] || false
          const isAnyLoading = submitLoading.value || isSyncing

          return h('div', { class: 'table-operation-buttons' }, [
            h(
              ElButton,
              {
                type: 'warning',
                size: 'small',
                disabled: isAnyLoading,
                onClick: () => handleEditResource(resource)
              },
              () => '编辑'
            ),
            h(
              ElButton,
              {
                type: 'success',
                size: 'small',
                loading: isSyncing,
                disabled: isAnyLoading,
                onClick: () => handleSyncResource(resource),
                style: 'margin-left: 8px;'
              },
              () => '同步'
            ),
            h(
              ElButton,
              {
                type: 'danger',
                size: 'small',
                disabled: isAnyLoading,
                onClick: () => handleDeleteResource(resource),
                style: 'margin-left: 8px;'
              },
              () => '删除'
            )
          ])
        }
      }
    ]

    const columns = ref(allColumns)

    return {
      columns
    }
  }

  return {
    // 状态
    loading,
    showSearchBar,
    submitLoading,
    syncLoadingMap,

    // 方法
    createTableColumns,
    formatDate,
    getUsagePercentage
  }
}