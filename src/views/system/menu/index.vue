<!-- 菜单管理页面 -->
<template>
  <div class="menu-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="formFilters"
      :items="formItems"
      :showExpand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader
        :showZebra="false"
        :loading="loading"
        v-model:columns="columnChecks"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElButton v-auth="'add'" @click="handleAddMenu" v-ripple> 添加菜单 </ElButton>
          <ElButton @click="toggleExpand" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        :columns="columns"
        :data="filteredTableData"
        :stripe="false"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      />

      <!-- 菜单弹窗 -->
      <MenuDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :editData="editData"
        :parentMenuList="parentMenuList"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { formatMenuTitle } from '@/utils/router'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import MenuDialog from './modules/menu-dialog.vue'
  import {
    getAllMenuTreeApi,
    searchMenuTreeApi,
    addMenuApi,
    updateMenuApi,
    deleteMenuApi,
    getSysMenuSimpleTreeApi,
    type MenuSysMenuTree,
    type MenuAddRequest,
    type MenuUpdateRequest,
    type MenuSearchRequest
  } from '@/api/portal/menu'
  import { ElTag, ElMessageBox, ElMessage } from 'element-plus'

  defineOptions({ name: 'Menus' })

  // 状态管理
  const loading = ref(false)
  const isExpanded = ref(false)
  const tableRef = ref()

  // 弹窗相关
  const dialogVisible = ref(false)
  const dialogType = ref<1 | 2 | 3>(2) // 1目录 2菜单 3按钮
  const editData = ref<MenuSysMenuTree | null>(null)
  const parentMenuList = ref<any[]>([])

  // 搜索相关
  const initialSearchState = {
    name: '',
    title: ''
  }

  const formFilters = reactive({ ...initialSearchState })
  const appliedFilters = reactive({ ...initialSearchState })

  const formItems = computed(() => [
    {
      label: '菜单名称',
      key: 'name',
      type: 'input',
      props: { clearable: true, placeholder: '请输入菜单名称' }
    },
    {
      label: '菜单标题',
      key: 'title',
      type: 'input',
      props: { clearable: true, placeholder: '请输入菜单标题' }
    }
  ])

  onMounted(() => {
    getMenuList()
    getParentMenuList()
  })

  /**
   * 获取父级菜单列表（用于下拉选择）
   */
  const getParentMenuList = async (): Promise<void> => {
    try {
      const list = await getSysMenuSimpleTreeApi({ status: 1 })
      parentMenuList.value = list || []
    } catch (error) {
      console.error('获取父级菜单失败:', error)
    }
  }

  /**
   * 获取菜单列表数据
   */
  const getMenuList = async (): Promise<void> => {
    loading.value = true

    try {
      const params: MenuSearchRequest = {}

      if (appliedFilters.name) {
        params.name = appliedFilters.name
      }
      if (appliedFilters.title) {
        params.title = appliedFilters.title
      }

      const response = await searchMenuTreeApi(params)
      tableData.value = response.items || []
    } catch (error) {
      console.error('获取菜单失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取菜单类型标签颜色
   */
  const getMenuTypeTag = (
    menuType: number
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    const typeMap = {
      1: 'info' as const, // 目录
      2: 'primary' as const, // 菜单
      3: 'danger' as const // 按钮
    }
    return typeMap[menuType as keyof typeof typeMap] || 'info'
  }

  /**
   * 获取菜单类型文本
   */
  const getMenuTypeText = (menuType: number): string => {
    const typeMap = {
      1: '目录',
      2: '菜单',
      3: '按钮'
    }
    return typeMap[menuType as keyof typeof typeMap] || '未知'
  }

  // 表格列配置
  const { columnChecks, columns } = useTableColumns(() => [
    {
      prop: 'title',
      label: '菜单名称',
      minWidth: 180,
      formatter: (row: MenuSysMenuTree) => formatMenuTitle(row.title)
    },
    {
      prop: 'menuType',
      label: '菜单类型',
      width: 100,
      formatter: (row: MenuSysMenuTree) => {
        return h(ElTag, { type: getMenuTypeTag(row.menuType) }, () => getMenuTypeText(row.menuType))
      }
    },
    {
      prop: 'name',
      label: '路由名称',
      width: 150,
      formatter: (row: MenuSysMenuTree) => row.name || '-'
    },
    {
      prop: 'path',
      label: '路由地址',
      minWidth: 150,
      formatter: (row: MenuSysMenuTree) => {
        if (row.menuType === 3) return '-' // 按钮没有路由
        return row.link || row.path || '-'
      }
    },
    {
      prop: 'component',
      label: '组件路径',
      minWidth: 180,
      formatter: (row: MenuSysMenuTree) => row.component || '-'
    },
    {
      prop: 'label',
      label: '权限标识',
      width: 120,
      formatter: (row: MenuSysMenuTree) => row.label || '-'
    },
    {
      prop: 'sort',
      label: '排序',
      width: 80,
      align: 'center',
      formatter: (row: MenuSysMenuTree) => row.sort || 0
    },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      align: 'center',
      formatter: (row: MenuSysMenuTree) => {
        return h(
          ElTag,
          { type: row.status === 1 ? 'success' : 'info', size: 'small' },
          () => (row.status === 1 ? '启用' : '停用')
        )
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 200,
      align: 'right',
      fixed: 'right',
      formatter: (row: MenuSysMenuTree) => {
        const buttonStyle = { style: 'text-align: right' }

        // 按钮类型的操作
        if (row.menuType === 3) {
          return h('div', buttonStyle, [
            h(ArtButtonTable, {
              type: 'edit',
              onClick: () => handleEditMenu(row)
            }),
            h(ArtButtonTable, {
              type: 'delete',
              onClick: () => handleDeleteMenu(row)
            })
          ])
        }

        // 目录和菜单类型的操作
        return h('div', buttonStyle, [
          h(ArtButtonTable, {
            type: 'add',
            onClick: () => handleAddSubMenu(row),
            title: '新增子菜单'
          }),
          h(ArtButtonTable, {
            type: 'edit',
            onClick: () => handleEditMenu(row)
          }),
          h(ArtButtonTable, {
            type: 'delete',
            onClick: () => handleDeleteMenu(row)
          })
        ])
      }
    }
  ])

  // 数据相关
  const tableData = ref<MenuSysMenuTree[]>([])

  /**
   * 重置搜索条件
   */
  const handleReset = (): void => {
    Object.assign(formFilters, { ...initialSearchState })
    Object.assign(appliedFilters, { ...initialSearchState })
    getMenuList()
  }

  /**
   * 执行搜索
   */
  const handleSearch = (): void => {
    Object.assign(appliedFilters, { ...formFilters })
    getMenuList()
  }

  /**
   * 刷新菜单列表
   */
  const handleRefresh = (): void => {
    getMenuList()
    getParentMenuList()
  }

  // 过滤后的表格数据
  const filteredTableData = computed(() => {
    return tableData.value
  })

  /**
   * 添加顶级菜单
   */
  const handleAddMenu = (): void => {
    dialogType.value = 2 // 默认为菜单类型
    editData.value = null
    dialogVisible.value = true
  }

  /**
   * 添加子菜单
   */
  const handleAddSubMenu = (row: MenuSysMenuTree): void => {
    dialogType.value = 2 // 默认为菜单类型
    editData.value = {
      ...row,
      parentId: row.id, // 设置父级ID
      id: 0 // 新增时ID为0
    } as any
    dialogVisible.value = true
  }

  /**
   * 编辑菜单
   */
  const handleEditMenu = (row: MenuSysMenuTree): void => {
    dialogType.value = row.menuType as 1 | 2 | 3
    editData.value = { ...row }
    dialogVisible.value = true
  }

  /**
   * 提交表单数据
   */
  const handleSubmit = async (formData: any): Promise<void> => {
    try {
      loading.value = true

      // 数据转换
      const submitData: any = {
        parentId: formData.parentId || 0,
        menuType: formData.menuType,
        name: formData.name,
        path: formData.path || '',
        component: formData.component || '',
        redirect: formData.redirect || '',
        label: formData.label || '',
        title: formData.title,
        icon: formData.icon || '',
        sort: formData.sort || 0,
        link: formData.link || '',
        isEnable: formData.isEnable ? 1 : 0,
        isMenu: formData.isMenu ? 1 : 0,
        keepAlive: formData.keepAlive ? 1 : 0,
        isHide: formData.isHide ? 1 : 0,
        isIframe: formData.isIframe ? 1 : 0,
        isHideTab: formData.isHideTab ? 1 : 0,
        showBadge: formData.showBadge ? 1 : 0,
        showTextBadge: formData.showTextBadge || '',
        isFirstLevel: formData.isFirstLevel ? 1 : 0,
        fixedTab: formData.fixedTab ? 1 : 0,
        isFullPage: formData.isFullPage ? 1 : 0,
        activePath: formData.activePath || '',
        roles: formData.roles && formData.roles.length > 0 ? JSON.stringify(formData.roles) : '',
        status: formData.status ? 1 : 0
      }

      // 按钮类型特殊字段
      if (formData.menuType === 3) {
        submitData.authName = formData.authName || ''
        submitData.authLabel = formData.authLabel || ''
        submitData.authIcon = formData.authIcon || ''
        submitData.authSort = formData.authSort || 0
      }

      if (formData.id && formData.id > 0) {
        // 更新
        await updateMenuApi({ id: formData.id, ...submitData } as MenuUpdateRequest)
        ElMessage.success('更新菜单成功')
      } else {
        // 新增
        await addMenuApi(submitData as MenuAddRequest)
        ElMessage.success('添加菜单成功')
      }

      dialogVisible.value = false
      getMenuList()
      getParentMenuList()
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除菜单
   */
  const handleDeleteMenu = async (row: MenuSysMenuTree): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        `确定要删除菜单"${row.title}"吗？删除后无法恢复，且会删除所有子菜单！`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      )

      loading.value = true
      await deleteMenuApi(row.id)
      ElMessage.success('删除成功')
      getMenuList()
      getParentMenuList()
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error('删除失败:', error)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换展开/收起所有菜单
   */
  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef && filteredTableData.value) {
        const processRows = (rows: MenuSysMenuTree[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(filteredTableData.value)
      }
    })
  }
</script>