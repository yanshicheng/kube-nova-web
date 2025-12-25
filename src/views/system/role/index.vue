<template>
  <div class="role-page art-full-height">
    <RoleSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></RoleSearch>

    <ElCard
      class="art-table-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
    >
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
            <ElButton @click="showDialog('add')">新增角色</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 角色编辑弹窗 -->
    <RoleEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :role-data="currentRoleData"
      @success="refreshData"
    />

    <!-- 菜单权限弹窗 -->
    <MenuPermissionDialog
      v-model="permissionDialog"
      :role-data="currentRoleData"
      @success="refreshData"
    />

    <!-- API权限弹窗 -->
    <ApiPermissionDialog v-model="apiDialog" :role-data="currentRoleData" @success="refreshData" />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { searchRoleApi, deleteRoleApi, type RoleSysRole } from '@/api/portal/role'
  import RoleSearch from './modules/role-search.vue'
  import RoleEditDialog from './modules/role-edit-dialog.vue'
  import MenuPermissionDialog from './modules/MenuPermissionDialog.vue'
  import ApiPermissionDialog from './modules/ApiPermissionDialog.vue'
  import { useRoleTableConfig } from './modules/table-config'

  defineOptions({ name: 'Role' })

  // 使用抽离的表格配置逻辑
  const { loading, showSearchBar, deleteLoadingMap, SearchFormItems, createTableColumns } =
    useRoleTableConfig()

  // 弹窗相关
  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const apiDialog = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentRoleData = ref<RoleSysRole | undefined>(undefined)

  // 表格数据
  const data = ref<RoleSysRole[]>([])

  // 搜索表单
  const searchForm = ref({
    name: undefined,
    code: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 按钮更多点击事件
  const buttonMoreClick = (item: ButtonMoreItem, row: RoleSysRole) => {
    switch (item.key) {
      case 'permission':
        showPermissionDialog(row)
        break
      case 'api':
        showApiDialog(row)
        break
      case 'edit':
        showDialog('edit', row)
        break
      case 'delete':
        deleteRole(row)
        break
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    buttonMoreClick
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

      const response = await searchRoleApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
      console.error('获取角色列表失败:', error)
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
  const showDialog = (type: 'add' | 'edit', row?: RoleSysRole) => {
    dialogVisible.value = true
    dialogType.value = type
    currentRoleData.value = row
  }

  // 显示菜单权限对话框
  const showPermissionDialog = (row?: RoleSysRole) => {
    permissionDialog.value = true
    currentRoleData.value = row
  }

  // 显示API权限对话框
  const showApiDialog = (row?: RoleSysRole) => {
    apiDialog.value = true
    currentRoleData.value = row
  }

  // 删除角色
  const deleteRole = async (row: RoleSysRole) => {
    try {
      await ElMessageBox.confirm(`确定删除角色"${row.name}"吗？此操作不可恢复！`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      deleteLoadingMap.value[row.id] = true
      await deleteRoleApi(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      } else {
        ElMessage.info('已取消删除')
      }
    } finally {
      deleteLoadingMap.value[row.id] = false
    }
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .role-page {
    padding-bottom: 15px;
  }
</style>
