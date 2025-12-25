import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip, ElIcon } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import {
  formatTimestamp,
  formatDuration,
  getSeverityTagType,
  getStatusTagType,
  AlertInstanceSeverityNames,
  AlertStatusNames,
  type AlertInstance
} from '@/api/portal/alert'

export function useAlertTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<number, boolean>>({})

  const createTableColumns = (handlers: {
    handleViewDetail: (row: AlertInstance) => void
    handleDelete: (row: AlertInstance) => void
  }) => {
    const { handleViewDetail, handleDelete } = handlers

    const allColumns = [
      { type: 'selection', width: 55, fixed: 'left' as const, visible: true },
      { prop: 'id', label: 'ID', width: 80, fixed: 'left' as const, visible: true },
      {
        prop: 'alertName',
        label: '告警名称',
        minWidth: 180,
        fixed: 'left' as const,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'severity',
        label: '严重级别',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const alertRow = row as AlertInstance
          return h(
            ElTag,
            {
              type: getSeverityTagType(alertRow.severity),
              size: 'small',
              effect: 'dark'
            },
            () => AlertInstanceSeverityNames[alertRow.severity] || alertRow.severity
          )
        }
      },
      {
        prop: 'status',
        label: '告警状态',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const alertRow = row as AlertInstance
          return h(
            ElTag,
            {
              type: getStatusTagType(alertRow.status),
              size: 'small',
              effect: alertRow.status === 'firing' ? 'dark' : 'plain'
            },
            () => AlertStatusNames[alertRow.status] || alertRow.status
          )
        }
      },
      {
        prop: 'clusterName',
        label: '集群',
        width: 150,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'projectName',
        label: '项目',
        width: 150,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'workspaceName',
        label: '工作空间',
        width: 150,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'repeatCount',
        label: '重复次数',
        width: 100,
        align: 'center' as const,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const alertRow = row as AlertInstance
          if (alertRow.repeatCount > 0) {
            return h(
              ElTag,
              {
                type: 'warning',
                size: 'small',
                round: true
              },
              () => alertRow.repeatCount
            )
          }
          return h('span', { style: 'color: var(--el-text-color-secondary)' }, '-')
        }
      },
      {
        prop: 'duration',
        label: '持续时长',
        width: 150,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const alertRow = row as AlertInstance
          return formatDuration(alertRow.duration)
        }
      },
      {
        prop: 'notificationCount',
        label: '通知次数',
        width: 100,
        align: 'center' as const,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const alertRow = row as AlertInstance
          if (alertRow.notificationCount > 0) {
            return h(
              ElTooltip,
              {
                content: `最后通知时间: ${formatTimestamp(alertRow.lastNotifiedAt)}`,
                placement: 'top'
              },
              () =>
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }
                  },
                  [
                    h(ElTag, { type: 'info', size: 'small', round: true }, () =>
                      String(alertRow.notificationCount)
                    ),
                    h(ElIcon, { size: 14, style: 'color: var(--el-color-info)' }, () =>
                      h(InfoFilled)
                    )
                  ]
                )
            )
          }
          return h('span', { style: 'color: var(--el-text-color-secondary)' }, '-')
        }
      },
      {
        prop: 'startsAt',
        label: '开始时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => formatTimestamp((row as AlertInstance).startsAt)
      },
      {
        prop: 'endsAt',
        label: '结束时间',
        width: 180,
        sortable: true,
        visible: false,
        formatter: (row: Record<string, any>) => formatTimestamp((row as AlertInstance).endsAt)
      },
      {
        prop: 'resolvedAt',
        label: '恢复时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => formatTimestamp((row as AlertInstance).resolvedAt)
      },
      {
        prop: 'instance',
        label: '告警实例',
        width: 200,
        showOverflowTooltip: true,
        visible: false
      },
      {
        prop: 'fingerprint',
        label: '告警指纹',
        width: 200,
        showOverflowTooltip: true,
        visible: false
      },
      {
        prop: 'createdAt',
        label: '创建时间',
        width: 180,
        sortable: true,
        visible: false,
        formatter: (row: Record<string, any>) => formatTimestamp((row as AlertInstance).createdAt)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 150,
        align: 'right' as const,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const alertRow = row as AlertInstance
          const isDeleting = deleteLoadingMap.value[alertRow.id] || false

          const buttonStyle = {
            style: 'text-align: right; display: flex; gap: 4px; justify-content: flex-end;'
          }

          return h('div', buttonStyle, [
            h(ArtButtonTable, {
              type: 'view',
              onClick: () => !isDeleting && handleViewDetail(alertRow),
              disabled: isDeleting,
              title: '查看详情'
            }),
            h(ArtButtonTable, {
              type: 'delete',
              onClick: () => !isDeleting && handleDelete(alertRow),
              disabled: isDeleting,
              loading: isDeleting,
              title: isDeleting ? '删除中...' : '删除'
            })
          ])
        }
      }
    ]

    const columnChecks = ref<Record<string, boolean>>(
      allColumns.reduce(
        (acc, col) => {
          if (col.prop) acc[col.prop] = col.visible !== false
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
