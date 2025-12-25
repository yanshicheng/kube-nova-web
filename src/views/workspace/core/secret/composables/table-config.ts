import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { SecretListItem } from '@/api'

export function useSecretTableConfig() {
  const loading = ref(true)
  const showSearchBar = ref(false)
  const deleteLoadingMap = ref<Record<string, boolean>>({})
  const downloadLoadingMap = ref<Record<string, boolean>>({})

  // 获取 Secret 类型标签样式
  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { type: string; label: string }> = {
      Opaque: { type: 'info', label: 'Opaque' },
      'kubernetes.io/tls': { type: 'success', label: 'TLS' },
      'kubernetes.io/dockerconfigjson': { type: 'warning', label: 'Docker Config' },
      'kubernetes.io/service-account-token': { type: 'primary', label: 'SA Token' },
      'kubernetes.io/basic-auth': { type: 'danger', label: 'Basic Auth' },
      'kubernetes.io/ssh-auth': { type: '', label: 'SSH Auth' }
    }
    return typeMap[type] || { type: 'info', label: type }
  }

  const createTableColumns = (handlers: {
    handleView: (row: SecretListItem) => void
    handleEdit: (row: SecretListItem) => void
    handleViewUsage: (row: SecretListItem) => void
    handleDownloadYaml: (row: SecretListItem) => void
    handleDelete: (row: SecretListItem) => void
  }) => {
    const { handleView, handleEdit, handleViewUsage, handleDownloadYaml, handleDelete } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 200,
        fixed: 'left' as const,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'namespace',
        label: '命名空间',
        minWidth: 150,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'type',
        label: '类型',
        minWidth: 180,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const secretRow = row as SecretListItem
          const tagInfo = getTypeTag(secretRow.type)
          return h(ElTag, { type: tagInfo.type as any, size: 'small' }, () => tagInfo.label)
        }
      },
      {
        prop: 'dataCount',
        label: '数据项数量',
        width: 120,
        align: 'center' as const,
        visible: true
      },
      {
        prop: 'age',
        label: '创建时间',
        minWidth: 150,
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
          const secretRow = row as SecretListItem
          const isDeleting = deleteLoadingMap.value[secretRow.name] || false
          const isDownloading = downloadLoadingMap.value[secretRow.name] || false
          const isAnyLoading = isDeleting || isDownloading

          return h(ArtButtonMore, {
            list: [
              {
                key: 'view',
                label: '查看详情',
                icon: 'lucide:eye',
                disabled: isAnyLoading
              },
              {
                key: 'edit',
                label: '编辑',
                icon: 'lucide:edit',
                disabled: isAnyLoading
              },
              {
                key: 'usage',
                label: '查看引用',
                icon: 'lucide:link',
                disabled: isAnyLoading
              },
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
                    handleView(secretRow)
                    break
                  case 'edit':
                    handleEdit(secretRow)
                    break
                  case 'usage':
                    handleViewUsage(secretRow)
                    break
                  case 'download':
                    handleDownloadYaml(secretRow)
                    break
                  case 'delete':
                    handleDelete(secretRow)
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
    createTableColumns,
    getTypeTag
  }
}
