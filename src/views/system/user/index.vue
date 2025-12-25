<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch
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
            <ElButton type="primary" @click="showDialog('add')"> 新增用户</ElButton>
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

    <!-- 用户编辑弹窗 -->
    <UserDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :user-data="currentUserData"
      @success="refreshData"
    />

    <!-- 修改密码弹窗 -->
    <ResetPasswordDialog
      v-model="passwordDialog"
      :user-data="currentUserData"
      @success="handlePasswordChangeSuccess"
    />

    <!-- 角色分配弹窗 -->
    <UserRoleDialog v-model="roleDialog" :user-data="currentUserData" @success="refreshData" />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import {
    searchUserApi,
    deleteUserApi,
    updateUserStatusApi,
    resetUserPasswordApi,
    getUserInfoApi,
    type UserSysUser
  } from '@/api'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import ResetPasswordDialog from './modules/reset-password-dialog.vue'
  import UserRoleDialog from './modules/user-role-dialog.vue'
  import { useUserTableConfig } from './modules/table-config'

  defineOptions({ name: 'User' })

  // 使用抽离的表格配置逻辑
  const {
    loading,
    showSearchBar,
    deleteLoadingMap,
    resetPwdLoadingMap,
    statusLoadingMap,
    SearchFormItems,
    createTableColumns
  } = useUserTableConfig()

  // 当前登录用户信息
  const currentUserInfo = ref<any>(null)

  // 弹窗相关
  const dialogVisible = ref(false)
  const passwordDialog = ref(false)
  const roleDialog = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentUserData = ref<UserSysUser | undefined>(undefined)

  // 表格数据
  const data = ref<UserSysUser[]>([])

  // 搜索表单
  const searchForm = ref({
    username: undefined,
    nickname: undefined,
    phone: undefined,
    email: undefined,
    workNumber: undefined,
    status: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 获取当前登录用户信息
  const getCurrentUserInfo = async () => {
    try {
      const response = await getUserInfoApi()
      currentUserInfo.value = response
    } catch (error) {
      console.error('获取当前用户信息失败:', error)
    }
  }

  // 处理状态改变
  const handleStatusChange = async (row: UserSysUser, val: boolean) => {
    try {
      statusLoadingMap.value[row.id] = true
      await updateUserStatusApi({
        id: row.id,
        status: val ? 1 : 0
      })
      ElMessage.success('状态更新成功')
      row.status = val ? 1 : 0
    } catch (error) {
      console.error('更新状态失败:', error)
      row.status = val ? 0 : 1
    } finally {
      statusLoadingMap.value[row.id] = false
    }
  }

  // 按钮更多点击事件
  const buttonMoreClick = (item: ButtonMoreItem, row: UserSysUser) => {
    switch (item.key) {
      case 'edit':
        showDialog('edit', row)
        break
      case 'role':
        showRoleDialog(row)
        break
      case 'resetPwd':
        resetPassword(row)
        break
      case 'delete':
        deleteUser(row)
        break
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns(
    {
      handleStatusChange,
      buttonMoreClick
    },
    currentUserInfo
  )

  // 获取数据
  const getData = async () => {
    try {
      loading.value = true
      const params = {
        page: pagination.value.current,
        pageSize: pagination.value.size,
        ...searchParams.value
      }

      const response = await searchUserApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
      console.error('获取用户列表失败:', error)
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

  // 显示对话框
  const showDialog = (type: 'add' | 'edit', row?: UserSysUser) => {
    dialogVisible.value = true
    dialogType.value = type
    currentUserData.value = row
  }

  // 显示修改密码对话框
  const showPasswordDialog = (row: UserSysUser) => {
    passwordDialog.value = true
    currentUserData.value = row
  }

  // 显示角色分配对话框
  const showRoleDialog = (row: UserSysUser) => {
    roleDialog.value = true
    currentUserData.value = row
  }

  // 重置密码
  const resetPassword = async (row: UserSysUser) => {
    try {
      await ElMessageBox.confirm(
        `确定重置用户"${row.nickname || row.username}"的密码吗？重置后密码将恢复为默认密码。`,
        '重置密码确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      resetPwdLoadingMap.value[row.id] = true
      await resetUserPasswordApi(row.id)
      ElMessage.success('密码重置成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('重置密码失败:', error)
      }
    } finally {
      resetPwdLoadingMap.value[row.id] = false
    }
  }

  // 删除用户
  const deleteUser = async (row: UserSysUser) => {
    try {
      await ElMessageBox.confirm(
        `确定删除用户"${row.nickname || row.username}"吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      deleteLoadingMap.value[row.id] = true
      await deleteUserApi(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    } finally {
      deleteLoadingMap.value[row.id] = false
    }
  }

  // 密码修改成功处理
  const handlePasswordChangeSuccess = () => {
    ElMessage.success('密码修改成功')
    refreshData()
  }

  // 初始化
  onMounted(() => {
    getCurrentUserInfo()
    getData()
  })
</script>

<style lang="scss" scoped>
  .user-page {
    padding-bottom: 15px;
  }
</style>
