// src/store/modules/project.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProjectsByUserApi } from '@/api'

// ========== 类型定义 ==========
export interface Project {
  id: number
  name: string
  uuid: string
  isSystem: number
}

// ========== 存储键名 ==========
const STORAGE_KEY = 'art-selected-project'

// ========== Pinia Store ==========
export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const selectedProject = ref<Project | null>(null)
  const loading = ref(false)
  const initialized = ref(false) // 添加初始化标志

  // 计算属性
  const hasSelectedProject = computed(() => !!selectedProject.value)
  const selectedProjectId = computed(() => selectedProject.value?.id)

  // 初始化 - 从本地存储加载
  const initializeStore = async () => {
    if (initialized.value) return // 防止重复初始化

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedProject = JSON.parse(saved)
        // 获取项目列表以验证保存的项目是否仍然存在
        await fetchProjects()

        // 验证保存的项目是否在列表中
        const exists = projects.value.find((p) => p.id === savedProject.id)
        if (exists) {
          selectedProject.value = exists
        } else {
          // 项目不存在，清除本地存储
          localStorage.removeItem(STORAGE_KEY)
          selectedProject.value = null
        }
      } else {
        // 没有保存的项目，只加载列表
        await fetchProjects()
      }
    } catch (error) {
      console.error('Failed to initialize project store:', error)
      localStorage.removeItem(STORAGE_KEY)
      selectedProject.value = null
    } finally {
      initialized.value = true
    }
  }

  // 获取项目列表
  const fetchProjects = async (name?: string) => {
    loading.value = true
    try {
      const response = await getProjectsByUserApi({ name })
      projects.value = response.map((item) => ({
        id: item.id,
        name: item.name,
        uuid: item.uuid,
        isSystem: item.isSystem
      }))

      // 验证已选择的项目是否仍存在
      if (selectedProject.value) {
        const exists = projects.value.find((p) => p.id === selectedProject.value!.id)
        if (!exists) {
          clearSelection()
        } else {
          selectedProject.value = exists
          // 更新本地存储为最新数据
          localStorage.setItem(STORAGE_KEY, JSON.stringify(exists))
        }
      }

      return projects.value
    } catch (error) {
      console.error('获取项目列表失败:', error)
      projects.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  // 选择项目
  const selectProject = (project: Project | null) => {
    selectedProject.value = project

    // 持久化到本地存储
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // 清空选择
  const clearSelection = () => {
    selectedProject.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  // 确保store已初始化
  const ensureInitialized = async () => {
    if (!initialized.value) {
      await initializeStore()
    }
    return selectedProject.value
  }

  // 初始化时立即从localStorage恢复
  const savedProject = localStorage.getItem(STORAGE_KEY)
  if (savedProject) {
    try {
      selectedProject.value = JSON.parse(savedProject)
    } catch (error) {
      console.error('Failed to parse saved project:', error)
    }
  }
  const clearAllStoredData = () => {
    selectedProject.value = null
    projects.value = []
    loading.value = false
    initialized.value = false
    localStorage.removeItem(STORAGE_KEY)
    console.log('[项目Store] 已清空所有项目数据')
  }
  return {
    // 状态
    projects,
    selectedProject,
    loading,
    initialized,

    // 计算属性
    hasSelectedProject,
    selectedProjectId,

    // 方法
    fetchProjects,
    selectProject,
    clearSelection,
    initializeStore,
    ensureInitialized,
    clearAllStoredData
  }
})
