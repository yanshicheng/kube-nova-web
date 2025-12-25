/**
 * ClusterRoleBinding 表格配置
 */

import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { ClusterRoleBindingListItem } from '@/api/workload/cluster-resource'

export function useClusterRoleBindingTableConfig() {
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    buttonMoreClick: (item: ButtonMoreItem, row: ClusterRoleBindingListItem) => void
  }) => {
    const { buttonMoreClick } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 250,
        fixed: 'left' as const,
        visible: true,
        formatter: (row: ClusterRoleBindingListItem) => {
          const isSystem = row.name.startsWith('system:') || row.name.startsWith('kubeadm:')

          return h('div', { class: 'name-cell' }, [
            h('span', { class: 'resource-name' }, row.name),
            isSystem
              ? h(
                ElTooltip,
                { content: '系统内置绑定，不建议修改', placement: 'top' },
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
        prop: 'role',
        label: '角色',
        width: 200,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: ClusterRoleBindingListItem) => {
          return h(
            ElTooltip,
            { content: `绑定的 ClusterRole: ${row.role}`, placement: 'top' },
            {
              default: () => h(ElTag, { type: 'primary', size: 'small' }, () => row.role)
            }
          )
        }
      },
      {
        prop: 'subjectCount',
        label: '主体数',
        width: 100,
        visible: true,
        formatter: (row: ClusterRoleBindingListItem) => {
          return h(
            ElTooltip,
            { content: `共有 ${row.subjectCount} 个主体`, placement: 'top' },
            {
              default: () =>
                h(ElTag, { size: 'small', type: 'success' }, () => `${row.subjectCount} 个`)
            }
          )
        }
      },
      {
        prop: 'users',
        label: '用户 (User)',
        minWidth: 150,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: ClusterRoleBindingListItem) => {
          if (!row.users || row.users === '-') {
            return h('span', { style: 'color: #909399' }, '-')
          }
          return h(
            ElTooltip,
            { content: row.users, placement: 'top' },
            {
              default: () => h('span', {}, row.users)
            }
          )
        }
      },
      {
        prop: 'groups',
        label: '组 (Group)',
        minWidth: 150,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: ClusterRoleBindingListItem) => {
          if (!row.groups || row.groups === '-') {
            return h('span', { style: 'color: #909399' }, '-')
          }
          return h(
            ElTooltip,
            { content: row.groups, placement: 'top' },
            {
              default: () => h('span', {}, row.groups)
            }
          )
        }
      },
      {
        prop: 'serviceAccounts',
        label: 'ServiceAccount',
        minWidth: 180,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: ClusterRoleBindingListItem) => {
          if (!row.serviceAccounts || row.serviceAccounts === '-') {
            return h('span', { style: 'color: #909399' }, '-')
          }
          return h(
            ElTooltip,
            { content: row.serviceAccounts, placement: 'top' },
            {
              default: () => h('span', {}, row.serviceAccounts)
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
        formatter: (row: ClusterRoleBindingListItem): VNode => {
          const isDeleting = deleteLoadingMap.value[row.name] || false
          const isSystem = row.name.startsWith('system:') || row.name.startsWith('kubeadm:')

          const menuItems: ButtonMoreItem[] = [
            { key: 'yaml', label: '查看 YAML', icon: 'lucide:file-code' },
            { key: 'describe', label: 'Describe', icon: 'lucide:eye' },
            { key: 'permissions', label: '实际权限', icon: 'lucide:lock' },
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