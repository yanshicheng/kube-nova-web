<template>
  <div class="dept-page art-full-height">
    <!-- 搜索栏 -->
    <DeptSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard
      class="art-table-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
    >
      <div class="dept-header">
        <h3>部门管理</h3>
        <ElSpace>
          <ElButton type="primary" @click="handleAdd(null)" :disabled="deleteLoading">
            新增部门
          </ElButton>
          <ElButton @click="expandAll">{{ isExpandAll ? '全部折叠' : '全部展开' }}</ElButton>
          <ElButton @click="refreshData" :loading="loading">刷新</ElButton>
          <ElButton @click="toggleSearchBar">
            {{ showSearchBar ? '隐藏搜索' : '显示搜索' }}
          </ElButton>
        </ElSpace>
      </div>

      <div class="dept-content">
        <!-- 使用现有的 DeptTree 组件 -->
        <DeptTree
          ref="deptTreeRef"
          :data="filteredDeptTreeData"
          :loading="loading"
          :expand-all="isExpandAll"
          :submit-loading="deleteLoading"
          @add="handleAdd"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
    </ElCard>

    <!-- 部门编辑弹窗 -->
    <DeptDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :dept-data="currentDeptData"
      :dept-tree="deptTreeData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { getDeptTreeApi, deleteDeptApi, type DeptSysDeptTree } from '@/api/portal/dept'
  import DeptTree from './modules/dept-tree.vue'
  import DeptDialog from './modules/dept-dialog.vue'
  import DeptSearch from './modules/dept-search.vue'

  defineOptions({ name: 'Dept' })

  // 状态管理
  const loading = ref(false)
  const deleteLoading = ref(false) // 删除loading状态
  const dialogVisible = ref(false)
  const showSearchBar = ref(true)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentDeptData = ref<DeptSysDeptTree | null>(null)
  const deptTreeData = ref<DeptSysDeptTree[]>([])
  const isExpandAll = ref(false) // 默认折叠

  // 搜索相关
  const searchForm = ref<{
    name: string
    leader: string
    status?: number // 添加 status 属性
  }>({
    name: '',
    leader: ''
  })
  const deptTreeRef = ref()

  // 递归搜索部门树
  const filterDeptTree = (depts: DeptSysDeptTree[], searchParams: any): DeptSysDeptTree[] => {
    const { name, leader, status } = searchParams

    return depts.reduce((filtered: DeptSysDeptTree[], dept) => {
      // 检查当前部门是否匹配搜索条件
      let isMatch = true

      if (name && !dept.name.toLowerCase().includes(name.toLowerCase())) {
        isMatch = false
      }

      if (leader && dept.leader && !dept.leader.toLowerCase().includes(leader.toLowerCase())) {
        isMatch = false
      }

      if (status !== undefined && dept.status !== status) {
        isMatch = false
      }

      // 递归处理子部门
      let filteredChildren: DeptSysDeptTree[] = []
      if (dept.children && dept.children.length > 0) {
        filteredChildren = filterDeptTree(dept.children, searchParams)
      }

      // 如果当前部门匹配或者有匹配的子部门，则包含此部门
      if (isMatch || filteredChildren.length > 0) {
        filtered.push({
          ...dept,
          children: filteredChildren
        })
      }

      return filtered
    }, [])
  }

  // 过滤后的部门树数据
  const filteredDeptTreeData = computed(() => {
    const hasSearchParams =
      searchForm.value.name || searchForm.value.leader || searchForm.value.status !== undefined

    if (!hasSearchParams) {
      return deptTreeData.value
    }

    return filterDeptTree(deptTreeData.value, searchForm.value)
  })

  // 获取部门树数据
  const getDeptTree = async () => {
    try {
      loading.value = true
      const res = await getDeptTreeApi()
      deptTreeData.value = res || []
    } catch (error) {
    } finally {
      loading.value = false
    }
  }

  // 刷新数据
  const refreshData = () => {
    getDeptTree()
  }

  // 展开/折叠全部
  const expandAll = () => {
    isExpandAll.value = !isExpandAll.value
    deptTreeRef.value?.setExpandAll(isExpandAll.value)
  }

  // 切换搜索栏显示
  const toggleSearchBar = () => {
    showSearchBar.value = !showSearchBar.value
  }

  // 搜索处理
  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchForm.value, params)
  }

  // 重置搜索
  const handleReset = () => {
    Object.assign(searchForm.value, {
      name: '',
      leader: ''
    })
  }

  // 新增部门
  const handleAdd = (parentDept: DeptSysDeptTree | null) => {
    dialogType.value = 'add'
    currentDeptData.value = parentDept
    dialogVisible.value = true
  }

  // 编辑部门
  const handleEdit = (dept: DeptSysDeptTree) => {
    dialogType.value = 'edit'
    currentDeptData.value = dept
    dialogVisible.value = true
  }

  // 删除部门
  const handleDelete = async (dept: DeptSysDeptTree) => {
    // 检查是否有子部门
    if (dept.children && dept.children.length > 0) {
      return
    }

    try {
      await ElMessageBox.confirm(`确定要删除部门"${dept.name}"吗？删除后不可恢复！`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      deleteLoading.value = true // 开始loading
      await deleteDeptApi(dept.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      deleteLoading.value = false // 结束loading
    }
  }

  // 处理弹窗成功事件
  const handleDialogSuccess = () => {
    refreshData()
  }

  // 初始化
  onMounted(() => {
    getDeptTree()
  })
</script>

<style lang="scss" scoped>
  .dept-page {

    .dept-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
    }

    .dept-content {
      min-height: 500px;
    }
  }
</style>
