<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="绑定业务项目"
    width="900px"
    :close-on-click-modal="false"
    @open="handleDialogOpen"
  >
    <div class="bind-project-dialog">
      <ElAlert title="绑定说明" type="info" :closable="false" style="margin-bottom: 20px">
        <template #default>
          将镜像仓库项目绑定到业务项目后，该业务项目成员可以访问此镜像仓库项目
        </template>
      </ElAlert>

      <div class="project-info">
        <div class="info-label">镜像仓库项目:</div>
        <div class="info-value">{{ registryProject?.name || '-' }}</div>
      </div>

      <!-- 添加绑定表单 -->
      <ElForm :model="addForm" :rules="addRules" ref="addFormRef" inline class="add-binding-form">
        <ElFormItem label="业务项目" prop="appProjectId" style="flex: 1">
          <ElSelect
            v-model="addForm.appProjectId"
            placeholder="请选择或搜索业务项目"
            filterable
            remote
            clearable
            :remote-method="handleSearchProjects"
            :loading="loadingProjects"
            style="width: 100%"
            @focus="handleProjectSelectFocus"
          >
            <ElOption
              v-for="project in availableProjects"
              :key="project.id"
              :label="`${project.name} (${project.uuid})`"
              :value="project.id"
              :disabled="isProjectBound(project.id)"
            >
              <div class="project-option">
                <FolderGit2 :size="16" />
                <span class="project-name">{{ project.name }}</span>
                <span class="project-uuid">({{ project.uuid }})</span>
                <ElTag v-if="isProjectBound(project.id)" type="info" size="small">已绑定</ElTag>
              </div>
            </ElOption>

            <template #loading>
              <div class="select-loading">加载中...</div>
            </template>
          </ElSelect>
        </ElFormItem>

        <ElFormItem style="margin-right: 0">
          <ElButton type="primary" :icon="Link" @click="handleAddBinding" :loading="binding">
            绑定
          </ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 已绑定的业务项目列表 -->
      <div class="bindings-list">
        <div class="section-title">
          <FolderGit2 :size="16" />
          已绑定的业务项目 ({{ bindings.length }})
        </div>

        <ElTable :data="paginatedBindings" style="width: 100%" v-loading="loading">
          <ElTableColumn label="业务项目" min-width="200">
            <template #default="{ row }">
              <div class="project-cell">
                <FolderGit2 :size="20" />
                <div class="project-info">
                  <span class="project-name">{{ getProjectName(row.appProjectId) }}</span>
                  <span class="project-id">ID: {{ row.appProjectId }}</span>
                </div>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="绑定时间" width="180">
            <template #default="{ row }">
              {{ row.createdAt ? formatDateTime(row.createdAt) : '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <ElButton type="danger" size="small" :icon="Trash2" @click="handleUnbind(row)" text>
                解绑
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty v-if="bindings.length === 0 && !loading" description="暂无绑定的业务项目" />
      </div>

      <!-- 分页 -->
      <div v-if="bindings.length > pageSize" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="bindings.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { FolderGit2, Link, Trash2 } from 'lucide-vue-next'
  import {
    bindRegistryProjectApi,
    unbindRegistryProjectApi,
    listProjectRegistryBindingsApi,
    getRegistryByUuidApi,
    type RegistryProject,
    type RegistryProjectBinding
  } from '@/api'
  import { searchProjectApi, type Project } from '@/api'

  interface Props {
    modelValue: boolean
    registryUuid: string
    clusterUuid?: string
    registryProject?: RegistryProject
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 加载状态
  const loading = ref(false)
  const loadingProjects = ref(false)
  const binding = ref(false)

  // 仓库 ID（通过 UUID 获取）
  const registryId = ref<number>(0)

  // 分页
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 业务项目列表
  const availableProjects = ref<Project[]>([])
  const allProjects = ref<Project[]>([]) // 缓存所有加载的项目
  const projectSearchQuery = ref('')

  // 已绑定的业务项目
  const bindings = ref<RegistryProjectBinding[]>([])

  // 添加绑定表单
  const addFormRef = ref<FormInstance>()
  const addForm = reactive({
    appProjectId: undefined as number | undefined
  })

  const addRules: FormRules = {
    appProjectId: [{ required: true, message: '请选择业务项目', trigger: 'change' }]
  }

  // 分页后的绑定列表
  const paginatedBindings = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return bindings.value.slice(start, end)
  })

  // 检查项目是否已绑定
  const isProjectBound = (projectId: number) => {
    return bindings.value.some((b) => b.appProjectId === projectId)
  }

  // 获取项目名称
  const getProjectName = (projectId: number) => {
    const project = allProjects.value.find((p) => p.id === projectId)
    return project?.name || `项目ID: ${projectId}`
  }

  // 获取仓库 ID
  const fetchRegistryId = async () => {
    try {
      const response = await getRegistryByUuidApi(props.registryUuid)
      if (response?.data?.id) {
        registryId.value = response.data.id
      }
    } catch (error) {
      console.error('获取仓库信息失败:', error)
    }
  }

  // 获取业务项目列表
  const fetchAvailableProjects = async (query: string = '') => {
    loadingProjects.value = true
    try {
      const response = await searchProjectApi({
        page: 1,
        pageSize: 50,
        name: query || undefined
      })

      // 处理 null 返回值
      const newProjects = response?.items || []
      availableProjects.value = newProjects

      // 更新缓存
      const allIds = new Set(allProjects.value.map((p) => p.id))
      newProjects.forEach((p) => {
        if (!allIds.has(p.id)) {
          allProjects.value.push(p)
        }
      })

      projectSearchQuery.value = query
    } catch (error) {
      console.error('获取业务项目列表失败:', error)
      availableProjects.value = []
    } finally {
      loadingProjects.value = false
    }
  }

  // 获取已绑定的业务项目列表
  const fetchBindings = async () => {
    if (!props.registryProject || !registryId.value) {
      console.warn('缺少必要参数，跳过获取绑定列表')
      return
    }

    loading.value = true
    try {
      const response = await listProjectRegistryBindingsApi({
        registryId: registryId.value,
        registryProjectName: props.registryProject.name
      })

      // ✅ 处理新的返回结构：BindProjectIds[]
      const bindData = response?.data || []

      // 转换为前端需要的格式
      bindings.value = bindData.map((item) => ({
        id: item.id, // ✅ 真实的绑定记录ID
        registryId: registryId.value,
        appProjectId: item.projectId, // ✅ 业务项目ID
        registryProjectName: props.registryProject!.name,
        registryProjectId: props.registryProject!.projectId?.toString() || '',
        createdAt: 0,
        updatedAt: 0
      }))

      // 批量加载绑定项目的详细信息
      const projectIds = bindData.map((item) => item.projectId)
      if (projectIds.length > 0) {
        await fetchProjectDetails(projectIds)
      }
    } catch (error: any) {
      console.error('获取绑定列表失败:', error)
      // 如果是空数据或404，不显示错误提示
      if (error?.response?.status !== 404) {
      }
      bindings.value = []
    } finally {
      loading.value = false
    }
  }

  // 批量加载项目详情
  const fetchProjectDetails = async (projectIds: number[]) => {
    if (!projectIds || projectIds.length === 0) return

    try {
      // 过滤出还未加载的项目 ID
      const newProjectIds = projectIds.filter((id) => !allProjects.value.find((p) => p.id === id))

      if (newProjectIds.length === 0) return

      // 加载更多项目（扩大查询范围）
      const response = await searchProjectApi({
        page: 1,
        pageSize: 100
      })

      const projects = response?.items || []

      // 更新缓存
      projects.forEach((p) => {
        if (!allProjects.value.find((existing) => existing.id === p.id)) {
          allProjects.value.push(p)
        }
      })
    } catch (error) {
      console.error('加载项目详情失败:', error)
    }
  }

  // 搜索业务项目（远程搜索）
  const handleSearchProjects = (query: string) => {
    if (query !== projectSearchQuery.value) {
      fetchAvailableProjects(query)
    }
  }

  // 下拉框获得焦点时加载初始数据
  const handleProjectSelectFocus = () => {
    if (availableProjects.value.length === 0) {
      fetchAvailableProjects('')
    }
  }

  // 添加绑定
  const handleAddBinding = async () => {
    if (!addFormRef.value) {
      return
    }

    if (!props.registryProject) {
      return
    }

    if (!registryId.value) {
      return
    }

    try {
      const valid = await addFormRef.value.validate()

      if (valid && addForm.appProjectId) {
        // 检查是否已绑定
        if (isProjectBound(addForm.appProjectId)) {
          return
        }

        binding.value = true

        await bindRegistryProjectApi({
          registryId: registryId.value,
          appProjectId: addForm.appProjectId,
          registryProjectName: props.registryProject.name,
          registryProjectId: props.registryProject.projectId?.toString() || ''
        })

        ElMessage.success('绑定成功')

        // 重置表单
        addForm.appProjectId = undefined
        addFormRef.value.resetFields()

        // 刷新绑定列表
        await fetchBindings()
        emit('success')
      }
    } catch (error: any) {
      console.error('绑定失败:', error)
    } finally {
      binding.value = false
    }
  }

  // 解绑
  const handleUnbind = async (binding: RegistryProjectBinding) => {
    try {
      await ElMessageBox.confirm(
        `确定要解绑业务项目 "${getProjectName(binding.appProjectId)}" 吗？`,
        '确认解绑',
        {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }
      )

      // ✅ 直接使用绑定记录ID删除（现在有真实的ID了）
      await unbindRegistryProjectApi(binding.id)

      ElMessage.success('解绑成功')

      // 刷新绑定列表
      await fetchBindings()
      emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('解绑失败:', error)
      }
    }
  }

  // 分页
  const handleSizeChange = () => {
    currentPage.value = 1
  }

  const handlePageChange = () => {
    // 当前页变化
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return '-'
    try {
      return new Date(timestamp * 1000).toLocaleString('zh-CN')
    } catch (error) {
      return '-'
    }
  }

  // 关闭对话框
  const handleClose = () => {
    emit('update:modelValue', false)
  }

  // 对话框打开时的处理
  const handleDialogOpen = async () => {
    // 重置状态
    currentPage.value = 1
    availableProjects.value = []
    bindings.value = []

    // 获取仓库 ID（绑定时需要）
    if (!registryId.value) {
      await fetchRegistryId()
    }

    // 并行加载数据
    await Promise.all([fetchAvailableProjects(''), fetchBindings()])
  }

  // 监听对话框打开（兼容旧的方式）
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && !registryId.value) {
        handleDialogOpen()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .bind-project-dialog {
    .project-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      margin-bottom: 20px;
      border-radius: 4px;
      background: var(--el-fill-color-light);

      .info-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }

      .info-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        font-family: 'Monaco', 'Consolas', monospace;
      }
    }

    .add-binding-form {
      padding: 20px;
      background: var(--el-fill-color-light);
      border-radius: 8px;
      margin-bottom: 20px;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }

      .project-option {
        display: flex;
        align-items: center;
        gap: 8px;

        .project-name {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .project-uuid {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .select-loading {
        padding: 8px;
        text-align: center;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }
    }

    .bindings-list {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 16px;
      }

      .project-cell {
        display: flex;
        align-items: center;
        gap: 12px;

        .project-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .project-name {
            font-weight: 500;
            font-size: 14px;
            color: var(--el-text-color-primary);
          }

          .project-id {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            font-family: 'Monaco', 'Consolas', monospace;
          }
        }
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
</style>
