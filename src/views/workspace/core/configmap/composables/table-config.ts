import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { ConfigMapListItem } from '@/api'

export function useConfigMapTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  // 创建表格列配置
  const createTableColumns = (handlers: {
    handleView: (row: ConfigMapListItem) => void
    handleEdit: (row: ConfigMapListItem) => void
    handleViewUsage: (row: ConfigMapListItem) => void
    handleDownloadYaml: (row: ConfigMapListItem) => void
    handleDelete: (row: ConfigMapListItem) => void
  }) => {
    const { handleView, handleEdit, handleViewUsage, handleDownloadYaml, handleDelete } = handlers

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
        prop: 'dataCount',
        label: '数据项',
        width: 120,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const configMapRow = row as ConfigMapListItem
          return h(ElTag, { type: 'success', size: 'small' }, () => `${configMapRow.dataCount} 项`)
        }
      },
      {
        prop: 'age',
        label: '运行时长',
        width: 150,
        align: 'center' as const,
        visible: true
      },
      {
        prop: 'creationTimestamp',
        label: '创建时间',
        minWidth: 180,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const configMapRow = row as ConfigMapListItem
          return configMapRow.creationTimestamp
            ? new Date(configMapRow.creationTimestamp).toLocaleString('zh-CN')
            : '-'
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 80,
        fixed: 'right' as const,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const configMapRow = row as ConfigMapListItem
          const isDeleting = deleteLoadingMap.value[configMapRow.name] || false
          const isDownloading = downloadLoadingMap.value[configMapRow.name] || false
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
                key: 'usage',
                label: '查看引用',
                icon: 'lucide:link',
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
                    handleView(configMapRow)
                    break
                  case 'edit':
                    handleEdit(configMapRow)
                    break
                  case 'usage':
                    handleViewUsage(configMapRow)
                    break
                  case 'download':
                    handleDownloadYaml(configMapRow)
                    break
                  case 'delete':
                    handleDelete(configMapRow)
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
    createTableColumns
  }
}
