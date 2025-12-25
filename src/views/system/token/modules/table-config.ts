import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip, ElButton } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { TokenSysToken } from '@/api/portal/token'

export function useTokenTableConfig() {
  // 状态管理
  const loading = ref(false)
  const batchDeleteLoading = ref(false)
  const showSearchBar = ref(true)

  // 搜索表单配置
  const SearchFormItems = computed(() => [
    {
      label: 'Token名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: 'Token值',
      key: 'token',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '类型',
      key: 'type',
      type: 'select',
      props: {
        clearable: true,
        options: [
          { label: '临时', value: 1 },
          { label: '长期', value: 2 },
          { label: '永久', value: 3 }
        ]
      }
    },
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

  // 时间格式化函数
  const formatTimestamp = (timestamp: number | undefined | null): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // Token类型配置
  const TOKEN_TYPE_CONFIG = {
    1: { type: 'info' as const, text: '临时' },
    2: { type: 'success' as const, text: '长期' },
    3: { type: 'warning' as const, text: '永久' }
  } as const

  // Token状态配置
  const TOKEN_STATUS_CONFIG = {
    0: { type: 'danger' as const, text: '禁用' },
    1: { type: 'success' as const, text: '启用' }
  } as const

  // 所有者类型配置
  const OWNER_TYPE_CONFIG = {
    1: { type: 'primary' as const, text: '用户' },
    2: { type: 'warning' as const, text: '角色' }
  } as const

  // 获取Token类型配置
  const getTokenTypeConfig = (type: number) => {
    return (
      TOKEN_TYPE_CONFIG[type as keyof typeof TOKEN_TYPE_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    )
  }

  // 获取Token状态配置
  const getTokenStatusConfig = (status: number) => {
    return (
      TOKEN_STATUS_CONFIG[status as keyof typeof TOKEN_STATUS_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    )
  }

  // 获取所有者类型配置
  const getOwnerTypeConfig = (type: number) => {
    return (
      OWNER_TYPE_CONFIG[type as keyof typeof OWNER_TYPE_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    )
  }

  // 复制Token到剪贴板
  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      return true
    } catch (error) {
      console.error('Copy failed:', error)
      return false
    }
  }

  // 创建表格列配置
  const createTableColumns = (handlers: {
    handleDelete: (row: TokenSysToken, loadingRef?: any) => Promise<void>
    onCopyToken: (token: string) => void
  }) => {
    const { handleDelete, onCopyToken } = handlers

    const allColumns = [
      {
        type: 'selection' as const,
        width: 50,
        visible: true
      },
      {
        type: 'index' as const,
        width: 60,
        label: '序号',
        visible: true
      },
      {
        prop: 'ownerType',
        label: '所有者类型',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const tokenRow = row as TokenSysToken
          const typeConfig = getOwnerTypeConfig(tokenRow.ownerType)
          return h(ElTag, { type: typeConfig.type, size: 'small' }, () => typeConfig.text)
        }
      },
      {
        prop: 'ownerId',
        label: '所有者ID',
        minWidth: 100,
        visible: true
      },
      {
        prop: 'name',
        label: 'Token名称',
        minWidth: 150,
        visible: true
      },
      {
        prop: 'token',
        label: 'Token值',
        minWidth: 200,
        showOverflowTooltip: false,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const tokenRow = row as TokenSysToken
          return h('div', { style: 'display: flex; align-items: center;' }, [
            h(
              ElTooltip,
              {
                content: tokenRow.token,
                placement: 'top'
              },
              () =>
                h(
                  'span',
                  {
                    style:
                      'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
                  },
                  tokenRow.token.substring(0, 20) + '...'
                )
            ),
            h(
              ElButton,
              {
                type: 'primary',
                link: true,
                icon: 'CopyDocument',
                onClick: () => onCopyToken(tokenRow.token)
              },
              () => '复制'
            )
          ])
        }
      },
      {
        prop: 'type',
        label: '类型',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const tokenRow = row as TokenSysToken
          const typeConfig = getTokenTypeConfig(tokenRow.type)
          return h(ElTag, { type: typeConfig.type }, () => typeConfig.text)
        }
      },
      {
        prop: 'expireTime',
        label: '过期时间',
        width: 160,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const tokenRow = row as TokenSysToken
          if (tokenRow.type === 3) return '永不过期'
          return formatTimestamp(tokenRow.expireTime)
        }
      },
      {
        prop: 'status',
        label: '状态',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const tokenRow = row as TokenSysToken
          const statusConfig = getTokenStatusConfig(tokenRow.status)
          return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
        }
      },
      {
        prop: 'createdAt',
        label: '创建时间',
        width: 160,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const tokenRow = row as TokenSysToken
          return formatTimestamp(tokenRow.createdAt)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 120,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const tokenRow = row as TokenSysToken
          const deleteLoading = ref(false)

          const menuItems: ButtonMoreItem[] = [
            {
              key: 'delete',
              label: deleteLoading.value ? '删除中...' : '删除',
              icon: 'lucide:trash-2',
              color: '#f56c6c',
              disabled: deleteLoading.value
            }
          ]

          return h('div', {}, [
            h(ArtButtonMore, {
              list: menuItems,
              onClick: async (item: ButtonMoreItem) => {
                if (item.key === 'delete') {
                  await handleDelete(tokenRow, deleteLoading)
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
    batchDeleteLoading,
    showSearchBar,

    // 配置
    SearchFormItems,

    // 方法
    createTableColumns,
    formatTimestamp,
    getTokenTypeConfig,
    getTokenStatusConfig,
    getOwnerTypeConfig,
    copyToken
  }
}
