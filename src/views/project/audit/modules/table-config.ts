import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElButton, ElPopconfirm } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import { formatTimestamp } from '@/utils/format'
import type { ProjectAuditLog } from '@/api/manager/audit'
import { getAuditStatusInfo, getWorkspaceDisplayName } from '@/api/manager/audit'

export function useAuditLogTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<number, boolean>>({})
  const batchDeleting = ref(false)

  const SearchFormItems = computed(() => [
    { label: '集群UUID', key: 'clusterUuid', type: 'input', props: { clearable: true } },
    { label: '操作简称', key: 'title', type: 'input', props: { clearable: true } },
    { label: '操作人', key: 'operatorName', type: 'input', props: { clearable: true } },
    {
      label: '工作空间ID',
      key: 'workspaceId',
      type: 'input-number',
      props: { clearable: true, placeholder: '-1表示项目级别' }
    },
    {
      label: '应用ID',
      key: 'applicationId',
      type: 'input-number',
      props: { clearable: true, placeholder: '-1表示不筛选' }
    },
    {
      label: '操作状态',
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        options: [
          { label: '成功', value: 1 },
          { label: '失败', value: 0 }
        ]
      }
    }
  ])

  const createTableColumns = (handlers: {
    handleDelete: (row: ProjectAuditLog) => void
    handleViewDetail: (row: ProjectAuditLog) => void
  }) => {
    const { handleDelete, handleViewDetail } = handlers

    const allColumns = [
      {
        prop: 'id',
        label: 'ID',
        width: 80,
        fixed: 'left' as const,
        visible: true
      },
      {
        prop: 'clusterName',
        label: '集群名称',
        minWidth: 150,
        visible: true,
        showOverflowTooltip: true
      },
      {
        prop: 'projectName',
        label: '项目名称',
        minWidth: 150,
        visible: true,
        showOverflowTooltip: true
      },
      {
        prop: 'workspaceName',
        label: '工作空间',
        minWidth: 150,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: Record<string, any>) => {
          const auditRow = row as ProjectAuditLog
          return getWorkspaceDisplayName(auditRow.workspaceName, auditRow.workspaceId)
        }
      },
      {
        prop: 'applicationName',
        label: '应用名称',
        minWidth: 150,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: Record<string, any>) => {
          const auditRow = row as ProjectAuditLog
          return auditRow.applicationName || '-'
        }
      },
      {
        prop: 'title',
        label: '操作简称',
        minWidth: 180,
        visible: true,
        showOverflowTooltip: true
      },
      {
        prop: 'actionDetail',
        label: '操作详情',
        minWidth: 250,
        visible: true,
        showOverflowTooltip: true
      },
      {
        prop: 'status',
        label: '操作状态',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const auditRow = row as ProjectAuditLog
          const statusInfo = getAuditStatusInfo(auditRow.status)
          return h(
            ElTag,
            { type: statusInfo.type as any, size: 'small' },
            () => statusInfo.label
          )
        }
      },
      {
        prop: 'operatorName',
        label: '操作人',
        width: 120,
        visible: true,
        showOverflowTooltip: true
      },
      {
        prop: 'createdAt',
        label: '操作时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => formatTimestamp((row as ProjectAuditLog).createdAt)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 150,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const auditRow = row as ProjectAuditLog
          const isDeleting = deleteLoadingMap.value[auditRow.id] || false

          return h(
            'div',
            {
              style: {
                display: 'flex',
                gap: '8px',
                justifyContent: 'center'
              }
            },
            [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  onClick: () => handleViewDetail(auditRow)
                },
                () => '详情'
              ),
              h(
                ElPopconfirm,
                {
                  title: '确定要删除这条审计日志吗？',
                  confirmButtonText: '确定',
                  cancelButtonText: '取消',
                  onConfirm: () => handleDelete(auditRow)
                },
                {
                  reference: () =>
                    h(
                      ElButton,
                      {
                        type: 'danger',
                        link: true,
                        size: 'small',
                        loading: isDeleting,
                        disabled: isDeleting
                      },
                      () => (isDeleting ? '删除中...' : '删除')
                    )
                }
              )
            ]
          )
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
    batchDeleting,
    SearchFormItems,
    createTableColumns
  }
}