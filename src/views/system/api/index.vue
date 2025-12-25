<template>
  <div class="api-page art-full-height">
    <div class="api-container">
      <!-- 左侧树 -->
      <div class="api-left">
        <ElCard shadow="never" class="tree-card">
          <template #header>
            <div class="tree-header">
              <span>API分组</span>
              <ElButton type="primary" size="small" link @click="handleAddGroup">
                新增分组
              </ElButton>
            </div>
          </template>
          <ApiTree
            ref="apiTreeRef"
            :loading="treeLoading"
            @node-click="handleNodeClick"
            @edit="handleEditGroup"
            @delete="handleDeleteGroup"
          />
        </ElCard>
      </div>

      <!-- 右侧表格 -->
      <div class="api-right">
        <!-- 搜索栏 -->
        <ApiSearch
          v-show="showSearchBar"
          v-model="searchForm"
          @search="handleSearch"
          @reset="resetSearchParams"
        />

        <!-- 表格卡片 -->
        <ElCard
          class="art-table-card"
          shadow="never"
          :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
        >
          <ArtTableHeader
            v-model:columns="columns"
            v-model:showSearchBar="showSearchBar"
            :loading="loading"
            @refresh="refreshData"
          >
            <template #left>
              <ElSpace wrap>
                <ElButton type="primary" @click="showDialog('add')"> 新增API</ElButton>
                <ElButton
                  v-if="currentNode && currentNode.id !== 0"
                  plain
                  @click="clearNodeSelection"
                >
                  清除选择 ({{ currentNode.name }})
                </ElButton>
              </ElSpace>
            </template>
          </ArtTableHeader>

          <!-- 表格 -->
          <ApiTable
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
            @edit="handleEdit"
            @delete="handleDelete"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </ElCard>
      </div>
    </div>

    <!-- API编辑弹窗 -->
    <ApiEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :api-data="currentApiData"
      :parent-id="selectedParentId"
      :is-group="isEditingGroup"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import ApiTree from './modules/api-tree.vue'
  import ApiSearch from './modules/api-search.vue'
  import ApiTable from './modules/api-table.vue'
  import ApiEditDialog from './modules/api-edit-dialog.vue'
  import { searchApiApi, deleteApiApi, type ApiSysAPI } from '@/api/portal/api'
  import { useApiTableConfig } from './modules/table-config'

  defineOptions({ name: 'ApiManage' })

  // 使用表格配置
  const { loading, treeLoading, showSearchBar, createTableColumns } = useApiTableConfig()

  // 树组件引用
  const apiTreeRef = ref()

  // 状态管理
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentApiData = ref<ApiSysAPI | undefined>(undefined)
  const currentNode = ref<any>(null)
  const selectedParentId = ref<number>(0)
  const isEditingGroup = ref(false)

  // 表格数据
  const data = ref<ApiSysAPI[]>([])

  // 搜索表单
  const searchForm = ref({
    name: undefined,
    path: undefined,
    method: undefined
  })

  // 搜索参数
  const searchParams = ref<any>({})

  // 分页配置
  const pagination = ref({
    current: 1,
    size: 20,
    total: 0
  })

  // 处理编辑
  const handleEdit = (row: ApiSysAPI) => {
    showDialog('edit', row)
  }

  // 处理删除
  const handleDelete = async (row: ApiSysAPI) => {
    try {
      await ElMessageBox.confirm(`确定删除API"${row.name}"吗？此操作不可恢复！`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      await deleteApiApi(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    }
  }

  // 创建表格列配置
  const { columns } = createTableColumns({
    handleEdit,
    handleDelete
  })

  // 获取数据
  const getData = async () => {
    try {
      loading.value = true
      const params = {
        page: pagination.value.current,
        pageSize: pagination.value.size,
        ...searchParams.value,
        // 如果选中了节点，添加父级ID过滤
        ...(currentNode.value &&
          currentNode.value.id !== 0 && {
            parentId: currentNode.value.id
          })
      }

      const response = await searchApiApi(params)
      data.value = response.items || []
      pagination.value.total = response.total || 0
    } catch (error) {
    } finally {
      loading.value = false
    }
  }

  // 刷新数据
  const refreshData = () => {
    getData()
    // 同时刷新树
    apiTreeRef.value?.loadTree()
  }

  // 处理节点点击
  const handleNodeClick = (node: any) => {
    currentNode.value = node
    // 重置分页
    pagination.value.current = 1
    // 刷新表格数据
    getData()
  }

  // 清除节点选择
  const clearNodeSelection = () => {
    currentNode.value = null
    apiTreeRef.value?.clearSelection()
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
  const showDialog = (type: 'add' | 'edit', row?: ApiSysAPI) => {
    dialogVisible.value = true
    dialogType.value = type
    currentApiData.value = row
    isEditingGroup.value = false

    // 设置父级ID
    if (type === 'add') {
      selectedParentId.value = currentNode.value?.id || 0
    } else if (row) {
      selectedParentId.value = row.parentId
    }
  }

  // 处理新增分组
  const handleAddGroup = () => {
    dialogVisible.value = true
    dialogType.value = 'add'
    currentApiData.value = undefined
    isEditingGroup.value = true
    selectedParentId.value = currentNode.value?.id || 0
  }

  // 处理编辑分组（从树）
  const handleEditGroup = (node: any) => {
    dialogVisible.value = true
    dialogType.value = 'edit'
    currentApiData.value = {
      id: node.id,
      parentId: node.pid || 0,
      name: node.name,
      path: '',
      method: '',
      isPermission: 0,
      createdBy: '',
      updatedBy: '',
      createdAt: 0,
      updatedAt: 0
    }
    isEditingGroup.value = true
    selectedParentId.value = node.pid || 0
  }

  // 处理删除分组（从树）
  const handleDeleteGroup = async (node: any) => {
    try {
      await ElMessageBox.confirm(
        `确定删除分组"${node.name}"吗？删除后其下所有API也将被删除！`,
        '删除分组',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await deleteApiApi(node.id)
      ElMessage.success('删除分组成功')

      // 清除选择并刷新
      currentNode.value = null
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    }
  }

  // 对话框成功回调
  const handleDialogSuccess = () => {
    refreshData()
  }

  // 初始化
  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .api-page {

    .api-container {
      display: flex;
      gap: 12px;
      height: 100%;

      .api-left {
        width: 300px;
        flex-shrink: 0;

        .tree-card {
          height: 100%;
          display: flex;
          flex-direction: column;

          :deep(.el-card__body) {
            flex: 1;
            overflow: auto;
          }

          .tree-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        }
      }

      .api-right {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
    }
  }
</style>
