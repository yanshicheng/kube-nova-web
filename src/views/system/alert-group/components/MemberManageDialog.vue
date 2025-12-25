<template>
  <el-dialog
    v-model="visible"
    title="成员管理"
    width="800px"
    @close="handleClose"
    class="member-manage-dialog"
  >
    <div class="member-manage">
      <div class="action-bar">
        <el-button type="primary" :icon="Plus" @click="handleAdd"> 添加成员 </el-button>
      </div>

      <el-table v-loading="loading" :data="memberList" border stripe>
        <el-table-column prop="userId" label="用户ID" width="100" align="center" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-name">{{ getUserInfo(row.userId)?.nickname || '加载中...' }}</span>
              <span class="user-username">@{{ getUserInfo(row.userId)?.username || '...' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTag(row.role)">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="加入时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加成员"
      width="500px"
      append-to-body
      class="add-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="选择用户" prop="userId">
          <user-selector v-model="form.userId" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="所有者" value="owner">
              <div class="simple-option">
                <el-tag type="danger" size="small">所有者</el-tag>
                <span class="option-desc">最高权限</span>
              </div>
            </el-option>
            <el-option label="管理员" value="admin">
              <div class="simple-option">
                <el-tag type="warning" size="small">管理员</el-tag>
                <span class="option-desc">管理权限</span>
              </div>
            </el-option>
            <el-option label="成员" value="member">
              <div class="simple-option">
                <el-tag size="small">成员</el-tag>
                <span class="option-desc">普通成员</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { Plus, Delete } from '@element-plus/icons-vue'
  import {
    searchAlertGroupMembersApi,
    addAlertGroupMembersApi,
    deleteAlertGroupMembersApi,
    type AlertGroupMembers
  } from '@/api/portal/alert'
  import { getUserByIdApi, type UserSysUser } from '@/api/portal/user'
  import { formatTime } from '@/utils/date'
  import UserSelector from './UserSelector.vue'

  interface Props {
    modelValue: boolean
    groupId?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const submitLoading = ref(false)
  const memberList = ref<AlertGroupMembers[]>([])
  const userInfoMap = ref<Map<number, UserSysUser>>(new Map())

  const addDialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const form = reactive({
    userId: undefined as number | undefined,
    role: 'member'
  })

  const formRules = reactive<FormRules>({
    userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
    role: [{ required: true, message: '请选择角色', trigger: 'change' }]
  })

  // 获取用户信息
  const getUserInfo = (userId: number) => {
    return userInfoMap.value.get(userId)
  }

  // 获取角色名称
  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      owner: '所有者',
      admin: '管理员',
      member: '成员'
    }
    return roleMap[role] || role
  }

  // 获取角色标签
  const getRoleTag = (role: string) => {
    const tagMap: Record<string, string> = {
      owner: 'danger',
      admin: 'warning',
      member: ''
    }
    return tagMap[role] || ''
  }

  // 加载成员列表
  const loadMembers = async () => {
    if (!props.groupId) return

    loading.value = true
    try {
      const res = await searchAlertGroupMembersApi({
        groupId: props.groupId,
        page: 1,
        pageSize: 200
      })
      memberList.value = res.items || []

      // 加载用户信息
      const userIds = memberList.value.map((item) => item.userId)
      if (userIds.length > 0) {
        await loadUserInfo(userIds)
      }
    } catch (error) {
      ElMessage.error('加载成员列表失败')
    } finally {
      loading.value = false
    }
  }

  // 加载用户信息
  const loadUserInfo = async (userIds: number[]) => {
    try {
      const promises = userIds.map((id) => getUserByIdApi(id).catch(() => null))
      const results = await Promise.all(promises)
      results.forEach((user, index) => {
        if (user) {
          userInfoMap.value.set(userIds[index], user)
        }
      })
    } catch (error) {
      console.error('加载用户信息失败', error)
    }
  }

  // 添加成员
  const handleAdd = () => {
    form.userId = undefined
    form.role = 'member'
    addDialogVisible.value = true
  }

  // 提交添加
  const handleSubmit = async () => {
    if (!formRef.value || !props.groupId) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      submitLoading.value = true
      try {
        await addAlertGroupMembersApi({
          groupId: props.groupId!,
          userId: form.userId!,
          role: form.role
        })
        ElMessage.success('添加成功')
        addDialogVisible.value = false
        await loadMembers()
        emit('success')
      } catch (error) {
        ElMessage.error('添加失败')
      } finally {
        submitLoading.value = false
      }
    })
  }

  // 删除成员
  const handleDelete = async (row: AlertGroupMembers) => {
    try {
      await ElMessageBox.confirm('确定要移除该成员吗？', '确认', {
        type: 'warning'
      })
      await deleteAlertGroupMembersApi(row.id)
      ElMessage.success('移除成功')
      await loadMembers()
      emit('success')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('移除失败')
      }
    }
  }

  // 关闭对话框
  const handleClose = () => {
    memberList.value = []
    userInfoMap.value.clear()
  }

  watch(
    () => [props.groupId, visible.value],
    () => {
      if (visible.value && props.groupId) {
        loadMembers()
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .member-manage-dialog {
    :deep(.el-dialog__body) {
      padding: 0 24px 24px;
    }
  }

  .member-manage {
    .action-bar {
      margin-bottom: 16px;
    }

    .user-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .user-name {
        font-weight: 500;
        color: #303133;
      }

      .user-username {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .add-dialog {
    .simple-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;

      .option-desc {
        font-size: 12px;
        color: #909399;
      }
    }
  }
</style>

