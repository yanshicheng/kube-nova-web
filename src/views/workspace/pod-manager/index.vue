<!-- /Users/devops/data/project/vue/art-design-pro/src/views/workspace/pod-manager/index.vue -->
<template>
  <div class="pod-manager-page art-full-height">
    <!-- 面包屑式选择器 -->
    <div class="breadcrumb-selector">
      <div class="breadcrumb-content">
        <!-- 集群选择 -->
        <div class="breadcrumb-item">
          <span class="breadcrumb-label">
            <Server :size="14" />
            集群
          </span>
          <!-- 集群选择 -->
          <ElSelect
            v-model="selectedClusterId"
            placeholder="选择集群"
            clearable
            size="default"
            :disabled="!selectedProject"
            :loading="loadingClusters"
            @change="handleClusterChange"
            @clear="handleClusterClear"
            popper-class="pod-cluster-dropdown"
            class="breadcrumb-select"
          >
            <ElOption
              v-for="cluster in clusters"
              :key="cluster.id"
              :label="cluster.clusterName"
              :value="cluster.id"
            >
              <div class="cluster-option">
                <span class="option-name">{{ cluster.clusterName }}</span>
                <span class="option-meta">
                  CPU {{ cluster.cpuCapacity }}核 · 内存 {{ cluster.memCapacity }}GB
                </span>
              </div>
            </ElOption>
          </ElSelect>
        </div>

        <div class="breadcrumb-separator">
          <ChevronRight :size="16" />
        </div>

        <!-- 工作空间选择 -->
        <div class="breadcrumb-item">
          <span class="breadcrumb-label">
            <Box :size="14" />
            工作空间
          </span>
          <ElSelect
            v-model="selectedWorkspaceId"
            placeholder="选择工作空间"
            clearable
            size="default"
            :disabled="!selectedClusterId"
            :loading="loadingWorkspaces"
            @change="handleWorkspaceChange"
            @clear="handleWorkspaceClear"
            popper-class="pod-workspace-dropdown"
            class="breadcrumb-select"
          >
            <ElOption
              v-for="workspace in workspaces"
              :key="workspace.id"
              :label="workspace.name"
              :value="workspace.id"
            >
              <div class="workspace-option">
                <span class="option-name">{{ workspace.name }}</span>
                <ElTag size="small" type="info">{{ workspace.namespace }}</ElTag>
              </div>
            </ElOption>
          </ElSelect>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="breadcrumb-actions">
        <!-- 自动刷新下拉菜单 -->
        <ElDropdown @command="handleRefreshCommand" trigger="click">
          <ElButton :icon="RefreshCw" :loading="loading">
            {{ refreshButtonText }}
            <ChevronDown :size="14" style="margin-left: 4px" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem command="manual">
                <RefreshCw :size="14" style="margin-right: 6px" />
                手动刷新
              </ElDropdownItem>
              <ElDropdownItem divided command="disable">
                <span :style="{ color: !autoRefreshEnabled ? '#409eff' : undefined }">
                  {{ !autoRefreshEnabled ? '✓ ' : '' }}关闭自动刷新
                </span>
              </ElDropdownItem>
              <ElDropdownItem command="1">
                <span :style="{ color: autoRefreshInterval === 1 ? '#409eff' : undefined }">
                  {{ autoRefreshInterval === 1 ? '✓ ' : '' }}每1秒刷新
                </span>
              </ElDropdownItem>
              <ElDropdownItem command="3">
                <span :style="{ color: autoRefreshInterval === 3 ? '#409eff' : undefined }">
                  {{ autoRefreshInterval === 3 ? '✓ ' : '' }}每3秒刷新
                </span>
              </ElDropdownItem>
              <ElDropdownItem command="5">
                <span :style="{ color: autoRefreshInterval === 5 ? '#409eff' : undefined }">
                  {{ autoRefreshInterval === 5 ? '✓ ' : '' }}每5秒刷新
                </span>
              </ElDropdownItem>
              <ElDropdownItem command="10">
                <span :style="{ color: autoRefreshInterval === 10 ? '#409eff' : undefined }">
                  {{ autoRefreshInterval === 10 ? '✓ ' : '' }}每10秒刷新
                </span>
              </ElDropdownItem>
              <ElDropdownItem command="30">
                <span :style="{ color: autoRefreshInterval === 30 ? '#409eff' : undefined }">
                  {{ autoRefreshInterval === 30 ? '✓ ' : '' }}每30秒刷新
                </span>
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
    </div>

    <!-- 主体内容 -->
    <template v-if="selectedWorkspace">
      <!-- 搜索栏 -->
      <ArtSearchBar
        v-show="showSearchBar"
        v-model="searchForm"
        :items="searchFormItems"
        :showExpand="false"
        @reset="handleReset"
        @search="handleSearch"
      />

      <ElCard
        class="art-table-card"
        shadow="never"
        :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
      >
        <!-- 工具栏 -->
        <ArtTableHeader
          :loading="loading"
          v-model:showSearchBar="showSearchBar"
          v-model:columns="columns"
          :showZebra="true"
          :showBorder="true"
          :showHeaderBackground="true"
          :fullClass="'art-page-view'"
          :layout="'search,refresh,size,fullscreen,columns,settings'"
          @refresh="handleRefresh"
        />

        <!-- 表格 -->
        <ArtTable
          ref="tableRef"
          rowKey="name"
          :loading="loading"
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
          :stripe="true"
          :border="true"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>
    </template>

    <!-- 空状态 -->
    <div v-else class="empty-container">
      <ElEmpty description="请选择工作空间" :image-size="140">
        <template #description>
          <div class="empty-description">
            <Box :size="32" style="color: #c0c4cc; margin-bottom: 12px" />
            <p>请从上方下拉框中选择集群和工作空间</p>
          </div>
        </template>
      </ElEmpty>
    </div>

    <!-- 容器列表查看对话框 -->
    <ContainerViewer
      v-model="containerDialogVisible"
      :pod-name="selectedPod?.name || ''"
      :container-data="currentContainerData"
      :loading="containerDialogLoading"
      @retry="handleViewContainers(selectedPod!)"
    />

    <!-- 统一的 YAML 查看对话框 -->
    <ElDialog
      v-model="yamlDialog.visible"
      :title="yamlDialog.title"
      width="85%"
      top="5vh"
      class="yaml-dialog"
    >
      <YamlEditorPro
        v-model="yamlDialog.content"
        height="650px"
        :readonly="true"
        :show-status-bar="true"
        :validate-on-change="true"
        :filename="yamlDialog.filename"
      />
    </ElDialog>

    <!-- 日志查看组件 -->
    <PodLogViewer
      v-model="logDialogVisible"
      :workload-id="selectedWorkspace?.id || 0"
      :pod-name="selectedPod?.name || ''"
    />

    <!-- 注入临时容器对话框 -->
    <InjectEphemeral
      v-model="ephemeralDialogVisible"
      :pod-name="selectedPod?.name || ''"
      :submitting="injectingEphemeral"
      :version="dummyVersion"
      :application="dummyApplication"
      :cluster="selectedCluster"
      :workspace="selectedWorkspace"
      @submit="handleInjectConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  // 文件: /views/workspace/pod-manager/index.vue
  // 🔥 已更新：所有 Pod 操作改为使用 clusterUuid

  import { ref, reactive, computed, watch, onMounted, onActivated, onUnmounted, h } from 'vue'
  import type { VNode } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    ElMessage,
    ElMessageBox,
    ElTag,
    ElButton,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElDialog
  } from 'element-plus'
  import {
    RefreshCw,
    Server,
    Box,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    XCircle,
    Clock,
    AlertTriangle,
    FileText,
    Terminal,
    FolderOpen,
    MoreVertical,
    ChevronDown,
    Layers,
    Package,
    LogOut,
    Trash2,
    Info,
    Activity
  } from 'lucide-vue-next'
  import { useProjectStore } from '@/store/modules/project'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'
  import ContainerViewer from '@/views/workspace/application/components/version/tabs/common/components/container-viewer.vue'
  import InjectEphemeral from '@/views/workspace/application/components/version/tabs/common/components/inject-ephemeral.vue'
  import PodLogViewer from '@/views/workspace/application/components/version/tabs/common/components/pod-log-viewer.vue'
  import {
    searchProjectClusterApi,
    searchProjectWorkspaceApi,
    listPodsWithPaginationApi,
    getPodContainerListApi,
    GetPodContainersWithClusterNamespaceApi,
    getPodYamlWithClusterUuidApi,
    getPodDetailWithClusterUuidApi,
    evictPodWithClusterUuidApi,
    deletePodWithClusterUuidApi,
    injectEphemeralContainerWithClusterUuidApi,
    type ProjectCluster,
    type ProjectWorkspace,
    type PodDetailInfo,
    type ContainerInfoList,
    type OnecProjectVersion,
    type OnecProjectApplication
  } from '@/api'
  import dayjs from 'dayjs'

  defineOptions({ name: 'PodManager' })

  const router = useRouter()

  const projectStore = useProjectStore()
  const selectedProject = computed(() => projectStore.selectedProject)

  // 🔥 本地存储的 key
  const STORAGE_KEY_CLUSTER = 'pod-manager-selected-cluster'
  const STORAGE_KEY_WORKSPACE = 'pod-manager-selected-workspace'

  // 🔥 工具函数:从 localStorage 加载
  function loadFromStorage(key: string): number | null {
    try {
      const value = localStorage.getItem(key)
      return value ? Number(value) : null
    } catch (error) {
      return null
    }
  }

  // 🔥 工具函数:保存到 localStorage
  function saveToStorage(key: string, value: number | null) {
    try {
      if (value !== null) {
        localStorage.setItem(key, String(value))
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
    }
  }

  // 数据状态
  const clusters = ref<ProjectCluster[]>([])
  const workspaces = ref<ProjectWorkspace[]>([])
  const tableData = ref<PodDetailInfo[]>([])

  // 🔥 选择状态
  const selectedClusterId = ref<number | null>(null)
  const selectedWorkspaceId = ref<number | null>(null)
  const selectedCluster = ref<ProjectCluster | null>(null)
  const selectedWorkspace = ref<ProjectWorkspace | null>(null)
  const selectedPod = ref<PodDetailInfo | null>(null)

  // 🔥 初始化标志
  const isInitializing = ref(false)
  const hasCompletedInitialLoad = ref(false)

  // 加载状态
  const loadingClusters = ref(false)
  const loadingWorkspaces = ref(false)
  const loading = ref(false)
  const showSearchBar = ref(false)
  const tableRef = ref()

  // 对话框状态
  const containerDialogVisible = ref(false)
  const containerDialogLoading = ref(false)
  const currentContainerData = ref<ContainerInfoList | null>(null)
  const logDialogVisible = ref(false)
  const ephemeralDialogVisible = ref(false)
  const injectingEphemeral = ref(false)

  // YAML 对话框
  const yamlDialog = reactive({
    visible: false,
    title: '',
    content: '',
    filename: ''
  })

  // Loading 状态
  const evictLoadingMap = ref<Record<string, boolean>>({})
  const deleteLoadingMap = ref<Record<string, boolean>>({})

  // 自动刷新
  const autoRefreshEnabled = ref(false)
  const autoRefreshInterval = ref(0)
  const autoRefreshTimer = ref<NodeJS.Timeout | null>(null)
  const countdown = ref(0)
  const countdownTimer = ref<NodeJS.Timeout | null>(null)

  // 搜索表单
  let searchForm = reactive({
    search: '',
    status: '',
    sortBy: 'creationTime',
    sortDesc: true
  })

  // 分页
  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  // 虚拟的 version 和 application 对象（用于兼容子组件）
  const dummyVersion = computed<OnecProjectVersion>(
    () =>
      ({
        id: selectedWorkspace.value?.id || 0,
        name: selectedWorkspace.value?.name || ''
      }) as OnecProjectVersion
  )

  const dummyApplication = computed<OnecProjectApplication>(
    () =>
      ({
        id: 0,
        nameEn: 'Pod Manager',
        nameCn: 'Pod 管理',
        resourceType: 'pod'
      }) as OnecProjectApplication
  )

  // 刷新按钮文本
  const refreshButtonText = computed(() => {
    if (!autoRefreshEnabled.value) {
      return '刷新'
    }
    return `刷新 (${countdown.value}s)`
  })

  // 搜索表单配置
  const searchFormItems = computed(() => [
    {
      label: 'Pod名称',
      key: 'search',
      type: 'input',
      props: { clearable: true, placeholder: '请输入Pod名称' }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        placeholder: '请选择状态',
        options: [
          { label: 'Running', value: 'Running' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Succeeded', value: 'Succeeded' },
          { label: 'Failed', value: 'Failed' },
          { label: 'Unknown', value: 'Unknown' }
        ]
      }
    },
    {
      label: '排序字段',
      key: 'sortBy',
      type: 'select',
      props: {
        placeholder: '选择排序字段',
        options: [
          { label: '名称', value: 'name' },
          { label: '创建时间', value: 'creationTime' },
          { label: '状态', value: 'status' }
        ]
      }
    },
    {
      label: '降序',
      key: 'sortDesc',
      type: 'switch',
      props: {}
    }
  ])

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      Running: CheckCircle,
      Pending: Clock,
      Succeeded: CheckCircle,
      Failed: XCircle,
      Unknown: AlertTriangle
    }
    return iconMap[status] || AlertCircle
  }

  // 获取状态类型
  const getStatusType = (status: string) => {
    const typeMap: Record<string, any> = {
      Running: 'success',
      Pending: 'warning',
      Succeeded: 'success',
      Failed: 'danger',
      Unknown: 'info'
    }
    return typeMap[status] || 'info'
  }

  // 判断是否可以打开终端
  const canExecTerminal = (status: string) => {
    return status === 'Running'
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
  }

  // 打开 YAML 对话框
  const openYamlDialog = (title: string, content: string, filename: string) => {
    yamlDialog.title = title
    yamlDialog.content = content
    yamlDialog.filename = filename
    yamlDialog.visible = true
  }

  // 🔥 跳转到 Pod 监控页面
  const handleViewMonitor = (pod: PodDetailInfo) => {
    if (!selectedCluster.value || !selectedWorkspace.value) {
      return
    }

    try {
      const routeExists = router.hasRoute('podMonitoring')
      if (!routeExists) {
        return
      }

      router.push({
        name: 'podMonitoring',
        query: {
          clusterUuid: selectedCluster.value.clusterUuid,
          namespace: selectedWorkspace.value.namespace,
          podName: pod.name,
          clusterId: String(selectedCluster.value.id)
        }
      })
    } catch (error) {
    }
  }

  // 表格列配置
  const createTableColumns = () => {
    const allColumns = [
      {
        type: 'globalIndex',
        label: '序号',
        width: 80,
        align: 'center' as const,
        visible: true
      },
      {
        prop: 'name',
        label: 'Pod名称',
        minWidth: 200,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: PodDetailInfo): VNode => {
          return h(
            'span',
            {
              class: 'pod-name-link',
              onClick: () => handleViewMonitor(row)
            },
            row.name
          )
        }
      },
      {
        prop: 'status',
        label: '状态',
        width: 180,
        visible: true,
        // ✅ 方案 1: 使用 div + flex（最推荐）
        formatter: (row: PodDetailInfo): VNode => {
          const Icon = getStatusIcon(row.status)
          return h(
            ElTag,
            {
              type: getStatusType(row.status)
            },
            () =>
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }
                },
                [h(Icon, { size: 12 }), h('span', row.status)]
              )
          )
        }
      },
      {
        prop: 'ready',
        label: '就绪',
        width: 80,
        align: 'center' as const,
        visible: true
      },
      {
        prop: 'restarts',
        label: '重启',
        width: 70,
        align: 'center' as const,
        visible: true
      },
      {
        prop: 'node',
        label: '节点',
        width: 130,
        showOverflowTooltip: true,
        visible: true
      },
      {
        prop: 'podIP',
        label: 'Pod IP',
        width: 130,
        visible: true
      },
      {
        prop: 'age',
        label: '运行时长',
        width: 100,
        visible: true
      },
      {
        prop: 'creationTime',
        label: '创建时间',
        width: 180,
        visible: true,
        formatter: (row: PodDetailInfo): VNode => h('span', formatTime(row.creationTime))
      },
      {
        prop: 'operation',
        label: '操作',
        width: 200,
        align: 'center' as const,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: PodDetailInfo): VNode => {
          const isEvicting = evictLoadingMap.value[row.name] || false
          const isDeleting = deleteLoadingMap.value[row.name] || false
          const isAnyLoading = isEvicting || isDeleting

          return h(
            'div',
            {
              style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0'
              }
            },
            [
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    gap: '0',
                    marginRight: '4px'
                  }
                },
                [
                  h(
                    ElButton,
                    {
                      size: 'small',
                      type: 'primary',
                      text: true,
                      disabled: isAnyLoading,
                      onClick: () => handleViewLog(row),
                      style: { padding: '0 2px' }
                    },
                    () => '日志'
                  ),
                  h(
                    ElButton,
                    {
                      size: 'small',
                      type: 'success',
                      text: true,
                      disabled: isAnyLoading || !canExecTerminal(row.status),
                      onClick: () => handleTerminal(row),
                      style: { padding: '0 2px' }
                    },
                    () => '终端'
                  ),
                  h(
                    ElButton,
                    {
                      size: 'small',
                      type: 'primary',
                      text: true,
                      disabled: isAnyLoading || !canExecTerminal(row.status),
                      onClick: () => handleFileManager(row),
                      style: { padding: '0 2px' }
                    },
                    () => '文件'
                  )
                ]
              ),
              h(ArtButtonMore, {
                trigger: h(
                  ElButton,
                  {
                    size: 'small',
                    text: true,
                    disabled: isAnyLoading
                  },
                  () => h(MoreVertical, { size: 14 })
                ),
                // 🔥 修复：icon 应该是字符串，使用 lucide 图标集的格式
                list: [
                  {
                    key: 'monitor',
                    label: '监控',
                    icon: 'lucide:activity',
                    color: '#409eff',
                    disabled: isAnyLoading
                  },
                  {
                    key: 'container',
                    label: '容器列表',
                    icon: 'lucide:layers',
                    color: '#409eff',
                    disabled: isAnyLoading
                  },
                  {
                    key: 'yaml',
                    label: 'YAML',
                    icon: 'lucide:file-text',
                    color: '#67c23a',
                    disabled: isAnyLoading
                  },
                  {
                    key: 'detail',
                    label: '详情',
                    icon: 'lucide:info',
                    color: '#409eff',
                    disabled: isAnyLoading
                  },
                  {
                    key: 'inject',
                    label: '注入临时容器',
                    icon: 'lucide:package',
                    color: '#9333ea',
                    disabled: isAnyLoading
                  },
                  {
                    key: 'evict',
                    label: isEvicting ? '驱逐中...' : '驱逐',
                    icon: 'lucide:log-out',
                    color: '#e6a23c',
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
                    handleButtonMoreClick(item, row)
                  }
                }
              })
            ]
          )
        }
      }
    ]

    const columns = ref(allColumns)

    return {
      columns
    }
  }

  const { columns } = createTableColumns()

  // 更多操作点击
  const handleButtonMoreClick = (item: ButtonMoreItem, row: PodDetailInfo) => {
    switch (item.key) {
      case 'monitor':
        handleViewMonitor(row)
        break
      case 'container':
        handleViewContainers(row)
        break
      case 'yaml':
        handleViewYaml(row)
        break
      case 'detail':
        handleViewPodDetail(row)
        break
      case 'inject':
        handleInjectEphemeral(row)
        break
      case 'evict':
        handleEvict(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  // 查看容器信息
  const handleViewContainers = async (pod: PodDetailInfo) => {
    if (!selectedCluster.value || !selectedWorkspace.value) return

    selectedPod.value = pod
    containerDialogVisible.value = true
    containerDialogLoading.value = true
    currentContainerData.value = null

    try {
      const response = await GetPodContainersWithClusterNamespaceApi({
        podName: pod.name,
        clusterUuid: selectedCluster.value.clusterUuid,
        namespace: selectedWorkspace.value.namespace
      })
      currentContainerData.value = response || {
        initContainers: [],
        containers: [],
        ephemeralContainers: []
      }
    } catch (error) {
    } finally {
      containerDialogLoading.value = false
    }
  }

  // 🔥 修改：查看 Pod YAML - 使用 clusterUuid
  const handleViewYaml = async (pod: PodDetailInfo) => {
    if (!selectedCluster.value || !selectedWorkspace.value) return

    selectedPod.value = pod
    openYamlDialog('Pod YAML', '# 加载中...', `${pod.name}.yaml`)

    try {
      const response = await getPodYamlWithClusterUuidApi({
        clusterUuid: selectedCluster.value.clusterUuid,
        namespace: selectedWorkspace.value.namespace,
        podName: pod.name
      })
      yamlDialog.content = response || '# 获取失败'
    } catch (error) {
      yamlDialog.content = '# 获取失败'
    }
  }

  // 🔥 修改：查看 Pod 详情 - 使用 clusterUuid
  const handleViewPodDetail = async (pod: PodDetailInfo) => {
    if (!selectedCluster.value || !selectedWorkspace.value) return

    selectedPod.value = pod
    openYamlDialog('Pod 详情', '# 加载中...', `${pod.name}-detail.yaml`)

    try {
      const response = await getPodDetailWithClusterUuidApi({
        clusterUuid: selectedCluster.value.clusterUuid,
        namespace: selectedWorkspace.value.namespace,
        podName: pod.name
      })
      yamlDialog.content = response || '# 获取失败'
    } catch (error) {
      yamlDialog.content = '# 获取失败'
    }
  }

  // 查看日志
  const handleViewLog = (pod: PodDetailInfo) => {
    selectedPod.value = pod
    logDialogVisible.value = true
  }

  // 打开终端
  const handleTerminal = (pod: PodDetailInfo) => {
    if (!canExecTerminal(pod.status)) {
      return
    }

    if (!selectedWorkspace.value?.id || !pod.name) {
      return
    }

    try {
      const routeExists = router.hasRoute('TerminalManager')
      if (!routeExists) {
        return
      }

      const routeData = router.resolve({
        name: 'TerminalManager',
        query: {
          workloadId: String(selectedWorkspace.value.id),
          podName: pod.name
        }
      })

      window.open(routeData.href, '_blank', 'noopener,noreferrer')
      ElMessage.success({ message: '终端已在新标签页打开', duration: 2000 })
    } catch (error) {
    }
  }

  // 文件管理
  const handleFileManager = (pod: PodDetailInfo) => {
    if (!canExecTerminal(pod.status)) {
      return
    }

    if (!selectedWorkspace.value?.id || !pod.name) {
      return
    }

    try {
      const routeExists = router.hasRoute('FileManager')
      if (!routeExists) {
        return
      }

      const routeData = router.resolve({
        name: 'FileManager',
        query: {
          workspaceId: String(selectedWorkspace.value.id),
          podName: pod.name
        }
      })

      window.open(routeData.href, '_blank', 'noopener,noreferrer')
      ElMessage.success({ message: '文件管理器已在新标签页打开', duration: 2000 })
    } catch (error) {
    }
  }

  // 注入临时容器
  const handleInjectEphemeral = (pod: PodDetailInfo) => {
    selectedPod.value = pod
    ephemeralDialogVisible.value = true
  }

  // 🔥 修改：处理注入确认 - 使用 clusterUuid
  const handleInjectConfirm = async (formData: any) => {
    if (!selectedPod.value || !selectedCluster.value || !selectedWorkspace.value) return

    injectingEphemeral.value = true
    try {
      const payload: any = {
        clusterUuid: selectedCluster.value.clusterUuid,
        namespace: selectedWorkspace.value.namespace,
        podName: selectedPod.value.name,
        containerName: '',
        image: '',
        command: [],
        args: []
      }

      if (
        formData.containerName &&
        typeof formData.containerName === 'string' &&
        formData.containerName.trim()
      ) {
        payload.containerName = formData.containerName
      }

      if (formData.image && typeof formData.image === 'string' && formData.image.trim()) {
        payload.image = formData.image
      }

      if (Array.isArray(formData.command) && formData.command.length > 0) {
        payload.command = formData.command
      }

      if (Array.isArray(formData.args) && formData.args.length > 0) {
        payload.args = formData.args
      }

      await injectEphemeralContainerWithClusterUuidApi(payload)
      ElMessage.success('临时容器注入成功')
      ephemeralDialogVisible.value = false
      loadPods(true)
    } catch (error: any) {
      if (error.response?.data?.message) {
      } else if (error.message) {
      }
    } finally {
      injectingEphemeral.value = false
    }
  }

  // 🔥 修改：驱逐 Pod - 使用 clusterUuid
  const handleEvict = async (pod: PodDetailInfo) => {
    if (!selectedCluster.value || !selectedWorkspace.value) return

    try {
      await ElMessageBox.confirm(`确定要驱逐Pod "${pod.name}" 吗？`, '驱逐确认', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })

      evictLoadingMap.value[pod.name] = true
      await evictPodWithClusterUuidApi({
        clusterUuid: selectedCluster.value.clusterUuid,
        namespace: selectedWorkspace.value.namespace,
        podName: pod.name
      })
      ElMessage.success('驱逐成功')
      loadPods(true)
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      evictLoadingMap.value[pod.name] = false
    }
  }

  // 🔥 修改：删除 Pod - 使用 clusterUuid
  const handleDelete = async (pod: PodDetailInfo) => {
    if (!selectedCluster.value || !selectedWorkspace.value) return

    try {
      await ElMessageBox.confirm(`确定要删除Pod "${pod.name}" 吗？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })

      deleteLoadingMap.value[pod.name] = true
      await deletePodWithClusterUuidApi({
        clusterUuid: selectedCluster.value.clusterUuid,
        namespace: selectedWorkspace.value.namespace,
        podName: pod.name
      })
      ElMessage.success('删除成功')
      loadPods(true)
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      deleteLoadingMap.value[pod.name] = false
    }
  }

  // 🔥 修复：加载集群列表
  const loadClusters = async () => {
    if (!selectedProject.value) {
      clusters.value = []
      return
    }

    if (loadingClusters.value) {
      return
    }

    loadingClusters.value = true

    try {
      const response = await searchProjectClusterApi({
        projectId: selectedProject.value.id
      })
      clusters.value = response || []

      // 🔥 关键修复：只在初始化时恢复缓存的集群
      if (isInitializing.value) {
        const savedClusterId = loadFromStorage(STORAGE_KEY_CLUSTER)
        if (savedClusterId && typeof savedClusterId === 'number') {
          const cluster = clusters.value.find((c) => c.id === savedClusterId)
          if (cluster) {
            selectedClusterId.value = savedClusterId
            selectedCluster.value = cluster
          } else {
            saveToStorage(STORAGE_KEY_CLUSTER, null)
            saveToStorage(STORAGE_KEY_WORKSPACE, null)
          }
        }
      }
    } catch (error) {
      clusters.value = []
    } finally {
      loadingClusters.value = false
    }
  }

  // 🔥 修复：加载工作空间列表
  const loadWorkspaces = async () => {
    if (!selectedClusterId.value) {
      workspaces.value = []
      return
    }

    if (loadingWorkspaces.value) {
      return
    }

    loadingWorkspaces.value = true

    try {
      const response = await searchProjectWorkspaceApi({
        projectClusterId: selectedClusterId.value
      })
      workspaces.value = response || []

      // 🔥 关键修复：只在初始化时恢复缓存的工作空间
      if (isInitializing.value) {
        const savedWorkspaceId = loadFromStorage(STORAGE_KEY_WORKSPACE)
        if (savedWorkspaceId && typeof savedWorkspaceId === 'number') {
          const workspace = workspaces.value.find((w) => w.id === savedWorkspaceId)
          if (workspace) {
            selectedWorkspaceId.value = savedWorkspaceId
            selectedWorkspace.value = workspace
          } else {
            saveToStorage(STORAGE_KEY_WORKSPACE, null)
          }
        }
      }
    } catch (error) {
      workspaces.value = []
    } finally {
      loadingWorkspaces.value = false
    }
  }

  // 加载Pod列表
  const loadPods = async (silent = false) => {
    if (!selectedWorkspace.value) {
      tableData.value = []
      return
    }

    if (!silent) {
      loading.value = true
    }

    try {
      const response = await listPodsWithPaginationApi(selectedWorkspace.value.id, {
        page: pagination.current,
        pageSize: pagination.size,
        search: searchForm.search || undefined,
        labels: undefined,
        sortBy: searchForm.sortBy || undefined,
        sortDesc: searchForm.sortDesc
      })

      tableData.value = response.items || []
      pagination.total = response.total || 0
    } catch (error) {
      if (!silent) {
      }
      tableData.value = []
      pagination.total = 0
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  // 启动自动刷新
  const startAutoRefresh = (interval: number) => {
    stopAutoRefresh()

    if (interval <= 0) {
      return
    }

    autoRefreshInterval.value = interval
    autoRefreshEnabled.value = true
    countdown.value = interval

    countdownTimer.value = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        countdown.value = interval
      }
    }, 1000)

    autoRefreshTimer.value = setInterval(() => {
      loadPods(true)
    }, interval * 1000)
  }

  // 停止自动刷新
  const stopAutoRefresh = () => {
    if (autoRefreshTimer.value) {
      clearInterval(autoRefreshTimer.value)
      autoRefreshTimer.value = null
    }
    if (countdownTimer.value) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
    autoRefreshEnabled.value = false
    autoRefreshInterval.value = 0
  }

  // 处理刷新命令
  const handleRefreshCommand = (command: string) => {
    if (command === 'manual') {
      handleRefresh()
    } else if (command === 'disable') {
      stopAutoRefresh()
      ElMessage.success('已关闭自动刷新')
    } else {
      const interval = parseInt(command)
      if (!isNaN(interval)) {
        startAutoRefresh(interval)
        ElMessage.success(`已开启自动刷新,每${interval}秒刷新一次`)
      }
    }
  }

  // 集群变化
  const handleClusterChange = async (clusterId: number | null) => {
    saveToStorage(STORAGE_KEY_CLUSTER, clusterId)

    if (clusterId) {
      const cluster = clusters.value.find((c) => c.id === clusterId)
      if (cluster) {
        selectedCluster.value = cluster
        await loadWorkspaces()
      }
    } else {
      selectedCluster.value = null
      selectedWorkspaceId.value = null
      selectedWorkspace.value = null
      workspaces.value = []
      tableData.value = []
      pagination.total = 0

      saveToStorage(STORAGE_KEY_WORKSPACE, null)
    }
  }

  // 清除集群
  const handleClusterClear = () => {
    selectedCluster.value = null
    selectedWorkspaceId.value = null
    selectedWorkspace.value = null
    workspaces.value = []
    tableData.value = []
    pagination.total = 0

    saveToStorage(STORAGE_KEY_CLUSTER, null)
    saveToStorage(STORAGE_KEY_WORKSPACE, null)
  }

  // 工作空间变化
  const handleWorkspaceChange = async (workspaceId: number | null) => {
    saveToStorage(STORAGE_KEY_WORKSPACE, workspaceId)

    if (workspaceId) {
      const workspace = workspaces.value.find((w) => w.id === workspaceId)
      if (workspace) {
        selectedWorkspace.value = workspace
        pagination.current = 1
        await loadPods()
      } else {
        selectedWorkspaceId.value = null
        selectedWorkspace.value = null
        saveToStorage(STORAGE_KEY_WORKSPACE, null)
      }
    } else {
      selectedWorkspace.value = null
      tableData.value = []
      pagination.total = 0
    }
  }

  // 清除工作空间
  const handleWorkspaceClear = () => {
    selectedWorkspace.value = null
    tableData.value = []
    pagination.total = 0

    saveToStorage(STORAGE_KEY_WORKSPACE, null)
  }

  // 重置
  const handleReset = () => {
    searchForm.search = ''
    searchForm.status = ''
    searchForm.sortBy = 'creationTime'
    searchForm.sortDesc = true
    pagination.current = 1
    loadPods()
  }

  // 搜索
  const handleSearch = () => {
    pagination.current = 1
    loadPods()
  }

  // 刷新
  const handleRefresh = () => {
    loadPods()
  }

  // 分页大小变化
  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    loadPods()
  }

  // 页码变化
  const handleCurrentChange = (current: number) => {
    pagination.current = current
    loadPods()
  }

  // 🔥 修复：监听项目切换
  watch(selectedProject, async (newProject, oldProject) => {
    // 如果正在初始化，跳过
    if (isInitializing.value) {
      return
    }

    // 如果项目真的发生了变化
    if (newProject?.id !== oldProject?.id) {
      // 清除所有存储
      saveToStorage(STORAGE_KEY_CLUSTER, null)
      saveToStorage(STORAGE_KEY_WORKSPACE, null)

      // 清空所有选择状态
      selectedClusterId.value = null
      selectedWorkspaceId.value = null
      selectedCluster.value = null
      selectedWorkspace.value = null
      clusters.value = []
      workspaces.value = []
      tableData.value = []
      pagination.total = 0

      // 只有在项目存在时才加载集群
      if (newProject) {
        await loadClusters()
      }
    }
  })

  // 🔥 修复：完全重写初始化逻辑
  const initPage = async () => {
    if (isInitializing.value) {
      return
    }

    isInitializing.value = true

    try {
      // 1. 确保 store 初始化
      await projectStore.ensureInitialized()

      // 2. 检查项目是否存在
      if (!selectedProject.value) {
        saveToStorage(STORAGE_KEY_CLUSTER, null)
        saveToStorage(STORAGE_KEY_WORKSPACE, null)
        return
      }

      // 加载集群
      await loadClusters()

      // 如果有选中的集群，加载工作空间
      if (selectedClusterId.value) {
        await loadWorkspaces()

        // 如果有选中的工作空间，加载Pods
        if (selectedWorkspaceId.value) {
          await loadPods()
        }
      }
    } catch (error) {
    } finally {
      // 🔥 关键：确保在所有异步操作完成后才解除初始化标志
      setTimeout(() => {
        isInitializing.value = false
        hasCompletedInitialLoad.value = true
      }, 100)
    }
  }

  // 🔥 修复：只初始化一次
  let initPromise: Promise<void> | null = null

  onMounted(async () => {
    if (!initPromise) {
      initPromise = initPage()
    }
    await initPromise
  })

  onActivated(async () => {
    // 如果还没有完成初始加载，等待初始化
    if (!hasCompletedInitialLoad.value) {
      if (!initPromise) {
        initPromise = initPage()
      }
      await initPromise
      return
    }

    // 如果有选中的工作空间，刷新Pod列表
    if (selectedWorkspace.value) {
      await loadPods(true)
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })
</script>

<style lang="scss" scoped>
  .pod-manager-page {
    padding-bottom: 15px;

    .breadcrumb-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);

      .breadcrumb-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex-wrap: wrap;

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .breadcrumb-label {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #606266;
            font-weight: 500;
            white-space: nowrap;
          }

          .breadcrumb-select {
            min-width: 200px;
            max-width: 300px;
          }
        }

        .breadcrumb-separator {
          color: #c0c4cc;
          display: flex;
          align-items: center;
        }
      }

      .breadcrumb-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
    }

    .cluster-option,
    .workspace-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 8px;

      .option-name {
        font-weight: 500;
        color: #303133;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-meta {
        font-size: 12px;
        color: #909399;
        flex-shrink: 0;
      }
    }

    // 🔥 Pod 名称可点击样式
    :deep(.pod-name-link) {
      color: #409eff;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;

      &:hover {
        color: #66b1ff;
        text-decoration: underline;
      }
    }

    .empty-container {
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

      .empty-description {
        display: flex;
        flex-direction: column;
        align-items: center;

        p {
          margin: 0;
          font-size: 15px;
          color: #606266;
        }
      }
    }
    :deep(.el-table__empty-block) {
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :deep(.el-table__empty-text) {
      width: 100%;
    }
    .yaml-dialog {
      :deep(.el-dialog__body) {
        padding: 20px;
      }
    }
  }
</style>
<style lang="scss">
  /* Pod Manager - 集群下拉菜单样式 */
  .pod-cluster-dropdown {
    min-width: 400px !important;

    .el-select-dropdown__wrap {
      min-height: 300px !important;
      max-height: 300px !important;
    }

    .el-select-dropdown__item {
      height: auto !important;
      line-height: normal !important;
      padding: 0 !important;
      margin: 0 !important;

      &.hover {
        background-color: transparent !important;

        .cluster-option {
          background-color: #f5f7fa;
        }
      }

      &.selected {
        background-color: transparent !important;
        font-weight: normal !important;

        .cluster-option {
          background-color: #ecf5ff;

          .option-name {
            color: #409eff;
            font-weight: 500;
          }
        }
      }
    }

    .cluster-option {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100%;
      gap: 12px;
      padding: 10px 16px !important;
      border-radius: 4px;
      transition: background-color 0.2s;
      height: auto !important;
      box-sizing: border-box;

      .option-name {
        font-weight: 500;
        color: #303133;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        line-height: 1;
        margin: 0 !important;
        padding: 0 !important;
        vertical-align: middle;
      }

      .option-meta {
        font-size: 12px;
        color: #909399;
        flex-shrink: 0;
        white-space: nowrap;
        line-height: 1;
        margin: 0 !important;
        padding: 0 !important;
        vertical-align: middle;
      }
    }
  }

  /* Pod Manager - 工作空间下拉菜单样式 */
  .pod-workspace-dropdown {
    min-width: 400px !important;

    .el-select-dropdown__wrap {
      min-height: 300px !important;
      max-height: 300px !important;
    }

    .el-select-dropdown__item {
      height: auto !important;
      line-height: normal !important;
      padding: 0 !important;
      margin: 0 !important;

      &.hover {
        background-color: transparent !important;

        .workspace-option {
          background-color: #f5f7fa;
        }
      }

      &.selected {
        background-color: transparent !important;
        font-weight: normal !important;

        .workspace-option {
          background-color: #ecf5ff;

          .option-name {
            color: #409eff;
            font-weight: 500;
          }
        }
      }
    }

    .workspace-option {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100%;
      gap: 12px;
      padding: 10px 16px !important;
      border-radius: 4px;
      transition: background-color 0.2s;
      height: auto !important;
      box-sizing: border-box;

      .option-name {
        font-weight: 500;
        color: #303133;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        line-height: 1;
        margin: 0 !important;
        padding: 0 !important;
        vertical-align: middle;
      }

      :deep(.el-tag) {
        margin: 0 !important;
        vertical-align: middle !important;
      }
    }
  }
</style>