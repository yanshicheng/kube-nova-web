/**
 * IngressClass 表格配置
 */

import { ref, computed, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElTooltip } from 'element-plus'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import type { IngressClassListItem } from '@/api/workload/cluster-resource'

export function useIngressClassTableConfig() {
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<string, boolean>>({})

  const createTableColumns = (handlers: {
    handleSetDefault: (row: IngressClassListItem) => void
    handleUnsetDefault: (row: IngressClassListItem) => void
    buttonMoreClick: (item: ButtonMoreItem, row: IngressClassListItem) => void
  }) => {
    const { handleSetDefault, handleUnsetDefault, buttonMoreClick } = handlers

    const allColumns = [
      {
        prop: 'name',
        label: '名称',
        minWidth: 200,
        fixed: 'left' as const,
        visible: true,
        formatter: (row: IngressClassListItem) => {
          return h('div', { class: 'name-cell' }, [
            h('span', { class: 'resource-name' }, row.name),
            row.isDefault
              ? h(
                  ElTooltip,
                  { content: '默认 IngressClass', placement: 'top' },
                  {
                    default: () =>
                      h(
                        ElTag,
                        { type: 'primary', size: 'small', style: 'margin-left: 8px' },
                        () => '默认'
                      )
                  }
                )
              : null
          ])
        }
      },
      {
        prop: 'controller',
        label: '控制器',
        minWidth: 280,
        visible: true,
        showOverflowTooltip: true,
        formatter: (row: IngressClassListItem) => {
          const controllerName = row.controller
          let displayName = controllerName
          let description = ''

          // 识别常见控制器并添加友好名称
          if (controllerName === 'k8s.io/ingress-nginx') {
            displayName = 'NGINX Ingress'
            description = 'Kubernetes 社区版 NGINX 控制器'
          } else if (controllerName === 'traefik.io/ingress-controller') {
            displayName = 'Traefik'
            description = '云原生边缘路由器'
          } else if (controllerName === 'haproxy.org/ingress-controller') {
            displayName = 'HAProxy'
            description = '高性能负载均衡器'
          } else if (controllerName === 'nginx.org/ingress-controller') {
            displayName = 'NGINX Inc'
            description = 'NGINX 商业版控制器'
          } else if (controllerName === 'projectcontour.io/contour') {
            displayName = 'Contour'
            description = '基于 Envoy 的控制器'
          }

          return h(
            ElTooltip,
            {
              content: description ? `${displayName} - ${description}` : controllerName,
              placement: 'top'
            },
            {
              default: () =>
                h('div', { style: 'display: flex; align-items: center; gap: 8px' }, [
                  h('code', { class: 'controller-code' }, controllerName),
                  displayName !== controllerName
                    ? h(
                        ElTag,
                        { size: 'small', type: 'info', style: 'font-size: 11px' },
                        () => displayName
                      )
                    : null
                ])
            }
          )
        }
      },
      {
        prop: 'parameters',
        label: '参数',
        width: 150,
        visible: true,
        formatter: (row: IngressClassListItem) => {
          if (!row.parameters || row.parameters === '<none>') {
            return h('span', { style: 'color: #909399; font-size: 13px' }, '-')
          }
          return h(
            ElTooltip,
            { content: `参数配置：${row.parameters}`, placement: 'top' },
            {
              default: () => h(ElTag, { size: 'small', type: 'info' }, () => row.parameters)
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
        formatter: (row: IngressClassListItem): VNode => {
          const isDeleting = deleteLoadingMap.value[row.name] || false
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
              key: 'controllerStatus',
              label: '控制器状态',
              icon: 'lucide:activity',
              disabled: isAnyLoading
            },
            {
              key: 'edit',
              label: '编辑',
              icon: 'lucide:edit',
              disabled: isAnyLoading
            },
            row.isDefault
              ? {
                  key: 'unsetDefault',
                  label: '取消默认',
                  icon: 'lucide:star-off',
                  disabled: isAnyLoading
                }
              : {
                  key: 'setDefault',
                  label: '设为默认',
                  icon: 'lucide:star',
                  disabled: isAnyLoading
                },
            {
              key: 'delete',
              label: isDeleting ? '删除中...' : '删除',
              icon: 'lucide:trash-2',
              color: '#f56c6c',
              disabled: isAnyLoading
            }
          ]

          return h('div', {}, [
            h(ArtButtonMore, {
              list: menuItems,
              onClick: (item: ButtonMoreItem) => {
                if (!isAnyLoading) {
                  if (item.key === 'setDefault') {
                    handleSetDefault(row)
                  } else if (item.key === 'unsetDefault') {
                    handleUnsetDefault(row)
                  } else {
                    buttonMoreClick(item, row)
                  }
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
