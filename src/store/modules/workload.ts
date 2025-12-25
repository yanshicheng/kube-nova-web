import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 类型定义
export interface WorkloadNamespace {
  id: string
  name: string
  clusterId: number
}

export interface WorkloadResource {
  id: string
  name: string
  namespace: string
  type: string
  status: string
  createdAt: Date
  replicas?: {
    desired: number
    current: number
    ready: number
  }
}

// 存储键名常量
const STORAGE_KEYS = {
  SELECTED_CLUSTER: 'workload-selected-cluster',
  SELECTED_NAMESPACE: 'workload-selected-namespace'
} as const

export const useWorkloadStore = defineStore('workload', () => {
  // 状态
  const selectedClusterId = ref<number | null>(null)
  const selectedNamespace = ref<string | null>(null)
  const resources = ref<WorkloadResource[]>([])
  const loading = ref(false)

  // 初始化时从 localStorage 恢复状态
  const initializeStore = () => {
    const savedCluster = localStorage.getItem(STORAGE_KEYS.SELECTED_CLUSTER)
    if (savedCluster) {
      selectedClusterId.value = JSON.parse(savedCluster)
    }

    const savedNamespace = localStorage.getItem(STORAGE_KEYS.SELECTED_NAMESPACE)
    if (savedNamespace) {
      selectedNamespace.value = JSON.parse(savedNamespace)
    }
  }

  // 监听变化并持久化
  watch(selectedClusterId, (newVal) => {
    if (newVal !== null) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CLUSTER, JSON.stringify(newVal))
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CLUSTER)
    }
  })

  watch(selectedNamespace, (newVal) => {
    if (newVal !== null) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_NAMESPACE, JSON.stringify(newVal))
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_NAMESPACE)
    }
  })

  // 选择集群
  const selectCluster = (clusterId: number | null) => {
    selectedClusterId.value = clusterId
    if (!clusterId) {
      selectedNamespace.value = null
    }
  }

  // 选择命名空间
  const selectNamespace = (namespace: string | null) => {
    selectedNamespace.value = namespace
  }

  // 初始化
  initializeStore()

  return {
    selectedClusterId,
    selectedNamespace,
    resources,
    loading,
    selectCluster,
    selectNamespace,
    initializeStore
  }
})
