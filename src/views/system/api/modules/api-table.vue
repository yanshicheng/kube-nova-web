<template>
  <div class="api-table">
    <ArtTable
      :loading="loading"
      :data="data"
      :columns="tableColumns"
      :pagination="pagination"
      @pagination:size-change="handleSizeChange"
      @pagination:current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, h } from 'vue'
  import type { VNode } from 'vue'
  import { ElTag } from 'element-plus'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import type { ApiSysAPI } from '@/api/portal/api'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  interface Props {
    loading?: boolean
    data: ApiSysAPI[]
    columns?: any[]
    pagination: {
      current: number
      size: number
      total: number
    }
  }

  interface Emits {
    (e: 'edit', row: ApiSysAPI): void
    (e: 'delete', row: ApiSysAPI): void
    (e: 'size-change', size: number): void
    (e: 'current-change', current: number): void
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    data: () => [],
    columns: () => []
  })

  const emit = defineEmits<Emits>()

  // 删除loading状态管理
  const deleteLoadingMap = ref<Record<number, boolean>>({})

  // 时间格式化函数
  const formatTimestamp = (timestamp: number | undefined | null): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // HTTP方法颜色映射
  const methodColorMap: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info',
    OPTIONS: '',
    HEAD: '',
    '*': ''
  }

  // 表格列配置
  const tableColumns = computed(() => [
    {
      prop: 'id',
      label: 'ID',
      width: 80,
      visible: true
    },
    {
      prop: 'name',
      label: 'API名称',
      minWidth: 150,
      showOverflowTooltip: true,
      visible: true
    },
    {
      prop: 'path',
      label: 'API路径',
      minWidth: 200,
      showOverflowTooltip: true,
      visible: true
    },
    {
      prop: 'method',
      label: 'HTTP方法',
      width: 120,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const apiRow = row as ApiSysAPI
        return h(
          ElTag,
          {
            type: (methodColorMap[apiRow.method] || 'info') as any,
            size: 'small'
          },
          () => apiRow.method
        )
      }
    },
    {
      prop: 'isPermission',
      label: '类型',
      width: 100,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const apiRow = row as ApiSysAPI
        return h(
          ElTag,
          {
            type: apiRow.isPermission === 0 ? 'warning' : 'success',
            size: 'small'
          },
          () => (apiRow.isPermission === 0 ? '分组' : '权限')
        )
      }
    },
    {
      prop: 'createdAt',
      label: '创建时间',
      width: 180,
      sortable: true,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const apiRow = row as ApiSysAPI
        return formatTimestamp(apiRow.createdAt)
      }
    },
    {
      prop: 'updatedAt',
      label: '更新时间',
      width: 180,
      sortable: true,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const apiRow = row as ApiSysAPI
        return formatTimestamp(apiRow.updatedAt)
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 100,
      fixed: 'right' as const,
      visible: true,
      formatter: (row: Record<string, any>): VNode => {
        const apiRow = row as ApiSysAPI
        const isDeleting = deleteLoadingMap.value[apiRow.id] || false

        const menuItems: ButtonMoreItem[] = [
          {
            key: 'edit',
            label: '编辑',
            icon: 'Edit',
            disabled: isDeleting
          },
          {
            key: 'delete',
            label: isDeleting ? '删除中...' : '删除',
            icon: 'Delete',
            color: '#f56c6c',
            disabled: isDeleting
          }
        ]

        return h('div', {}, [
          h(ArtButtonMore, {
            list: menuItems,
            onClick: (item: ButtonMoreItem) => {
              if (!isDeleting) {
                buttonMoreClick(item, apiRow)
              }
            }
          })
        ])
      }
    }
  ])

  // 按钮更多点击事件
  const buttonMoreClick = (item: ButtonMoreItem, row: ApiSysAPI) => {
    switch (item.key) {
      case 'edit':
        emit('edit', row)
        break
      case 'delete':
        deleteLoadingMap.value[row.id] = true
        emit('delete', row)
        // 3秒后自动重置loading状态（防止异常情况）
        setTimeout(() => {
          deleteLoadingMap.value[row.id] = false
        }, 3000)
        break
    }
  }

  // 分页事件
  const handleSizeChange = (size: number) => {
    emit('size-change', size)
  }

  const handleCurrentChange = (current: number) => {
    emit('current-change', current)
  }
</script>

<style lang="scss" scoped>
  .api-table {
    width: 100%;
  }
</style>
