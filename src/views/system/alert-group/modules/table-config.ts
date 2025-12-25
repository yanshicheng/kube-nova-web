import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import { formatTimestamp } from '@/utils/format'
import type { AlertGroups } from '@/api/portal/alert'

export function useGroupTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<number, boolean>>({})

  const createTableColumns = (handlers: {
    handleEdit: (row: AlertGroups) => void
    handleDelete: (row: AlertGroups) => void
    handleManageMembers: (row: AlertGroups) => void
    handleManageChannels: (row: AlertGroups) => void
    handleBindProject: (row: AlertGroups) => void
  }) => {
    const {
      handleEdit,
      handleDelete,
      handleManageMembers,
      handleManageChannels,
      handleBindProject
    } = handlers

    const allColumns = [
      {
        prop: 'id',
        label: 'ID',
        width: 80,
        fixed: 'left' as const,
        visible: true,
        align: 'center' as const
      },
      {
        prop: 'groupName',
        label: '告警组名称',
        minWidth: 200,
        fixed: 'left' as const,
        visible: true,
        align: 'center' as const
      },
      {
        prop: 'groupType',
        label: '组类型',
        width: 120,
        visible: true,
        align: 'center' as const,
        formatter: (row: Record<string, any>) => {
          const groupRow = row as AlertGroups
          return h(
            ElTag,
            {
              type: groupRow.groupType === 'duty' ? 'warning' : 'success',
              size: 'default'
            },
            () => (groupRow.groupType === 'duty' ? '值班组' : '普通组')
          )
        }
      },
      {
        prop: 'description',
        label: '描述',
        minWidth: 200,
        visible: true,
        showOverflowTooltip: true
      },
      {
        prop: 'sortOrder',
        label: '排序',
        width: 100,
        visible: true,
        align: 'center' as const
      },
      {
        prop: 'createdAt',
        label: '创建时间',
        width: 180,
        visible: true,
        align: 'center' as const,
        sortable: true,
        formatter: (row: Record<string, any>) => formatTimestamp((row as AlertGroups).createdAt)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 100,
        fixed: 'right' as const,
        visible: true,
        align: 'center' as const,
        formatter: (row: Record<string, any>): VNode => {
          const groupRow = row as AlertGroups
          const isDeleting = deleteLoadingMap.value[groupRow.id] || false
          const isAnyLoading = isDeleting

          const menuItems: ButtonMoreItem[] = [
            {
              key: 'edit',
              label: '编辑用户组',
              icon: 'lucide:edit',
              disabled: isAnyLoading
            },
            {
              key: 'members',
              label: '管理成员',
              icon: 'lucide:users',
              disabled: isAnyLoading
            },
            {
              key: 'channels',
              label: '渠道配置',
              icon: 'lucide:bell',
              disabled: isAnyLoading
            },
            {
              key: 'project',
              label: '绑定项目',
              icon: 'lucide:link',
              disabled: isAnyLoading
            },
            {
              key: 'delete',
              label: isDeleting ? '删除中...' : '删除用户组',
              icon: 'lucide:trash-2',
              color: '#f56c6c',
              disabled: isAnyLoading
            }
          ]

          return h('div', {}, [
            h(ArtButtonMore, {
              list: menuItems,
              onClick: (item: ButtonMoreItem) => {
                if (!isAnyLoading) {
                  switch (item.key) {
                    case 'edit':
                      handleEdit(groupRow)
                      break
                    case 'members':
                      handleManageMembers(groupRow)
                      break
                    case 'channels':
                      handleManageChannels(groupRow)
                      break
                    case 'project':
                      handleBindProject(groupRow)
                      break
                    case 'delete':
                      handleDelete(groupRow)
                      break
                  }
                }
              }
            })
          ])
        }
      }
    ]

    const columnChecks = ref<Record<string, boolean>>(
      allColumns.reduce(
        (acc, col) => {
          if (col.prop) acc[col.prop] = col.visible
          return acc
        },
        {} as Record<string, boolean>
      )
    )

    const columns = computed(() =>
      allColumns.filter((col) => !col.prop || columnChecks.value[col.prop] !== false)
    )

    return { columnChecks, columns }
  }

  return {
    loading,
    showSearchBar,
    deleteLoadingMap,
    createTableColumns
  }
}
