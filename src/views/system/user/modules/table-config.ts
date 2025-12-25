import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElSwitch, ElTag } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import { formatTimestamp } from '@/utils/format'
import type { UserSysUser } from '@/api/portal/user'

export function useUserTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<number, boolean>>({})
  const resetPwdLoadingMap = ref<Record<number, boolean>>({})
  const statusLoadingMap = ref<Record<number, boolean>>({})

  const SearchFormItems = computed(() => [
    { label: '用户名', key: 'username', type: 'input', props: { clearable: true } },
    { label: '昵称', key: 'nickname', type: 'input', props: { clearable: true } },
    { label: '手机号', key: 'phone', type: 'input', props: { clearable: true } },
    { label: '邮箱', key: 'email', type: 'input', props: { clearable: true } },
    { label: '工号', key: 'workNumber', type: 'input', props: { clearable: true } },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 }
        ]
      }
    }
  ])

  const createTableColumns = (
    handlers: {
      handleStatusChange: (row: UserSysUser, val: boolean) => void
      buttonMoreClick: (item: ButtonMoreItem, row: UserSysUser) => void
    },
    currentUserInfo: any
  ) => {
    const { handleStatusChange, buttonMoreClick } = handlers

    const allColumns = [
      { prop: 'id', label: '用户ID', width: 80, fixed: 'left' as const, visible: true },
      { prop: 'username', label: '用户名', minWidth: 120, fixed: 'left' as const, visible: true },
      { prop: 'nickname', label: '昵称', minWidth: 120, visible: true },
      { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true, visible: true },
      { prop: 'phone', label: '手机号', width: 120, visible: true },
      { prop: 'workNumber', label: '工号', width: 100, visible: true },
      {
        prop: 'status',
        label: '状态',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const userRow = row as UserSysUser
          const isCurrentUser = currentUserInfo.value?.username === userRow.username
          const isLoading = statusLoadingMap.value[userRow.id] || false

          return h(ElSwitch, {
            modelValue: userRow.status === 1,
            disabled: isCurrentUser || isLoading,
            loading: isLoading,
            onUpdateModelValue: (val: boolean) => handleStatusChange(userRow, val)
          })
        }
      },
      {
        prop: 'isNeedResetPwd',
        label: '需重置密码',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const userRow = row as UserSysUser
          return h(
            ElTag,
            { type: userRow.isNeedResetPwd === 1 ? 'warning' : 'success', size: 'small' },
            () => (userRow.isNeedResetPwd === 1 ? '是' : '否')
          )
        }
      },
      {
        prop: 'createdAt',
        label: '创建时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => formatTimestamp((row as UserSysUser).createdAt)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 100,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const userRow = row as UserSysUser
          const isCurrentUser = currentUserInfo.value?.username === userRow.username
          const isDeleting = deleteLoadingMap.value[userRow.id] || false
          const isResettingPwd = resetPwdLoadingMap.value[userRow.id] || false
          const isAnyLoading = isDeleting || isResettingPwd

          const menuItems: ButtonMoreItem[] = [
            {
              key: 'edit',
              label: '编辑用户',
              icon: 'lucide:edit',
              disabled: isAnyLoading
            },
            {
              key: 'role',
              label: '分配角色',
              icon: 'lucide:user-cog',
              disabled: isAnyLoading
            },
            {
              key: 'resetPwd',
              label: isResettingPwd ? '重置中...' : '重置密码',
              icon: 'lucide:key',
              disabled: isCurrentUser || isAnyLoading
            },
            {
              key: 'delete',
              label: isDeleting ? '删除中...' : '删除用户',
              icon: 'lucide:trash-2',
              color: '#f56c6c',
              disabled: isCurrentUser || isAnyLoading
            }
          ]

          return h('div', {}, [
            h(ArtButtonMore, {
              list: menuItems,
              onClick: (item: ButtonMoreItem) => {
                if (!isAnyLoading) {
                  buttonMoreClick(item, userRow)
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
    resetPwdLoadingMap,
    statusLoadingMap,
    SearchFormItems,
    createTableColumns
  }
}
