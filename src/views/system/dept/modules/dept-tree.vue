<template>
  <div class="dept-tree" v-loading="loading">
    <ElTree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :expand-on-click-node="false"
      :default-expand-all="expandAll"
      node-key="id"
      highlight-current
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <div class="node-content">
            <span class="node-label">{{ data.name }}</span>
            <ElTag v-if="data.status === 0" type="danger" size="small">禁用</ElTag>
            <ElTag v-else type="success" size="small">启用</ElTag>
            <span class="node-info">
              <span v-if="data.leader">负责人: {{ data.leader }}</span>
              <span v-if="data.phone">电话: {{ data.phone }}</span>
            </span>
          </div>
          <div class="node-actions">
            <ElButton
              type="primary"
              size="small"
              link
              :icon="Plus"
              @click.stop="handleAdd(data)"
              :loading="submitLoading"
              :disabled="submitLoading"
            >
              新增
            </ElButton>
            <ElButton
              type="primary"
              size="small"
              link
              :icon="Edit"
              @click.stop="handleEdit(data)"
              :loading="submitLoading"
              :disabled="submitLoading"
            >
              编辑
            </ElButton>
            <ElButton
              type="danger"
              size="small"
              link
              :icon="Delete"
              @click.stop="handleDelete(data)"
              :disabled="hasChildren(data) || submitLoading"
              :loading="submitLoading"
            >
              删除
            </ElButton>
          </div>
        </div>
      </template>
    </ElTree>

    <!-- 空数据提示 -->
    <ElEmpty v-if="!loading && treeData.length === 0" description="暂无部门数据" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { Plus, Edit, Delete } from '@element-plus/icons-vue'
  import type { DeptSysDeptTree } from '@/api/portal/dept'

  interface Props {
    data: DeptSysDeptTree[]
    loading?: boolean
    expandAll?: boolean
    submitLoading?: boolean
  }

  interface Emits {
    (e: 'add', dept: DeptSysDeptTree | null): void

    (e: 'edit', dept: DeptSysDeptTree): void

    (e: 'delete', dept: DeptSysDeptTree): void
  }

  const props = withDefaults(defineProps<Props>(), {
    data: () => [],
    loading: false,
    expandAll: false,
    submitLoading: false
  })

  const emit = defineEmits<Emits>()

  const treeRef = ref()

  // 树配置
  const treeProps = {
    children: 'children',
    label: 'name'
  }

  // 树数据
  const treeData = computed(() => props.data)

  // 判断是否有子节点
  const hasChildren = (data: DeptSysDeptTree) => {
    return data.children && data.children.length > 0
  }

  // 处理新增
  const handleAdd = (data: DeptSysDeptTree) => {
    if (props.submitLoading) return
    emit('add', data)
  }

  // 处理编辑
  const handleEdit = (data: DeptSysDeptTree) => {
    if (props.submitLoading) return
    emit('edit', data)
  }

  // 处理删除
  const handleDelete = (data: DeptSysDeptTree) => {
    if (props.submitLoading || hasChildren(data)) return
    emit('delete', data)
  }

  // 设置展开/折叠
  const setExpandAll = (expand: boolean) => {
    if (!treeRef.value) return

    const nodes = treeRef.value.store.nodesMap
    Object.values(nodes).forEach((node: any) => {
      node.expanded = expand
    })
  }

  // 监听展开状态变化
  watch(
    () => props.expandAll,
    (newVal) => {
      nextTick(() => {
        setExpandAll(newVal)
      })
    }
  )

  // 暴露方法
  defineExpose({
    setExpandAll
  })
</script>

<style lang="scss" scoped>
  .dept-tree {
    min-height: 400px;

    :deep(.el-tree) {
      .el-tree-node {
        position: relative;

        .el-tree-node__content {
          height: auto;
          min-height: 40px;
          padding: 8px 12px;

          &:hover {
            background-color: #f5f7fa;

            .node-actions {
              opacity: 1;
            }
          }
        }
      }
    }

    .tree-node {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      font-size: 14px;

      .node-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .node-label {
          font-weight: 500;
          margin-right: 8px;
        }

        .node-info {
          display: flex;
          gap: 16px;
          margin-left: 12px;
          color: #909399;
          font-size: 12px;
        }
      }

      .node-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s;
      }
    }
  }
</style>
