<template>
  <div class="project-page art-full-height">
    <!-- 搜索栏 -->
    <ProjectSearch
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
        :showZebra="false"
        :showBorder="true"
        :showHeaderBackground="true"
        :fullClass="'art-page-view'"
        :layout="'search,refresh,size,fullscreen,columns,settings'"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="handleAddProject" :disabled="submitLoading">
              <ArtSvgIcon icon="ri:add-line" class="mr-1" />
              新建项目
            </ElButton>

            <ElButton
              type="success"
              @click="handleSyncAllData"
              :loading="syncAllLoading"
              :disabled="submitLoading || syncAllLoading"
            >
              <ArtSvgIcon v-if="!syncAllLoading" icon="ri:refresh-line" class="mr-1" />
              {{ syncAllLoading ? '同步中...' : '同步全部数据' }}
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
        :stripe="false"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 项目弹窗 -->
    <ProjectDialog
      v-model:visible="dialogVisible"
      :editData="editData"
      :submitLoading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 成员分配弹窗 -->
    <MemberDialog
      v-model:visible="memberDialogVisible"
      :projectId="currentProjectId"
      :submitLoading="memberSubmitLoading"
      @submit="handleMemberSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useRouter } from 'vue-router'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ProjectSearch from './modules/project-search.vue'
  import ProjectDialog from './modules/project-dialog.vue'
  import MemberDialog from './modules/member-dialog.vue'
  import { useProjectTableConfig } from './modules/table-config'
  import {
    addProjectApi,
    updateProjectApi,
    deleteProjectApi,
    searchProjectApi,
    addProjectAdminApi,
    syncAllProjectsApi
  } from '@/api'

  defineOptions({ name: 'ProjectManagement' })

  const router = useRouter()

  // 使用抽离的表格配置逻辑
  const { loading, showSearchBar, deleteLoadingMap, submitLoading, createTableColumns } =
    useProjectTableConfig()

  // 弹窗相关
  const dialogVisible = ref(false)
  const memberDialogVisible = ref(false)
  const editData = ref<any>(null)
  const currentProjectId = ref<number>(0)
  const memberSubmitLoading = ref(false)
  const syncAllLoading = ref(false)

  // 表格数据
  const data = ref<any[]>([])

  // 搜索表单
  const searchForm = ref({
    name: undefined,
    uuid: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 10,
    total: 0
  })

  // 查看详情
  const handleViewDetail = (row: any) => {
    router.push({
      name: 'ProjectDetail',
      params: { id: row.id }
    })
  }

  // 分配成员
  const handleAssignMember = (row: any) => {
    if (memberSubmitLoading.value) return
    currentProjectId.value = row.id
    memberDialogVisible.value = true
  }

  // 编辑项目
  const handleEditProject = (row: any) => {
    // 🔥 新增：检查是否为系统项目
    if (row.isSystem === 1) {
      ElMessage.warning('系统项目不允许编辑')
      return
    }

    if (submitLoading.value) return
    editData.value = row
    dialogVisible.value = true
  }

  // 删除项目
  const handleDeleteProject = async (id: number) => {
    if (submitLoading.value) return

    // 🔥 新增：查找项目并检查是否为系统项目
    const project = data.value.find((item) => item.id === id)
    if (project && project.isSystem === 1) {
      ElMessage.warning('系统项目不允许删除')
      return
    }

    try {
      await ElMessageBox.confirm(
        '确定要删除该项目吗？删除后相关的资源配置也会被清除。',
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[id] = true
      await deleteProjectApi(id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoadingMap.value[id] = false
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleAssignMember,
    handleViewDetail,
    handleEditProject,
    handleDeleteProject
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

      const response = await searchProjectApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
      console.error('获取项目数据失败:', error)
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

  // 新建项目
  const handleAddProject = () => {
    if (submitLoading.value) return
    editData.value = null
    dialogVisible.value = true
  }

  // 提交表单
  const handleSubmit = async (formData: any) => {
    submitLoading.value = true
    try {
      if (formData.id) {
        // 🔥 新增：编辑时再次检查是否为系统项目
        const project = data.value.find((item) => item.id === formData.id)
        if (project && project.isSystem === 1) {
          ElMessage.warning('系统项目不允许编辑')
          return
        }

        await updateProjectApi(formData.id, formData)
        ElMessage.success('更新成功')
      } else {
        await addProjectApi(formData)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      refreshData()
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitLoading.value = false
    }
  }

  // 成员分配提交
  const handleMemberSubmit = async (userIds: number[]) => {
    memberSubmitLoading.value = true
    try {
      await addProjectAdminApi({
        projectId: currentProjectId.value,
        userIds
      })
      ElMessage.success('成员分配成功')
      memberDialogVisible.value = false
      refreshData()
    } catch (error: any) {
      console.error('分配成员失败:', error)
    } finally {
      memberSubmitLoading.value = false
    }
  }

  // 同步全部数据
  const handleSyncAllData = async () => {
    try {
      await ElMessageBox.confirm(
        '确定要同步全部项目集群数据吗？此操作会同步所有项目的集群配置信息，可能需要一些时间完成。',
        '同步确认',
        {
          confirmButtonText: '确定同步',
          cancelButtonText: '取消',
          type: 'info'
        }
      )

      syncAllLoading.value = true
      await syncAllProjectsApi()
      ElMessage.success('同步全部数据成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('同步全部数据失败:', error)
      }
    } finally {
      syncAllLoading.value = false
    }
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .project-page {
    padding-bottom: 15px;

    :deep(.el-tag) {
      border-radius: 4px;
    }

    :deep(.table-operation-buttons) {
      display: flex;
      align-items: center;

      .el-button {
        padding: 5px 10px;
      }
    }
  }
</style>