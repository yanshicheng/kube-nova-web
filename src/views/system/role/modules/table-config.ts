import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { RoleSysRole } from '@/api/portal/role'

export function useRoleTableConfig() {
  // 状态管理
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<number, boolean>>({})

  // 搜索表单配置
  const SearchFormItems = computed(() => [
    {
      label: '角色名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '角色编码',
      key: 'code',
      type: 'input',
      props: { clearable: true }
    }
  ])

  // 时间格式化函数
  const formatTimestamp = (timestamp: number | undefined | null): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // 创建表格列配置
  const createTableColumns = (handlers: {
    buttonMoreClick: (item: ButtonMoreItem, row: RoleSysRole) => void
  }) => {
    const { buttonMoreClick } = handlers

    const allColumns = [
      {
        prop: 'id',
        label: '角色ID',
        width: 100,
        visible: true
      },
      {
        prop: 'name',
        label: '角色名称',
        minWidth: 120,
        visible: true
      },
      {
        prop: 'code',
        label: '角色编码',
        minWidth: 120,
        visible: true
      },
      {
        prop: 'remark',
        label: '备注说明',
        minWidth: 150,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'createdAt',
        label: '创建时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const roleRow = row as RoleSysRole
          return formatTimestamp(roleRow.createdAt)
        }
      },
      {
        prop: 'updatedAt',
        label: '更新时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const roleRow = row as RoleSysRole
          return formatTimestamp(roleRow.updatedAt)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 100,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const roleRow = row as RoleSysRole
          const isDeleting = deleteLoadingMap.value[roleRow.id] || false
          const isAnyLoading = isDeleting

          const menuItems: ButtonMoreItem[] = [
            {
              key: 'permission',
              label: '菜单权限',
              icon: 'lucide:settings',
              disabled: isAnyLoading
            },
            {
              key: 'api',
              label: 'API权限',
              icon: 'lucide:link',
              disabled: isAnyLoading
            },
            {
              key: 'edit',
              label: '编辑角色',
              icon: 'lucide:edit',
              disabled: isAnyLoading
            },
            {
              key: 'delete',
              label: isDeleting ? '删除中...' : '删除角色',
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
                  buttonMoreClick(item, roleRow)
                }
              }
            })
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
    deleteLoadingMap,

    // 配置
    SearchFormItems,

    // 方法
    createTableColumns,
    formatTimestamp
  }
}
