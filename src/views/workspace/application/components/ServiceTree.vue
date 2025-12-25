<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Server,
    RefreshCw,
    Search,
    Loader,
    Box,
    Database,
    Layers,
    Clock,
    Briefcase,
    Package
  } from 'lucide-vue-next'
  import { searchApplicationApi, type ProjectWorkspace, type OnecProjectApplication } from '@/api'

  interface Props {
    workspace: ProjectWorkspace | null
    resourceType: string
    searchKeyword?: string
    // ⭐ 新增：从父组件接收应用列表
    applications?: OnecProjectApplication[]
  }

  const props = withDefaults(defineProps<Props>(), {
    searchKeyword: '',
    applications: () => []
  })

  const emit = defineEmits<{
    nodeClick: [application: OnecProjectApplication]
    refresh: []
  }>()

  const treeRef = ref()
  const localApplications = ref<OnecProjectApplication[]>([])
  const loading = ref(false)
  const localSearchKeyword = ref('')
  const lastWorkspaceId = ref<number | null>(null)
  // ⭐ 添加加载状态标记
  const isLoading = ref(false)

  const treeProps = {
    label: 'label',
    children: 'children'
  }

  // ⭐ 优先使用父组件传入的数据
  const applications = computed(() => {
    // 如果父组件有数据，优先使用
    if (props.applications && props.applications.length > 0) {
      return props.applications
    }
    return localApplications.value
  })

  // 过滤应用
  const filteredApplications = computed(() => {
    let filtered = applications.value

    // 按资源类型过滤
    if (props.resourceType && props.resourceType !== 'all') {
      filtered = filtered.filter((app) => app.resourceType === props.resourceType)
    }

    // 按搜索关键词过滤
    if (localSearchKeyword.value) {
      const keyword = localSearchKeyword.value.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.nameCn.toLowerCase().includes(keyword) ||
          app.nameEn.toLowerCase().includes(keyword) ||
          app.resourceType.toLowerCase().includes(keyword)
      )
    }

    return filtered
  })

  // 树形数据
  const treeData = computed(() => {
    return filteredApplications.value.map((app) => ({
      id: app.id,
      label: app.nameCn || app.nameEn,
      resourceType: app.resourceType,
      raw: app
    }))
  })

  // 获取资源图标
  const getResourceIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      pod: Box,
      deployment: Layers,
      statefulset: Database,
      daemonset: Server,
      cronjob: Clock,
      job: Briefcase
    }
    return iconMap[type] || Package
  }

  // 获取资源类型标签
  const getResourceTypeTag = (type: string) => {
    const tagMap: Record<string, string> = {
      pod: 'info',
      deployment: 'success',
      statefulset: 'warning',
      daemonset: 'primary',
      cronjob: 'danger',
      job: ''
    }
    return tagMap[type] || 'info'
  }

  // ⭐ 优化：只在必要时加载
  const loadApplications = async (force = false) => {
    if (!props.workspace) {
      localApplications.value = []
      lastWorkspaceId.value = null
      return
    }

    // ⭐ 如果父组件已提供数据，不需要加载（除非强制刷新）
    if (props.applications && props.applications.length > 0 && !force) {
      return
    }

    // ⭐ 防止重复加载同一个 workspace
    if (lastWorkspaceId.value === props.workspace.id && !force) {
      return
    }

    // ⭐ 防止并发请求
    if (isLoading.value) {
      return
    }

    isLoading.value = true
    loading.value = true

    try {
      const response = await searchApplicationApi({
        workspaceId: props.workspace.id
      })
      localApplications.value = response || []
      lastWorkspaceId.value = props.workspace.id
    } catch (error) {
      console.error('[ServiceTree] 加载服务列表失败:', error)
      localApplications.value = []
    } finally {
      loading.value = false
      isLoading.value = false
    }
  }

  // 节点点击
  const handleNodeClick = (data: any) => {
    if (data.raw) {
      emit('nodeClick', data.raw)
    }
  }

  // 刷新
  const handleRefresh = () => {
    loadApplications(true) // 强制刷新
    emit('refresh')
  }

  // 搜索
  const handleSearch = () => {
    // 搜索逻辑由 computed 自动处理
  }

  // ⭐ 优化：去掉 immediate，只监听真正的变化
  watch(
    () => props.workspace?.id,
    (newId, oldId) => {
      // 只在真正变化时才加载
      if (newId !== oldId) {
        // 如果父组件没有传数据，才自己加载
        if (!props.applications || props.applications.length === 0) {
          loadApplications()
        }
      }
    }
    // ❌ 不使用 immediate: true
  )

  // ⭐ 不需要监听 resourceType，由 computed 自动过滤

  defineExpose({
    refresh: () => loadApplications(true)
  })
</script>

<!-- template 和 style 部分保持不变 -->
<template>
  <div class="service-tree">
    <div class="tree-toolbar">
      <div class="toolbar-title">
        <Server :size="18" />
        <span>服务列表</span>
        <ElTag v-if="workspace" size="small" type="info">
          {{ workspace.namespace }}
        </ElTag>
        <ElTag v-if="filteredApplications.length > 0" size="small">
          {{ filteredApplications.length }}
        </ElTag>
      </div>
      <div class="toolbar-actions">
        <ElTooltip content="刷新">
          <ElButton :icon="RefreshCw" size="small" text @click="handleRefresh" />
        </ElTooltip>
      </div>
    </div>

    <div v-if="workspace" class="search-box">
      <ElInput
        v-model="localSearchKeyword"
        placeholder="搜索服务..."
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <Search :size="16" />
        </template>
      </ElInput>
    </div>

    <ElScrollbar class="tree-container">
      <div v-if="!workspace" class="empty-prompt">
        <ElEmpty :image-size="80" description="请先选择工作空间" />
      </div>

      <div v-else-if="loading" class="loading-state">
        <ElIcon class="is-loading">
          <Loader :size="32" />
        </ElIcon>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredApplications.length === 0" class="empty-prompt">
        <ElEmpty :image-size="80" description="暂无服务数据" />
      </div>

      <ElTree
        v-else
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        :highlight-current="true"
        node-key="id"
        default-expand-all
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <component :is="getResourceIcon(data.resourceType)" :size="16" class="node-icon" />
            <ElTooltip :content="data.label" placement="top" :show-after="500">
              <span class="node-label">{{ data.label }}</span>
            </ElTooltip>
            <ElTag :type="getResourceTypeTag(data.resourceType)" size="small" class="node-tag">
              {{ data.resourceType }}
            </ElTag>
          </div>
        </template>
      </ElTree>
    </ElScrollbar>
  </div>
</template>

<style lang="scss" scoped>
  .service-tree {
    height: 100%;
    display: flex;
    flex-direction: column;

    .tree-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #ebeef5;

      .toolbar-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        font-size: 14px;
      }

      .toolbar-actions {
        display: flex;
        gap: 4px;
      }
    }

    .search-box {
      padding: 12px 16px;
      border-bottom: 1px solid #ebeef5;
    }

    .tree-container {
      flex: 1;

      .empty-prompt,
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px;
        color: #909399;

        p {
          margin-top: 12px;
          font-size: 14px;
        }
      }

      :deep(.el-tree) {
        .tree-node {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          overflow: hidden;

          .node-icon {
            flex-shrink: 0;
          }

          .node-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 500;
            font-size: 13px;
          }

          .node-tag {
            flex-shrink: 0;
          }
        }

        .el-tree-node__content {
          height: 40px;
          padding-right: 8px;

          &:hover {
            background: #f5f7fa;
          }
        }

        .is-current > .el-tree-node__content {
          background: #ecf5ff;

          .tree-node .node-label {
            color: #409eff;
          }
        }
      }
    }
  }
</style>
