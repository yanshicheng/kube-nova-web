<template>
  <ElDialog
    v-model="visible"
    title=""
    width="90%"
    top="5vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
    class="api-permission-dialog"
  >
    <!-- 头部 -->
    <template #header>
      <div class="dialog-header">
        <IconApi class="header-icon" />
        <div class="header-info">
          <h2>API权限配置 - 层级选择器</h2>
          <p>为角色 <span class="role-name">{{ roleData?.name }}</span> 分配API权限</p>
        </div>
      </div>
    </template>

    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <span
        v-for="(item, index) in breadcrumbs"
        :key="index"
        @click="navigateToBreadcrumb(index)"
        :class="['breadcrumb-item', { current: index === breadcrumbs.length - 1 }]"
      >
        {{ item.icon }} {{ item.name }}
      </span>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElTag type="info" effect="plain" size="large">
          <IconCheck />
          已选择 <strong>{{ selectedCount }}</strong> 个API权限
        </ElTag>
        <ElTag type="success" effect="plain" size="large">
          📁 <strong>{{ totalGroups }}</strong> 个分组
        </ElTag>
      </div>
      <div class="toolbar-right">
        <ElButton @click="clearAllSelections" :disabled="submitLoading" text>
          🗑️ 清空选择
        </ElButton>
      </div>
    </div>

    <!-- 多列布局容器 -->
    <div class="columns-container" v-loading="loading">
      <div
        v-for="(column, columnIndex) in displayColumns"
        :key="columnIndex"
        class="column"
      >
        <div class="column-header">
          {{ column.title }}
        </div>
        <div class="column-content">
          <div
            v-for="item in column.items"
            :key="item.id"
            :class="[
              'column-item',
              { active: item.id === selectedPath[columnIndex]?.id }
            ]"
            @click="handleItemClick(item, columnIndex)"
          >
            <ElCheckbox
              v-model="item.checked"
              @click.stop
              @change="handleCheckChange(item)"
            />
            <span class="item-icon">
              {{ item.isPermission === 0 ? '📁' : '🔗' }}
            </span>
            <div class="item-content">
              <div class="item-name">{{ item.name }}</div>
              <div v-if="item.isPermission === 1 && item.method" class="item-desc">
                <ElTag
                  size="small"
                  :type="getMethodType(item.method)"
                  effect="plain"
                  class="method-tag"
                >
                  {{ item.method }}
                </ElTag>
                <span class="item-path">{{ item.path }}</span>
              </div>
              <div v-else class="item-desc">{{ item.childCount || 0 }} 个子项</div>
            </div>
            <span v-if="item.isPermission === 0 && item.children?.length" class="item-arrow">
              ›
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 已选区域 -->
    <div class="selected-area">
      <div class="selected-header">
        <div class="selected-title">✓ 已选择的API权限</div>
        <div class="selected-stats">
          <div class="stat-item">
            <span class="stat-label">GET:</span>
            <span class="stat-value">{{ methodStats.GET }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">POST:</span>
            <span class="stat-value">{{ methodStats.POST }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">PUT:</span>
            <span class="stat-value">{{ methodStats.PUT }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">DELETE:</span>
            <span class="stat-value">{{ methodStats.DELETE }}</span>
          </div>
        </div>
      </div>
      <div class="selected-list">
        <div v-if="selectedItems.length === 0" class="empty-state">暂无选择</div>
        <div
          v-for="item in selectedItems"
          :key="item.id"
          class="selected-tag"
        >
          <span class="tag-icon">
            {{ item.isPermission === 0 ? '📁' : '🔗' }}
          </span>
          <span class="tag-name">{{ item.name }}</span>
          <span v-if="item.path" class="tag-path">{{ item.fullPath }}</span>
          <ElIcon class="tag-remove" @click="removeSelection(item)">
            <Close />
          </ElIcon>
        </div>
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
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, Close } from '@element-plus/icons-vue'
import {
  getApiTreeApi,
  bindRoleApiApi,
  getRoleApiApi,
  type ApiSysAPITreeNode,
  type RoleSysRole
} from '@/api/portal'

// 自定义图标
const IconApi = {
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
          d: 'M7 3C5.9 3 5 3.9 5 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H7zm0 2h10v14H7V5zm2 2v2h6V7H9zm0 4v2h6v-2H9zm0 4v2h4v-2H9z'
        })
      ]
    )
  }
}

const IconCheck = {
  render() {
    return h(
      'svg',
      {
        viewBox: '0 0 16 16',
        width: '14',
        height: '14',
        fill: 'currentColor'
      },
      [
        h('path', {
          d: 'M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z'
        })
      ]
    )
  }
}

interface ExtendedApiNode extends ApiSysAPITreeNode {
  checked?: boolean
  childCount?: number
  fullPath?: string
  method?: string
  path?: string
}

interface Column {
  title: string
  items: ExtendedApiNode[]
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
const treeData = ref<ExtendedApiNode[]>([])
const selectedPath = ref<ExtendedApiNode[]>([])
const allNodes = ref<Map<number, ExtendedApiNode>>(new Map())
const checkedIds = ref<Set<number>>(new Set())

// 面包屑
const breadcrumbs = computed(() => {
  const crumbs = [{ name: '根目录', icon: '🏠' }]
  selectedPath.value.forEach((node, index) => {
    crumbs.push({
      name: node.name,
      icon: node.isPermission === 0 ? '📁' : '🔗'
    })
  })
  return crumbs
})

// 显示的列
const displayColumns = computed(() => {
  const columns: Column[] = []

  // 第一列：根目录
  columns.push({
    title: '📂 根目录',
    items: treeData.value
  })

  // 后续列：根据selectedPath添加
  selectedPath.value.forEach((node, index) => {
    if (node.children && node.children.length > 0) {
      columns.push({
        title: `${node.isPermission === 0 ? '📂' : '🔗'} ${node.name}`,
        items: node.children as ExtendedApiNode[]
      })
    }
  })

  return columns
})

// 已选项
const selectedItems = computed(() => {
  const items: ExtendedApiNode[] = []
  allNodes.value.forEach((node) => {
    if (node.checked) {
      items.push(node)
    }
  })
  return items
})

// 已选数量
const selectedCount = computed(() => {
  return Array.from(checkedIds.value).filter((id) => {
    const node = allNodes.value.get(id)
    return node?.isPermission === 1
  }).length
})

// 总分组数
const totalGroups = computed(() => {
  let count = 0
  allNodes.value.forEach((node) => {
    if (node.isPermission === 0) count++
  })
  return count
})

// 方法统计
const methodStats = computed(() => {
  const stats = { GET: 0, POST: 0, PUT: 0, DELETE: 0 }
  checkedIds.value.forEach((id) => {
    const node = allNodes.value.get(id)
    if (node?.isPermission === 1 && node.method) {
      const method = node.method.toUpperCase()
      if (method in stats) {
        stats[method as keyof typeof stats]++
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

    // 获取API树
    const apiRes = await getApiTreeApi()
    const rawData = apiRes || []

    // 处理树数据
    treeData.value = processTreeData(rawData)

    // 获取角色已有的API权限
    const roleApiRes = await getRoleApiApi(props.roleData!.id)
    const checkedApiIds = roleApiRes || []

    // 设置选中状态
    checkedIds.value = new Set(checkedApiIds)
    updateCheckedState()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 处理树数据
const processTreeData = (
  nodes: ApiSysAPITreeNode[],
  parentPath = ''
): ExtendedApiNode[] => {
  return nodes.map((node) => {
    const fullPath = parentPath ? `${parentPath} / ${node.name}` : node.name
    const extended: ExtendedApiNode = {
      ...node,
      checked: false,
      childCount: node.children?.length || 0,
      fullPath
    }

    // 存储到全局节点映射
    allNodes.value.set(node.id, extended)

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      extended.children = processTreeData(node.children, fullPath)
    }

    return extended
  })
}

// 更新选中状态
const updateCheckedState = () => {
  allNodes.value.forEach((node) => {
    node.checked = checkedIds.value.has(node.id)
  })
}

// 处理项点击
const handleItemClick = (item: ExtendedApiNode, columnIndex: number) => {
  if (item.isPermission === 0 && item.children && item.children.length > 0) {
    // 点击分组，展开下一列
    selectedPath.value = selectedPath.value.slice(0, columnIndex)
    selectedPath.value.push(item)
  }
}

// 处理选中状态变更
const handleCheckChange = (item: ExtendedApiNode) => {
  if (item.checked) {
    checkedIds.value.add(item.id)
    // 如果是分组，同时选中所有子项
    if (item.isPermission === 0) {
      selectAllChildren(item, true)
    }
  } else {
    checkedIds.value.delete(item.id)
    // 如果是分组，取消所有子项
    if (item.isPermission === 0) {
      selectAllChildren(item, false)
    }
  }
  updateCheckedState()
}

// 递归选中/取消所有子项
const selectAllChildren = (node: ExtendedApiNode, checked: boolean) => {
  if (node.children) {
    node.children.forEach((child) => {
      const childNode = child as ExtendedApiNode
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

// 面包屑导航
const navigateToBreadcrumb = (index: number) => {
  if (index === 0) {
    selectedPath.value = []
  } else {
    selectedPath.value = selectedPath.value.slice(0, index)
  }
}

// 清空所有选择
const clearAllSelections = () => {
  checkedIds.value.clear()
  updateCheckedState()
  ElMessage.success('已清空所有选择')
}

// 移除选择
const removeSelection = (item: ExtendedApiNode) => {
  item.checked = false
  checkedIds.value.delete(item.id)
  if (item.isPermission === 0) {
    selectAllChildren(item, false)
  }
}

// 获取方法类型
const getMethodType = (method: string) => {
  const methodUpper = method.toUpperCase()
  switch (methodUpper) {
    case 'GET':
      return 'success'
    case 'POST':
      return 'primary'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'danger'
    default:
      return 'info'
  }
}

// 关闭
const handleClose = () => {
  if (submitLoading.value) return
  selectedPath.value = []
}

// 取消
const handleCancel = () => {
  visible.value = false
}

// 提交
const handleSubmit = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要为角色"${props.roleData?.name}"更新API权限吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    submitLoading.value = true

    const allIds = Array.from(checkedIds.value)

    await bindRoleApiApi({
      roleId: props.roleData!.id,
      apiIds: allIds
    })

    ElMessage.success('API权限保存成功')
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
.api-permission-dialog {
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
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
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

.breadcrumb {
  padding: 12px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-wrap: wrap;

  .breadcrumb-item {
    color: #409eff;
    cursor: pointer;
    transition: all 0.2s;
    padding: 2px 6px;
    border-radius: 4px;

    &:hover {
      background: #ecf5ff;
    }

    &.current {
      color: #303133;
      cursor: default;
      font-weight: 500;

      &:hover {
        background: transparent;
      }
    }

    &:not(:last-child)::after {
      content: '/';
      margin-left: 8px;
      color: #909399;
    }
  }
}

.toolbar {
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .toolbar-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
  }
}

.columns-container {
  display: flex;
  height: 420px;
  overflow-x: auto;
  background: #fafbfc;

  .column {
    min-width: 320px;
    border-right: 1px solid #e5e7eb;
    background: white;
    display: flex;
    flex-direction: column;

    &:last-child {
      border-right: none;
    }

    .column-header {
      padding: 12px 16px;
      background: #f5f7fa;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      font-size: 13px;
      color: #303133;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .column-content {
      flex: 1;
      overflow-y: auto;
    }

    .column-item {
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s;
      border-bottom: 1px solid #f5f7fa;

      &:hover {
        background: #ecf5ff;
      }

      &.active {
        background: #e1f3ff;
        border-left: 3px solid #409eff;
      }

      .item-icon {
        font-size: 16px;
      }

      .item-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;

        .item-name {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }

        .item-desc {
          font-size: 12px;
          color: #909399;
          display: flex;
          align-items: center;
          gap: 6px;

          .method-tag {
            font-family: 'Courier New', monospace;
            font-size: 11px;
          }

          .item-path {
            font-family: 'Courier New', monospace;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .item-arrow {
        color: #c0c4cc;
        font-size: 18px;
      }
    }
  }
}

.selected-area {
  background: #fafbfc;
  border-top: 1px solid #e5e7eb;
  max-height: 180px;
  display: flex;
  flex-direction: column;

  .selected-header {
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .selected-title {
      font-size: 13px;
      color: #606266;
      font-weight: 600;
    }

    .selected-stats {
      display: flex;
      gap: 16px;

      .stat-item {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;

        .stat-label {
          color: #909399;
        }

        .stat-value {
          color: #409eff;
          font-weight: 600;
        }
      }
    }
  }

  .selected-list {
    padding: 12px 20px;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-content: flex-start;

    .empty-state {
      width: 100%;
      text-align: center;
      padding: 20px;
      color: #909399;
      font-size: 13px;
    }

    .selected-tag {
      padding: 6px 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      max-width: 400px;

      &:hover {
        border-color: #f56c6c;
        background: #fef0f0;
      }

      .tag-icon {
        font-size: 14px;
      }

      .tag-name {
        color: #303133;
        font-weight: 500;
      }

      .tag-path {
        color: #909399;
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tag-remove {
        cursor: pointer;
        color: #f56c6c;
        margin-left: auto;

        &:hover {
          color: #f45454;
        }
      }
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