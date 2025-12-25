<template>
  <div class="project-card" @click="$emit('view', project)">
    <div class="project-header">
      <div class="project-title">
        <FolderOpen :size="20" />
        <h3>{{ project.name }}</h3>
      </div>
      <ElTag :type="project.isPublic ? 'success' : 'info'" size="small">
        {{ project.isPublic ? '公开' : '私有' }}
      </ElTag>
    </div>

    <div class="project-stats">
      <div class="stat-item">
        <Package :size="14" />
        <span>{{ project.repoCount }} 镜像</span>
      </div>
      <div class="stat-item">
        <Clock :size="14" />
        <span>{{ formatDate(project.creationTime) }}</span>
      </div>
      <div class="stat-item" v-if="project.ownerName">
        <User :size="14" />
        <span>{{ project.ownerName }}</span>
      </div>
    </div>

    <div class="project-actions" @click.stop>
      <ElButton type="primary" link :icon="Eye" @click="$emit('view', project)">查看</ElButton>
      <ElButton link :icon="Settings" @click="$emit('edit', project)">设置</ElButton>
      <ElButton link :icon="PieChart" @click="$emit('quota', project)">配额</ElButton>
      <ElButton type="danger" link :icon="Trash2" @click="$emit('delete', project)">
        删除
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    FolderOpen,
    Package,
    Clock,
    User,
    Eye,
    Settings,
    PieChart,
    Trash2
  } from 'lucide-vue-next'
  import type { RegistryProject } from '@/api'

  interface Props {
    project: RegistryProject
  }

  interface Emits {
    (e: 'view', project: RegistryProject): void
    (e: 'edit', project: RegistryProject): void
    (e: 'quota', project: RegistryProject): void
    (e: 'delete', project: RegistryProject): void
  }

  defineProps<Props>()
  defineEmits<Emits>()

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
  }
</script>

<style lang="scss" scoped>
  .project-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary-light-5);
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .project-title {
        display: flex;
        align-items: center;
        gap: 8px;

        h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        svg {
          color: var(--el-color-primary);
        }
      }
    }

    .project-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        svg {
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .project-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
</style>
