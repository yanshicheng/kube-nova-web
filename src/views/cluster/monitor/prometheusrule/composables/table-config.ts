import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { PrometheusRuleListItem } from '@/api/workload/monitor'

export function usePrometheusRuleTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    handleView: (row: PrometheusRuleListItem) => void
    handleEdit: (row: PrometheusRuleListItem) => void
    handleDownloadYaml: (row: PrometheusRuleListItem) => void
    handleDelete: (row: PrometheusRuleListItem) => void
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
          const ruleRow = row as PrometheusRuleListItem
          return h('span', { style: 'font-weight: 500;' }, ruleRow.name)
        }
      },
      {
        prop: 'namespace',
        label: '命名空间',
        minWidth: 130,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const ruleRow = row as PrometheusRuleListItem
          return h(ElTag, { type: 'info', size: 'small' }, () => ruleRow.namespace)
        }
      },
      {
        prop: 'labels',
        label: '标签',
        minWidth: 180,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const ruleRow = row as PrometheusRuleListItem
          if (!ruleRow.labels || Object.keys(ruleRow.labels).length === 0) {
            return h('span', { style: 'color: #909399;' }, '-')
          }

          const labelCount = Object.keys(ruleRow.labels).length
          const firstLabel = Object.entries(ruleRow.labels)[0]

          return h(
            'div',
            { style: 'display: flex; flex-wrap: wrap; gap: 4px; align-items: center;' },
            [
              h(
                ElTag,
                { type: 'success', size: 'small' },
                () => `${firstLabel[0]}=${firstLabel[1]}`
              ),
              labelCount > 1
                ? h(ElTag, { type: 'info', size: 'small' }, () => `+${labelCount - 1}`)
                : null
            ].filter(Boolean)
          )
        }
      },
      {
        prop: 'age',
        label: '创建时长',
        minWidth: 140,
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
          const ruleRow = row as PrometheusRuleListItem
          const isDeleting = deleteLoadingMap.value[ruleRow.name] || false
          const isDownloading = downloadLoadingMap.value[ruleRow.name] || false
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
                    handleView(ruleRow)
                    break
                  case 'edit':
                    handleEdit(ruleRow)
                    break
                  case 'download':
                    handleDownloadYaml(ruleRow)
                    break
                  case 'delete':
                    handleDelete(ruleRow)
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