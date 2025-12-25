import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip, ElButton } from 'element-plus'
import { formatTimestamp } from '@/utils/format'
import type { LoginLogSysLoginLog } from '@/api/portal/login-log'

export function useLoginLogTableConfig() {
  // 状态管理
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<number, boolean>>({})

  // 搜索表单配置
  const SearchFormItems = computed(() => [
    {
      label: '用户ID',
      key: 'userId',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: 'IP地址',
      key: 'ipAddress',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '用户代理',
      key: 'userAgent',
      type: 'input',
      props: { clearable: true }
    }
  ])

  // 格式化用户代理字符串（简化显示）
  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return '-'

    // 提取主要浏览器信息
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/i)
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)[^;)]*/)

    const browser = browserMatch ? browserMatch[0] : ''
    const os = osMatch ? osMatch[0] : ''

    return `${browser} ${os}`.trim() || userAgent.substring(0, 50) + '...'
  }

  // 创建表格列配置
  const createTableColumns = (handlers: { handleDelete: (row: LoginLogSysLoginLog) => void }) => {
    const { handleDelete } = handlers

    const allColumns = [
      {
        type: 'selection' as const,
        width: 50,
        fixed: 'left' as const,
        visible: true
      },
      {
        prop: 'id',
        label: '日志ID',
        width: 80,
        fixed: 'left' as const,
        visible: true
      },
      {
        prop: 'username',
        label: '用户名',
        minWidth: 120,
        fixed: 'left' as const,
        visible: true
      },
      {
        prop: 'userId',
        label: '用户ID',
        width: 80,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const logRow = row as LoginLogSysLoginLog
          return logRow.userId || '-'
        }
      },
      {
        prop: 'loginStatus',
        label: '登录状态',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const logRow = row as LoginLogSysLoginLog
          const type = logRow.loginStatus === 1 ? 'success' : 'danger'
          const text = logRow.loginStatus === 1 ? '成功' : '失败'
          return h(ElTag, { type, size: 'small' }, () => text)
        }
      },
      {
        prop: 'ipAddress',
        label: 'IP地址',
        width: 140,
        visible: true
      },
      {
        prop: 'userAgent',
        label: '用户代理',
        minWidth: 200,
        showOverflowTooltip: false,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const logRow = row as LoginLogSysLoginLog
          const shortText = formatUserAgent(logRow.userAgent)

          return h(
            ElTooltip,
            {
              content: logRow.userAgent,
              placement: 'top',
              showAfter: 500
            },
            () => h('span', shortText)
          )
        }
      },
      {
        prop: 'loginTime',
        label: '登录时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const logRow = row as LoginLogSysLoginLog
          return formatTimestamp(logRow.loginTime)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 80,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const logRow = row as LoginLogSysLoginLog
          const isDeleting = deleteLoadingMap.value[logRow.id] || false

          return h('div', {}, [
            h(
              ElButton,
              {
                type: 'danger',
                size: 'small',
                icon: 'Delete',
                loading: isDeleting,
                disabled: isDeleting,
                onClick: () => handleDelete(logRow)
              },
              { default: () => (isDeleting ? '删除中' : '删除') }
            )
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
    formatUserAgent
  }
}
