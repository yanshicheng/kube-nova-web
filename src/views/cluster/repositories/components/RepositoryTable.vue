<template>
  <ElTable :data="data" style="width: 100%">
    <ElTableColumn label="仓库名称" min-width="200">
      <template #default="{ row }">
        <div class="repo-name-cell" @click="$emit('manage', row)">
          <div class="repo-icon" :class="`type-${row.type}`">
            <Server v-if="row.type === 'harbor'" :size="20" />
            <Package v-else-if="row.type === 'docker-registry'" :size="20" />
            <Database v-else :size="20" />
          </div>
          <div class="repo-info">
            <span class="repo-name">{{ row.name }}</span>
            <span class="repo-url">{{ row.url }}</span>
          </div>
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="类型" width="130">
      <template #default="{ row }">
        <ElTag size="small" type="info">
          {{ getTypeText(row.type) }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="环境" width="100">
      <template #default="{ row }">
        <ElTag size="small" :type="getEnvType(row.env)">
          {{ getEnvText(row.env) }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="用户名" width="120">
      <template #default="{ row }">
        <div class="username-cell">
          <User :size="14" />
          <span>{{ row.username }}</span>
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="状态" width="100">
      <template #default="{ row }">
        <ElTag :type="row.status === 1 ? 'success' : 'info'" size="small">
          <div class="status-cell">
            <Check v-if="row.status === 1" :size="12" />
            <X v-else :size="12" />
            {{ row.status === 1 ? '启用' : '禁用' }}
          </div>
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="证书验证" width="120">
      <template #default="{ row }">
        <ElTag :type="row.insecure ? 'warning' : 'success'" size="small">
          {{ row.insecure ? '已跳过' : '已启用' }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="创建时间" width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="创建人" width="120">
      <template #default="{ row }">
        {{ row.createdBy || '-' }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="操作" width="240" fixed="right">
      <template #default="{ row }">
        <ElSpace :size="4">
          <ElButton type="primary" size="small" :icon="Settings" @click="$emit('manage', row)">
            管理
          </ElButton>
          <ElButton size="small" :icon="Link2" @click="$emit('bind-cluster', row)"> 绑定 </ElButton>
          <ElDropdown @command="handleCommand(row, $event)">
            <ElButton size="small" :icon="MoreVertical" circle />
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="edit" :icon="Edit">编辑</ElDropdownItem>
                <ElDropdownItem command="delete" :icon="Trash2" divided>删除</ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </ElSpace>
      </template>
    </ElTableColumn>
  </ElTable>
</template>

<script setup lang="ts">
  import {
    Server,
    Package,
    Database,
    User,
    Check,
    X,
    Settings,
    Link2,
    MoreVertical,
    Edit,
    Trash2
  } from 'lucide-vue-next'
  import type { ContainerRegistry } from '@/api'

  interface Props {
    data: ContainerRegistry[]
  }

  interface Emits {
    (e: 'manage', registry: ContainerRegistry): void
    (e: 'bind-cluster', registry: ContainerRegistry): void
    (e: 'edit', registry: ContainerRegistry): void
    (e: 'delete', registry: ContainerRegistry): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 仓库类型
  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      harbor: 'Harbor',
      'docker-registry': 'Docker Registry',
      nexus: 'Nexus'
    }
    return texts[type] || type
  }

  // 环境类型
  const getEnvType = (env: string) => {
    const types: Record<string, any> = {
      dev: 'info',
      test: 'warning',
      staging: 'success',
      prod: 'danger'
    }
    return types[env] || 'info'
  }

  const getEnvText = (env: string) => {
    const texts: Record<string, string> = {
      dev: '开发',
      test: '测试',
      staging: '预发',
      prod: '生产'
    }
    return texts[env] || env
  }

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 处理命令
  const handleCommand = (row: ContainerRegistry, command: string) => {
    if (command === 'edit') {
      emit('edit', row)
    } else if (command === 'delete') {
      emit('delete', row)
    }
  }
</script>

<style lang="scss" scoped>
  .repo-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;

    .repo-icon {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.type-harbor {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      &.type-docker-registry {
        background: linear-gradient(135deg, #0db7ed 0%, #086dd7 100%);
        color: white;
      }

      &.type-nexus {
        background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        color: white;
      }
    }

    .repo-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;

      .repo-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-color-primary);
        transition: color 0.3s;

        &:hover {
          color: var(--el-color-primary-light-3);
        }
      }

      .repo-url {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        font-family: 'Monaco', 'Consolas', monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .username-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  .status-cell {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  :deep(.el-table) {
    .el-table__row {
      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }
  }
</style>
