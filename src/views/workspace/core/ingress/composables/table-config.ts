import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { IngressListItem } from '@/api'

export function useIngressTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  const getIngressStatus = (item: IngressListItem) => {
    if (item.address && item.address !== '-') {
      return { type: 'success', text: '正常' }
    }
    return { type: 'warning', text: '待分配' }
  }

  const getRulesCount = (item: IngressListItem) => {
    return item.hosts?.length || 0
  }

  const hasTLS = (item: IngressListItem) => {
    return item.ports?.includes('443')
  }

  const createTableColumns = (handlers: {
    handleView: (row: IngressListItem) => void
    handleEdit: (row: IngressListItem) => void
    handleDownloadYaml: (row: IngressListItem) => void
    handleDelete: (row: IngressListItem) => void
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
          const ingressRow = row as IngressListItem
          const status = getIngressStatus(ingressRow)

          return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
            h('span', { style: 'font-weight: 500;' }, ingressRow.name),
            h(ElTag, { type: status.type as any, size: 'small' }, () => status.text)
          ])
        }
      },
      {
        prop: 'namespace',
        label: '命名空间',
        minWidth: 130,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'ingressClass',
        label: 'Ingress Class',
        minWidth: 140,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const ingressRow = row as IngressListItem
          return h(
            ElTag,
            { type: 'info', size: 'small' },
            () => ingressRow.ingressClass || 'default'
          )
        }
      },
      {
        prop: 'hosts',
        label: '主机/规则',
        minWidth: 220,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const ingressRow = row as IngressListItem

          if (!ingressRow.hosts || ingressRow.hosts.length === 0) {
            return h('span', { style: 'color: #909399;' }, '* (所有域名)')
          }

          const rulesCount = getRulesCount(ingressRow)

          return h(
            'div',
            { style: 'display: flex; flex-wrap: wrap; gap: 4px; align-items: center;' },
            [
              ...ingressRow.hosts
                .slice(0, 2)
                .map((host) => h(ElTag, { type: 'success', size: 'small' }, () => host)),
              ingressRow.hosts.length > 2
                ? h(ElTag, { type: 'info', size: 'small' }, () => `+${ingressRow.hosts.length - 2}`)
                : null,
              rulesCount > 0
                ? h(ElTag, { type: 'warning', size: 'small' }, () => `${rulesCount} 条规则`)
                : null
            ].filter(Boolean)
          )
        }
      },
      {
        prop: 'address',
        label: 'LoadBalancer 地址',
        minWidth: 180,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const ingressRow = row as IngressListItem

          if (!ingressRow.address || ingressRow.address === '-') {
            return h('span', { style: 'color: #e6a23c;' }, '待分配')
          }

          return h(
            'span',
            { style: 'font-family: monospace; font-weight: 500; color: #67c23a;' },
            ingressRow.address
          )
        }
      },
      {
        prop: 'ports',
        label: '端口/TLS',
        width: 120,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const ingressRow = row as IngressListItem
          const tlsEnabled = hasTLS(ingressRow)

          return h(
            'div',
            { style: 'display: flex; flex-direction: column; align-items: center; gap: 4px;' },
            [
              h('span', { style: 'font-size: 12px; color: #606266;' }, ingressRow.ports || '-'),
              tlsEnabled ? h(ElTag, { type: 'success', size: 'small' }, () => 'TLS') : null
            ]
          )
        }
      },
      {
        prop: 'age',
        label: '创建时间',
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
          const ingressRow = row as IngressListItem
          const isDeleting = deleteLoadingMap.value[ingressRow.name] || false
          const isDownloading = downloadLoadingMap.value[ingressRow.name] || false
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
                    handleView(ingressRow)
                    break
                  case 'edit':
                    handleEdit(ingressRow)
                    break
                  case 'download':
                    handleDownloadYaml(ingressRow)
                    break
                  case 'delete':
                    handleDelete(ingressRow)
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
