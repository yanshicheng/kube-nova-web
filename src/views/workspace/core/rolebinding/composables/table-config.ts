import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import { Link } from 'lucide-vue-next'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { RoleBindingListItem } from '@/api/workload/core'

export function useRoleBindingTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  // 解析 role 字段 (格式: "Role/rolename" 或 "ClusterRole/clusterrolename")
  const parseRole = (roleStr: string) => {
    if (!roleStr) return { kind: '', name: '' }
    const parts = roleStr.split('/')
    if (parts.length === 2) {
      return { kind: parts[0], name: parts[1] }
    }
    return { kind: '', name: roleStr }
  }

  const createTableColumns = (handlers: {
    handleView: (row: RoleBindingListItem) => void
    handleEdit: (row: RoleBindingListItem) => void
    handleDownloadYaml: (row: RoleBindingListItem) => void
    handleDelete: (row: RoleBindingListItem) => void
  }) => {
    const { handleView, handleEdit, handleDownloadYaml, handleDelete } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 200,
        fixed: 'left' as const,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const bindingRow = row as RoleBindingListItem
          return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
            h(Link, { size: 16, style: 'color: #409eff; flex-shrink: 0;' }),
            h('span', { style: 'font-weight: 500;' }, bindingRow.name)
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
        prop: 'role',
        label: '绑定的角色',
        minWidth: 220,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const bindingRow = row as RoleBindingListItem
          const { kind, name } = parseRole(bindingRow.role)

          if (!kind || !name) {
            return h('span', { style: 'color: #909399;' }, bindingRow.role || '-')
          }

          const isClusterRole = kind === 'ClusterRole'

          return h(
            'div',
            { style: 'display: flex; align-items: center; gap: 8px;' },
            [
              h(
                ElTag,
                {
                  type: isClusterRole ? 'warning' : 'success',
                  size: 'small'
                },
                () => kind
              ),
              h(
                'span',
                {
                  style: 'font-weight: 500; font-family: "Consolas", "Monaco", monospace;'
                },
                name
              )
            ]
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
          const bindingRow = row as RoleBindingListItem
          const isDeleting = deleteLoadingMap.value[bindingRow.name] || false
          const isDownloading = downloadLoadingMap.value[bindingRow.name] || false
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
                    handleView(bindingRow)
                    break
                  case 'edit':
                    handleEdit(bindingRow)
                    break
                  case 'download':
                    handleDownloadYaml(bindingRow)
                    break
                  case 'delete':
                    handleDelete(bindingRow)
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