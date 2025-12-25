/**
 * PersistentVolume 表格配置
 */

import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { PVListItem } from '@/api/workload/cluster-resource'

export function usePVTableConfig() {
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    buttonMoreClick: (item: ButtonMoreItem, row: PVListItem) => void
  }) => {
    const { buttonMoreClick } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 200,
        fixed: 'left' as const,
        visible: true,
        formatter: (row: PVListItem) => {
          return h('div', { class: 'name-cell' }, [
            h('span', { class: 'resource-name', style: 'font-weight: 500' }, row.name)
          ])
        }
      },
      {
        prop: 'capacity',
        label: '容量',
        width: 100,
        visible: true,
        formatter: (row: PVListItem) => {
          return h('strong', { style: 'font-size: 13px; color: #409eff' }, row.capacity)
        }
      },
      {
        prop: 'accessModes',
        label: '访问模式',
        width: 120,
        visible: true,
        formatter: (row: PVListItem) => {
          const modeMap: Record<string, { full: string; desc: string; color: string }> = {
            RWO: { full: 'ReadWriteOnce', desc: '单节点读写', color: 'primary' },
            ROX: { full: 'ReadOnlyMany', desc: '多节点只读', color: 'info' },
            RWX: { full: 'ReadWriteMany', desc: '多节点读写', color: 'success' },
            RWOP: { full: 'ReadWriteOncePod', desc: '单Pod读写', color: 'warning' }
          }
          const accessMode = row.accessModes || 'RWO'
          const mode = modeMap[accessMode] || {
            full: accessMode,
            desc: accessMode,
            color: 'info'
          }
          return h(
            ElTooltip,
            { content: `${mode.full} - ${mode.desc}`, placement: 'top' },
            {
              default: () => h(ElTag, { size: 'small', type: mode.color as any }, () => accessMode)
            }
          )
        }
      },
      {
        prop: 'status',
        label: '状态',
        width: 100,
        visible: true,
        formatter: (row: PVListItem) => {
          const statusMap: Record<string, { type: string; label: string }> = {
            Available: { type: 'success', label: '可用' },
            Bound: { type: 'primary', label: '已绑定' },
            Released: { type: 'warning', label: '已释放' },
            Failed: { type: 'danger', label: '失败' },
            Pending: { type: 'info', label: '等待中' }
          }
          const statusValue = row.status || 'Unknown'
          const status = statusMap[statusValue] || {
            type: 'info',
            label: statusValue || '未知'
          }
          return h(ElTag, { type: status.type as any, size: 'small' }, () => status.label)
        }
      },
      {
        prop: 'claim',
        label: '绑定的 PVC',
        minWidth: 200,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: PVListItem) => {
          if (!row.claim || row.claim === '-') {
            return h('span', { style: 'color: #909399; font-size: 13px' }, '-')
          }
          return h(
            ElTooltip,
            { content: row.claim, placement: 'top' },
            {
              default: () =>
                h('span', { style: 'color: #409eff; cursor: pointer; font-weight: 500' }, row.claim)
            }
          )
        }
      },
      {
        prop: 'storageClass',
        label: '存储类',
        width: 150,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: PVListItem) => {
          if (!row.storageClass || row.storageClass === '-') {
            return h('span', { style: 'color: #909399; font-size: 13px' }, '-')
          }
          return h(ElTag, { size: 'small', type: 'info' }, () => row.storageClass)
        }
      },
      {
        prop: 'reclaimPolicy',
        label: '回收策略',
        width: 110,
        visible: true,
        formatter: (row: PVListItem) => {
          const typeMap: Record<string, { type: string; tooltip: string }> = {
            Delete: { type: 'danger', tooltip: '删除 PVC 时自动删除 PV 和数据' },
            Retain: { type: 'success', tooltip: '保留 PV，需手动删除' },
            Recycle: { type: 'warning', tooltip: '已弃用，不建议使用' }
          }
          const policyValue = row.reclaimPolicy || 'Retain'
          const policy = typeMap[policyValue] || {
            type: 'info',
            tooltip: policyValue
          }
          return h(
            ElTooltip,
            { content: policy.tooltip, placement: 'top' },
            {
              default: () =>
                h(ElTag, { type: policy.type as any, size: 'small' }, () => policyValue)
            }
          )
        }
      },
      {
        prop: 'volumeMode',
        label: '卷模式',
        width: 100,
        visible: true,
        formatter: (row: PVListItem) => {
          const mode = row.volumeMode || 'Filesystem'
          const tooltip = mode === 'Filesystem' ? '文件系统模式' : '块设备模式'
          const tagType = mode === 'Filesystem' ? 'info' : 'warning'
          return h(
            ElTooltip,
            { content: tooltip, placement: 'top' },
            {
              default: () => h(ElTag, { size: 'small', type: tagType as any }, () => mode)
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
        formatter: (row: PVListItem): VNode => {
          const isDeleting = deleteLoadingMap.value[row.name] || false
          const isBound = row.status === 'Bound'
          const isAnyLoading = isDeleting

          const menuItems: ButtonMoreItem[] = [
            {
              key: 'yaml',
              label: '查看 YAML',
              icon: 'lucide:file-code',
              disabled: isAnyLoading
            },
            {
              key: 'describe',
              label: 'Describe',
              icon: 'lucide:eye',
              disabled: isAnyLoading
            },
            {
              key: 'usage',
              label: '使用情况',
              icon: 'lucide:pie-chart',
              disabled: isAnyLoading
            },
            {
              key: 'edit',
              label: '编辑',
              icon: 'lucide:edit',
              disabled: isAnyLoading
            },
            {
              key: 'delete',
              label: isDeleting ? '删除中...' : '删除',
              icon: 'lucide:trash-2',
              color: '#f56c6c',
              disabled: isAnyLoading || isBound
            }
          ]

          return h('div', {}, [
            h(ArtButtonMore, {
              list: menuItems,
              onClick: (item: ButtonMoreItem) => {
                if (!isAnyLoading || ['yaml', 'describe', 'usage'].includes(String(item.key))) {
                  buttonMoreClick(item, row)
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
