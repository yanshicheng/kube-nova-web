<template>
  <div class="token-page art-full-height">
    <!-- 搜索栏 -->
    <TokenSearch
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
            <ElButton type="primary" @click="showDialog()">新增Token</ElButton>
            <ElButton
              type="danger"
              :disabled="selectedRows.length === 0"
              :loading="batchDeleteLoading"
              @click="handleBatchDelete"
            >
              批量删除
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />

      <!-- Token弹窗 -->
      <TokenDialog v-model="dialogVisible" @success="handleDialogSuccess" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { searchTokenApi, deleteTokenApi, type TokenSysToken } from '@/api/portal/token'
  import TokenSearch from './modules/token-search.vue'
  import TokenDialog from './modules/token-dialog.vue'
  import { useTokenTableConfig } from './modules/table-config'

  defineOptions({ name: 'Token' })

  // 使用抽离的表格配置逻辑
  const {
    loading,
    batchDeleteLoading,
    showSearchBar,
    SearchFormItems,
    createTableColumns,
    copyToken
  } = useTokenTableConfig()

  // 状态管理
  const dialogVisible = ref(false)
  const selectedRows = ref<TokenSysToken[]>([])

  // 表格数据
  const data = ref<TokenSysToken[]>([])

  // 搜索表单
  const searchForm = ref({
    name: undefined,
    token: undefined,
    type: undefined,
    status: undefined
  })

  // 搜索参数（只搜索角色类型的Token）
  const searchParams = ref<any>({
    ownerType: 2 // 固定为角色类型
  })

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 复制Token处理
  const onCopyToken = async (token: string) => {
    const success = await copyToken(token)
    if (success) {
      ElMessage.success('Token已复制到剪贴板')
    } else {
    }
  }

  // 删除Token（带Loading状态）
  const handleDelete = async (row: TokenSysToken, loadingRef?: any) => {
    try {
      await ElMessageBox.confirm(`确定要删除Token"${row.name}"吗？此操作不可恢复！`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      if (loadingRef) loadingRef.value = true
      await deleteTokenApi(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      if (loadingRef) loadingRef.value = false
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleDelete,
    onCopyToken
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

      const response = await searchTokenApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
      console.error('获取Token列表失败:', error)
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
    searchParams.value = {
      ...params,
      ownerType: 2 // 保持固定为角色类型
    }
    pagination.value.current = 1
    getData()
  }

  // 重置搜索参数
  const resetSearchParams = () => {
    searchParams.value = {
      ownerType: 2 // 保持固定为角色类型
    }
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

  // 显示对话框
  const showDialog = () => {
    dialogVisible.value = true
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRows.value.length === 0) {
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRows.value.length} 个Token吗？此操作不可恢复！`,
        '批量删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      batchDeleteLoading.value = true
      const promises = selectedRows.value.map((token) => deleteTokenApi(token.id))
      await Promise.all(promises)

      ElMessage.success(`成功删除 ${selectedRows.value.length} 个Token`)
      selectedRows.value = []
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
      }
    } finally {
      batchDeleteLoading.value = false
    }
  }

  // 处理表格行选择变化
  const handleSelectionChange = (selection: TokenSysToken[]) => {
    selectedRows.value = selection
  }

  // 处理弹窗成功事件
  const handleDialogSuccess = () => {
    refreshData()
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .token-page {
    padding-bottom: 15px;
  }
</style>
