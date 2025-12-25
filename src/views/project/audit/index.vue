<template>
  <div class="audit-log-page art-full-height">
    <!-- 未选择项目提示 -->
    <template v-if="!selectedProject">
      <ElCard shadow="never" class="empty-project-card">
        <ElEmpty description="请先选择项目" :image-size="140">
          <template #description>
            <div class="empty-description">
              <p>您需要先选择一个项目才能查看审计日志</p>
              <p class="empty-hint">请从顶部导航栏选择项目</p>
            </div>
          </template>
        </ElEmpty>
      </ElCard>
    </template>

    <!-- 已选择项目 -->
    <template v-else>
      <!-- 搜索栏 -->
      <AuditSearch
        v-show="showSearchBar"
        v-model="searchForm"
        :project-id="selectedProject.id"
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
                :disabled="selectedIds.length === 0 || batchDeleting"
                :loading="batchDeleting"
                @click="handleBatchDelete"
              >
                {{ batchDeleting ? '批量删除中...' : `批量删除 (${selectedIds.length})` }}
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
          :show-selection="true"
          @selection-change="handleSelectionChange"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>

      <!-- 详情弹窗 -->
      <ElDialog
        v-model="detailDialogVisible"
        title="审计日志详情"
        width="700px"
        align-center
        :close-on-click-modal="false"
      >
        <ElDescriptions :column="2" border v-if="currentAuditLog">
          <ElDescriptionsItem label="日志ID">{{ currentAuditLog.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="操作状态">
            <ElTag :type="getAuditStatusInfo(currentAuditLog.status).type" size="small">
              {{ getAuditStatusInfo(currentAuditLog.status).label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="集群名称">
            {{ currentAuditLog.clusterName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="集群UUID">
            {{ currentAuditLog.clusterUuid }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="项目名称">
            {{ currentAuditLog.projectName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="项目ID">
            {{ currentAuditLog.projectId }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="工作空间" :span="2">
            {{
              getWorkspaceDisplayName(currentAuditLog.workspaceName, currentAuditLog.workspaceId)
            }}
            (ID: {{ currentAuditLog.workspaceId }})
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用名称" :span="2">
            {{ currentAuditLog.applicationName || '-' }}
            <template v-if="currentAuditLog.applicationId">
              (ID: {{ currentAuditLog.applicationId }})
            </template>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作简称" :span="2">
            {{ currentAuditLog.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作详情" :span="2">
            <div style="word-break: break-all; white-space: pre-wrap">
              {{ currentAuditLog.actionDetail }}
            </div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作人">
            {{ currentAuditLog.operatorName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作人ID">
            {{ currentAuditLog.operatorId }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作时间">
            {{ formatTimestamp(currentAuditLog.createdAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ formatTimestamp(currentAuditLog.updatedAt) }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <template #footer>
          <ElButton @click="detailDialogVisible = false">关闭</ElButton>
        </template>
      </ElDialog>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useProjectStore } from '@/store/modules/project'
  import {
    searchProjectAuditLogApi,
    deleteProjectAuditLogApi,
    batchDeleteProjectAuditLogApi,
    getAuditStatusInfo,
    getWorkspaceDisplayName,
    type ProjectAuditLog
  } from '@/api/manager/audit'
  import { formatTimestamp } from '@/utils/format'
  import AuditSearch from './modules/audit-search.vue'
  import { useAuditLogTableConfig } from './modules/table-config'

  defineOptions({ name: 'ProjectAuditLog' })

  // 获取当前选中的项目
  const projectStore = useProjectStore()
  const selectedProject = computed(() => projectStore.selectedProject)

  // 使用抽离的表格配置逻辑
  const { loading, showSearchBar, deleteLoadingMap, batchDeleting, createTableColumns } =
    useAuditLogTableConfig()

  // 表格数据
  const data = ref<ProjectAuditLog[]>([])

  // 已选择的行
  const selectedIds = ref<number[]>([])

  // 搜索表单 - workspaceId 和 status 默认 -1
  const searchForm = ref({
    clusterUuid: undefined,
    workspaceId: -1,
    applicationId: -1,
    title: undefined,
    operatorName: undefined,
    status: -1,
    timeRange: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 详情弹窗
  const detailDialogVisible = ref(false)
  const currentAuditLog = ref<ProjectAuditLog | null>(null)

  // 查看详情
  const handleViewDetail = (row: ProjectAuditLog) => {
    currentAuditLog.value = row
    detailDialogVisible.value = true
  }

  // 删除单条记录
  const handleDelete = async (row: ProjectAuditLog) => {
    try {
      deleteLoadingMap.value[row.id] = true
      await deleteProjectAuditLogApi(row.id)
      ElMessage.success('删除成功')
      await getData()
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      deleteLoadingMap.value[row.id] = false
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请先选择要删除的记录')
      return
    }

    if (selectedIds.value.length > 100) {
      ElMessage.warning('一次最多只能删除100条记录')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 条审计日志吗?此操作不可恢复!`,
        '批量删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      batchDeleting.value = true
      await batchDeleteProjectAuditLogApi({ ids: selectedIds.value })
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      await getData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
      }
    } finally {
      batchDeleting.value = false
    }
  }

  // 处理表格选择变化
  const handleSelectionChange = (selection: ProjectAuditLog[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleDelete,
    handleViewDetail
  })

  // 获取数据
  const getData = async () => {
    if (!selectedProject.value) {
      console.warn('⚠️ 未选择项目，无法查询审计日志')
      data.value = []
      pagination.value.total = 0
      return
    }

    try {
      loading.value = true
      const params = {
        page: pagination.value.current,
        pageSize: pagination.value.size,
        orderField: 'id',
        isAsc: false,
        ...searchParams.value // searchParams 里已经包含 projectId 了
      }

      const response = await searchProjectAuditLogApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
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
    console.log('🔍 收到搜索参数:', params)

    // ⭐ 确保 projectId 存在
    if (!params.projectId) {
      ElMessage.warning('请先选择项目')
      return
    }

    searchParams.value = params
    pagination.value.current = 1
    getData()
  }

  // 重置搜索参数
  const resetSearchParams = () => {
    if (!selectedProject.value) {
      searchParams.value = {}
    } else {
      // ⭐ 重置但保留 projectId
      searchParams.value = {
        projectId: selectedProject.value.id,
        workspaceId: -1,
        applicationId: -1,
        status: -1
      }
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

  // 监听项目切换
  watch(
    selectedProject,
    (newProject, oldProject) => {
      // 项目切换时重置搜索和分页
      if (newProject?.id !== oldProject?.id) {
        // ⭐ 重新初始化 searchParams，包含新项目的 ID
        if (newProject) {
          searchParams.value = {
            projectId: newProject.id,
            workspaceId: -1,
            applicationId: -1,
            status: -1
          }
        } else {
          searchParams.value = {}
        }

        pagination.value.current = 1
        selectedIds.value = []

        // 重新加载数据
        if (newProject) {
          getData()
        } else {
          data.value = []
          pagination.value.total = 0
        }
      }
    },
    { immediate: false }
  )

  // 初始化
  onMounted(() => {
    if (selectedProject.value) {
      // ⭐ 初始化 searchParams，包含 projectId 和默认值
      searchParams.value = {
        projectId: selectedProject.value.id,
        workspaceId: -1,
        applicationId: -1,
        status: -1
      }
      getData()
    }
  })
</script>

<style lang="scss" scoped>
  .audit-log-page {
    padding-bottom: 15px;
  }

  .empty-project-card {
    height: calc(100vh - 200px);
    display: flex;
    align-items: center;
    justify-content: center;

    .empty-description {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      p {
        margin: 0;
        font-size: 15px;
        color: #606266;

        &.empty-hint {
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
