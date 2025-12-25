import { ref, computed } from 'vue'

export function useApiTableConfig() {
  // 状态管理
  const loading = ref(false)
  const treeLoading = ref(false)
  const showSearchBar = ref(false)

  // 搜索表单配置
  const SearchFormItems = computed(() => [
    {
      label: 'API名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: 'API路径',
      key: 'path',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '请求方法',
      key: 'method',
      type: 'select',
      props: {
        clearable: true,
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'HEAD', value: 'HEAD' },
          { label: 'OPTIONS', value: 'OPTIONS' }
        ]
      }
    }
  ])

  // 创建表格列配置
  const createTableColumns = (handlers: {
    handleEdit: (row: any) => void
    handleDelete: (row: any) => void
  }) => {
    // 这里返回空的列配置，因为实际的列配置在 api-table.vue 中
    // 只是为了保持接口一致性
    const columns = ref([])

    return {
      columns
    }
  }

  return {
    // 状态
    loading,
    treeLoading,
    showSearchBar,

    // 配置
    SearchFormItems,

    // 方法
    createTableColumns
  }
}
