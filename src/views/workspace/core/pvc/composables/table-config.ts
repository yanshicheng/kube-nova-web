import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import { Database } from 'lucide-vue-next'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { PVCListItem } from '@/api/workload/core'

export function usePVCTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  // 状态颜色映射
  const getStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'Bound':
        return 'success'
      case 'Pending':
        return 'warning'
      case 'Lost':
        return 'danger'
      default:
        return 'info'
    }
  }

  const createTableColumns = (handlers: {
    handleView: (row: PVCListItem) => void
    handleViewAssociation: (row: PVCListItem) => void
    handleEdit: (row: PVCListItem) => void
    handleDownloadYaml: (row: PVCListItem) => void
    handleDelete: (row: PVCListItem) => void
  }) => {
    const { handleView, handleViewAssociation, handleEdit, handleDownloadYaml, handleDelete } =
      handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 200,
        fixed: 'left' as const,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const pvcRow = row as PVCListItem
          return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
            h(Database, { size: 16, style: 'color: #409eff; flex-shrink: 0;' }),
            h('span', { style: 'font-weight: 500;' }, pvcRow.name)
          ])
        }
      },
      {
        prop: 'namespace',
        label: '命名空间',
        minWidth: 130,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'status',
        label: '状态',
        minWidth: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const pvcRow = row as PVCListItem
          return h(
            ElTag,
            {
              type: getStatusType(pvcRow.status),
              size: 'small'
            },
            () => pvcRow.status
          )
        }
      },
      {
        prop: 'volume',
        label: '绑定的 PV',
        minWidth: 150,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const pvcRow = row as PVCListItem
          return h(
            'span',
            {
              style: pvcRow.volume
                ? 'font-family: "Consolas", "Monaco", monospace; color: #409eff;'
                : 'color: #909399;'
            },
            pvcRow.volume || '-'
          )
        }
      },
      {
        prop: 'capacity',
        label: '容量',
        minWidth: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const pvcRow = row as PVCListItem
          return h('span', { style: 'font-weight: 500;' }, pvcRow.capacity || '-')
        }
      },
      {
        prop: 'accessModes',
        label: '访问模式',
        minWidth: 150,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const pvcRow = row as PVCListItem
          if (!pvcRow.accessModes || pvcRow.accessModes.length === 0) {
            return h('span', { style: 'color: #909399;' }, '-')
          }
          return h(
            'div',
            { style: 'display: flex; flex-wrap: wrap; gap: 4px;' },
            pvcRow.accessModes.map((mode) =>
              h(
                ElTag,
                {
                  size: 'small',
                  type: 'info'
                },
                () => mode
              )
            )
          )
        }
      },
      {
        prop: 'storageClass',
        label: '存储类',
        minWidth: 150,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const pvcRow = row as PVCListItem
          return h(
            'span',
            {
              style: pvcRow.storageClass
                ? 'font-family: "Consolas", "Monaco", monospace;'
                : 'color: #909399;'
            },
            pvcRow.storageClass || '默认'
          )
        }
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
          const pvcRow = row as PVCListItem
          const isDeleting = deleteLoadingMap.value[pvcRow.name] || false
          const isDownloading = downloadLoadingMap.value[pvcRow.name] || false
          const isAnyLoading = isDeleting || isDownloading

          return h(ArtButtonMore, {
            list: [
              { key: 'view', label: '查看详情', icon: 'lucide:eye', disabled: isAnyLoading },
              {
                key: 'association',
                label: '关联信息',
                icon: 'lucide:link',
                disabled: isAnyLoading
              },
              { key: 'edit', label: '编辑', icon: 'lucide:edit', disabled: isAnyLoading },
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
                    handleView(pvcRow)
                    break
                  case 'association':
                    handleViewAssociation(pvcRow)
                    break
                  case 'edit':
                    handleEdit(pvcRow)
                    break
                  case 'download':
                    handleDownloadYaml(pvcRow)
                    break
                  case 'delete':
                    handleDelete(pvcRow)
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