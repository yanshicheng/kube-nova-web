<template>
  <div class="alert-group-page art-full-height">
    <!-- 搜索栏 -->
    <GroupSearch
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
            <ElButton type="primary" :icon="Plus" @click="handleAdd"> 新增告警组 </ElButton>
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

    <!-- 新增对话框 -->
    <group-form-dialog v-model="dialogVisible" @success="refreshData" />

    <!-- 编辑对话框 -->
    <group-edit-dialog
      v-model="editDialogVisible"
      :group-id="currentGroupId"
      @success="refreshData"
    />

    <!-- 成员管理对话框 -->
    <member-manage-dialog
      v-model="memberDialogVisible"
      :group-id="currentGroupId"
      @success="refreshData"
    />

    <!-- 渠道管理对话框 -->
    <channel-manage-dialog
      v-model="channelDialogVisible"
      :group-id="currentGroupId"
      @success="refreshData"
    />

    <!-- 项目绑定对话框 -->
    <project-bind-dialog
      v-model="projectBindDialogVisible"
      :group-id="currentGroupId"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import { searchAlertGroupsApi, deleteAlertGroupsApi, type AlertGroups } from '@/api/portal/alert'
  import GroupSearch from './modules/group-search.vue'
  import GroupFormDialog from './components/GroupFormDialog.vue'
  import GroupEditDialog from './components/GroupEditDialog.vue'
  import MemberManageDialog from './components/MemberManageDialog.vue'
  import ChannelManageDialog from './components/ChannelManageDialog.vue'
  import ProjectBindDialog from './components/ProjectBindDialog.vue'
  import { useGroupTableConfig } from './modules/table-config'

  defineOptions({ name: 'AlertGroup' })

  // 使用表格配置逻辑
  const { loading, showSearchBar, createTableColumns } = useGroupTableConfig()

  // 弹窗相关
  const dialogVisible = ref(false)
  const editDialogVisible = ref(false)
  const memberDialogVisible = ref(false)
  const channelDialogVisible = ref(false)
  const projectBindDialogVisible = ref(false)
  const currentGroupId = ref<number>()

  // 表格数据
  const data = ref<AlertGroups[]>([])

  // 搜索表单
  const searchForm = ref({
    groupName: undefined,
    groupType: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 处理编辑
  const handleEditGroup = (row: AlertGroups) => {
    currentGroupId.value = row.id
    editDialogVisible.value = true
  }

  // 处理删除
  const handleDelete = async (row: AlertGroups) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除告警组"${row.groupName}"吗？删除后将无法恢复。`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消'
        }
      )
      await deleteAlertGroupsApi(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  // 管理成员
  const handleManageMembers = (row: AlertGroups) => {
    currentGroupId.value = row.id
    memberDialogVisible.value = true
  }

  // 管理渠道
  const handleManageChannels = (row: AlertGroups) => {
    currentGroupId.value = row.id
    channelDialogVisible.value = true
  }

  // 绑定项目
  const handleBindProject = (row: AlertGroups) => {
    currentGroupId.value = row.id
    projectBindDialogVisible.value = true
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleEdit: handleEditGroup,
    handleDelete,
    handleManageMembers,
    handleManageChannels,
    handleBindProject
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

      const response = await searchAlertGroupsApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
      console.error('获取告警组列表失败:', error)
      ElMessage.error('查询失败')
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

  // 新增
  const handleAdd = () => {
    dialogVisible.value = true
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .alert-group-page {
    padding-bottom: 15px;
  }
</style>
