<template>
  <div class="flagger-management-modern">
    <!-- 表格头部 -->
    <ArtTableHeader
      v-model:columns="columns"
      :loading="loading"
      :showZebra="true"
      :showBorder="true"
      :showHeaderBackground="true"
      :fullClass="'flagger-management-modern'"
      :layout="'refresh,size,fullscreen,columns,settings'"
      @refresh="handleRefresh"
    >
      <template #left>
        <ElSpace wrap>
          <ElButton type="primary" :icon="Plus" @click="handleCreate"> 创建 Canary 发布 </ElButton>
        </ElSpace>
      </template>
    </ArtTableHeader>

    <!-- 数据表格 -->
    <ArtTable :loading="loading" :data="canaries" :columns="columns" />

    <!-- 创建/编辑对话框 -->
    <FlaggerCreateDialog
      v-model="createDialogVisible"
      :mode="dialogMode"
      :canary-name="currentCanaryName"
      :application="application"
      :workspace="workspace"
      @success="handleCreateSuccess"
    />

    <!-- 详情查看弹窗 -->
    <FlaggerDetailDialog
      v-model="detailVisible"
      :canary-name="currentCanaryName"
      :workspace="workspace"
    />

    <!-- 状态查看弹窗 -->
    <FlaggerStatusDialog
      v-model="statusVisible"
      :canary-name="currentCanaryName"
      :workspace="workspace"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, h, watch } from 'vue'
  import type { VNode } from 'vue'
  import {
    ElMessage,
    ElMessageBox,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElTag,
    ElButton
  } from 'element-plus'
  import {
    Plus,
    MoreVertical,
    Eye,
    Activity,
    Pause,
    Play,
    RotateCcw,
    Download,
    Trash2,
    Edit
  } from 'lucide-vue-next'
  import FlaggerCreateDialog from './components/FlaggerCreateDialog.vue'
  import FlaggerDetailDialog from './components/FlaggerDetailDialog.vue'
  import FlaggerStatusDialog from './components/FlaggerStatusDialog.vue'
  import {
    getCanaryListApplicationApi,
    getCanaryYamlApi,
    deleteCanaryApi,
    pauseCanaryApi,
    resumeCanaryApi,
    resetCanaryApi,
    type CanaryListItem,
    type OnecProjectApplication,
    type ProjectWorkspace
  } from '@/api'

  interface Props {
    application: OnecProjectApplication
    workspace: ProjectWorkspace | null
    refreshTrigger: number
  }

  const props = defineProps<Props>()

  const canaries = ref<CanaryListItem[]>([])
  const loading = ref(false)
  const createDialogVisible = ref(false)
  const detailVisible = ref(false)
  const statusVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const currentCanaryName = ref('')

  const getStatusTypeTag = (status: string) => {
    const tagMap: Record<string, string> = {
      Initialized: 'info',
      Progressing: 'warning',
      Promoting: 'primary',
      Finalising: 'primary',
      Succeeded: 'success',
      Failed: 'danger'
    }
    return tagMap[status] || 'info'
  }

  const getPhaseTypeTag = (phase: string) => {
    const tagMap: Record<string, string> = {
      Initializing: 'info',
      Waiting: 'info',
      Progressing: 'warning',
      Promoting: 'primary',
      Finalising: 'primary',
      Succeeded: 'success',
      Failed: 'danger'
    }
    return tagMap[phase] || 'info'
  }

  const formatAge = (ageStr: string): string => {
    if (!ageStr) return '-'
    return ageStr.replace(/(\d+)\.(\d+)([a-z]+)/g, '$1$3')
  }

  const handleCommand = (command: string, row: CanaryListItem) => {
    currentCanaryName.value = row.name

    switch (command) {
      case 'view':
        detailVisible.value = true
        break
      case 'status':
        statusVisible.value = true
        break
      case 'edit':
        dialogMode.value = 'edit'
        createDialogVisible.value = true
        break
      case 'pause':
        handlePause(row)
        break
      case 'resume':
        handleResume(row)
        break
      case 'reset':
        handleReset(row)
        break
      case 'yaml':
        handleDownloadYaml(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  // 创建表格列配置
  const createTableColumns = () => {
    const allColumns = [
      {
        prop: 'name',
        label: 'Canary 名称',
        minWidth: 180,
        fixed: 'left' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('span', { style: 'font-weight: 500;' }, row.name)
        }
      },
      {
        prop: 'targetRef',
        label: '目标资源',
        width: 200,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('div', { class: 'target-cell' }, [
            h(ElTag, { type: 'primary', size: 'small' }, () => row.targetRef.kind),
            h('span', { style: 'margin-left: 8px; color: #606266;' }, row.targetRef.name)
          ])
        }
      },
      {
        prop: 'status',
        label: '状态',
        width: 140,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h(ElTag, { type: getStatusTypeTag(row.status), size: 'default' }, () => row.status)
        }
      },
      {
        prop: 'phase',
        label: '阶段',
        width: 140,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h(ElTag, { type: getPhaseTypeTag(row.phase), size: 'default' }, () => row.phase)
        }
      },
      {
        prop: 'canaryWeight',
        label: '金丝雀权重',
        width: 150,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('span', { style: 'font-weight: 500; color: #67c23a;' }, `${row.canaryWeight}%`)
        }
      },
      {
        prop: 'failedChecks',
        label: '失败次数',
        width: 120,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const color = row.failedChecks > 0 ? '#f56c6c' : '#909399'
          return h('span', { style: `color: ${color}; font-weight: 500;` }, row.failedChecks)
        }
      },
      {
        prop: 'age',
        label: '创建时长',
        width: 130,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('span', formatAge(row.age))
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 80,
        align: 'center' as const,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          return h('div', [
            h(
              ElDropdown,
              {
                trigger: 'click',
                onCommand: (cmd: string) => handleCommand(cmd, row)
              },
              {
                default: () =>
                  h(ElButton, { type: 'primary', link: true }, () => h(MoreVertical, { size: 16 })),
                dropdown: () =>
                  h(ElDropdownMenu, {}, () => [
                    h(ElDropdownItem, { command: 'view' }, () => [
                      h(Eye, { size: 14, style: 'margin-right: 6px' }),
                      '查看详情'
                    ]),
                    h(ElDropdownItem, { command: 'status' }, () => [
                      h(Activity, { size: 14, style: 'margin-right: 6px' }),
                      '查看状态'
                    ]),
                    h(ElDropdownItem, { command: 'edit' }, () => [
                      h(Edit, { size: 14, style: 'margin-right: 6px' }),
                      '编辑'
                    ]),
                    h('li', { class: 'el-dropdown-menu__item--divided', role: 'separator' }),
                    h(ElDropdownItem, { command: 'pause' }, () => [
                      h(Pause, { size: 14, style: 'margin-right: 6px' }),
                      '暂停发布'
                    ]),
                    h(ElDropdownItem, { command: 'resume' }, () => [
                      h(Play, { size: 14, style: 'margin-right: 6px' }),
                      '恢复发布'
                    ]),
                    h(ElDropdownItem, { command: 'reset' }, () => [
                      // 修复：使用已导入的 RotateCcw 替代未导入的 RotateCw
                      h(RotateCcw, { size: 14, style: 'margin-right: 6px' }),
                      '重置状态'
                    ]),
                    h(ElDropdownItem, { command: 'yaml' }, () => [
                      h(Download, { size: 14, style: 'margin-right: 6px' }),
                      '下载 YAML'
                    ]),
                    h('li', { class: 'el-dropdown-menu__item--divided', role: 'separator' }),
                    h(ElDropdownItem, { command: 'delete' }, () => [
                      h(Trash2, { size: 14, style: 'margin-right: 6px; color: #f56c6c' }),
                      h('span', { style: 'color: #f56c6c' }, '删除')
                    ])
                  ])
              }
            )
          ])
        }
      }
    ]

    const columns = ref(allColumns)

    return {
      columns
    }
  }

  const { columns } = createTableColumns()

  const loadCanaries = async () => {
    if (!props.workspace) return

    loading.value = true
    try {
      const result = await getCanaryListApplicationApi({
        workloadId: props.workspace.id,
        applicationId: props.application.id,
        search: '',
        labelSelector: ''
      })
      canaries.value = result || []
    } catch (error) {
      console.error('加载 Canary 列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleCreate = () => {
    dialogMode.value = 'create'
    currentCanaryName.value = ''
    createDialogVisible.value = true
  }

  const handleCreateSuccess = () => {
    loadCanaries()
  }

  const handleRefresh = () => {
    loadCanaries()
  }

  const handlePause = async (canary: CanaryListItem) => {
    if (!props.workspace) return

    try {
      await pauseCanaryApi({
        workloadId: props.workspace.id,
        name: canary.name
      })
      ElMessage.success('已暂停发布')
      await loadCanaries()
    } catch (error) {
      console.error('暂停失败:', error)
    }
  }

  const handleResume = async (canary: CanaryListItem) => {
    if (!props.workspace) return

    try {
      await resumeCanaryApi({
        workloadId: props.workspace.id,
        name: canary.name
      })
      ElMessage.success('已恢复发布')
      await loadCanaries()
    } catch (error) {
      console.error('恢复失败:', error)
    }
  }

  const handleReset = async (canary: CanaryListItem) => {
    if (!props.workspace) return

    try {
      await ElMessageBox.confirm('确定要重置 Canary 状态吗？这将清除当前的发布进度。', '重置确认', {
        type: 'warning',
        confirmButtonText: '确定重置',
        cancelButtonText: '取消'
      })

      await resetCanaryApi({
        workloadId: props.workspace.id,
        name: canary.name
      })
      ElMessage.success('已重置状态')
      await loadCanaries()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('重置失败:', error)
      }
    }
  }

  const handleDownloadYaml = async (canary: CanaryListItem) => {
    if (!props.workspace) return

    try {
      const yaml = await getCanaryYamlApi({
        workloadId: props.workspace.id,
        name: canary.name
      })

      const blob = new Blob([yaml], { type: 'text/yaml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${canary.name}.yaml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success('下载成功')
    } catch (error) {
      console.error('下载YAML失败:', error)
    }
  }

  const handleDelete = async (canary: CanaryListItem) => {
    if (!props.workspace) return

    try {
      await ElMessageBox.confirm(
        `确定要删除 Canary "${canary.name}" 吗？此操作不可恢复！`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消'
        }
      )

      await deleteCanaryApi({
        workloadId: props.workspace.id,
        name: canary.name
      })

      ElMessage.success('删除成功')
      await loadCanaries()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    }
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal > 0) {
        loadCanaries()
      }
    }
  )

  onMounted(() => {
    loadCanaries()
  })
</script>

<style lang="scss" scoped>
  .flagger-management-modern {
    padding-top: 10px;
    padding-bottom: 15px;
    margin: 2px;

    .canary-name-cell {
      display: flex;
      align-items: center;
    }

    .target-cell {
      display: flex;
      align-items: center;
    }

    .weight-cell {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    // 空状态高度优化
    :deep(.el-table__empty-block) {
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :deep(.el-table__empty-text) {
      width: 100%;
    }
  }
</style>
