<template>
  <div class="user-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElInput
          v-model="searchParams.search"
          placeholder="搜索用户名或邮箱..."
          :prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 300px"
        />
      </div>

      <div class="toolbar-right">
        <ElButton type="primary" :icon="UserPlus" @click="handleCreate">创建用户</ElButton>
        <ElButton :icon="RefreshCw" @click="fetchUsers">刷新</ElButton>
      </div>
    </div>

    <!-- 用户列表 -->
    <ElCard shadow="never" class="table-card" v-loading="loading">
      <ElTable :data="users" style="width: 100%">
        <ElTableColumn label="用户信息" min-width="250">
          <template #default="{ row }">
            <div class="user-info-cell">
              <div class="user-avatar">
                <UserCircle2 :size="32" />
              </div>
              <div class="user-details">
                <div class="user-name">
                  {{ row.realname }}
                  <ElTag v-if="row.sysadminFlag" type="danger" size="small">管理员</ElTag>
                </div>
                <div class="user-username">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="邮箱" min-width="200">
          <template #default="{ row }">
            <div class="email-cell">
              <Mail :size="14" />
              <span>{{ row.email }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="备注" min-width="200">
          <template #default="{ row }">
            {{ row.comment || '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.creationTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <ElSpace :size="4">
              <ElButton size="small" :icon="Edit" @click="handleEdit(row)">编辑</ElButton>
              <ElButton size="small" :icon="Key" @click="handleChangePassword(row)">
                改密
              </ElButton>
              <ElDropdown @command="handleCommand(row, $event)">
                <ElButton size="small" :icon="MoreVertical" circle />
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem
                      :command="row.sysadminFlag ? 'remove-admin' : 'set-admin'"
                      :icon="Shield"
                    >
                      {{ row.sysadminFlag ? '取消管理员' : '设为管理员' }}
                    </ElDropdownItem>
                    <ElDropdownItem command="delete" :icon="Trash2" divided>
                      删除用户
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div v-if="users.length > 0" class="pagination-wrapper">
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

      <!-- 空状态 -->
      <ElEmpty v-if="users.length === 0 && !loading" description="暂无用户" />
    </ElCard>

    <!-- 创建/编辑用户对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '创建用户' : '编辑用户'"
      width="600px"
      :close-on-click-modal="false"
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <ElFormItem label="用户名" prop="username">
          <ElInput
            v-model="formData.username"
            placeholder="请输入用户名"
            :disabled="dialogMode === 'edit'"
          />
          <div class="form-tip">用户名创建后不可修改</div>
        </ElFormItem>

        <ElFormItem label="真实姓名" prop="realname">
          <ElInput v-model="formData.realname" placeholder="请输入真实姓名" />
        </ElFormItem>

        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="formData.email" placeholder="请输入邮箱地址" />
        </ElFormItem>

        <ElFormItem v-if="dialogMode === 'create'" label="密码" prop="password">
          <ElInput
            v-model="formData.password"
            type="password"
            placeholder="请输入密码（至少8位）"
            show-password
          />
        </ElFormItem>

        <ElFormItem label="备注">
          <ElInput
            v-model="formData.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 修改密码对话框 -->
    <ElDialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="passwordFormRef"
        :model="passwordFormData"
        :rules="passwordFormRules"
        label-width="100px"
      >
        <ElFormItem label="旧密码" prop="oldPassword">
          <ElInput
            v-model="passwordFormData.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            show-password
          />
        </ElFormItem>

        <ElFormItem label="新密码" prop="newPassword">
          <ElInput
            v-model="passwordFormData.newPassword"
            type="password"
            placeholder="请输入新密码（至少8位）"
            show-password
          />
        </ElFormItem>

        <ElFormItem label="确认密码" prop="confirmPassword">
          <ElInput
            v-model="passwordFormData.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="passwordDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitPassword" :loading="changingPassword">
          确定
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Search,
    UserPlus,
    RefreshCw,
    UserCircle2,
    Mail,
    Edit,
    Key,
    MoreVertical,
    Shield,
    Trash2
  } from 'lucide-vue-next'
  import {
    registryListUsersApi,
    registryCreateUserApi,
    registryUpdateUserApi,
    registryDeleteUserApi,
    registryChangeUserPasswordApi,
    registrySetUserAdminApi,
    type HarborUser
  } from '@/api'

  interface Props {
    registryUuid: string
  }

  const props = defineProps<Props>()

  const loading = ref(false)
  const users = ref<HarborUser[]>([])
  const total = ref(0)

  // 搜索参数
  const searchParams = reactive({
    page: 1,
    pageSize: 20,
    search: ''
  })

  // 创建/编辑对话框
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const formData = reactive({
    userId: 0,
    username: '',
    realname: '',
    email: '',
    password: '',
    comment: ''
  })

  const formRules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 255, message: '用户名长度在 2 到 255 个字符', trigger: 'blur' }
    ],
    realname: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
    email: [
      { required: true, message: '请输入邮箱地址', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, message: '密码长度至少8位', trigger: 'blur' }
    ]
  }

  // 修改密码对话框
  const passwordDialogVisible = ref(false)
  const passwordFormRef = ref<FormInstance>()
  const changingPassword = ref(false)
  const currentUser = ref<HarborUser>()

  const passwordFormData = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const validateConfirmPassword = (rule: any, value: any, callback: any) => {
    if (value === '') {
      callback(new Error('请再次输入新密码'))
    } else if (value !== passwordFormData.newPassword) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }

  const passwordFormRules: FormRules = {
    oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, message: '密码长度至少8位', trigger: 'blur' }
    ],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
  }

  // 获取用户列表
  const fetchUsers = async () => {
    loading.value = true
    try {
      const response = await registryListUsersApi({
        registryUuid: props.registryUuid,
        search: searchParams.search || undefined,
        page: searchParams.page,
        pageSize: searchParams.pageSize
      })

      users.value = response.items || []
      total.value = response.total || 0
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = () => {
    searchParams.page = 1
    fetchUsers()
  }

  // 分页
  const handleSizeChange = () => {
    searchParams.page = 1
    fetchUsers()
  }

  const handlePageChange = () => {
    fetchUsers()
  }

  // 创建用户
  const handleCreate = () => {
    dialogMode.value = 'create'
    Object.assign(formData, {
      userId: 0,
      username: '',
      realname: '',
      email: '',
      password: '',
      comment: ''
    })
    dialogVisible.value = true
  }

  // 编辑用户
  const handleEdit = (user: HarborUser) => {
    dialogMode.value = 'edit'
    Object.assign(formData, {
      userId: user.userId,
      username: user.username,
      realname: user.realname,
      email: user.email,
      password: '',
      comment: user.comment || ''
    })
    dialogVisible.value = true
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      submitting.value = true

      if (dialogMode.value === 'create') {
        await registryCreateUserApi({
          registryUuid: props.registryUuid,
          username: formData.username,
          realname: formData.realname,
          email: formData.email,
          password: formData.password,
          comment: formData.comment || undefined
        })
        ElMessage.success('创建成功')
      } else {
        await registryUpdateUserApi(formData.userId, {
          registryUuid: props.registryUuid,
          realname: formData.realname,
          email: formData.email,
          comment: formData.comment || undefined
        })
        ElMessage.success('保存成功')
      }

      dialogVisible.value = false
      fetchUsers()
    } catch (error: any) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }

  // 修改密码
  const handleChangePassword = (user: HarborUser) => {
    currentUser.value = user
    Object.assign(passwordFormData, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    passwordDialogVisible.value = true
  }

  // 提交修改密码
  const handleSubmitPassword = async () => {
    if (!passwordFormRef.value || !currentUser.value) return

    try {
      await passwordFormRef.value.validate()

      changingPassword.value = true
      await registryChangeUserPasswordApi(currentUser.value.userId, {
        registryUuid: props.registryUuid,
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword
      })

      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false
    } catch (error: any) {
      console.error('修改密码失败:', error)
    } finally {
      changingPassword.value = false
    }
  }

  // 设置/取消管理员
  const handleSetAdmin = async (user: HarborUser, isAdmin: boolean) => {
    try {
      await ElMessageBox.confirm(
        `确定要${isAdmin ? '设置' : '取消'}用户 "${user.realname}" 的管理员权限吗？`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await registrySetUserAdminApi(user.userId, {
        registryUuid: props.registryUuid,
        sysadminFlag: isAdmin
      })

      ElMessage.success(`${isAdmin ? '设置' : '取消'}管理员成功`)
      fetchUsers()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('操作失败:', error)
      }
    }
  }

  // 删除用户
  const handleDelete = async (user: HarborUser) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除用户 "${user.realname}" 吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await registryDeleteUserApi(user.userId, props.registryUuid)
      ElMessage.success('删除成功')
      fetchUsers()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除用户失败:', error)
      }
    }
  }

  // 处理命令
  const handleCommand = (user: HarborUser, command: string) => {
    switch (command) {
      case 'set-admin':
        handleSetAdmin(user, true)
        break
      case 'remove-admin':
        handleSetAdmin(user, false)
        break
      case 'delete':
        handleDelete(user)
        break
    }
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  onMounted(() => {
    fetchUsers()
  })
</script>

<style lang="scss" scoped>
  .user-management {
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
      .user-info-cell {
        display: flex;
        align-items: center;
        gap: 12px;

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .user-details {
          flex: 1;
          min-width: 0;

          .user-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
          }

          .user-username {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            font-family: 'Monaco', 'Consolas', monospace;
          }
        }
      }

      .email-cell {
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
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
