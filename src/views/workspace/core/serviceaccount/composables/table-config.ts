import { ref, h } from 'vue'
import { ElTag, ElTooltip } from 'element-plus'
import { ShieldCheck } from 'lucide-vue-next'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { ServiceAccountListItem } from '@/api/workload/core'

export function useServiceAccountTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    handleView: (row: ServiceAccountListItem) => void
    handleEdit: (row: ServiceAccountListItem) => void
    handleDownloadYaml: (row: ServiceAccountListItem) => void
    handleDelete: (row: ServiceAccountListItem) => void
  }) => {
    const { handleView, handleEdit, handleDownloadYaml, handleDelete } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 220,
        fixed: 'left' as const,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const saRow = row as ServiceAccountListItem
          return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
            h(ShieldCheck, { size: 16, style: 'color: #409eff; flex-shrink: 0;' }),
            h('span', { style: 'font-weight: 500;' }, saRow.name)
          ])
        }
      },
      {
        prop: 'namespace',
        label: '命名空间',
        minWidth: 140,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'secrets',
        label: 'Secrets 数量',
        width: 140,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const saRow = row as ServiceAccountListItem
          const count = saRow.secrets || 0

          if (count === 0) {
            return h('span', { style: 'color: #909399;' }, '0')
          }

          return h(
            ElTag,
            { type: 'success', size: 'small' },
            () => `${count} 个`
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
          const saRow = row as ServiceAccountListItem
          const isDeleting = deleteLoadingMap.value[saRow.name] || false
          const isDownloading = downloadLoadingMap.value[saRow.name] || false
          const isAnyLoading = isDeleting || isDownloading

          return h(ArtButtonMore, {
            list: [
              { key: 'view', label: '查看详情', icon: 'lucide:eye', disabled: isAnyLoading },
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
                    handleView(saRow)
                    break
                  case 'edit':
                    handleEdit(saRow)
                    break
                  case 'download':
                    handleDownloadYaml(saRow)
                    break
                  case 'delete':
                    handleDelete(saRow)
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