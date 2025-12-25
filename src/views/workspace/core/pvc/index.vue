<template>
  <div class="pvc-page art-full-height">
    <!-- 搜索栏 -->
    <PVCSearch
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
              <Database :size="16" style="margin-right: 4px" />
              新增 PVC
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
    <PVCDialog
      v-if="dialogVisible"
      :visible="dialogVisible"
      :dialog-type="dialogType"
      :pvc-data="currentPVC"
      :workspace="workspace"
      @close="handleDialogClose"
      @success="handleSuccess"
    />

    <!-- 查看详情对话框 -->
    <PVCDetailDialog
      v-if="detailVisible"
      :visible="detailVisible"
      :pvc-name="currentPVCName"
      :workspace="workspace"
      @close="detailVisible = false"
    />

    <!-- 关联信息对话框 -->
    <PVCAssociationDialog
      v-if="associationVisible"
      :visible="associationVisible"
      :pvc-name="currentPVCName"
      :workspace="workspace"
      @close="associationVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Database } from 'lucide-vue-next'
  import {
    getPVCListApi,
    deletePVCApi,
    getPVCYamlApi,
    type PVCListItem,
    type ProjectWorkspace
  } from '@/api/workload/core'
  import PVCSearch from './components/PVCSearch.vue'
  import PVCDialog from './components/PVCDialog.vue'
  import PVCDetailDialog from './components/PVCDetailDialog.vue'
  import PVCAssociationDialog from './components/PVCAssociationDialog.vue'
  import { usePVCTableConfig } from './composables/table-config'

  defineOptions({ name: 'PVCManagement' })

  interface Props {
    workspace?: ProjectWorkspace
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['loaded'])

  const { loading, showSearchBar, deleteLoadingMap, downloadLoadingMap, createTableColumns } =
    usePVCTableConfig()

  const allData = ref<PVCListItem[]>([])
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
  const associationVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentPVC = ref<PVCListItem | undefined>(undefined)
  const currentPVCName = ref('')

  const displayData = computed(() => {
    if (useServerPagination.value) {
      return allData.value
    } else {
      const start = (pagination.value.current - 1) * pagination.value.size
      const end = start + pagination.value.size
      return allData.value.slice(start, end)
    }
  })

  const handleView = (row: PVCListItem) => {
    currentPVCName.value = row.name
    detailVisible.value = true
  }

  const handleViewAssociation = (row: PVCListItem) => {
    currentPVCName.value = row.name
    associationVisible.value = true
  }

  const handleEdit = (row: PVCListItem) => {
    dialogType.value = 'edit'
    currentPVC.value = row
    dialogVisible.value = true
  }

  const handleDownloadYaml = async (row: PVCListItem) => {
    try {
      downloadLoadingMap.value[row.name] = true
      const yaml = await getPVCYamlApi({
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

  const handleDelete = async (row: PVCListItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除 PVC "${row.name}" 吗？此操作不可恢复，可能影响正在使用的 Pod！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[row.name] = true
      await deletePVCApi({
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
    handleViewAssociation,
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

      const response = await getPVCListApi(params)

      let items: PVCListItem[] = []

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
      console.error('加载PVC列表失败:', error)
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
    currentPVC.value = undefined
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
  .pvc-page {
    padding-bottom: 20px;
  }
</style>