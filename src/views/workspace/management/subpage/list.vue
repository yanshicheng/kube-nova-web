<template>
  <div class="workspace-list-view">
    <div class="table-container">
      <ArtTable
        :loading="loading"
        :data="displayData"
        :columns="tableColumns"
        :pagination="tablePagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handlePageChange"
      />
    </div>

    <!-- 迁移对话框 -->
    <MigrateWorkspaceDialog
      v-model="migrateDialogVisible"
      :workspace="selectedWorkspace"
      :current-project="currentProject"
      @success="handleMigrateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, h, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElButton, ElTag, ElSpace } from 'element-plus'
  import { Setting, Edit, Delete, Monitor as MonitorIcon, Position } from '@element-plus/icons-vue'
  import type { ProjectWorkspace } from '@/api'
  import { formatResourceDisplay } from '@/utils/resource'
  import { useProjectStore } from '@/store/modules/project'
  import MigrateWorkspaceDialog from './dialog/MigrateWorkspaceDialog.vue'

  interface Props {
    workspaces: ProjectWorkspace[]
    loading: boolean
  }

  interface Emits {
    (e: 'edit', workspace: ProjectWorkspace): void
    (e: 'delete', workspace: ProjectWorkspace): void
    (e: 'manage', workspace: ProjectWorkspace): void
    (e: 'refresh'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const router = useRouter()
  const projectStore = useProjectStore()

  // 分页配置
  const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const migrateDialogVisible = ref(false)
  const selectedWorkspace = ref<ProjectWorkspace | null>(null)
  const currentProject = computed(() => projectStore.selectedProject)

  // 转换分页格式（适配 ArtTable 组件）
  const tablePagination = computed(() => ({
    current: pagination.value.current,
    size: pagination.value.pageSize,
    total: pagination.value.total
  }))

  // 计算显示数据（支持前端分页）
  const displayData = computed(() => {
    const start = (pagination.value.current - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return props.workspaces.slice(start, end)
  })

  // 监听数据变化，更新总数
  watch(
    () => props.workspaces,
    (newData) => {
      pagination.value.total = newData.length
    },
    { immediate: true }
  )

  // 跳转到监控页面
  const handleMonitoring = (workspace: ProjectWorkspace) => {
    router.push({
      name: 'namespaceMonitoring',
      query: {
        clusterUuid: workspace.clusterUuid,
        clusterId: workspace.projectClusterId,
        namespace: workspace.namespace
      }
    })
  }

  // 处理迁移
  const handleMigrate = (workspace: ProjectWorkspace) => {
    selectedWorkspace.value = workspace
    migrateDialogVisible.value = true
  }

  // 迁移成功回调
  const handleMigrateSuccess = () => {
    emit('refresh')
  }

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 表格列配置
  const allColumns = [
    {
      prop: 'status',
      label: '状态',
      width: 80,
      fixed: 'left' as const,
      visible: true,
      formatter: (row: Record<string, any>) => {
        return h(
          ElTag,
          {
            type: row.status === 1 ? 'success' : 'danger',
            size: 'small'
          },
          () => (row.status === 1 ? '正常' : '异常')
        )
      }
    },
    {
      prop: 'name',
      label: '工作空间',
      minWidth: 150,
      fixed: 'left' as const,
      showOverflowTooltip: true,
      visible: true,
      formatter: (row: Record<string, any>) => {
        return h('div', { class: 'workspace-name-cell' }, [
          h('img', {
            src: '/src/assets/img/cluster/kubernetes.png',
            class: 'k8s-icon',
            style: 'width: 20px; height: 20px; margin-right: 8px;'
          }),
          h('div', { class: 'workspace-info' }, [
            h(
              'div',
              {
                class: 'name',
                style: 'color: var(--el-color-primary); cursor: pointer;',
                onClick: () => emit('manage', row as ProjectWorkspace)
              },
              row.name
            ),
            h('div', { class: 'namespace' }, row.namespace)
          ])
        ])
      }
    },
    {
      prop: 'description',
      label: '描述',
      minWidth: 200,
      showOverflowTooltip: true,
      visible: true,
      formatter: (row: Record<string, any>) => row.description || '-'
    },
    {
      prop: 'resources',
      label: '基础资源',
      width: 320,
      visible: true,
      formatter: (row: Record<string, any>) => {
        return h('div', { class: 'resource-group' }, [
          h('div', { class: 'resource-item' }, [
            h('span', { class: 'resource-label' }, 'CPU:'),
            h('span', { class: 'resource-value' }, formatResourceDisplay(row.cpuAllocated, 'cpu'))
          ]),
          h('div', { class: 'resource-item' }, [
            h('span', { class: 'resource-label' }, '内存:'),
            h(
              'span',
              { class: 'resource-value' },
              formatResourceDisplay(row.memAllocated, 'memory')
            )
          ]),
          h('div', { class: 'resource-item' }, [
            h('span', { class: 'resource-label' }, '存储:'),
            h(
              'span',
              { class: 'resource-value' },
              formatResourceDisplay(row.storageAllocated, 'memory')
            )
          ]),
          h('div', { class: 'resource-item' }, [
            h('span', { class: 'resource-label' }, 'GPU:'),
            h('span', { class: 'resource-value' }, formatResourceDisplay(row.gpuAllocated, 'cpu'))
          ]),
          h('div', { class: 'resource-item' }, [
            h('span', { class: 'resource-label' }, 'Pod:'),
            h('span', { class: 'resource-value' }, row.podsAllocated || '∞')
          ])
        ])
      }
    },
    {
      prop: 'workloads',
      label: '工作负载限制',
      minWidth: 280,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const workloadItems = [
          { label: 'Deploy', value: row.deploymentsAllocated },
          { label: 'StatefulSet', value: row.statefulsetsAllocated },
          { label: 'DaemonSet', value: row.daemonsetsAllocated },
          { label: 'Job', value: row.jobsAllocated },
          { label: 'CronJob', value: row.cronjobsAllocated }
        ]

        return h(
          'div',
          { class: 'workload-limits' },
          workloadItems.map((item) =>
            h(
              ElTag,
              {
                size: 'small',
                type: item.value ? 'info' : '',
                style: 'margin: 2px'
              },
              () => `${item.label}: ${item.value || '∞'}`
            )
          )
        )
      }
    },
    {
      prop: 'configs',
      label: '配置资源限制',
      minWidth: 240,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const configItems = [
          { label: 'ConfigMap', value: row.configmapAllocated },
          { label: 'Secret', value: row.secretAllocated },
          { label: 'PVC', value: row.pvcAllocated }
        ]

        return h(
          'div',
          { class: 'config-limits' },
          configItems.map((item) =>
            h(
              ElTag,
              {
                size: 'small',
                type: item.value ? 'warning' : '',
                style: 'margin: 2px'
              },
              () => `${item.label}: ${item.value || '∞'}`
            )
          )
        )
      }
    },
    {
      prop: 'network',
      label: '网络资源限制',
      minWidth: 260,
      visible: true,
      formatter: (row: Record<string, any>) => {
        const networkItems = [
          { label: 'Service', value: row.serviceAllocated },
          { label: 'Ingress', value: row.ingressesAllocated },
          { label: 'LB', value: row.loadbalancersAllocated },
          { label: 'NodePort', value: row.nodeportsAllocated }
        ]

        return h(
          'div',
          { class: 'network-limits' },
          networkItems.map((item) =>
            h(
              ElTag,
              {
                size: 'small',
                type: item.value ? 'success' : '',
                style: 'margin: 2px'
              },
              () => `${item.label}: ${item.value || '∞'}`
            )
          )
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
        return h(
          'span',
          { style: 'font-size: 12px; color: var(--el-text-color-secondary);' },
          formatTime(row.createdAt)
        )
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 380,
      fixed: 'right' as const,
      visible: true,
      formatter: (row: Record<string, any>) => {
        return h(ElSpace, { wrap: true }, () => [
          h(
            ElButton,
            {
              type: 'primary',
              size: 'small',
              icon: Setting,
              onClick: () => emit('manage', row as ProjectWorkspace)
            },
            () => '详情'
          ),
          h(
            ElButton,
            {
              type: 'success',
              size: 'small',
              icon: MonitorIcon,
              plain: true,
              onClick: () => handleMonitoring(row as ProjectWorkspace)
            },
            () => '监控'
          ),
          h(
            ElButton,
            {
              type: 'warning',
              size: 'small',
              icon: Position,
              plain: true,
              onClick: () => handleMigrate(row as ProjectWorkspace)
            },
            () => '迁移'
          ),
          h(
            ElButton,
            {
              size: 'small',
              icon: Edit,
              plain: true,
              onClick: () => emit('edit', row as ProjectWorkspace)
            },
            () => '编辑'
          ),
          h(
            ElButton,
            {
              type: 'danger',
              size: 'small',
              icon: Delete,
              plain: true,
              onClick: () => emit('delete', row as ProjectWorkspace)
            },
            () => '删除'
          )
        ])
      }
    }
  ]

  const tableColumns = ref(allColumns)

  // 处理分页改变
  const handlePageChange = (page: number) => {
    pagination.value.current = page
  }

  // 处理分页大小改变
  const handleSizeChange = (size: number) => {
    pagination.value.pageSize = size
    pagination.value.current = 1
  }
</script>

<style lang="scss" scoped>
  .workspace-list-view {
    .table-container {
      min-height: 500px;
      padding-bottom: 20px;
    }

    :deep(.workspace-name-cell) {
      display: flex;
      align-items: center;

      .k8s-icon {
        flex-shrink: 0;
        border-radius: 4px;
      }

      .workspace-info {
        flex: 1;
        min-width: 0;

        .name {
          font-weight: 500;
          color: var(--el-color-primary);
          margin-bottom: 2px;
          transition: all 0.3s;
          cursor: pointer;

          &:hover {
            color: var(--el-color-primary-light-3);
            text-decoration: underline;
          }
        }

        .namespace {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-family: monospace;
        }
      }
    }

    :deep(.resource-group) {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .resource-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: var(--el-fill-color-lighter);
        border-radius: 4px;

        .resource-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }

        .resource-value {
          font-size: 12px;
          font-weight: 500;
          font-family: monospace;
          color: var(--el-text-color-primary);
        }
      }
    }

    :deep(.workload-limits),
    :deep(.config-limits),
    :deep(.network-limits) {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    :deep(.el-table) {
      .el-table__header {
        th {
          background: #f5f7fa;
        }
      }

      .el-table__row {
        &:hover {
          background-color: var(--el-fill-color-light);
        }
      }
    }
  }
</style>
