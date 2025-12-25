<template>
  <div class="audit-log-page art-full-height">
    <!-- 搜索栏 -->
    <AuditSearch
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
              :icon="Delete"
              :disabled="selectedIds.length === 0 || batchDeleting"
              :loading="batchDeleting"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedIds.length }})
            </ElButton>
            <ElButton type="warning" :icon="Clock" @click="showCleanDialog = true">
              定期清理
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

    <!-- 详情弹窗 -->
    <AuditDetail v-model="showDetailDialog" :data="currentDetail" />

    <!-- 定期清理弹窗 -->
    <el-dialog
      v-model="showCleanDialog"
      title="定期清理审计日志"
      width="500px"
      align-center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="cleanForm" label-width="120px">
        <el-form-item label="清理规则">
          <el-alert title="删除指定天数之前的审计日志" type="info" :closable="false" show-icon />
        </el-form-item>

        <el-form-item label="保留天数" required>
          <el-input-number
            v-model="cleanForm.days"
            :min="1"
            :max="3650"
            :step="1"
            placeholder="请输入保留天数"
            :disabled="cleanLoading"
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            将删除 {{ cleanForm.days }} 天之前的审计日志
          </div>
        </el-form-item>

        <el-form-item label="确认操作">
          <el-checkbox v-model="cleanForm.confirmed" :disabled="cleanLoading">
            我已了解此操作不可撤销
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCleanDialog = false" :disabled="cleanLoading">取消</el-button>
          <el-button
            type="danger"
            :disabled="!cleanForm.confirmed || !cleanForm.days || cleanLoading"
            :loading="cleanLoading"
            @click="handleCleanByDays"
          >
            {{ cleanLoading ? '清理中...' : '确定清理' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Delete, Clock } from '@element-plus/icons-vue'
  import AuditSearch from './modules/audit-search.vue'
  import AuditDetail from './modules/audit-detail.vue'
  import { useAuditLogTableConfig } from './modules/table-config'
  import type { ProjectAuditLog } from '@/api/manager/audit'
  import {
    searchProjectAuditLogApi,
    deleteProjectAuditLogApi,
    batchDeleteProjectAuditLogApi,
    deleteProjectAuditLogBeforeDaysApi
  } from '@/api/manager/audit'

  defineOptions({ name: 'AuditLog' })

  // 使用表格配置
  const {
    loading,
    showSearchBar,
    deleteLoadingMap,
    batchDeleting,
    selectedIds,
    createTableColumns
  } = useAuditLogTableConfig()

  // 表格数据
  const data = ref<ProjectAuditLog[]>([])

  // 搜索表单
  const searchForm = ref({
    clusterUuid: undefined,
    projectId: -1,
    workspaceId: -1,
    title: undefined,
    operatorName: undefined,
    status: -1,
    timeRange: undefined
  })

  // 搜索参数（初始化带上默认值，确保传给后端）
  const searchParams = ref<any>({
    projectId: -1,
    workspaceId: -1,
    status: -1
  })

  // 分页配置
  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  // 详情弹窗
  const showDetailDialog = ref(false)
  const currentDetail = ref<ProjectAuditLog | null>(null)

  // 定期清理弹窗
  const showCleanDialog = ref(false)
  const cleanLoading = ref(false)
  const cleanForm = reactive({
    days: 30,
    confirmed: false
  })

  // 创建表格列配置
  const { columnChecks, columns } = createTableColumns({
    handleDelete,
    handleViewDetail
  })

  // 获取数据
  const getData = async () => {
    try {
      loading.value = true
      const params = {
        page: pagination.current,
        pageSize: pagination.size,
        ...searchParams.value
      }

      const response = await searchProjectAuditLogApi(params)
      data.value = response.items || []
      pagination.total = response.total || 0
    } catch (error) {
      console.error('获取审计日志失败:', error)
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
    pagination.current = 1
    getData()
  }

  // 重置搜索参数
  const resetSearchParams = () => {
    searchParams.value = {
      projectId: -1,
      workspaceId: -1,
      status: -1
    }
    pagination.current = 1
    getData()
  }

  // 分页大小改变
  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    getData()
  }

  // 当前页改变
  const handleCurrentChange = (current: number) => {
    pagination.current = current
    getData()
  }

  // 查看详情
  function handleViewDetail(row: ProjectAuditLog) {
    currentDetail.value = row
    showDetailDialog.value = true
  }

  // 删除单条
  async function handleDelete(row: ProjectAuditLog) {
    try {
      deleteLoadingMap.value[row.id] = true
      await deleteProjectAuditLogApi(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error) {
    } finally {
      deleteLoadingMap.value[row.id] = false
    }
  }

  // 批量选择变化
  const handleSelectionChange = (selection: ProjectAuditLog[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请先选择要删除的记录')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 条审计日志吗？此操作不可恢复！`,
        '批量删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      batchDeleting.value = true
      await batchDeleteProjectAuditLogApi({ ids: selectedIds.value })
      ElMessage.success(`成功删除 ${selectedIds.value.length} 条记录`)
      selectedIds.value = []
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      batchDeleting.value = false
    }
  }

  // 按天数清理
  const handleCleanByDays = async () => {
    if (!cleanForm.days || !cleanForm.confirmed) {
      ElMessage.warning('请填写保留天数并确认操作')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除 ${cleanForm.days} 天之前的所有审计日志吗？此操作不可撤销！`,
        '定期清理确认',
        {
          confirmButtonText: '确定清理',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      )

      cleanLoading.value = true
      await deleteProjectAuditLogBeforeDaysApi({ days: cleanForm.days })
      ElMessage.success('清理成功')
      showCleanDialog.value = false
      cleanForm.confirmed = false
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      cleanLoading.value = false
    }
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .audit-log-page {
    padding-bottom: 15px;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
