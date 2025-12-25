<template>
  <div class="login-log-page art-full-height">
    <!-- 搜索栏 -->
    <LoginLogSearch
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
            <ElButton type="danger" @click="handleBatchDelete" :disabled="!selectedRows.length">
              批量删除 ({{ selectedRows.length }})
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
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    searchLoginLogApi,
    deleteLoginLogApi,
    type LoginLogSysLoginLog
  } from '@/api/portal/login-log'
  import LoginLogSearch from './modules/login-log-search.vue'
  import { useLoginLogTableConfig } from './modules/table-config'

  defineOptions({ name: 'LoginLog' })

  // 使用抽离的表格配置逻辑
  const { loading, showSearchBar, deleteLoadingMap, SearchFormItems, createTableColumns } =
    useLoginLogTableConfig()

  // 状态管理
  const selectedRows = ref<LoginLogSysLoginLog[]>([])

  // 表格数据
  const data = ref<LoginLogSysLoginLog[]>([])

  // 搜索表单
  const searchForm = ref({
    userId: undefined,
    username: undefined,
    ipAddress: undefined,
    userAgent: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 删除单条日志
  const handleDelete = async (row: LoginLogSysLoginLog) => {
    try {
      await ElMessageBox.confirm(
        `确定删除用户"${row.username}"的登录日志吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[row.id] = true
      await deleteLoginLogApi(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoadingMap.value[row.id] = false
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleDelete
  })

  // 获取数据
  const getData = async () => {
    try {
      loading.value = true
      const params = {
        page: pagination.value.current,
        pageSize: pagination.value.size,
        orderField: 'login_time',
        isAsc: false,
        ...searchParams.value
      }

      const response = await searchLoginLogApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
      console.error('获取登录日志失败:', error)
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

  // 处理选择变化
  const handleSelectionChange = (selection: LoginLogSysLoginLog[]) => {
    selectedRows.value = selection
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (!selectedRows.value.length) {
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定删除选中的 ${selectedRows.value.length} 条登录日志吗？此操作不可恢复！`,
        '批量删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      loading.value = true

      const deletePromises = selectedRows.value.map((row) =>
        deleteLoginLogApi(row.id).catch((err) => {
          console.error(`删除日志 ${row.id} 失败:`, err)
          return { error: true, id: row.id } as const // 添加 as const
        })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter((r) => typeof r === 'object' && r.error).length // 修改过滤条件

      if (failedCount > 0) {
      } else {
        ElMessage.success('批量删除成功')
      }

      selectedRows.value = []
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
      }
    } finally {
      loading.value = false
    }
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .login-log-page {
    padding-bottom: 15px;
  }
</style>
