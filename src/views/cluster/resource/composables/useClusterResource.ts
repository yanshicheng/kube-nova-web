/**
 * 集群资源管理通用 Hook
 * 提供列表加载、刷新、搜索、分页等通用功能
 */

import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export interface UseClusterResourceOptions<T, P = any> {
  /** 获取列表数据的 API */
  listApi: (params: P) => Promise<{ total: number; items: T[] }>
  /** 删除资源的 API */
  deleteApi?: (params: { clusterUuid: string; name: string }) => Promise<any>
  /** 检查是否可删除的 API */
  canDeleteApi?: (params: {
    clusterUuid: string
    name: string
  }) => Promise<{ canDelete: boolean; warning?: string }>
  /** 获取 YAML 的 API */
  getYamlApi?: (params: { clusterUuid: string; name: string }) => Promise<string>
  /** 获取 Describe 的 API */
  getDescribeApi?: (params: { clusterUuid: string; name: string }) => Promise<string>
  /** 资源类型名称（用于提示） */
  resourceName: string
  /** 默认分页大小 */
  defaultPageSize?: number
}

export function useClusterResource<
  T extends { name: string },
  P extends { clusterUuid: string } = any
>(options: UseClusterResourceOptions<T, P>) {
  const {
    listApi,
    deleteApi,
    canDeleteApi,
    getYamlApi,
    getDescribeApi,
    resourceName,
    defaultPageSize = 20
  } = options

  // ==================== 状态 ====================
  const loading = ref(false)
  const data = ref<T[]>([])
  const total = ref(0)
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)
  const clusterUuid = ref('')
  const hasLoaded = ref(false)
  const lastLoadTime = ref<number>(0)

  // 删除相关
  const deleteLoading = ref<Record<string, boolean>>({})

  // YAML/Describe 查看
  const yamlDialogVisible = ref(false)
  const describeDialogVisible = ref(false)
  const currentYaml = ref('')
  const currentDescribe = ref('')
  const currentResourceName = ref('')
  const yamlLoading = ref(false)
  const describeLoading = ref(false)

  // ==================== 计算属性 ====================
  const isEmpty = computed(() => !loading.value && data.value.length === 0)

  const filteredData = computed(() => {
    if (!searchKeyword.value) return data.value
    const keyword = searchKeyword.value.toLowerCase()
    return data.value.filter((item) => item.name.toLowerCase().includes(keyword))
  })

  // ==================== 方法 ====================

  /** 设置集群 UUID */
  const setClusterUuid = (uuid: string) => {
    if (clusterUuid.value !== uuid) {
      clusterUuid.value = uuid
      hasLoaded.value = false
      data.value = []
      total.value = 0
    }
  }

  /** 加载数据 */
  const loadData = async (force = false) => {
    if (!clusterUuid.value) {
      console.warn('未设置集群 UUID')
      return
    }

    // 如果不是强制刷新且已加载过，检查是否需要重新加载
    if (!force && hasLoaded.value) {
      const now = Date.now()
      // 30秒内不重复加载
      if (now - lastLoadTime.value < 30000) {
        return
      }
    }

    try {
      loading.value = true
      const params = {
        clusterUuid: clusterUuid.value,
        search: searchKeyword.value || undefined,
        page: currentPage.value,
        pageSize: pageSize.value
      } as P

      const response = await listApi(params)
      data.value = response.items || []
      total.value = response.total || 0
      hasLoaded.value = true
      lastLoadTime.value = Date.now()
    } catch (error: any) {
      console.error(`加载 ${resourceName} 列表失败:`, error)
      ElMessage.error(`加载 ${resourceName} 列表失败`)
    } finally {
      loading.value = false
    }
  }

  /** 刷新数据 */
  const refresh = () => {
    hasLoaded.value = false
    loadData(true)
  }

  /** 搜索 */
  const handleSearch = () => {
    currentPage.value = 1
    loadData(true)
  }

  /** 重置搜索 */
  const resetSearch = () => {
    searchKeyword.value = ''
    currentPage.value = 1
    loadData(true)
  }

  /** 分页大小改变 */
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    loadData(true)
  }

  /** 页码改变 */
  const handleCurrentChange = (page: number) => {
    currentPage.value = page
    loadData(true)
  }

  /** 删除资源 */
  const handleDelete = async (row: T) => {
    if (!deleteApi) {
      ElMessage.warning('删除功能暂未实现')
      return
    }

    try {
      // 先检查是否可删除
      if (canDeleteApi) {
        const checkResult = await canDeleteApi({
          clusterUuid: clusterUuid.value,
          name: row.name
        })

        if (!checkResult.canDelete) {
          ElMessage.warning(checkResult.warning || `无法删除 ${resourceName}`)
          return
        }

        if (checkResult.warning) {
          // 有警告但可以删除，显示确认
          await ElMessageBox.confirm(
            `${checkResult.warning}\n\n确定要继续删除吗？`,
            `删除 ${resourceName}`,
            {
              confirmButtonText: '确定删除',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
        }
      }

      // 确认删除
      await ElMessageBox.confirm(
        `确定要删除 ${resourceName} "${row.name}" 吗？此操作不可恢复！`,
        `删除 ${resourceName}`,
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoading.value[row.name] = true

      await deleteApi({
        clusterUuid: clusterUuid.value,
        name: row.name
      })

      ElMessage.success(`${resourceName} "${row.name}" 已删除`)
      refresh()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error(`删除 ${resourceName} 失败:`, error)
        ElMessage.error(`删除失败: ${error.message || '未知错误'}`)
      }
    } finally {
      deleteLoading.value[row.name] = false
    }
  }

  /** 查看 YAML */
  const viewYaml = async (row: T) => {
    if (!getYamlApi) {
      ElMessage.warning('YAML 查看功能暂未实现')
      return
    }

    try {
      yamlLoading.value = true
      currentResourceName.value = row.name
      currentYaml.value = await getYamlApi({
        clusterUuid: clusterUuid.value,
        name: row.name
      })
      yamlDialogVisible.value = true
    } catch (error: any) {
      console.error('获取 YAML 失败:', error)
      ElMessage.error('获取 YAML 失败')
    } finally {
      yamlLoading.value = false
    }
  }

  /** 查看 Describe */
  const viewDescribe = async (row: T) => {
    if (!getDescribeApi) {
      ElMessage.warning('Describe 功能暂未实现')
      return
    }

    try {
      describeLoading.value = true
      currentResourceName.value = row.name
      currentDescribe.value = await getDescribeApi({
        clusterUuid: clusterUuid.value,
        name: row.name
      })
      describeDialogVisible.value = true
    } catch (error: any) {
      console.error('获取 Describe 失败:', error)
      ElMessage.error('获取 Describe 失败')
    } finally {
      describeLoading.value = false
    }
  }

  /** 关闭 YAML 弹窗 */
  const closeYamlDialog = () => {
    yamlDialogVisible.value = false
    currentYaml.value = ''
    currentResourceName.value = ''
  }

  /** 关闭 Describe 弹窗 */
  const closeDescribeDialog = () => {
    describeDialogVisible.value = false
    currentDescribe.value = ''
    currentResourceName.value = ''
  }

  return {
    // 状态
    loading,
    data,
    total,
    searchKeyword,
    currentPage,
    pageSize,
    hasLoaded,
    isEmpty,
    filteredData,
    deleteLoading,

    // YAML/Describe
    yamlDialogVisible,
    describeDialogVisible,
    currentYaml,
    currentDescribe,
    currentResourceName,
    yamlLoading,
    describeLoading,

    // 方法
    setClusterUuid,
    loadData,
    refresh,
    handleSearch,
    resetSearch,
    handleSizeChange,
    handleCurrentChange,
    handleDelete,
    viewYaml,
    viewDescribe,
    closeYamlDialog,
    closeDescribeDialog
  }
}

/**
 * Tab 懒加载 Hook
 * 实现切换 Tab 时重新加载数据的逻辑
 */
export function useTabLazyLoad(
  loadFn: () => void | Promise<void>,
  options: {
    immediate?: boolean
    refreshOnReactivate?: boolean
  } = {}
) {
  const { immediate = true, refreshOnReactivate = true } = options

  const isActive = ref(false)
  const hasActivated = ref(false)

  /** 激活 Tab */
  const activate = () => {
    isActive.value = true

    if (!hasActivated.value) {
      // 首次激活
      hasActivated.value = true
      loadFn()
    } else if (refreshOnReactivate) {
      // 重新激活，刷新数据
      loadFn()
    }
  }

  /** 停用 Tab */
  const deactivate = () => {
    isActive.value = false
  }

  // 立即激活（如果配置了）
  if (immediate) {
    onMounted(() => {
      activate()
    })
  }

  return {
    isActive,
    hasActivated,
    activate,
    deactivate
  }
}
