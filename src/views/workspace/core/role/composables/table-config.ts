import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import { ShieldCheck } from 'lucide-vue-next'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { RoleListItem } from '@/api/workload/core'

export function useRoleTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    handleView: (row: RoleListItem) => void
    handleViewAssociation: (row: RoleListItem) => void
    handleEdit: (row: RoleListItem) => void
    handleDownloadYaml: (row: RoleListItem) => void
    handleDelete: (row: RoleListItem) => void
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
          const roleRow = row as RoleListItem
          return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
            h(ShieldCheck, { size: 16, style: 'color: #67c23a; flex-shrink: 0;' }),
            h('span', { style: 'font-weight: 500;' }, roleRow.name)
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
          const roleRow = row as RoleListItem
          const isDeleting = deleteLoadingMap.value[roleRow.name] || false
          const isDownloading = downloadLoadingMap.value[roleRow.name] || false
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
                    handleView(roleRow)
                    break
                  case 'association':
                    handleViewAssociation(roleRow)
                    break
                  case 'edit':
                    handleEdit(roleRow)
                    break
                  case 'download':
                    handleDownloadYaml(roleRow)
                    break
                  case 'delete':
                    handleDelete(roleRow)
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