<template>
  <div class="project-management">
    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElInput
          v-model="searchParams.search"
          placeholder="搜索项目名称..."
          :prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 300px"
        />

        <ElSelect
          v-model="searchParams.isPublic"
          placeholder="访问权限"
          clearable
          style="width: 150px"
          @change="handleSearch"
        >
          <ElOption label="公开" :value="true" />
          <ElOption label="私有" :value="false" />
        </ElSelect>
      </div>

      <div class="toolbar-right">
        <ElButton :icon="RefreshCw" @click="fetchProjects">刷新</ElButton>
      </div>
    </div>

    <!-- 项目列表 -->
    <ElCard shadow="never" class="table-card" v-loading="loading">
      <ElTable :data="projects" style="width: 100%" @sort-change="handleSortChange">
        <ElTableColumn label="项目名称" min-width="200" sortable="custom" prop="name">
          <template #default="{ row }">
            <div class="project-name-cell" @click="handleViewProject(row)">
              <div class="project-icon">
                <FolderGit2 :size="20" />
              </div>
              <div class="project-info">
                <span class="project-name">{{ row.name }}</span>
                <span class="project-id">ID: {{ row.projectId }}</span>
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="访问权限" width="120">
          <template #default="{ row }">
            <ElTag :type="row.isPublic ? 'success' : 'warning'" size="small">
              <div class="tag-content">
                <Globe v-if="row.isPublic" :size="12" />
                <Lock v-else :size="12" />
                {{ row.isPublic ? '公开' : '私有' }}
              </div>
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="已用配额" width="120" sortable="custom" prop="storageUsed">
          <template #default="{ row }">
            <div class="storage-cell">
              <span class="storage-value">{{ row.storageUsedDisplay || '0B' }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="配额限制" width="120" sortable="custom" prop="storageLimit">
          <template #default="{ row }">
            <div class="storage-cell">
              <span class="storage-value">{{ row.storageLimitDisplay || '未知' }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="拥有者" width="150">
          <template #default="{ row }">
            <div class="owner-cell">
              <UserCircle2 :size="14" />
              <span>{{ row.ownerName || '-' }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="仓库数量" width="120" sortable="custom" prop="repoCount">
          <template #default="{ row }">
            <div class="count-cell">
              <Package :size="14" />
              <span>{{ row.repoCount }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="创建时间" width="180" sortable="custom" prop="creationTime">
          <template #default="{ row }">
            {{ formatDateTime(row.creationTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="更新时间" width="180" sortable="custom" prop="updateTime">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <ElSpace :size="4">
              <ElButton
                v-if="!row.isPublic"
                type="success"
                size="small"
                :icon="Link"
                @click="handleBindProject(row)"
              >
                绑定项目
              </ElButton>
              <ElButton type="primary" size="small" :icon="Users" @click="handleAssignUsers(row)">
                分配用户
              </ElButton>
              <ElButton size="small" :icon="FolderOpen" @click="handleViewProject(row)">
                查看
              </ElButton>
              <ElDropdown @command="handleCommand(row, $event)">
                <ElButton size="small" :icon="MoreVertical" circle />
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="edit" :icon="Edit">编辑</ElDropdownItem>
                    <ElDropdownItem command="quota" :icon="HardDrive">配额管理</ElDropdownItem>
                    <ElDropdownItem command="delete" :icon="Trash2" divided>删除</ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div v-if="projects.length > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </ElCard>

    <!-- 编辑项目对话框 -->
    <ElDialog
      v-model="editDialogVisible"
      title="编辑项目"
      width="600px"
      :close-on-click-modal="false"
    >
      <ElForm ref="editFormRef" :model="editFormData" :rules="editFormRules" label-width="120px">
        <ElFormItem label="项目名称">
          <ElInput v-model="editFormData.name" disabled />
        </ElFormItem>

        <ElFormItem label="是否公开">
          <ElSwitch v-model="editFormData.isPublic" active-text="公开" inactive-text="私有" />
        </ElFormItem>

        <ElFormItem label="存储限额">
          <ElInputNumber
            v-model="editFormData.storageLimit"
            :min="-1"
            :step="1024"
            placeholder="-1表示无限制"
            style="width: 100%"
          />
          <span class="form-tip">单位：MB，-1表示无限制</span>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="editDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitEdit" :loading="editing">保存</ElButton>
      </template>
    </ElDialog>

    <!-- 配额管理对话框 -->
    <QuotaManagementDialog
      v-model="quotaDialogVisible"
      :registry-uuid="registryUuid"
      :project="currentProject"
      @success="handleQuotaSuccess"
    />

    <!-- 绑定业务项目对话框 -->
    <BindProjectDialog
      v-model="bindProjectDialogVisible"
      :registry-uuid="registryUuid"
      :cluster-uuid="clusterUuid"
      :registry-project="currentProject"
      @success="handleBindSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Search,
    RefreshCw,
    FolderGit2,
    Globe,
    Lock,
    UserCircle2,
    Package,
    Users,
    FolderOpen,
    MoreVertical,
    Edit,
    HardDrive,
    Trash2,
    Link
  } from 'lucide-vue-next'
  import QuotaManagementDialog from './QuotaManagementDialog.vue'
  import BindProjectDialog from './BindProjectDialog.vue'
  import {
    listRegistryProjectsApi,
    updateRegistryProjectApi,
    deleteRegistryProjectApi,
    type RegistryProject
  } from '@/api'

  interface Props {
    registryUuid: string
    registryUrl: string
    registryName: string
  }

  interface Emits {
    (e: 'assign-users', project: RegistryProject): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const router = useRouter()
  const route = useRoute()

  const loading = ref(false)
  const projects = ref<RegistryProject[]>([])
  const total = ref(0)

  const clusterUuid = computed(() => (route.query.clusterUuid as string) || '')

  // 搜索参数
  const searchParams = reactive({
    page: 1,
    pageSize: 10,
    search: '',
    isPublic: undefined as boolean | undefined,
    sortBy: 'updateTime',
    sortDesc: true
  })

  // 编辑对话框
  const editDialogVisible = ref(false)
  const editFormRef = ref<FormInstance>()
  const editing = ref(false)

  const editFormData = reactive({
    name: '',
    isPublic: false,
    storageLimit: -1
  })

  const editFormRules: FormRules = {}

  // 配额管理
  const quotaDialogVisible = ref(false)
  const currentProject = ref<RegistryProject>()

  // 绑定业务项目
  const bindProjectDialogVisible = ref(false)

  // 获取项目列表
  const fetchProjects = async () => {
    loading.value = true
    try {
      const params: any = {
        registryUuid: props.registryUuid,
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        sortBy: searchParams.sortBy,
        sortDesc: searchParams.sortDesc
      }

      if (searchParams.search) {
        params.search = searchParams.search
      }

      if (searchParams.isPublic !== undefined) {
        params.isPublic = searchParams.isPublic
      }

      const response = await listRegistryProjectsApi(params)
      projects.value = response.items || []
      total.value = response.total || 0
    } catch (error) {
      console.error('获取项目列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = () => {
    searchParams.page = 1
    fetchProjects()
  }

  // 排序
  const handleSortChange = ({ prop, order }: any) => {
    if (prop) {
      searchParams.sortBy = prop
      searchParams.sortDesc = order === 'descending'
      fetchProjects()
    }
  }

  // 分页
  const handleSizeChange = () => {
    searchParams.page = 1
    fetchProjects()
  }

  const handlePageChange = () => {
    fetchProjects()
  }

  // 查看项目 - 跳转到制品管理页面，传递 registryUrl 和 registryName
  const handleViewProject = (project: RegistryProject) => {

    // 验证必需参数
    if (!props.registryUrl) {
      return
    }

    router.push({
      name: 'RegistryArtifacts',
      params: {
        registryUuid: props.registryUuid,
        projectName: project.name
      },
      query: {
        registryUrl: props.registryUrl,
        registryName: props.registryName
      }
    })
  }

  // 分配用户
  const handleAssignUsers = (project: RegistryProject) => {
    emit('assign-users', project)
  }

  // 绑定业务项目
  const handleBindProject = (project: RegistryProject) => {
    // if (!clusterUuid.value) {
    //   return
    // }
    currentProject.value = project
    bindProjectDialogVisible.value = true
  }

  // 绑定成功
  const handleBindSuccess = () => {
    ElMessage.success('绑定成功')
    fetchProjects()
  }

  // 编辑项目
  const handleEdit = (project: RegistryProject) => {
    Object.assign(editFormData, {
      name: project.name,
      isPublic: project.isPublic,
      storageLimit: -1
    })
    currentProject.value = project
    editDialogVisible.value = true
  }

  // 提交编辑
  const handleSubmitEdit = async () => {
    if (!editFormRef.value || !currentProject.value) return

    try {
      await editFormRef.value.validate()

      editing.value = true
      await updateRegistryProjectApi(currentProject.value.name, {
        registryUuid: props.registryUuid,
        isPublic: editFormData.isPublic,
        storageLimit: editFormData.storageLimit === -1 ? undefined : editFormData.storageLimit
      })

      ElMessage.success('保存成功')
      editDialogVisible.value = false
      fetchProjects()
    } catch (error: any) {
      console.error('保存失败:', error)
    } finally {
      editing.value = false
    }
  }

  // 配额管理
  const handleQuota = (project: RegistryProject) => {
    currentProject.value = project
    quotaDialogVisible.value = true
  }

  // 配额成功
  const handleQuotaSuccess = () => {
    ElMessage.success('配额更新成功')
    fetchProjects()
  }

  // 删除项目
  const handleDelete = async (project: RegistryProject) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除项目 "${project.name}" 吗？此操作将删除该项目下的所有镜像，且不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await deleteRegistryProjectApi(project.name, props.registryUuid)
      ElMessage.success('删除成功')
      fetchProjects()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除项目失败:', error)
      }
    }
  }

  // 处理命令
  const handleCommand = (project: RegistryProject, command: string) => {
    switch (command) {
      case 'edit':
        handleEdit(project)
        break
      case 'quota':
        handleQuota(project)
        break
      case 'delete':
        handleDelete(project)
        break
    }
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 监听刷新事件
  onMounted(() => {
    fetchProjects()

    window.addEventListener('refresh-projects', fetchProjects)
    return () => {
      window.removeEventListener('refresh-projects', fetchProjects)
    }
  })
</script>

<style lang="scss" scoped>
  .project-management {
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        display: flex;
        gap: 12px;
      }

      .toolbar-right {
        display: flex;
        gap: 12px;
      }
    }

    .table-card {
      .project-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;

        .project-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .project-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;

          .project-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-color-primary);
            transition: color 0.3s;

            &:hover {
              color: var(--el-color-primary-light-3);
            }
          }

          .project-id {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            font-family: 'Monaco', 'Consolas', monospace;
          }
        }
      }

      .tag-content {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .storage-cell {
        .storage-value {
          font-size: 13px;
          color: var(--el-text-color-primary);
          font-weight: 500;
        }
      }

      .owner-cell,
      .count-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }

      .pagination-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }

    .form-tip {
      margin-left: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
