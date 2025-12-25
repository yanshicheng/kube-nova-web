<template>
  <div class="configmap-page art-full-height">
    <!-- 搜索栏 -->
    <ConfigMapSearch
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
            <ElButton type="primary" @click="handleCreate">新 增</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 数据表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ConfigMapDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :configmap-data="currentConfigMap"
      :workspace="workspace"
      @success="loadData"
    />

    <!-- 详情查看弹窗 -->
    <ConfigMapDetailDialog
      v-model="detailVisible"
      :configmap-name="currentConfigMapName"
      :workspace="workspace"
    />

    <!-- 引用查看弹窗 -->
    <ConfigMapUsageDialog
      v-model="usageVisible"
      :configmap-name="currentConfigMapName"
      :workspace="workspace"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    getConfigMapListApi,
    deleteConfigMapApi,
    getConfigMapUsageApi,
    getConfigMapYamlApi,
    type ConfigMapListItem,
    type ProjectWorkspace,
    type ProjectCluster
  } from '@/api'
  import ConfigMapSearch from './components/ConfigMapSearch.vue'
  import ConfigMapDialog from './components/ConfigMapDialog.vue'
  import ConfigMapDetailDialog from './components/ConfigMapDetailDialog.vue'
  import ConfigMapUsageDialog from './components/ConfigMapUsageDialog.vue'
  import { useConfigMapTableConfig } from './composables/table-config'

  defineOptions({ name: 'ConfigMapManagement' })

  interface Props {
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['loaded'])

  const { loading, showSearchBar, deleteLoadingMap, downloadLoadingMap, createTableColumns } =
    useConfigMapTableConfig()

  const data = ref<ConfigMapListItem[]>([])

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
  const usageVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentConfigMap = ref<ConfigMapListItem | undefined>(undefined)
  const currentConfigMapName = ref('')

  const workloadId = computed(() => props.workspace?.id || 0)

  const handleView = (row: ConfigMapListItem) => {
    currentConfigMapName.value = row.name
    detailVisible.value = true
  }

  const handleEdit = (row: ConfigMapListItem) => {
    dialogType.value = 'edit'
    currentConfigMap.value = row
    dialogVisible.value = true
  }

  const handleViewUsage = (row: ConfigMapListItem) => {
    currentConfigMapName.value = row.name
    usageVisible.value = true
  }

  const handleDownloadYaml = async (row: ConfigMapListItem) => {
    try {
      downloadLoadingMap.value[row.name] = true
      const yaml = await getConfigMapYamlApi({
        workloadId: workloadId.value,
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

  const handleDelete = async (row: ConfigMapListItem) => {
    try {
      const usage = await getConfigMapUsageApi({
        workloadId: workloadId.value,
        name: row.name
      })

      let confirmMessage = `确定要删除 ConfigMap "${row.name}" 吗？此操作不可恢复！`
      if (!usage.canDelete && usage.deleteWarning) {
        confirmMessage = `${usage.deleteWarning}\n\n${confirmMessage}`
      }

      await ElMessageBox.confirm(confirmMessage, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      })

      deleteLoadingMap.value[row.name] = true
      await deleteConfigMapApi({
        workloadId: workloadId.value,
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
    handleViewUsage,
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
    if (!workloadId.value) {
      return
    }

    loading.value = true
    try {
      const params = {
        workloadId: workloadId.value,
        ...searchParams.value
      }

      const response = await getConfigMapListApi(params)

      data.value = response.items || []
      pagination.value.total = response.total || 0
      emit('loaded')
    } catch (error) {
      console.error('加载ConfigMap列表失败:', error)
      data.value = []
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
    loadData()
  }

  const handleCurrentChange = (current: number) => {
    pagination.value.current = current
    loadData()
  }

  const handleCreate = () => {
    if (!props.workspace) {
      return
    }
    dialogType.value = 'add'
    currentConfigMap.value = undefined
    dialogVisible.value = true
  }

  onMounted(() => {
    if (props.workspace) {
      loadData()
    }
  })
</script>

<style lang="scss" scoped>
  .configmap-page {
    padding-bottom: 20px;
  }
</style>