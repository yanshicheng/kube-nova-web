import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { ServiceListItem } from '@/api'

export function useServiceTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  // 获取 Service 类型标签样式
  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { type: string; label: string }> = {
      ClusterIP: { type: 'info', label: 'ClusterIP' },
      NodePort: { type: 'success', label: 'NodePort' },
      LoadBalancer: { type: 'warning', label: 'LoadBalancer' },
      ExternalName: { type: 'primary', label: 'ExternalName' }
    }
    return typeMap[type] || { type: 'info', label: type }
  }

  const createTableColumns = (handlers: {
    handleView: (row: ServiceListItem) => void
    handleEdit: (row: ServiceListItem) => void
    handleViewEndpoints: (row: ServiceListItem) => void
    handleDownloadYaml: (row: ServiceListItem) => void
    handleDelete: (row: ServiceListItem) => void
  }) => {
    const { handleView, handleEdit, handleViewEndpoints, handleDownloadYaml, handleDelete } =
      handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 200,
        fixed: 'left' as const,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'namespace',
        label: '命名空间',
        minWidth: 150,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'type',
        label: '类型',
        width: 140,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const serviceRow = row as ServiceListItem
          const tagInfo = getTypeTag(serviceRow.type)
          return h(ElTag, { type: tagInfo.type as any, size: 'small' }, () => tagInfo.label)
        }
      },
      {
        prop: 'clusterIP',
        label: '集群IP',
        minWidth: 140,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'externalIP',
        label: '外部IP',
        minWidth: 140,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const serviceRow = row as ServiceListItem
          return h('span', serviceRow.externalIP || '-')
        }
      },
      {
        prop: 'ports',
        label: '端口',
        minWidth: 200,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'age',
        label: '创建时间',
        minWidth: 150,
        visible: true
      },
      {
        prop: 'operation',
        label: '操作',
        width: 80,
        fixed: 'right' as const,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const serviceRow = row as ServiceListItem
          const isDeleting = deleteLoadingMap.value[serviceRow.name] || false
          const isDownloading = downloadLoadingMap.value[serviceRow.name] || false
          const isAnyLoading = isDeleting || isDownloading

          return h(ArtButtonMore, {
            list: [
              {
                key: 'view',
                label: '查看详情',
                icon: 'lucide:eye',
                disabled: isAnyLoading
              },
              {
                key: 'edit',
                label: '编辑',
                icon: 'lucide:edit',
                disabled: isAnyLoading
              },
              {
                key: 'endpoints',
                label: '查看 Endpoints',
                icon: 'lucide:activity',
                disabled: isAnyLoading
              },
              {
                key: 'download',
                label: isDownloading ? '下载中...' : '下载 YAML',
                icon: 'lucide:download',
                disabled: isAnyLoading
              },
              {
                key: 'delete',
                label: isDeleting ? '删除中...' : '删除',
                icon: 'lucide:trash-2',
                color: '#f56c6c',
                disabled: isAnyLoading
              }
            ] as ButtonMoreItem[],
            onClick: (item: ButtonMoreItem) => {
              if (!isAnyLoading) {
                switch (item.key) {
                  case 'view':
                    handleView(serviceRow)
                    break
                  case 'edit':
                    handleEdit(serviceRow)
                    break
                  case 'endpoints':
                    handleViewEndpoints(serviceRow)
                    break
                  case 'download':
                    handleDownloadYaml(serviceRow)
                    break
                  case 'delete':
                    handleDelete(serviceRow)
                    break
                }
              }
            }
          })
        }
      }
    ]

    const columns = ref(allColumns)

    return {
      columns
    }
  }

  return {
    loading,
    showSearchBar,
    deleteLoadingMap,
    downloadLoadingMap,
    createTableColumns,
    getTypeTag
  }
}
