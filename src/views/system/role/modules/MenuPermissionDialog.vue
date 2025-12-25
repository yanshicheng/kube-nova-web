<template>
  <ElDialog
    v-model="visible"
    title=""
    width="85%"
    top="5vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
    class="menu-permission-dialog"
  >
    <!-- 头部 -->
    <template #header>
      <div class="dialog-header">
        <IconMenu class="header-icon" />
        <div class="header-info">
          <h2>菜单权限配置 - 卡片视图</h2>
          <p
            >为角色 <span class="role-name">{{ roleData?.name }}</span> 分配菜单权限</p
          >
        </div>
      </div>
    </template>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElInput
          v-model="searchText"
          placeholder="搜索菜单名称..."
          :prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <ElTag type="info" effect="plain" size="large">
          ✓ 已选 <strong>{{ selectedCount }}</strong> 项
        </ElTag>
      </div>
      <div class="toolbar-right">
        <ElButton @click="expandAll" :disabled="loading" text>
          📂 {{ allExpanded ? '全部收起' : '全部展开' }}
        </ElButton>
        <ElButton @click="selectAll" :disabled="loading" text>
          ☑️ {{ allSelected ? '取消全选' : '全选' }}
        </ElButton>
      </div>
    </div>

    <!-- 卡片容器 -->
    <div class="cards-container" v-loading="loading">
      <div v-for="group in filteredGroups" :key="group.id" class="permission-card">
        <!-- 卡片头部 -->
        <div class="card-header" @click="toggleCard(group)">
          <div class="card-header-left">
            <ElCheckbox
              v-model="group.checked"
              :indeterminate="group.indeterminate"
              @click.stop
              @change="handleGroupCheck(group)"
            />
            <span class="card-icon">📁</span>
            <span class="card-title">{{ group.title }}</span>
          </div>
          <span class="card-count">
            已选 <span class="count-num">{{ group.checkedCount }}</span> /
            {{ group.totalCount }}
          </span>
          <ElIcon :class="['collapse-icon', { collapsed: !group.expanded }]">
            <ArrowDown />
          </ElIcon>
        </div>

        <!-- 卡片内容 -->
        <div v-show="group.expanded" class="card-content">
          <div
            v-for="item in group.items"
            :key="item.id"
            :class="['permission-item', { checked: item.checked }]"
            @click="toggleItem(item)"
          >
            <ElCheckbox v-model="item.checked" @click.stop @change="handleItemCheck(item, group)" />
            <span class="item-icon">{{ getItemIcon(item.menuType) }}</span>
            <div class="item-info">
              <div class="item-name">{{ item.title }}</div>
              <div class="item-meta">
                <ElTag
                  size="small"
                  :type="getMenuTypeTag(item.menuType).type"
                  effect="plain"
                  class="item-tag"
                >
                  {{ getMenuTypeTag(item.menuType).text }}
                </ElTag>
                <span v-if="item.childCount > 0" class="item-desc">
                  包含 {{ item.childCount }} 个子项
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-icon">📂</span>
        <span
          >目录: <span class="stat-value">{{ typeStats.dir }}</span></span
        >
      </div>
      <div class="stat-item">
        <span class="stat-icon">📋</span>
        <span
          >菜单: <span class="stat-value">{{ typeStats.menu }}</span></span
        >
      </div>
      <div class="stat-item">
        <span class="stat-icon">🔘</span>
        <span
          >按钮: <span class="stat-value">{{ typeStats.button }}</span></span
        >
      </div>
      <div class="stat-item">
        <span class="stat-icon">📁</span>
        <span
          >分组: <span class="stat-value">{{ groups.length }}</span></span
        >
      </div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <ElIcon :size="14" color="#409eff">
            <InfoFilled />
          </ElIcon>
          <span>权限变更将在保存后立即生效</span>
        </div>
        <div class="footer-actions">
          <ElButton @click="handleCancel" :disabled="submitLoading">取消</ElButton>
          <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ submitLoading ? '保存中...' : '💾 保存权限' }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Search, ArrowDown, InfoFilled } from '@element-plus/icons-vue'
  import {
    getSysMenuSimpleTreeApi,
    bindRoleMenuApi,
    getRoleMenuApi,
    type MenuSysMenuSimpleTreeNode,
    type RoleSysRole
  } from '@/api/portal'

  // 自定义图标
  const IconMenu = {
    render() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: '20',
          height: '20',
          fill: 'currentColor'
        },
        [
          h('path', {
            d: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z'
          })
        ]
      )
    }
  }

  interface ExtendedMenuItem extends MenuSysMenuSimpleTreeNode {
    checked?: boolean
    childCount?: number
    menuType?: number
  }

  interface PermissionGroup {
    id: number
    title: string
    checked: boolean
    indeterminate: boolean
    expanded: boolean
    items: ExtendedMenuItem[]
    checkedCount: number
    totalCount: number
  }

  interface Props {
    modelValue: boolean
    roleData?: RoleSysRole
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  // 状态
  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const submitLoading = ref(false)
  const searchText = ref('')
  const allExpanded = ref(true)
  const treeData = ref<ExtendedMenuItem[]>([])
  const groups = ref<PermissionGroup[]>([])
  const allNodes = ref<Map<number, ExtendedMenuItem>>(new Map())
  const checkedIds = ref<Set<number>>(new Set())

  // 过滤后的分组
  const filteredGroups = computed(() => {
    if (!searchText.value) {
      return groups.value
    }
    const keyword = searchText.value.toLowerCase()
    return groups.value
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.title?.toLowerCase().includes(keyword))
      }))
      .filter((group) => group.items.length > 0)
  })

  // 已选数量
  const selectedCount = computed(() => checkedIds.value.size)

  // 是否全选
  const allSelected = computed(() => {
    const totalCount = allNodes.value.size
    return totalCount > 0 && checkedIds.value.size === totalCount
  })

  // 类型统计
  const typeStats = computed(() => {
    const stats = { dir: 0, menu: 0, button: 0 }
    checkedIds.value.forEach((id) => {
      const node = allNodes.value.get(id)
      if (node) {
        switch (node.menuType) {
          case 1:
            stats.dir++
            break
          case 2:
            stats.menu++
            break
          case 3:
            stats.button++
            break
        }
      }
    })
    return stats
  })

  // 监听弹窗显示
  watch(visible, async (val) => {
    if (val && props.roleData) {
      await initData()
    }
  })

  // 初始化数据
  const initData = async () => {
    try {
      loading.value = true

      // 获取菜单树
      const menuRes = await getSysMenuSimpleTreeApi({ status: 1 })
      const rawData = menuRes || []

      // 处理树数据
      treeData.value = processTreeData(rawData)

      // 构建分组
      buildGroups()

      // 获取角色已有的菜单权限
      const roleMenuRes = await getRoleMenuApi(props.roleData!.id)
      const checkedMenuIds = roleMenuRes || []

      // 设置选中状态
      checkedIds.value = new Set(checkedMenuIds)
      updateCheckedState()
      updateGroupStates()
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
    } finally {
      loading.value = false
    }
  }

  // 处理树数据
  const processTreeData = (nodes: MenuSysMenuSimpleTreeNode[]): ExtendedMenuItem[] => {
    return nodes.map((node) => {
      const extended: ExtendedMenuItem = {
        ...node,
        checked: false,
        childCount: 0
      }

      // 存储到全局节点映射
      allNodes.value.set(node.id, extended)

      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        extended.children = processTreeData(node.children)
        extended.childCount = countAllChildren(extended)
      }

      return extended
    })
  }

  // 统计所有子节点数量
  const countAllChildren = (node: ExtendedMenuItem): number => {
    let count = 0
    if (node.children) {
      count = node.children.length
      node.children.forEach((child) => {
        count += countAllChildren(child as ExtendedMenuItem)
      })
    }
    return count
  }

  // 构建分组
  const buildGroups = () => {
    const groupList: PermissionGroup[] = []

    treeData.value.forEach((topNode) => {
      const allItems: ExtendedMenuItem[] = []

      // 收集该分组下的所有菜单项
      const collectItems = (node: ExtendedMenuItem) => {
        allItems.push(node)
        if (node.children) {
          node.children.forEach((child) => {
            collectItems(child as ExtendedMenuItem)
          })
        }
      }

      collectItems(topNode)

      groupList.push({
        id: topNode.id,
        title: topNode.title,
        checked: false,
        indeterminate: false,
        expanded: true,
        items: allItems,
        checkedCount: 0,
        totalCount: allItems.length
      })
    })

    groups.value = groupList
  }

  // 更新选中状态
  const updateCheckedState = () => {
    allNodes.value.forEach((node) => {
      node.checked = checkedIds.value.has(node.id)
    })
  }

  // 更新分组状态
  const updateGroupStates = () => {
    groups.value.forEach((group) => {
      const checkedCount = group.items.filter((item) => item.checked).length
      group.checkedCount = checkedCount

      if (checkedCount === 0) {
        group.checked = false
        group.indeterminate = false
      } else if (checkedCount === group.totalCount) {
        group.checked = true
        group.indeterminate = false
      } else {
        group.checked = false
        group.indeterminate = true
      }
    })
  }

  // 处理分组选中
  const handleGroupCheck = (group: PermissionGroup) => {
    const checked = group.checked
    group.items.forEach((item) => {
      item.checked = checked
      if (checked) {
        checkedIds.value.add(item.id)
      } else {
        checkedIds.value.delete(item.id)
      }
    })
    updateGroupStates()
  }

  // 处理项选中
  const handleItemCheck = (item: ExtendedMenuItem, group: PermissionGroup) => {
    if (item.checked) {
      checkedIds.value.add(item.id)
      // 如果有子节点，同时选中
      if (item.children) {
        selectAllChildren(item, true)
      }
    } else {
      checkedIds.value.delete(item.id)
      // 如果有子节点，同时取消
      if (item.children) {
        selectAllChildren(item, false)
      }
    }
    updateCheckedState()
    updateGroupStates()
  }

  // 递归选中/取消所有子项
  const selectAllChildren = (node: ExtendedMenuItem, checked: boolean) => {
    if (node.children) {
      node.children.forEach((child) => {
        const childNode = child as ExtendedMenuItem
        childNode.checked = checked
        if (checked) {
          checkedIds.value.add(childNode.id)
        } else {
          checkedIds.value.delete(childNode.id)
        }
        if (childNode.children) {
          selectAllChildren(childNode, checked)
        }
      })
    }
  }

  // 切换项
  const toggleItem = (item: ExtendedMenuItem) => {
    // 点击项本身不会触发选中，只有点击checkbox才会
  }

  // 切换卡片展开
  const toggleCard = (group: PermissionGroup) => {
    group.expanded = !group.expanded
  }

  // 全部展开/收起
  const expandAll = () => {
    allExpanded.value = !allExpanded.value
    groups.value.forEach((group) => {
      group.expanded = allExpanded.value
    })
  }

  // 全选/取消全选
  const selectAll = () => {
    const checked = !allSelected.value
    allNodes.value.forEach((node) => {
      node.checked = checked
      if (checked) {
        checkedIds.value.add(node.id)
      } else {
        checkedIds.value.delete(node.id)
      }
    })
    updateGroupStates()
  }

  // 搜索
  const handleSearch = () => {
    // 搜索时自动展开所有卡片
    if (searchText.value) {
      groups.value.forEach((group) => {
        group.expanded = true
      })
    }
  }

  // 获取菜单类型图标
  const getItemIcon = (menuType?: number) => {
    switch (menuType) {
      case 1:
        return '📂'
      case 2:
        return '📋'
      case 3:
        return '🔘'
      default:
        return '📄'
    }
  }

  // 获取菜单类型标签
  const getMenuTypeTag = (menuType?: number) => {
    switch (menuType) {
      case 1:
        return { text: '目录', type: 'primary' }
      case 2:
        return { text: '菜单', type: 'success' }
      case 3:
        return { text: '按钮', type: 'warning' }
      default:
        return { text: '未知', type: 'info' }
    }
  }

  // 关闭
  const handleClose = () => {
    if (submitLoading.value) return
    searchText.value = ''
  }

  // 取消
  const handleCancel = () => {
    visible.value = false
  }

  // 提交
  const handleSubmit = async () => {
    try {
      await ElMessageBox.confirm(
        `确定要为角色"${props.roleData?.name}"更新菜单权限吗？`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      submitLoading.value = true

      const allIds = Array.from(checkedIds.value)

      await bindRoleMenuApi({
        roleId: props.roleData!.id,
        menuIds: allIds
      })

      ElMessage.success('菜单权限保存成功')
      emit('success')
      visible.value = false
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    } finally {
      submitLoading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .menu-permission-dialog {
    :deep(.el-dialog__header) {
      padding: 0;
      margin-right: 0;
    }

    :deep(.el-dialog__body) {
      padding: 0;
    }

    :deep(.el-dialog__footer) {
      padding: 0;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }

    .header-info {
      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      p {
        margin: 4px 0 0;
        font-size: 14px;
        opacity: 0.9;

        .role-name {
          font-weight: 600;
        }
      }
    }
  }

  .toolbar {
    padding: 16px 20px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .toolbar-left {
      display: flex;
      gap: 12px;
      align-items: center;

      .search-input {
        width: 240px;
      }
    }

    .toolbar-right {
      display: flex;
      gap: 12px;
    }
  }

  .cards-container {
    padding: 20px;
    height: 500px;
    overflow-y: auto;
    background: #fafbfc;

    .permission-card {
      background: white;
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .card-header {
        padding: 14px 18px;
        background: linear-gradient(to right, #f5f7fa, white);
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;

        &:hover {
          background: linear-gradient(to right, #ecf5ff, white);
        }

        .card-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;

          .card-icon {
            font-size: 20px;
          }

          .card-title {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
          }
        }

        .card-count {
          margin-right: 12px;
          font-size: 12px;
          color: #909399;

          .count-num {
            color: #409eff;
            font-weight: 600;
          }
        }

        .collapse-icon {
          font-size: 14px;
          color: #909399;
          transition: transform 0.3s;

          &.collapsed {
            transform: rotate(-90deg);
          }
        }
      }

      .card-content {
        padding: 12px 18px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 12px;

        .permission-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #fafbfc;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
          cursor: pointer;

          &:hover {
            background: #ecf5ff;
            border-color: #b3d8ff;
          }

          &.checked {
            background: #ecf5ff;
            border-color: #409eff;
          }

          .item-icon {
            font-size: 16px;
          }

          .item-info {
            flex: 1;
            min-width: 0;

            .item-name {
              font-size: 13px;
              color: #303133;
              margin-bottom: 4px;
              font-weight: 500;
            }

            .item-meta {
              display: flex;
              gap: 8px;
              align-items: center;

              .item-tag {
                font-size: 11px;
              }

              .item-desc {
                font-size: 11px;
                color: #909399;
              }
            }
          }
        }
      }
    }
  }

  .stats-bar {
    padding: 16px 20px;
    background: #f5f7fa;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 24px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #606266;

      .stat-icon {
        font-size: 16px;
      }

      .stat-value {
        color: #409eff;
        font-weight: 600;
        font-size: 16px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #fafbfc;
    border-top: 1px solid #e5e7eb;

    .footer-info {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #909399;
      font-size: 13px;
    }

    .footer-actions {
      display: flex;
      gap: 12px;
    }
  }
</style>
