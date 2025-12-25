<template>
  <div class="core-config-page">
    <!-- 面包屑式选择器 -->
    <div class="breadcrumb-selector">
      <div class="breadcrumb-content">
        <!-- 集群选择 -->
        <div class="breadcrumb-item">
          <span class="breadcrumb-label">
            <Server :size="14" />
            集群
          </span>
          <ElSelect
            v-model="managementStore.selectedClusterId"
            placeholder="选择集群"
            clearable
            size="default"
            :disabled="!selectedProject"
            :loading="loadingClusters"
            @change="handleClusterChange"
            @clear="handleClusterClear"
            popper-class="core-config-cluster-dropdown"
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
            v-model="managementStore.selectedWorkspaceId"
            placeholder="选择工作空间"
            clearable
            size="default"
            :disabled="!managementStore.selectedClusterId"
            :loading="loadingWorkspaces"
            @change="handleWorkspaceChange"
            @clear="handleWorkspaceClear"
            popper-class="core-config-workspace-dropdown"
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
        <ElTooltip content="刷新数据" placement="bottom">
          <ElButton
            :icon="RefreshCw"
            circle
            size="default"
            :disabled="!isWorkspaceReady"
            @click="handleRefresh"
          />
        </ElTooltip>
      </div>
    </div>

    <!-- 主要内容区 -->
    <ElCard class="main-content-card" shadow="never">
      <!-- 初始化加载状态 -->
      <div v-if="isInitializing" class="loading-state">
        <ElSkeleton :rows="8" animated />
      </div>

      <!-- 未选择工作空间的提示 -->
      <div v-else-if="!isWorkspaceReady" class="empty-state">
        <ElEmpty description=" ">
          <template #image>
            <div class="empty-icon">
              <Layers :size="64" />
            </div>
          </template>
          <template #description>
            <div class="empty-description">
              <h3>请先选择集群和工作空间</h3>
              <p>通过上方的选择器选择集群和工作空间后,即可管理 Kubernetes 资源</p>
            </div>
          </template>
        </ElEmpty>
      </div>

      <!-- Tab内容 -->
      <ElTabs v-else v-model="activeTab" class="config-tabs" @tab-change="handleTabChange">
        <ElTabPane label="ConfigMap" name="configmap">
          <div class="tab-content-wrapper">
            <ConfigMapManagement
              v-if="loadedTabs.configmap"
              :cluster="managementStore.selectedCluster"
              :workspace="managementStore.selectedWorkspace"
              :refresh-trigger="refreshTriggers.configmap"
              @loaded="loadedTabs.configmap = true"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="Secret" name="secret">
          <div class="tab-content-wrapper">
            <SecretManagement
              v-if="loadedTabs.secret"
              :cluster="managementStore.selectedCluster"
              :workspace="managementStore.selectedWorkspace"
              :refresh-trigger="refreshTriggers.secret"
              @loaded="loadedTabs.secret = true"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="Service" name="service">
          <div class="tab-content-wrapper">
            <ServiceManagement
              v-if="loadedTabs.service"
              :cluster="managementStore.selectedCluster"
              :workspace="managementStore.selectedWorkspace"
              :refresh-trigger="refreshTriggers.service"
              @loaded="loadedTabs.service = true"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="Ingress" name="ingress">
          <div class="tab-content-wrapper">
            <IngressManagement
              v-if="loadedTabs.ingress"
              :cluster="managementStore.selectedCluster"
              :workspace="managementStore.selectedWorkspace"
              @loaded="loadedTabs.ingress = true"
            />
          </div>
        </ElTabPane>

        <!-- PVC 标签页 -->
        <ElTabPane label="PVC" name="pvc">
          <div class="tab-content-wrapper">
            <PVCManagement
              v-if="loadedTabs.pvc"
              :workspace="managementStore.selectedWorkspace"
              :refresh-trigger="refreshTriggers.pvc"
              @loaded="loadedTabs.pvc = true"
            />
          </div>
        </ElTabPane>

        <!-- ServiceAccount 标签页 -->
        <ElTabPane label="ServiceAccount" name="serviceaccount">
          <div class="tab-content-wrapper">
            <ServiceAccountManagement
              v-if="loadedTabs.serviceaccount"
              :workspace="managementStore.selectedWorkspace"
              :refresh-trigger="refreshTriggers.serviceaccount"
              @loaded="loadedTabs.serviceaccount = true"
            />
          </div>
        </ElTabPane>

        <!-- Role 标签页 -->
        <ElTabPane label="Role" name="role">
          <div class="tab-content-wrapper">
            <RoleManagement
              v-if="loadedTabs.role"
              :workspace="managementStore.selectedWorkspace"
              :refresh-trigger="refreshTriggers.role"
              @loaded="loadedTabs.role = true"
            />
          </div>
        </ElTabPane>

        <!-- RoleBinding 标签页 -->
        <ElTabPane label="RoleBinding" name="rolebinding">
          <div class="tab-content-wrapper">
            <RoleBindingManagement
              v-if="loadedTabs.rolebinding"
              :workspace="managementStore.selectedWorkspace"
              :refresh-trigger="refreshTriggers.rolebinding"
              @loaded="loadedTabs.rolebinding = true"
            />
          </div>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onActivated, nextTick } from 'vue'
  import { RefreshCw, Layers, Server, Box, ChevronRight } from 'lucide-vue-next'
  import { useProjectStore } from '@/store/modules/project'
  import { useApplicationManagementStore } from '@/store/modules/applicationManagement'
  import {
    searchProjectClusterApi,
    searchProjectWorkspaceApi,
    type ProjectCluster,
    type ProjectWorkspace
  } from '@/api'
  import ConfigMapManagement from './configmap/index.vue'
  import SecretManagement from './secret/index.vue'
  import ServiceManagement from './service/index.vue'
  import IngressManagement from './ingress/index.vue'
  import PVCManagement from './pvc/index.vue'
  import ServiceAccountManagement from './serviceaccount/index.vue'
  import RoleManagement from './role/index.vue'
  import RoleBindingManagement from './rolebinding/index.vue'

  defineOptions({ name: 'CoreConfigPage' })

  const projectStore = useProjectStore()
  const managementStore = useApplicationManagementStore()

  const selectedProject = computed(() => projectStore.selectedProject)

  const STORAGE_KEY_CLUSTER = 'core-config-selected-cluster'
  const STORAGE_KEY_WORKSPACE = 'core-config-selected-workspace'
  const STORAGE_KEY_TAB = 'core-config-active-tab'

  function loadFromStorage(key: string): number | string | null {
    try {
      const value = localStorage.getItem(key)
      return value || null
    } catch (error) {
      console.error('加载存储失败:', error)
      return null
    }
  }

  function saveToStorage(key: string, value: number | string | null) {
    try {
      if (value !== null && value !== undefined) {
        localStorage.setItem(key, String(value))
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('保存存储失败:', error)
    }
  }

  const clusters = ref<ProjectCluster[]>([])
  const workspaces = ref<ProjectWorkspace[]>([])

  const loadingClusters = ref(false)
  const loadingWorkspaces = ref(false)

  const activeTab = ref('configmap')

  const isInitializing = ref(false)
  const hasCompletedInitialLoad = ref(false)

  const isWorkspaceReady = computed(() => {
    return !!(
      managementStore.selectedClusterId &&
      managementStore.selectedWorkspaceId &&
      managementStore.selectedCluster &&
      managementStore.selectedWorkspace
    )
  })

  // 添加所有标签页到 loadedTabs
  const loadedTabs = ref({
    configmap: false,
    secret: false,
    service: false,
    ingress: false,
    pvc: false,
    serviceaccount: false,
    role: false,
    rolebinding: false
  })

  // 添加所有标签页到 refreshTriggers
  const refreshTriggers = ref({
    configmap: 0,
    secret: 0,
    service: 0,
    pvc: 0,
    serviceaccount: 0,
    role: 0,
    rolebinding: 0
  })

  watch(selectedProject, async (newProject, oldProject) => {
    if (isInitializing.value) {
      return
    }

    if (newProject?.id !== oldProject?.id) {
      saveToStorage(STORAGE_KEY_CLUSTER, null)
      saveToStorage(STORAGE_KEY_WORKSPACE, null)
      saveToStorage(STORAGE_KEY_TAB, null)

      managementStore.setCluster(null)
      managementStore.setWorkspace(null)

      clusters.value = []
      workspaces.value = []
      resetLoadedTabs()

      activeTab.value = 'configmap'

      if (newProject) {
        await loadClusters()
      }
    }
  })

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

      if (isInitializing.value) {
        const savedClusterId = loadFromStorage(STORAGE_KEY_CLUSTER)
        if (savedClusterId) {
          const cluster = clusters.value.find((c) => c.id === Number(savedClusterId))
          if (cluster) {
            managementStore.setCluster(cluster, true)
          } else {
            console.warn('⚠️ 缓存的集群不存在，清空选择')
            saveToStorage(STORAGE_KEY_CLUSTER, null)
            saveToStorage(STORAGE_KEY_WORKSPACE, null)
            saveToStorage(STORAGE_KEY_TAB, null)
            managementStore.setCluster(null)
            managementStore.setWorkspace(null)
          }
        }
      }
    } catch (error) {
      console.error('❌ 加载集群失败:', error)
      clusters.value = []
    } finally {
      loadingClusters.value = false
    }
  }

  const handleClusterChange = async (clusterId: number | null) => {
    saveToStorage(STORAGE_KEY_CLUSTER, clusterId)

    if (clusterId) {
      const cluster = clusters.value.find((c) => c.id === clusterId)
      if (cluster) {
        managementStore.setCluster(cluster)
        await loadWorkspaces()
      }
    } else {
      managementStore.setCluster(null)
      managementStore.setWorkspace(null)
      workspaces.value = []
      resetLoadedTabs()

      saveToStorage(STORAGE_KEY_WORKSPACE, null)
    }
  }

  const handleClusterClear = () => {
    managementStore.setCluster(null)
    managementStore.setWorkspace(null)
    workspaces.value = []
    resetLoadedTabs()

    activeTab.value = 'configmap'

    saveToStorage(STORAGE_KEY_CLUSTER, null)
    saveToStorage(STORAGE_KEY_WORKSPACE, null)
    saveToStorage(STORAGE_KEY_TAB, null)
  }

  const loadWorkspaces = async () => {
    if (!managementStore.selectedClusterId) {
      workspaces.value = []
      return
    }

    if (loadingWorkspaces.value) {
      return
    }

    loadingWorkspaces.value = true

    try {
      const response = await searchProjectWorkspaceApi({
        projectClusterId: managementStore.selectedClusterId
      })
      workspaces.value = response || []

      if (isInitializing.value) {
        const savedWorkspaceId = loadFromStorage(STORAGE_KEY_WORKSPACE)
        if (savedWorkspaceId) {
          const workspace = workspaces.value.find((w) => w.id === Number(savedWorkspaceId))
          if (workspace) {
            managementStore.setWorkspace(workspace, true)
            resetLoadedTabs()

            const savedTab = loadFromStorage(STORAGE_KEY_TAB)
            if (savedTab && typeof savedTab === 'string') {
              activeTab.value = savedTab
            }

            await nextTick()
            loadedTabs.value[activeTab.value as keyof typeof loadedTabs.value] = true
          } else {
            console.warn('⚠️ 缓存的工作空间不存在，清空选择')
            saveToStorage(STORAGE_KEY_WORKSPACE, null)
            managementStore.setWorkspace(null)
          }
        }
      }
    } catch (error) {
      console.error('❌ 加载工作空间失败:', error)
      workspaces.value = []
    } finally {
      loadingWorkspaces.value = false
    }
  }

  const handleWorkspaceChange = (workspaceId: number | null) => {
    saveToStorage(STORAGE_KEY_WORKSPACE, workspaceId)

    if (workspaceId) {
      const workspace = workspaces.value.find((w) => w.id === workspaceId)
      if (workspace) {
        managementStore.setWorkspace(workspace)
        resetLoadedTabs()
        nextTick(() => {
          loadedTabs.value[activeTab.value as keyof typeof loadedTabs.value] = true
        })
      } else {
        console.warn('选择的工作空间不存在，清空选择')
        managementStore.setWorkspace(null)
        saveToStorage(STORAGE_KEY_WORKSPACE, null)
      }
    } else {
      managementStore.setWorkspace(null)
      resetLoadedTabs()
    }
  }

  const handleWorkspaceClear = () => {
    managementStore.setWorkspace(null)
    resetLoadedTabs()

    saveToStorage(STORAGE_KEY_WORKSPACE, null)
  }

  const resetLoadedTabs = () => {
    loadedTabs.value = {
      configmap: false,
      secret: false,
      service: false,
      ingress: false,
      pvc: false,
      serviceaccount: false,
      role: false,
      rolebinding: false
    }
  }

  const handleTabChange = (tabName: string) => {
    if (!isWorkspaceReady.value) {
      return
    }

    saveToStorage(STORAGE_KEY_TAB, tabName)

    if (tabName in loadedTabs.value) {
      loadedTabs.value[tabName as keyof typeof loadedTabs.value] = true
    }

    const tab = tabName as keyof typeof refreshTriggers.value
    if (tab in refreshTriggers.value) {
      refreshTriggers.value[tab]++
    }
  }

  const handleRefresh = () => {
    if (!isWorkspaceReady.value) {
      return
    }

    const tab = activeTab.value as keyof typeof refreshTriggers.value
    if (tab in refreshTriggers.value) {
      refreshTriggers.value[tab]++
    }
  }

  const initPage = async () => {
    if (isInitializing.value) {
      return
    }

    isInitializing.value = true

    try {
      await Promise.all([projectStore.ensureInitialized(), managementStore.ensureInitialized()])

      if (!selectedProject.value) {
        console.warn('⚠️ 未选择项目，清空所有状态')
        saveToStorage(STORAGE_KEY_CLUSTER, null)
        saveToStorage(STORAGE_KEY_WORKSPACE, null)
        saveToStorage(STORAGE_KEY_TAB, null)
        return
      }

      await loadClusters()

      if (managementStore.selectedClusterId) {
        await loadWorkspaces()
      }
    } catch (error) {
      console.error('❌ 页面初始化失败:', error)
    } finally {
      setTimeout(() => {
        isInitializing.value = false
        hasCompletedInitialLoad.value = true
      }, 100)
    }
  }

  let initPromise: Promise<void> | null = null

  onMounted(async () => {
    if (!initPromise) {
      initPromise = initPage()
    }
    await initPromise
  })

  onActivated(async () => {
    if (!hasCompletedInitialLoad.value) {
      if (!initPromise) {
        initPromise = initPage()
      }
      await initPromise
      return
    }

    if (isWorkspaceReady.value && activeTab.value) {
      const tab = activeTab.value as keyof typeof refreshTriggers.value
      if (tab in refreshTriggers.value) {
        refreshTriggers.value[tab]++
      }
    }
  })
</script>

<style lang="scss" scoped>
  .core-config-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;

    .breadcrumb-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 16px;
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

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;

          .breadcrumb-label {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #606266;
            font-weight: 500;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .breadcrumb-select {
            min-width: 180px;
            max-width: 280px;

            :deep(.el-input__wrapper) {
              background-color: #f5f7fa;
              border: 1px solid #dcdfe6;
              transition: all 0.2s;

              &:hover {
                border-color: #c0c4cc;
              }
            }

            :deep(.el-input__inner) {
              font-size: 13px;
              font-weight: 500;
            }
          }
        }

        .breadcrumb-separator {
          color: #c0c4cc;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
      }

      .breadcrumb-actions {
        flex-shrink: 0;
      }
    }
  }

  @media (max-width: 1200px) {
    .breadcrumb-selector {
      .breadcrumb-content {
        .breadcrumb-item {
          .breadcrumb-select {
            min-width: 150px;
            max-width: 200px;
          }
        }
      }
    }
  }
</style>

<style lang="scss">
  /* Core Config - 集群下拉菜单样式 */
  .core-config-cluster-dropdown {
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

  /* Core Config - 工作空间下拉菜单样式 */
  .core-config-workspace-dropdown {
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
        flex-shrink: 0;
      }
    }
  }
</style>
