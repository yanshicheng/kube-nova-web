<template>
  <div class="registry-projects-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <ElButton :icon="ArrowLeft" @click="handleBack" circle size="large" />
        <div class="header-info">
          <h1 class="page-title">
            <FolderGit2 :size="28" />
            项目管理
          </h1>
          <p class="page-description">{{ registryName || '加载中...' }}</p>
        </div>
      </div>
      <div class="header-actions">
        <ElButton type="primary" :icon="Plus" @click="handleCreateProject">创建项目</ElButton>
      </div>
    </div>

    <!-- Tabs 导航 -->
    <ElCard class="tabs-card" shadow="never">
      <ElTabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 项目详情 -->
        <ElTabPane name="details" lazy>
          <template #label>
            <div class="tab-label">
              <Info :size="16" />
              项目详情
            </div>
          </template>
          <ProjectDetails v-if="activeTab === 'details'" :registry-uuid="registryUuid" />
        </ElTabPane>

        <!-- 项目管理 -->
        <ElTabPane name="management" lazy>
          <template #label>
            <div class="tab-label">
              <FolderTree :size="16" />
              项目管理
            </div>
          </template>
          <ProjectManagement
            v-if="activeTab === 'management'"
            :registry-uuid="registryUuid"
            :registry-url="registryUrl"
            :registry-name="registryName"
            @assign-users="handleAssignUsers"
          />
        </ElTabPane>

        <!-- 用户管理 -->
        <ElTabPane name="users" lazy>
          <template #label>
            <div class="tab-label">
              <Users :size="16" />
              用户管理
            </div>
          </template>
          <UserManagement v-if="activeTab === 'users'" :registry-uuid="registryUuid" />
        </ElTabPane>

        <!-- GC 管理 -->
        <ElTabPane name="gc" lazy>
          <template #label>
            <div class="tab-label">
              <Trash2 :size="16" />
              垃圾回收
            </div>
          </template>
          <GCManagement v-if="activeTab === 'gc'" :registry-uuid="registryUuid" />
        </ElTabPane>

        <!-- 保留策略 -->
        <ElTabPane name="retention" lazy>
          <template #label>
            <div class="tab-label">
              <Archive :size="16" />
              保留策略
            </div>
          </template>
          <RetentionPolicy v-if="activeTab === 'retention'" :registry-uuid="registryUuid" />
        </ElTabPane>

        <!-- 复制策略 -->
        <ElTabPane name="replication" lazy>
          <template #label>
            <div class="tab-label">
              <Copy :size="16" />
              复制策略
            </div>
          </template>
          <ReplicationPolicy v-if="activeTab === 'replication'" :registry-uuid="registryUuid" />
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <!-- 创建项目对话框 -->
    <ElDialog
      v-model="createDialogVisible"
      title="创建项目"
      width="600px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="createFormRef"
        :model="createFormData"
        :rules="createFormRules"
        label-width="120px"
      >
        <ElFormItem label="项目名称" prop="projectName">
          <ElInput
            v-model="createFormData.projectName"
            placeholder="请输入项目名称（只能包含小写字母、数字、中划线、下划线和点）"
          />
          <div class="form-tip">项目名称创建后不可修改</div>
        </ElFormItem>

        <ElFormItem label="是否公开">
          <ElSwitch v-model="createFormData.isPublic" active-text="公开" inactive-text="私有" />
          <span class="form-tip">公开项目所有人都可以访问</span>
        </ElFormItem>

        <ElFormItem label="存储限额">
          <div class="storage-limit-input">
            <ElInputNumber
              v-model="createFormData.storageLimit"
              :min="-1"
              :step="1"
              placeholder="-1表示无限制"
              style="width: 200px"
            />
            <ElSelect v-model="createFormData.storageUnit" style="width: 100px">
              <ElOption label="B" value="B" />
              <ElOption label="KB" value="KB" />
              <ElOption label="MB" value="MB" />
              <ElOption label="GB" value="GB" />
              <ElOption label="TB" value="TB" />
            </ElSelect>
          </div>
          <div class="form-tip">-1 表示无限制</div>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitCreate" :loading="creating"> 创建 </ElButton>
      </template>
    </ElDialog>

    <!-- 分配用户对话框 -->
    <AssignUsersDialog
      v-model="assignDialogVisible"
      :registry-uuid="registryUuid"
      :project-name="currentProject?.name || ''"
      @refresh="handleAssignSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, TabsPaneContext } from 'element-plus'
import { ArrowLeft, FolderGit2, Plus, Info, FolderTree, Users, Trash2, Archive, Copy } from 'lucide-vue-next'
import ProjectDetails from './components/ProjectDetails.vue'
import ProjectManagement from './components/ProjectManagement.vue'
import UserManagement from './components/UserManagement.vue'
import GCManagement from './components/GCManagement.vue'
import RetentionPolicy from './components/RetentionPolicy.vue'
import ReplicationPolicy from './components/ReplicationPolicy.vue'
import AssignUsersDialog from './components/AssignUsersDialog.vue'
import { createProjectApi, type RegistryProject } from '@/api'

const router = useRouter()
const route = useRoute()

// 从路由获取参数
const registryUuid = computed(() => route.params.registryUuid as string)
const registryUrl = computed(() => (route.query.registryUrl as string) || '')
const registryName = computed(() => (route.query.registryName as string) || '')

// 当前激活的Tab
const activeTab = ref('details')

// 创建项目对话框
const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const creating = ref(false)

const createFormData = reactive({
  projectName: '',
  isPublic: false,
  storageLimit: -1,
  storageUnit: 'GB'
})

const createFormRules: FormRules = {
  projectName: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    {
      pattern: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
      message: '只能包含小写字母、数字、中划线、下划线和点',
      trigger: 'blur'
    }
  ]
}

// 分配用户
const assignDialogVisible = ref(false)
const currentProject = ref<RegistryProject>()

// 返回
const handleBack = () => {
  router.push({ name: 'ClusterRepositories' })
}

// Tab切换 - 数据懒加载，只有点击时才加载数据
const handleTabClick = (tab: TabsPaneContext) => {
}

// 创建项目
const handleCreateProject = () => {
  Object.assign(createFormData, {
    projectName: '',
    isPublic: false,
    storageLimit: -1,
    storageUnit: 'GB'
  })
  createDialogVisible.value = true
}

// 提交创建
const handleSubmitCreate = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()

    creating.value = true
    await createProjectApi({
      registryUuid: registryUuid.value,
      projectName: createFormData.projectName,
      isPublic: createFormData.isPublic,
      storageLimit: createFormData.storageLimit === -1 ? undefined : createFormData.storageLimit,
      storageUnit: createFormData.storageUnit
    })

    ElMessage.success('创建成功')
    createDialogVisible.value = false

    // 刷新项目管理页面
    if (activeTab.value === 'management') {
      window.dispatchEvent(new CustomEvent('refresh-projects'))
    }
  } catch (error: any) {
    console.error('创建项目失败:', error)
  } finally {
    creating.value = false
  }
}

// 分配用户
const handleAssignUsers = (project: RegistryProject) => {
  currentProject.value = project
  assignDialogVisible.value = true
}

// 分配成功
const handleAssignSuccess = () => {
  ElMessage.success('操作成功')
  window.dispatchEvent(new CustomEvent('refresh-projects'))
}

// 初始化
onMounted(() => {
  // 验证路由参数
  if (!registryUrl.value) {
    console.error('Missing registryUrl in route query:', route.query)
  }

  if (!registryName.value) {
    console.warn('Missing registryName in route query:', route.query)
  }
})
</script>

<style lang="scss" scoped>
.registry-projects-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      gap: 16px;
      align-items: flex-start;

      .header-info {
        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 8px 0;
        }

        .page-description {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin: 0;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .tabs-card {
    :deep(.el-card__body) {
      padding: 0;
    }

    :deep(.el-tabs__header) {
      padding: 0 20px;
      margin: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-tabs__content) {
      padding: 20px;
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
  }

  .form-tip {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .storage-limit-input {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}
</style>