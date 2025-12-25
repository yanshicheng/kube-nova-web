<template>
  <ElDialog
    :model-value="visible"
    title="Role 关联信息"
    width="700px"
    top="5vh"
    @update:model-value="handleClose"
  >
    <div v-if="loading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="6" animated />
    </div>

    <div v-else-if="association" class="association-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-header">
          <ShieldCheck :size="16" />
          <span>基本信息</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Role 名称</label>
            <span>{{ association.roleName }}</span>
          </div>
          <div class="info-item">
            <label>命名空间</label>
            <span>{{ association.namespace }}</span>
          </div>
        </div>
      </div>

      <!-- RoleBinding 列表 -->
      <div class="info-section">
        <div class="section-header">
          <Link :size="16" />
          <span>被 RoleBinding 引用</span>
          <ElTag size="small" type="info">{{ association.bindingCount }} 个</ElTag>
        </div>

        <div v-if="association.roleBindings.length > 0" class="bindings-list">
          <div v-for="binding in association.roleBindings" :key="binding" class="binding-item">
            <Link :size="14" />
            <span>{{ binding }}</span>
          </div>
        </div>
        <ElEmpty v-else description="没有 RoleBinding 引用此 Role" :image-size="60" />
      </div>

      <!-- 主体列表 -->
      <div class="info-section">
        <div class="section-header">
          <Users :size="16" />
          <span>绑定的主体</span>
          <ElTag size="small" type="success">{{ association.subjects.length }} 个</ElTag>
        </div>

        <div v-if="association.subjects.length > 0" class="subjects-list">
          <div v-for="subject in association.subjects" :key="subject" class="subject-item">
            <User :size="14" />
            <span>{{ subject }}</span>
          </div>
        </div>
        <ElEmpty v-else description="没有主体绑定到此 Role" :image-size="60" />
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ShieldCheck, Link, Users, User } from 'lucide-vue-next'
  import {
    getRoleAssociationApi,
    type ProjectWorkspace,
    type RoleAssociation
  } from '@/api/workload/core'

  interface Props {
    visible: boolean
    roleName: string
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['close'])

  const loading = ref(false)
  const association = ref<RoleAssociation | null>(null)

  const handleClose = () => {
    emit('close')
  }

  const loadAssociation = async () => {
    if (!props.workspace || !props.roleName) {
      return
    }

    loading.value = true
    try {
      const result = await getRoleAssociationApi({
        clusterUuid: props.workspace.clusterUuid!,
        namespace: props.workspace.namespace!,
        name: props.roleName
      })

      association.value = result
    } catch (error: any) {
      console.error('加载 Role 关联信息失败:', error)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        loadAssociation()
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .association-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-section {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e4e7ed;
      font-size: 14px;
      font-weight: 600;
      color: #303133;

      svg {
        color: #409eff;
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 12px;
      color: #909399;
      font-weight: 500;
    }

    span {
      font-size: 13px;
      color: #303133;
      font-weight: 500;
    }
  }

  .bindings-list,
  .subjects-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .binding-item,
  .subject-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    font-size: 13px;
    color: #303133;
    transition: all 0.2s;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    svg {
      color: #409eff;
      flex-shrink: 0;
    }

    span {
      font-family: 'Consolas', 'Monaco', monospace;
    }
  }

  :deep(.el-empty) {
    padding: 20px 0;
  }
</style>