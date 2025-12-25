<template>
  <ElDialog v-model="visible" title="项目成员管理" width="900px" :close-on-click-modal="false">
    <div class="member-management">
      <!-- 添加成员表单 - 一行显示 -->
      <ElForm :model="addForm" :rules="addRules" ref="addFormRef" inline class="add-member-form">
        <ElFormItem label="用户名" prop="memberUser" style="flex: 1">
          <ElSelect
            v-model="addForm.memberUser"
            placeholder="请选择用户"
            filterable
            clearable
            style="width: 100%"
            :loading="loadingUsers"
          >
            <ElOption
              v-for="user in availableUsers"
              :key="user.userId"
              :label="user.username"
              :value="user.username"
              :disabled="isMemberExists(user.username)"
            >
              <div class="user-option">
                <ElAvatar :size="24">
                  <User :size="14" />
                </ElAvatar>
                <span class="user-name">{{ user.username }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="角色" prop="roleId" style="width: 200px">
          <ElSelect v-model="addForm.roleId" placeholder="请选择角色" style="width: 100%">
            <ElOption :value="1" label="项目管理员">
              <div class="role-option">
                <ShieldCheck :size="16" class="role-icon admin" />
                <div class="role-info">
                  <span class="role-name">项目管理员</span>
                  <span class="role-desc">项目的所有权限</span>
                </div>
              </div>
            </ElOption>
            <ElOption :value="2" label="开发者">
              <div class="role-option">
                <Code :size="16" class="role-icon developer" />
                <div class="role-info">
                  <span class="role-name">开发者</span>
                  <span class="role-desc">可以管理制品和扫描</span>
                </div>
              </div>
            </ElOption>
            <ElOption :value="3" label="访客">
              <div class="role-option">
                <Eye :size="16" class="role-icon guest" />
                <div class="role-info">
                  <span class="role-name">访客</span>
                  <span class="role-desc">只能拉取镜像</span>
                </div>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <ElFormItem style="margin-right: 0">
          <ElButton type="primary" :icon="UserPlus" @click="handleAddMember" :loading="adding">
            添加成员
          </ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 成员列表 -->
      <div class="members-list">
        <ElTable :data="members" style="width: 100%" v-loading="loading">
          <ElTableColumn label="成员" min-width="200">
            <template #default="{ row }">
              <div class="member-cell">
                <ElAvatar :size="32">
                  <User :size="16" />
                </ElAvatar>
                <div class="member-info">
                  <span class="member-name">{{ row.entityName }}</span>
                  <span class="member-type">{{ getEntityTypeText(row.entityType) }}</span>
                </div>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="角色" width="250">
            <template #default="{ row }">
              <div class="role-cell">
                <ElTag :type="getRoleType(row.roleId)" size="large">
                  <div class="role-tag-content">
                    <ShieldCheck v-if="row.roleId === 1" :size="14" />
                    <Code v-else-if="row.roleId === 2" :size="14" />
                    <Eye v-else :size="14" />
                    <span>{{ getRoleName(row.roleId) }}</span>
                  </div>
                </ElTag>
                <span class="role-desc">{{ getRoleDescription(row.roleId) }}</span>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.creationTime) }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <ElSpace :size="8">
                <ElButton
                  type="primary"
                  size="small"
                  :icon="Edit"
                  @click="handleEditRole(row)"
                  :disabled="isLastAdmin(row)"
                  text
                >
                  角色
                </ElButton>
                <ElButton
                  type="danger"
                  size="small"
                  :icon="Trash2"
                  @click="handleRemoveMember(row)"
                  :disabled="isLastAdmin(row)"
                  text
                >
                  移除
                </ElButton>
              </ElSpace>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>

  <!-- 编辑角色对话框 -->
  <ElDialog
    v-model="editRoleDialogVisible"
    title="编辑角色"
    width="500px"
    :close-on-click-modal="false"
  >
    <ElForm :model="editRoleForm" label-width="80px">
      <ElFormItem label="成员">
        <ElInput :model-value="currentEditMember?.entityName" disabled />
      </ElFormItem>

      <ElFormItem label="选择角色">
        <ElRadioGroup v-model="editRoleForm.roleId" style="width: 100%">
          <ElRadio :value="1" border style="width: 100%; margin-bottom: 12px">
            <div class="role-radio-content">
              <div class="role-header">
                <ShieldCheck :size="18" class="role-icon admin" />
                <span class="role-name">项目管理员</span>
              </div>
              <span class="role-desc">项目的所有权限</span>
            </div>
          </ElRadio>

          <ElRadio :value="2" border style="width: 100%; margin-bottom: 12px">
            <div class="role-radio-content">
              <div class="role-header">
                <Code :size="18" class="role-icon developer" />
                <span class="role-name">开发者</span>
              </div>
              <span class="role-desc">可以管理制品和扫描</span>
            </div>
          </ElRadio>

          <ElRadio :value="3" border style="width: 100%">
            <div class="role-radio-content">
              <div class="role-header">
                <Eye :size="18" class="role-icon guest" />
                <span class="role-name">访客</span>
              </div>
              <span class="role-desc">只能拉取镜像</span>
            </div>
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="editRoleDialogVisible = false">取消</ElButton>
      <ElButton type="primary" @click="handleSaveRole" :loading="updating"> 保存 </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { User, ShieldCheck, Code, Eye, UserPlus, Edit, Trash2 } from 'lucide-vue-next'
  import {
    listProjectMembersApi,
    addProjectMemberApi,
    updateProjectMemberApi,
    deleteProjectMemberApi,
    registryListUsersApi,
    type ProjectMember,
    type AddProjectMemberRequest,
    type UpdateProjectMemberRequest,
    type HarborUser
  } from '@/api'

  interface Props {
    modelValue: boolean
    registryUuid: string
    projectName: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'refresh'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const loading = ref(false)
  const loadingUsers = ref(false)
  const adding = ref(false)
  const updating = ref(false)
  const members = ref<ProjectMember[]>([])
  const availableUsers = ref<HarborUser[]>([])

  // 添加成员表单
  const addFormRef = ref<FormInstance>()
  const addForm = reactive({
    memberUser: '',
    roleId: 2
  })

  const addRules: FormRules = {
    memberUser: [{ required: true, message: '请选择用户', trigger: 'change' }],
    roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
  }

  // 编辑角色
  const editRoleDialogVisible = ref(false)
  const currentEditMember = ref<ProjectMember | null>(null)
  const editRoleForm = reactive({
    roleId: 1
  })

  // 检查成员是否已存在
  const isMemberExists = (username: string) => {
    return members.value.some((m) => m.entityName === username)
  }

  // 判断是否是最后一个管理员
  const isLastAdmin = (member: ProjectMember) => {
    const adminCount = members.value.filter((m) => m.roleId === 1).length
    return adminCount === 1 && member.roleId === 1
  }

  // 获取实体类型文本
  const getEntityTypeText = (entityType: string) => {
    const typeMap: Record<string, string> = {
      u: '用户',
      g: '用户组'
    }
    return typeMap[entityType] || entityType
  }

  // 获取角色名称
  const getRoleName = (roleId: number) => {
    const nameMap: Record<number, string> = {
      1: '项目管理员',
      2: '开发者',
      3: '访客'
    }
    return nameMap[roleId] || '未知角色'
  }

  // 角色相关方法
  const getRoleType = (roleId: number) => {
    const typeMap: Record<number, any> = {
      1: 'danger',
      2: 'primary',
      3: 'info'
    }
    return typeMap[roleId] || 'info'
  }

  const getRoleDescription = (roleId: number) => {
    const descMap: Record<number, string> = {
      1: '项目的所有权限',
      2: '可以管理制品和扫描',
      3: '只能拉取镜像'
    }
    return descMap[roleId] || ''
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 获取项目成员列表
  const fetchMembers = async () => {
    if (!props.registryUuid || !props.projectName) return

    loading.value = true
    try {
      const res = await listProjectMembersApi({
        registryUuid: props.registryUuid,
        projectName: props.projectName,
        page: 1,
        pageSize: 100
      })
      members.value = res.items || []
    } catch (error) {
      console.error('获取成员列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取可用用户列表
  const fetchUsers = async () => {
    if (!props.registryUuid) return

    loadingUsers.value = true
    try {
      const res = await registryListUsersApi({
        registryUuid: props.registryUuid,
        page: 1,
        pageSize: 100
      })
      availableUsers.value = res.items || []
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      loadingUsers.value = false
    }
  }

  // 添加成员
  const handleAddMember = async () => {
    if (!addFormRef.value) return

    await addFormRef.value.validate(async (valid) => {
      if (valid) {
        // 验证 projectName 是否存在
        if (!props.projectName) {
          return
        }

        adding.value = true
        try {
          const requestData: AddProjectMemberRequest = {
            registryUuid: props.registryUuid,
            projectName: props.projectName,
            memberUser: addForm.memberUser,
            roleId: addForm.roleId
          }

          await addProjectMemberApi(requestData)
          ElMessage.success('添加成员成功')

          // 重置表单
          addForm.memberUser = ''
          addForm.roleId = 2
          addFormRef.value?.resetFields()

          // 刷新成员列表
          await fetchMembers()
          emit('refresh')
        } catch (error: any) {
          console.error('添加成员失败:', error)
        } finally {
          adding.value = false
        }
      }
    })
  }

  // 编辑角色
  const handleEditRole = (member: ProjectMember) => {
    currentEditMember.value = member
    editRoleForm.roleId = member.roleId
    editRoleDialogVisible.value = true
  }

  // 保存角色
  const handleSaveRole = async () => {
    if (!currentEditMember.value) return

    updating.value = true
    try {
      const requestData: UpdateProjectMemberRequest = {
        registryUuid: props.registryUuid,
        projectName: props.projectName,
        roleId: editRoleForm.roleId
      }

      await updateProjectMemberApi(currentEditMember.value.id, requestData)
      ElMessage.success('角色更新成功')
      editRoleDialogVisible.value = false

      // 刷新成员列表
      await fetchMembers()
      emit('refresh')
    } catch (error: any) {
      console.error('角色更新失败:', error)
    } finally {
      updating.value = false
    }
  }

  // 移除成员
  const handleRemoveMember = async (member: ProjectMember) => {
    if (member.roleId === 1 && isLastAdmin(member)) {
      return
    }

    try {
      await ElMessageBox.confirm(`确定要将 ${member.entityName} 从项目中移除吗？`, '确认移除', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })

      await deleteProjectMemberApi(member.id, props.registryUuid, props.projectName)
      ElMessage.success('移除成员成功')

      // 刷新成员列表
      await fetchMembers()
      emit('refresh')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('移除成员失败:', error)
      }
    }
  }

  // 关闭对话框
  const handleClose = () => {
    visible.value = false
  }

  // 监听对话框打开
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        fetchMembers()
        fetchUsers()
      }
    }
  )

  // 监听 props 变化
  watch(
    () => [props.registryUuid, props.projectName],
    () => {
      if (props.modelValue) {
        fetchMembers()
        fetchUsers()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .member-management {
    .add-member-form {
      padding: 20px;
      background: var(--el-fill-color-light);
      border-radius: 8px;
      margin-bottom: 20px;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }

      .user-option {
        display: flex;
        align-items: center;
        gap: 12px;

        .user-name {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .user-email {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .role-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;

        .role-icon {
          flex-shrink: 0;

          &.admin {
            color: var(--el-color-danger);
          }

          &.developer {
            color: var(--el-color-primary);
          }

          &.guest {
            color: var(--el-color-info);
          }
        }

        .role-info {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .role-name {
            font-weight: 500;
            font-size: 14px;
            color: var(--el-text-color-primary);
          }

          .role-desc {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    .members-list {
      .member-cell {
        display: flex;
        align-items: center;
        gap: 12px;

        .member-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .member-name {
            font-weight: 500;
            font-size: 14px;
            color: var(--el-text-color-primary);
          }

          .member-type {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }

      .role-cell {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .role-tag-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .role-desc {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-left: 2px;
        }
      }
    }
  }

  .role-radio-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;

    .role-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .role-icon {
        flex-shrink: 0;

        &.admin {
          color: var(--el-color-danger);
        }

        &.developer {
          color: var(--el-color-primary);
        }

        &.guest {
          color: var(--el-color-info);
        }
      }

      .role-name {
        font-weight: 500;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    .role-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      padding-left: 26px;
    }
  }

  :deep(.el-radio.is-bordered) {
    height: auto;
    padding: 12px;
  }
</style>
