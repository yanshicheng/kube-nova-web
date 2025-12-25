<template>
  <ElDialog
    v-model="visible"
    title="菜单权限"
    width="520px"
    align-center
    class="el-dialog-border"
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElScrollbar height="70vh">
      <ElTree
        ref="treeRef"
        :data="menuTreeData"
        show-checkbox
        node-key="id"
        :default-expand-all="isExpandAll"
        :default-checked-keys="checkedKeys"
        :props="defaultProps"
        @check="handleTreeCheck"
      >
        <template #default="{ data }">
          <div style="display: flex; align-items: center">
            <span v-if="data.isAuth">
              {{ data.label }}
            </span>
            <span v-else>{{ data.title || data.label }}</span>
          </div>
        </template>
      </ElTree>
    </ElScrollbar>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="outputSelectedData" :disabled="loading">获取选中数据</ElButton>
        <ElButton @click="toggleExpandAll" :disabled="loading">
          {{ isExpandAll ? '全部收起' : '全部展开' }}
        </ElButton>
        <ElButton @click="toggleSelectAll" :disabled="loading">
          {{ isSelectAll ? '取消全选' : '全部选择' }}
        </ElButton>
        <ElButton type="primary" @click="savePermission" :loading="loading">
          {{ loading ? '保存中...' : '保存' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { bindRoleMenuApi, getRoleMenuApi, type RoleSysRole } from '@/api/portal/role'
  import { getAllMenuTreeApi, type MenuSysMenuTree } from '@/api/portal/menu'

  interface Props {
    modelValue: boolean
    roleData?: RoleSysRole
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const treeRef = ref()
  const isExpandAll = ref(true)
  const isSelectAll = ref(false)
  const loading = ref(false) // 内部管理loading状态
  const menuTreeData = ref<MenuSysMenuTree[]>([])
  const checkedKeys = ref<number[]>([])

  const defaultProps = {
    children: 'children',
    label: 'title'
  }

  // 监听弹窗打开，初始化权限数据
  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        await loadMenuTree()
        if (props.roleData) {
          await loadRoleMenus()
        }
      }
    }
  )

  // 加载菜单树
  const loadMenuTree = async () => {
    try {
      loading.value = true
      const res = await getAllMenuTreeApi({ status: 1 })
      menuTreeData.value = res || []
    } catch (error) {
      console.error('加载菜单树失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 加载角色已有的菜单权限
  const loadRoleMenus = async () => {
    if (!props.roleData) return

    try {
      loading.value = true
      const res = await getRoleMenuApi(props.roleData.id)
      checkedKeys.value = Array.isArray(res) ? res : ((res as any)?.menuIds || [])


      // 设置选中的节点
      nextTick(() => {
        treeRef.value?.setCheckedKeys(checkedKeys.value)
      })
    } catch (error) {
      console.error('加载角色菜单失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleClose = () => {
    if (loading.value) {
      return
    }
    visible.value = false
    treeRef.value?.setCheckedKeys([])
    checkedKeys.value = []
  }

  const savePermission = async () => {
    if (!props.roleData) {
      return
    }

    try {
      loading.value = true
      const tree = treeRef.value
      if (!tree) return

      // 获取选中的节点ID（包括半选中的父节点）
      const checkedIds = tree.getCheckedKeys(false)
      const halfCheckedIds = tree.getHalfCheckedKeys()
      const allIds = [...new Set([...checkedIds, ...halfCheckedIds])]

      await bindRoleMenuApi({
        roleId: props.roleData.id,
        menuIds: allIds
      })

      ElMessage.success('权限保存成功')
      emit('success')
      handleClose()
    } catch (error: any) {
      console.error('保存权限失败:', error)
    } finally {
      loading.value = false
    }
  }

  const toggleExpandAll = () => {
    if (loading.value) return

    const tree = treeRef.value
    if (!tree) return

    // 使用store.nodesMap直接控制所有节点的展开状态
    const nodes = tree.store.nodesMap
    Object.values(nodes).forEach((node: any) => {
      node.expanded = !isExpandAll.value
    })

    isExpandAll.value = !isExpandAll.value
  }

  const toggleSelectAll = () => {
    if (loading.value) return

    const tree = treeRef.value
    if (!tree) return

    if (!isSelectAll.value) {
      // 全选：获取所有节点的key并设置为选中
      const allKeys = getAllNodeKeys(menuTreeData.value)
      tree.setCheckedKeys(allKeys)
    } else {
      // 取消全选：清空所有选中
      tree.setCheckedKeys([])
    }

    isSelectAll.value = !isSelectAll.value
  }

  const getAllNodeKeys = (nodes: MenuSysMenuTree[]): number[] => {
    const keys: number[] = []
    const traverse = (nodeList: MenuSysMenuTree[]) => {
      nodeList.forEach((node) => {
        if (node.id) {
          keys.push(node.id)
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    traverse(nodes)
    return keys
  }

  const handleTreeCheck = () => {
    const tree = treeRef.value
    if (!tree) return

    // 使用树组件的getCheckedKeys方法获取选中的节点
    const checkedKeys = tree.getCheckedKeys()
    const allKeys = getAllNodeKeys(menuTreeData.value)

    // 判断是否全选：选中的节点数量等于总节点数量
    isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0
  }

  // 输出选中的数据
  const outputSelectedData = () => {
    if (loading.value) return

    const tree = treeRef.value
    if (!tree) return

    // 获取选中的节点keys
    const checkedKeys = tree.getCheckedKeys()
    // 获取半选中的节点keys（父节点部分选中时）
    const halfCheckedKeys = tree.getHalfCheckedKeys()
    // 获取选中的节点数据
    const checkedNodes = tree.getCheckedNodes()
    // 获取半选中的节点数据
    const halfCheckedNodes = tree.getHalfCheckedNodes()

    const selectedData = {
      checkedKeys,
      halfCheckedKeys,
      checkedNodes,
      halfCheckedNodes,
      totalChecked: checkedKeys.length,
      totalHalfChecked: halfCheckedKeys.length
    }

    ElMessage.success(`已输出选中数据到控制台，共选中 ${checkedKeys.length} 个节点`)
  }
</script>

<style lang="scss" scoped>
  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
