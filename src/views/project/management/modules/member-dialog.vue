<template>
  <ElDialog
    title="分配项目成员"
    :model-value="visible"
    @update:model-value="handleCancel"
    width="900px"
    align-center
    class="member-dialog"
    @closed="handleClosed"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <!-- 搜索栏 -->
    <div class="search-bar mb-4">
      <ElInput
        v-model="searchKeyword"
        placeholder="搜索用户名、昵称、邮箱"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
        :disabled="submitLoading"
      >
        <template #prefix>
          <ElIcon>
            <Search />
          </ElIcon>
        </template>
        <template #append>
          <ElButton @click="handleSearch" :disabled="submitLoading">搜索</ElButton>
        </template>
      </ElInput>
    </div>

    <!-- 用户选择区域 -->
    <div class="user-selection-area">
      <ElRow :gutter="20">
        <!-- 左侧：可选用户列表 -->
        <ElCol :span="12">
          <div class="selection-panel">
            <div class="panel-header">
              <span>可选用户</span>
              <ElTag type="info" size="small">{{ pagination.total }}</ElTag>
            </div>
            <div class="user-list" v-loading="loading">
              <ElCheckbox
                v-model="selectAllCurrent"
                :indeterminate="isIndeterminateCurrent"
                @change="handleSelectAllCurrent"
                :disabled="submitLoading || displayUsers.length === 0"
              >
                选择本页全部
              </ElCheckbox>
              <ElCheckboxGroup v-model="selectedUserIds" :disabled="submitLoading">
                <div v-for="user in displayUsers" :key="user.id" class="user-item">
                  <ElCheckbox :value="user.id">
                    <div class="user-info">
                      <ElAvatar :src="user.avatar" :size="32">
                        {{ user.nickname?.charAt(0) || user.username?.charAt(0) }}
                      </ElAvatar>
                      <div class="user-details">
                        <div class="user-name">{{ user.nickname || user.username }}</div>
                        <div class="user-meta"
                          >{{ user.email || user.phone || '暂无联系方式' }}
                        </div>
                      </div>
                    </div>
                  </ElCheckbox>
                </div>
              </ElCheckboxGroup>
              <ElEmpty
                v-if="displayUsers.length === 0 && !loading"
                description="暂无可选用户"
                :image-size="80"
              />
            </div>

            <!-- 分页 -->
            <div class="panel-footer" v-if="pagination.total > 0">
              <ElPagination
                v-model:current-page="pagination.current"
                v-model:page-size="pagination.size"
                :page-sizes="[10, 20, 50, 100]"
                :total="pagination.total"
                :disabled="loading || submitLoading"
                layout="total, sizes, prev, pager, next"
                small
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </ElCol>

        <!-- 右侧：已选用户列表 -->
        <ElCol :span="12">
          <div class="selection-panel">
            <div class="panel-header">
              <span>已选用户</span>
              <ElTag type="success" size="small">{{ selectedUsers.length }}</ElTag>
            </div>
            <div class="user-list" v-loading="loading">
              <div v-if="selectedUsers.length > 0" class="selected-summary">
                <ElAlert
                  :title="`已选择 ${selectedUsers.length} 个用户`"
                  type="info"
                  :closable="false"
                  show-icon
                />
                <ElButton
                  v-if="selectedUsers.length > 0"
                  link
                  type="danger"
                  size="small"
                  @click="handleClearAll"
                  :disabled="submitLoading"
                >
                  清空所有
                </ElButton>
              </div>

              <div v-for="user in selectedUsers" :key="user.id" class="user-item selected">
                <div class="user-info">
                  <ElAvatar :src="user.avatar" :size="32">
                    {{ user.nickname?.charAt(0) || user.username?.charAt(0) }}
                  </ElAvatar>
                  <div class="user-details">
                    <div class="user-name">{{ user.nickname || user.username }}</div>
                    <div class="user-meta">{{ user.email || user.phone || '暂无联系方式' }}</div>
                  </div>
                </div>
                <ElButton
                  link
                  type="danger"
                  size="small"
                  @click="handleRemoveMember(user.id)"
                  :disabled="submitLoading"
                >
                  移除
                </ElButton>
              </div>

              <ElEmpty
                v-if="selectedUsers.length === 0 && !loading"
                description="暂未选择用户"
                :image-size="80"
              />
            </div>
          </div>
        </ElCol>
      </ElRow>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleCancel" :disabled="submitLoading">取 消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ submitLoading ? '保存中...' : '保 存' }}
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox, ElIcon, ElAlert } from 'element-plus'
  import { Search } from 'lucide-vue-next'
  import { searchUserApi, type UserSysUser } from '@/api/portal/user'
  import { getProjectAdminsApi, type ProjectAdmin } from '@/api/manager/project'

  interface Props {
    visible: boolean
    projectId: number
    submitLoading?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void

    (e: 'submit', userIds: number[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    projectId: 0,
    submitLoading: false
  })

  const emit = defineEmits<Emits>()

  // 状态管理
  const loading = ref(false)
  const searchKeyword = ref('')
  const allUsers = ref<UserSysUser[]>([])
  const currentMemberIds = ref<number[]>([])
  const selectedUserIds = ref<number[]>([])
  const selectAllCurrent = ref(false)

  // 分页配置
  const pagination = reactive({
    current: 1,
    size: 20,
    total: 0
  })

  // 计算属性 - 当前页显示的用户
  const displayUsers = computed(() => {
    return allUsers.value.filter((user) => !currentMemberIds.value.includes(user.id))
  })

  // 计算属性 - 已选择的用户详细信息
  const selectedUsers = computed(() => {
    return allUsers.value.filter((user) => selectedUserIds.value.includes(user.id))
  })

  // 计算属性 - 当前页全选状态
  const isIndeterminateCurrent = computed(() => {
    if (displayUsers.value.length === 0) return false
    const selectedCount = displayUsers.value.filter((user) =>
      selectedUserIds.value.includes(user.id)
    ).length
    return selectedCount > 0 && selectedCount < displayUsers.value.length
  })

  // 获取用户列表
  const loadUsers = async () => {
    loading.value = true
    try {
      const response = await searchUserApi({
        page: pagination.current,
        pageSize: pagination.size,
        username: searchKeyword.value || undefined,
        nickname: searchKeyword.value || undefined,
      })
      allUsers.value = response.items || []
      pagination.total = response.total || 0
    } catch (error) {
      console.error('获取用户列表失败:', error)
      allUsers.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取当前项目成员
  const loadCurrentMembers = async () => {
    if (!props.projectId) return

    try {
      const response = await getProjectAdminsApi({
        projectId: props.projectId
      })
      const memberIds = response?.map((admin: ProjectAdmin) => admin.userId) || []
      currentMemberIds.value = memberIds

      // 初始化时将当前成员加入已选列表
      selectedUserIds.value = [...memberIds]

      // 加载成员的详细信息
      if (memberIds.length > 0) {
        const memberResponse = await searchUserApi({
          page: 1,
          pageSize: 20,
          ids: memberIds
        })
        // 合并成员信息到allUsers
        memberResponse.items?.forEach((member) => {
          if (!allUsers.value.find((u) => u.id === member.id)) {
            allUsers.value.push(member)
          }
        })
      }
    } catch (error) {
      console.error('获取项目成员失败:', error)
      currentMemberIds.value = []
      selectedUserIds.value = []
    }
  }

  // 搜索处理
  const handleSearch = () => {
    pagination.current = 1
    loadUsers()
  }

  // 分页大小改变
  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    loadUsers()
  }

  // 页码改变
  const handlePageChange = (page: number) => {
    pagination.current = page
    loadUsers()
  }

  // 当前页全选处理
  const handleSelectAllCurrent = (val: boolean) => {
    const currentPageIds = displayUsers.value.map((user) => user.id)
    if (val) {
      selectedUserIds.value = [...new Set([...selectedUserIds.value, ...currentPageIds])]
    } else {
      selectedUserIds.value = selectedUserIds.value.filter((id) => !currentPageIds.includes(id))
    }
  }

  // 清空所有选择
  const handleClearAll = () => {
    selectedUserIds.value = [...currentMemberIds.value]
  }

  // 移除成员
  const handleRemoveMember = (userId: number) => {
    selectedUserIds.value = selectedUserIds.value.filter((id) => id !== userId)
  }

  // 提交处理
  const handleSubmit = async () => {
    if (props.submitLoading) {
      return
    }

    // 如果没有选择任何用户，提示确认
    if (selectedUserIds.value.length === 0) {
      try {
        await ElMessageBox.confirm('未选择任何用户，这将清空该项目的所有成员，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        return
      }
    }

    emit('submit', selectedUserIds.value)
  }

  const handleCancel = () => {
    if (props.submitLoading) {
      return
    }
    emit('update:visible', false)
  }

  const handleClosed = () => {
    if (!props.submitLoading) {
      searchKeyword.value = ''
      selectedUserIds.value = []
      currentMemberIds.value = []
      selectAllCurrent.value = false
      pagination.current = 1
      pagination.size = 20
      allUsers.value = []
    }
  }

  // 监听弹窗显示
  watch(
    () => props.visible,
    async (newVal) => {
      if (newVal) {
        await loadCurrentMembers()
        await loadUsers()
      }
    }
  )

  // 监听当前页用户变化，更新全选状态
  watch(displayUsers, () => {
    if (displayUsers.value.length === 0) {
      selectAllCurrent.value = false
      return
    }
    const allSelected = displayUsers.value.every((user) => selectedUserIds.value.includes(user.id))
    selectAllCurrent.value = allSelected
  })
</script>

<style lang="scss" scoped>
  .member-dialog {
    .search-bar {
      margin-bottom: 16px;
    }

    .user-selection-area {
      min-height: 500px;
    }

    .selection-panel {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      height: 550px;
      display: flex;
      flex-direction: column;

      .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: var(--el-fill-color-lighter);
        font-weight: 500;
      }

      .panel-footer {
        padding: 12px;
        border-top: 1px solid var(--el-border-color-lighter);
        background-color: var(--el-fill-color-lighter);

        :deep(.el-pagination) {
          justify-content: center;
        }
      }

      .user-list {
        flex: 1;
        padding: 12px;
        overflow-y: auto;

        .selected-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;

          :deep(.el-alert) {
            flex: 1;
            margin-right: 12px;
          }
        }

        > .el-checkbox {
          margin-bottom: 12px;
          padding: 8px;
          background-color: var(--el-fill-color-light);
          border-radius: 4px;
        }

        .user-item {
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          background-color: var(--el-fill-color-blank);
          border: 1px solid var(--el-border-color-lighter);
          transition: all 0.3s;

          &:hover {
            background-color: var(--el-fill-color-light);
            border-color: var(--el-color-primary-light-7);
          }

          &.selected {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary-light-5);
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .user-details {
              flex: 1;

              .user-name {
                font-size: 14px;
                font-weight: 500;
                color: var(--el-text-color-primary);
              }

              .user-meta {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                margin-top: 2px;
              }
            }
          }
        }

        :deep(.el-checkbox) {
          display: block;
          margin-right: 0;
          width: 100%;

          .el-checkbox__label {
            width: 100%;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>