<template>
  <div class="api-tree">
    <ElTree
      ref="treeRef"
      v-loading="loading"
      :data="treeData"
      :props="defaultProps"
      node-key="id"
      :default-expand-all="false"
      :expand-on-click-node="false"
      highlight-current
      @node-click="handleNodeClick"
      @node-contextmenu="handleContextMenu"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <div class="node-content">
            <ElIcon v-if="data.isPermission === 0" :size="16">
              <Folder />
            </ElIcon>
            <ElIcon v-else :size="16">
              <Document />
            </ElIcon>
            <span class="node-label">{{ data.name }}</span>
            <ElTag v-if="data.isPermission === 1" type="info" size="small">
              {{ data.method }}
            </ElTag>
          </div>
          <div class="node-actions" @click.stop>
            <ElButton
              v-if="data.isPermission === 0"
              type="primary"
              size="small"
              link
              @click="handleEdit(data)"
            >
              编辑
            </ElButton>
            <ElButton type="danger" size="small" link @click="handleDelete(data)"> 删除</ElButton>
          </div>
        </div>
      </template>
    </ElTree>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { Folder, Document } from '@element-plus/icons-vue'
  import { getApiGroupsTreeApi, type ApiGroupTreeNode } from '@/api/portal/api'

  interface Props {
    loading?: boolean
  }

  interface Emits {
    (e: 'node-click', node: any): void

    (e: 'edit', node: any): void

    (e: 'delete', node: any): void
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  })

  const emit = defineEmits<Emits>()

  const treeRef = ref()
  const loading = ref(false)
  const treeData = ref<any[]>([])

  const defaultProps = {
    children: 'children',
    label: 'name'
  }

  // 加载树数据
  const loadTree = async () => {
    try {
      loading.value = true
      const response = await getApiGroupsTreeApi()

      // 添加根节点
      treeData.value = [
        {
          id: 0,
          name: '全部API',
          isPermission: 0,
          children: response || []
        }
      ]
    } catch (error) {
    } finally {
      loading.value = false
    }
  }

  // 处理节点点击
  const handleNodeClick = (data: any) => {
    emit('node-click', data)
  }

  // 处理编辑
  const handleEdit = (data: any) => {
    if (data.id !== 0) {
      // 不允许编辑根节点
      emit('edit', data)
    }
  }

  // 处理删除
  const handleDelete = (data: any) => {
    if (data.id !== 0) {
      // 不允许删除根节点
      emit('delete', data)
    }
  }

  // 处理右键菜单
  const handleContextMenu = (event: MouseEvent, data: any) => {
    event.preventDefault()
    // 可以添加右键菜单功能
  }

  // 清除选择
  const clearSelection = () => {
    treeRef.value?.setCurrentKey(null)
  }

  // 初始化
  onMounted(() => {
    loadTree()
  })

  // 暴露方法
  defineExpose({
    loadTree,
    clearSelection
  })
</script>

<style lang="scss" scoped>
  .api-tree {
    :deep(.el-tree-node__content) {
      height: 36px;

      &:hover {
        .node-actions {
          display: flex;
        }
      }
    }

    .tree-node {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-right: 8px;

      .node-content {
        display: flex;
        align-items: center;
        gap: 8px;

        .node-label {
          margin-left: 4px;
        }
      }

      .node-actions {
        display: none;
        gap: 8px;
      }
    }
  }
</style>