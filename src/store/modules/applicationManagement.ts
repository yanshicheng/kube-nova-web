// src/store/modules/applicationManagement.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useProjectStore } from './project'
import type { ProjectCluster, ProjectWorkspace, OnecProjectApplication } from '@/api'

// ========== 类型定义 ==========
interface ApplicationManagementState {
  clusterId: number | null
  workspaceId: number | null
  applicationId: number | null
  resourceType: string
  showServiceTree: boolean
  sidebarWidth: number
  activeTab: string
}

// ========== 存储键名 ==========
const STORAGE_KEY_PREFIX = 'art-app-management'

// ========== Pinia Store ==========
export const useApplicationManagementStore = defineStore('applicationManagement', () => {
  const projectStore = useProjectStore()

  // 状态
  const selectedClusterId = ref<number | null>(null)
  const selectedCluster = ref<ProjectCluster | null>(null)

  const selectedWorkspaceId = ref<number | null>(null)
  const selectedWorkspace = ref<ProjectWorkspace | null>(null)

  const selectedApplicationId = ref<number | null>(null)
  const selectedApplication = ref<OnecProjectApplication | null>(null)

  const selectedResourceType = ref<string>('all')
  const showServiceTree = ref<boolean>(false)
  const sidebarWidth = ref<number>(320)
  const activeTab = ref<string>('basic')

  const initialized = ref(false)

  // 获取当前项目的存储键
  const getStorageKey = () => {
    const projectId = projectStore.selectedProjectId
    return projectId ? `${STORAGE_KEY_PREFIX}-${projectId}` : null
  }

  // 保存状态到 localStorage
  const saveState = () => {
    const storageKey = getStorageKey()
    if (!storageKey) return

    const state: ApplicationManagementState = {
      clusterId: selectedClusterId.value,
      workspaceId: selectedWorkspaceId.value,
      applicationId: selectedApplicationId.value,
      resourceType: selectedResourceType.value,
      showServiceTree: showServiceTree.value,
      sidebarWidth: sidebarWidth.value,
      activeTab: activeTab.value
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      console.log('[应用管理Store] 状态已保存:', state)
    } catch (error) {
      console.error('[应用管理Store] 保存状态失败:', error)
    }
  }

  // 从 localStorage 加载状态
  const loadState = (): ApplicationManagementState | null => {
    const storageKey = getStorageKey()
    if (!storageKey) return null

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const state = JSON.parse(saved) as ApplicationManagementState
        console.log('[应用管理Store] 状态已加载:', state)
        return state
      }
    } catch (error) {
      console.error('[应用管理Store] 加载状态失败:', error)
      // 清除损坏的数据
      if (storageKey) {
        localStorage.removeItem(storageKey)
      }
    }
    return null
  }

  // 恢复状态（仅恢复 ID，不恢复对象）
  const restoreState = () => {
    const state = loadState()
    if (state) {
      selectedClusterId.value = state.clusterId
      selectedWorkspaceId.value = state.workspaceId
      selectedApplicationId.value = state.applicationId
      selectedResourceType.value = state.resourceType || 'all'
      showServiceTree.value = state.showServiceTree || false
      sidebarWidth.value = state.sidebarWidth || 320
      activeTab.value = state.activeTab || 'basic'

      console.log('[应用管理Store] 状态已恢复')
      return true
    }
    return false
  }

  // 清空当前项目的状态
  const clearState = () => {
    const storageKey = getStorageKey()

    // 清空内存状态
    selectedClusterId.value = null
    selectedCluster.value = null
    selectedWorkspaceId.value = null
    selectedWorkspace.value = null
    selectedApplicationId.value = null
    selectedApplication.value = null
    selectedResourceType.value = 'all'
    showServiceTree.value = false
    sidebarWidth.value = 320
    activeTab.value = 'basic'

    // 清空 localStorage
    if (storageKey) {
      localStorage.removeItem(storageKey)
      console.log('[应用管理Store] 状态已清空')
    }
  }

  // 清空所有项目的存储数据
  const clearAllStoredData = () => {
    try {
      // 获取所有 localStorage 的键
      const keys = Object.keys(localStorage)
      // 过滤出应用管理相关的键
      const appManagementKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_PREFIX))
      // 删除所有相关键
      appManagementKeys.forEach((key) => {
        localStorage.removeItem(key)
      })

      // 清空当前状态
      clearState()

      console.log('[应用管理Store] 已清空所有存储数据')
    } catch (error) {
      console.error('[应用管理Store] 清空存储数据失败:', error)
    }
  }

  // 设置集群（支持静默模式，不清空下级数据）
  const setCluster = (cluster: ProjectCluster | null, silent = false) => {
    const clusterChanged = selectedClusterId.value !== cluster?.id

    selectedCluster.value = cluster
    selectedClusterId.value = cluster?.id || null

    // 只有在集群真正改变且非静默模式时，才清空下级数据
    if (clusterChanged && !silent) {
      selectedWorkspaceId.value = null
      selectedWorkspace.value = null
      selectedApplicationId.value = null
      selectedApplication.value = null
    }

    saveState()
  }

  // 设置工作空间（支持静默模式，不清空下级数据）
  const setWorkspace = (workspace: ProjectWorkspace | null, silent = false) => {
    const workspaceChanged = selectedWorkspaceId.value !== workspace?.id

    selectedWorkspace.value = workspace
    selectedWorkspaceId.value = workspace?.id || null

    // 只有在工作空间真正改变且非静默模式时，才清空应用
    if (workspaceChanged && !silent) {
      selectedApplicationId.value = null
      selectedApplication.value = null
    }

    saveState()
  }

  // 设置应用（不需要清空下级，因为应用是最底层）
  const setApplication = (application: OnecProjectApplication | null) => {
    selectedApplication.value = application
    selectedApplicationId.value = application?.id || null
    saveState()
  }

  // 设置资源类型
  const setResourceType = (type: string) => {
    selectedResourceType.value = type
    saveState()
  }

  // 设置服务树显示状态
  const setShowServiceTree = (show: boolean) => {
    showServiceTree.value = show
    saveState()
  }

  // 设置侧边栏宽度
  const setSidebarWidth = (width: number) => {
    sidebarWidth.value = width
    saveState()
  }

  // 设置激活的 Tab
  const setActiveTab = (tab: string) => {
    activeTab.value = tab
    saveState()
  }

  // 初始化 Store
  const initializeStore = async () => {
    if (initialized.value) return

    await projectStore.ensureInitialized()

    if (projectStore.selectedProject) {
      // 尝试恢复状态
      restoreState()
    }

    initialized.value = true
    console.log('[应用管理Store] 初始化完成')
  }

  // 确保 Store 已初始化
  const ensureInitialized = async () => {
    if (!initialized.value) {
      await initializeStore()
    }
  }

  // 监听项目切换，清空状态
  watch(
    () => projectStore.selectedProjectId,
    (newProjectId, oldProjectId) => {
      if (oldProjectId && newProjectId !== oldProjectId) {
        console.log('[应用管理Store] 检测到项目切换，清空状态')
        clearState()

        // 尝试加载新项目的状态
        if (newProjectId) {
          restoreState()
        }
      }
    }
  )

  return {
    // 状态
    selectedClusterId,
    selectedCluster,
    selectedWorkspaceId,
    selectedWorkspace,
    selectedApplicationId,
    selectedApplication,
    selectedResourceType,
    showServiceTree,
    sidebarWidth,
    activeTab,
    initialized,

    // 方法
    setCluster,
    setWorkspace,
    setApplication,
    setResourceType,
    setShowServiceTree,
    setSidebarWidth,
    setActiveTab,
    clearState,
    clearAllStoredData,
    saveState,
    loadState,
    restoreState,
    initializeStore,
    ensureInitialized
  }
})
