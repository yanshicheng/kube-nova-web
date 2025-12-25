<template>
  <div class="rolebinding-page art-full-height">
    <!-- 搜索栏 -->
    <RoleBindingSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    />

    <ElCard
      class="art-table-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
    >
      <!-- 表格头部 -->
      <ArtTableHeader
        v-model:columns="columns"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        :showZebra="true"
        :showBorder="true"
        :showHeaderBackground="true"
        :fullClass="'art-page-view'"
        :layout="'search,refresh,size,fullscreen,columns,settings'"
        @refresh="loadData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="handleCreate">
              <Link :size="16" style="margin-right: 4px" />
              新增 RoleBinding
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 数据表格 -->
      <ArtTable
        :loading="loading"
        :data="displayData"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 创建/编辑对话框 -->
    <RoleBindingDialog
      v-if="dialogVisible"
      :visible="dialogVisible"
      :dialog-type="dialogType"
      :binding-data="currentBinding"
      :workspace="workspace"
      @close="handleDialogClose"
      @success="handleSuccess"
    />

    <!-- 查看详情对话框 -->
    <RoleBindingDetailDialog
      v-if="detailVisible"
      :visible="detailVisible"
      :binding-name="currentBindingName"
      :workspace="workspace"
      @close="detailVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Link } from 'lucide-vue-next'
  import {
    getRoleBindingListApi,
    deleteRoleBindingApi,
    getRoleBindingYamlApi,
    type RoleBindingListItem,
    type ProjectWorkspace
  } from '@/api/workload/core'
  import RoleBindingSearch from './components/RoleBindingSearch.vue'
  import RoleBindingDialog from './components/RoleBindingDialog.vue'
  import RoleBindingDetailDialog from './components/RoleBindingDetailDialog.vue'
  import { useRoleBindingTableConfig } from './composables/table-config'

  defineOptions({ name: 'RoleBindingManagement' })

  interface Props {
    workspace?: ProjectWorkspace
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['loaded'])

  const { loading, showSearchBar, deleteLoadingMap, downloadLoadingMap, createTableColumns } =
    useRoleBindingTableConfig()

  const allData = ref<RoleBindingListItem[]>([])
  const useServerPagination = ref(true)

  const searchForm = ref({
    search: '',
    labelSelector: ''
  })

  const searchParams = ref<any>({})

  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentBinding = ref<RoleBindingListItem | undefined>(undefined)
  const currentBindingName = ref('')

  const displayData = computed(() => {
    if (useServerPagination.value) {
      return allData.value
    } else {
      const start = (pagination.value.current - 1) * pagination.value.size
      const end = start + pagination.value.size
      return allData.value.slice(start, end)
    }
  })

  const handleView = (row: RoleBindingListItem) => {
    currentBindingName.value = row.name
    detailVisible.value = true
  }

  const handleEdit = (row: RoleBindingListItem) => {
    dialogType.value = 'edit'
    currentBinding.value = row
    dialogVisible.value = true
  }

  const handleDownloadYaml = async (row: RoleBindingListItem) => {
    try {
      downloadLoadingMap.value[row.name] = true
      const yaml = await getRoleBindingYamlApi({
        clusterUuid: props.workspace!.clusterUuid!,
        namespace: props.workspace!.namespace!,
        name: row.name
      })

      const blob = new Blob([yaml], { type: 'text/yaml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${row.name}.yaml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success('下载成功')
    } catch (error) {
      console.error('下载YAML失败:', error)
    } finally {
      downloadLoadingMap.value[row.name] = false
    }
  }

  const handleDelete = async (row: RoleBindingListItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除 RoleBinding "${row.name}" 吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[row.name] = true
      await deleteRoleBindingApi({
        clusterUuid: props.workspace!.clusterUuid!,
        namespace: props.workspace!.namespace!,
        name: row.name
      })

      ElMessage.success('删除成功')
      loadData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoadingMap.value[row.name] = false
    }
  }

  const { columns } = createTableColumns({
    handleView,
    handleEdit,
    handleDownloadYaml,
    handleDelete
  })

  watch(
    () => props.refreshTrigger,
    () => {
      if (props.workspace) {
        loadData()
      }
    }
  )

  watch(
    () => props.workspace,
    (newWorkspace) => {
      if (newWorkspace) {
        resetSearchParams()
      }
    }
  )

  const loadData = async () => {
    if (!props.workspace?.clusterUuid || !props.workspace?.namespace) {
      return
    }

    loading.value = true
    try {
      const params = {
        clusterUuid: props.workspace.clusterUuid,
        namespace: props.workspace.namespace,
        ...searchParams.value
      }

      const response = await getRoleBindingListApi(params)

      let items: RoleBindingListItem[] = []

      if (Array.isArray(response)) {
        items = response
        useServerPagination.value = false
      } else if (response && response.items) {
        items = response.items
        if (response.total !== undefined && response.total !== null) {
          useServerPagination.value = true
          pagination.value.total = response.total
        } else {
          useServerPagination.value = false
        }
      } else {
        items = []
      }

      allData.value = items

      if (!useServerPagination.value) {
        pagination.value.total = items.length
      }

      emit('loaded')
    } catch (error: any) {
      console.error('加载RoleBinding列表失败:', error)
      allData.value = []
      pagination.value.total = 0
    } finally {
      loading.value = false
    }
  }

  const handleSearch = (params: Record<string, any>) => {
    searchParams.value = params
    pagination.value.current = 1
    loadData()
  }

  const resetSearchParams = () => {
    searchParams.value = {}
    pagination.value.current = 1
    loadData()
  }

  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1

    if (useServerPagination.value) {
      loadData()
    }
  }

  const handleCurrentChange = (current: number) => {
    pagination.value.current = current

    if (useServerPagination.value) {
      loadData()
    }
  }

  const handleCreate = () => {
    if (!props.workspace) {
      return
    }
    dialogType.value = 'add'
    currentBinding.value = undefined
    dialogVisible.value = true
  }

  const handleDialogClose = () => {
    dialogVisible.value = false
  }

  const handleSuccess = () => {
    dialogVisible.value = false
    loadData()
  }

  onMounted(() => {
    if (props.workspace) {
      loadData()
    }
  })
</script>

<style lang="scss" scoped>
  .rolebinding-page {
    padding-bottom: 20px;
  }
</style>