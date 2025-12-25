/**
 * ClusterRole 表格配置
 */

import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip, ElSpace } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { ClusterRoleListItem } from '@/api/workload/cluster-resource'

export function useClusterRoleTableConfig() {
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    buttonMoreClick: (item: ButtonMoreItem, row: ClusterRoleListItem) => void
  }) => {
    const { buttonMoreClick } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 250,
        fixed: 'left' as const,
        visible: true,
        formatter: (row: ClusterRoleListItem) => {
          const isSystem =
            row.name.startsWith('system:') ||
            row.name.startsWith('kubeadm:') ||
            ['cluster-admin', 'admin', 'edit', 'view'].includes(row.name)

          return h('div', { class: 'name-cell' }, [
            h('span', { class: 'resource-name' }, row.name),
            isSystem
              ? h(
                  ElTooltip,
                  { content: '系统内置角色，不建议修改', placement: 'top' },
                  {
                    default: () =>
                      h(
                        ElTag,
                        { type: 'info', size: 'small', style: 'margin-left: 8px' },
                        () => '系统'
                      )
                  }
                )
              : null
          ])
        }
      },
      {
        prop: 'ruleCount',
        label: '规则数',
        width: 100,
        visible: true,
        formatter: (row: ClusterRoleListItem) => {
          return h(
            ElTag,
            { type: row.ruleCount > 0 ? 'primary' : 'info', size: 'small' },
            () => `${row.ruleCount} 条`
          )
        }
      },
      {
        prop: 'aggregationLabels',
        label: '聚合标签',
        minWidth: 200,
        visible: true,
        formatter: (row: ClusterRoleListItem) => {
          if (!row.aggregationLabels || row.aggregationLabels.length === 0) {
            return h('span', { style: 'color: #909399' }, '-')
          }
          return h(
            ElTooltip,
            {
              content: `聚合选择器：${row.aggregationLabels.join(', ')}`,
              placement: 'top'
            },
            {
              default: () =>
                h(ElSpace, { wrap: true }, () =>
                  row
                    .aggregationLabels!.slice(0, 3)
                    .map((label, index) =>
                      h(ElTag, { key: index, size: 'small', type: 'warning' }, () => label)
                    )
                    .concat(
                      row.aggregationLabels!.length > 3
                        ? [
                            h(
                              'span',
                              { style: 'color: #909399; font-size: 12px' },
                              `+${row.aggregationLabels!.length - 3}`
                            )
                          ]
                        : []
                    )
                )
            }
          )
        }
      },
      {
        prop: 'age',
        label: '存在时间',
        width: 120,
        visible: true
      },
      {
        prop: 'operation',
        label: '操作',
        width: 120,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: ClusterRoleListItem): VNode => {
          const isDeleting = deleteLoadingMap.value[row.name] || false
          const isSystem =
            row.name.startsWith('system:') ||
            row.name.startsWith('kubeadm:') ||
            ['cluster-admin', 'admin', 'edit', 'view'].includes(row.name)

          const menuItems: ButtonMoreItem[] = [
            { key: 'yaml', label: '查看 YAML', icon: 'lucide:file-code' },
            { key: 'describe', label: 'Describe', icon: 'lucide:eye' },
            { key: 'usage', label: '使用情况', icon: 'lucide:pie-chart' },
            { key: 'permissions', label: '权限摘要', icon: 'lucide:lock' },
            {
              key: 'edit',
              label: '编辑',
              icon: 'lucide:edit',
              disabled: isDeleting || isSystem
            },
            {
              key: 'delete',
              label: isDeleting ? '删除中...' : '删除',
              icon: 'lucide:trash-2',
              color: '#f56c6c',
              disabled: isDeleting || isSystem
            }
          ]

          return h('div', {}, [
            h(ArtButtonMore, {
              list: menuItems,
              onClick: (item: ButtonMoreItem) => {
                buttonMoreClick(item, row)
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
