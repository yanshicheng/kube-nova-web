import { ref, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElButton } from 'element-plus'
import { Setting, Monitor as MonitorIcon, View } from '@element-plus/icons-vue'
import type { ClusterNodeInfo } from '@/api/manager/node'

export function useNodeTableConfig() {
  const loading = ref(false)
  const showSearchBar = ref(false)
  const operationLoading = ref(false)

  const formatTimestamp = (timestamp: number | undefined | null): string => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const createTableColumns = (handlers: {
    handleNodeManage: (row: ClusterNodeInfo) => void
    handleNodeMonitor: (row: ClusterNodeInfo) => void
    handleNodeDetail: (row: ClusterNodeInfo) => void
  }) => {
    const { handleNodeManage, handleNodeMonitor, handleNodeDetail } = handlers

    const allColumns = [
      {
        prop: 'nodeName',
        label: '节点名称',
        minWidth: 150,
        showOverflowTooltip: true,
        fixed: 'left' as const,
        visible: true
      },
      {
        prop: 'nodeIp',
        label: 'IP地址',
        width: 140,
        visible: true
      },
      {
        prop: 'nodeRole',
        label: '节点角色',
        width: 120,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const role = row.nodeRole?.toLowerCase() || ''
          const isControl = role.includes('control') || role.includes('master')
          return h(ElTag, { type: isControl ? 'danger' : 'info', size: 'small' }, () =>
            isControl ? 'Control Plane' : 'Worker'
          )
        }
      },
      {
        prop: 'nodeStatus',
        label: '状态',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const statusMap: Record<string, any> = {
            Ready: { text: '就绪', type: 'success' },
            NotReady: { text: '未就绪', type: 'danger' },
            Unknown: { text: '未知', type: 'warning' }
          }
          const status = statusMap[row.nodeStatus] || { text: row.nodeStatus, type: 'info' }
          return h(ElTag, { type: status.type, size: 'small' }, () => status.text)
        }
      },
      {
        prop: 'unschedulable',
        label: '调度状态',
        width: 100,
        visible: true,
        formatter: (row: Record<string, any>) => {
          return h(
            ElTag,
            { type: row.unschedulable === 2 ? 'danger' : 'success', size: 'small' },
            () => (row.unschedulable === 2 ? '禁止调度' : '允许调度')
          )
        }
      },
      {
        prop: 'architecture',
        label: '架构',
        width: 100,
        visible: true
      },
      {
        prop: 'createdAt',
        label: '创建时间',
        width: 180,
        sortable: true,
        visible: true,
        formatter: (row: Record<string, any>) => formatTimestamp(row.createdAt)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 240,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('div', { style: 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
            h(
              ElButton,
              {
                type: 'primary',
                size: 'small',
                icon: Setting,
                disabled: operationLoading.value,
                onClick: () => handleNodeManage(row as ClusterNodeInfo)
              },
              () => '管理'
            ),
            h(
              ElButton,
              {
                type: 'success',
                size: 'small',
                icon: MonitorIcon,
                disabled: operationLoading.value,
                onClick: () => handleNodeMonitor(row as ClusterNodeInfo)
              },
              () => '监控'
            ),
            h(
              ElButton,
              {
                type: 'info',
                size: 'small',
                icon: View,
                disabled: operationLoading.value,
                onClick: () => handleNodeDetail(row as ClusterNodeInfo)
              },
              () => '详情'
            )
          ])
        }
      }
    ]

    const columns = ref(allColumns)

    return { columns }
  }

  return {
    loading,
    showSearchBar,
    operationLoading,
    createTableColumns,
    formatTimestamp
  }
}
