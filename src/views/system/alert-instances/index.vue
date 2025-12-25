<template>
  <div class="alert-instance-page art-full-height">
    <!-- 搜索栏 -->
    <AlertSearch
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
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton
              type="danger"
              :disabled="!selectedIds.length"
              @click="handleBatchDelete"
              v-ripple
            >
              <ElIcon><Delete /></ElIcon>
              批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </ElButton>
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
        @selection-change="handleSelectionChange"
      />
    </ElCard>

    <!-- 详情弹窗 -->
    <AlertDetailDialog
      v-model="detailDialogVisible"
      :alert-id="currentAlertId"
      @refresh="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Delete } from '@element-plus/icons-vue'
  import {
    searchAlertInstanceApi,
    deleteAlertInstanceApi,
    batchDeleteAlertInstanceApi,
    type AlertInstance
  } from '@/api/portal/alert'
  import AlertSearch from './modules/alert-search.vue'
  import AlertDetailDialog from './modules/alert-detail-dialog.vue'
  import { useAlertTableConfig } from './modules/table-config'

  defineOptions({ name: 'AlertInstance' })

  // 使用表格配置
  const { loading, showSearchBar, deleteLoadingMap, createTableColumns } = useAlertTableConfig()

  // 弹窗控制
  const detailDialogVisible = ref(false)
  const currentAlertId = ref<number | undefined>(undefined)

  // 表格数据
  const data = ref<AlertInstance[]>([])
  const selectedIds = ref<number[]>([])

  // 搜索表单
  const searchForm = ref({
    instance: undefined,
    fingerprint: undefined,
    clusterUuid: undefined,
    clusterName: undefined,
    projectId: undefined,
    projectName: undefined,
    workspaceName: undefined,
    alertName: undefined,
    severity: undefined,
    status: undefined,
    repeatCount: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 查看详情
  const handleViewDetail = (row: AlertInstance) => {
    currentAlertId.value = row.id
    detailDialogVisible.value = true
  }

  // 删除告警
  const handleDelete = async (row: AlertInstance) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除告警实例"${row.alertName}"吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error',
          autofocus: false
        }
      )

      deleteLoadingMap.value[row.id] = true
      await deleteAlertInstanceApi(row.id)
      ElMessage.success('删除成功')
      await refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoadingMap.value[row.id] = false
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (!selectedIds.value.length) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要批量删除选中的 ${selectedIds.value.length} 条告警实例吗？此操作不可恢复！`,
        '批量删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error',
          autofocus: false
        }
      )

      loading.value = true
      await batchDeleteAlertInstanceApi({ ids: selectedIds.value })
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      await refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
      }
    } finally {
      loading.value = false
    }
  }

  // 表格选择变化
  const handleSelectionChange = (selection: AlertInstance[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleViewDetail,
    handleDelete
  })

  // 获取数据
  const getData = async () => {
    try {
      loading.value = true
      const params = {
        page: pagination.value.current,
        pageSize: pagination.value.size,
        ...searchParams.value
      }

      const response = await searchAlertInstanceApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
      console.error('获取告警实例列表失败:', error)
      ElMessage.error('获取告警实例列表失败')
    } finally {
      loading.value = false
    }
  }

  // 刷新数据
  const refreshData = () => {
    getData()
  }

  // 搜索处理
  const handleSearch = (params: Record<string, any>) => {
    searchParams.value = params
    pagination.value.current = 1
    getData()
  }

  // 重置搜索参数
  const resetSearchParams = () => {
    searchParams.value = {}
    pagination.value.current = 1
    getData()
  }

  // 分页大小改变
  const handleSizeChange = (size: number) => {
    pagination.value.size = size
    pagination.value.current = 1
    getData()
  }

  // 当前页改变
  const handleCurrentChange = (current: number) => {
    pagination.value.current = current
    getData()
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .alert-instance-page {
    padding-bottom: 15px;
  }
</style>
