<!-- /views/workspace/management/subpage/card.vue -->
<template>
  <div class="workspace-card-view">
    <div v-if="loading" class="card-content">
      <div class="loading-container">
        <ElSkeleton v-for="i in 8" :key="i" animated style="width: 100%">
          <template #template>
            <div class="skeleton-card">
              <ElSkeletonItem variant="text" style="width: 60%; margin-bottom: 12px" />
              <ElSkeletonItem variant="rect" style="width: 100%; height: 80px" />
            </div>
          </template>
        </ElSkeleton>
      </div>
    </div>

    <template v-else-if="workspaces.length > 0">
      <!-- 卡片网格 - 自动填充剩余空间 -->
      <div class="card-content">
        <div class="card-grid">
          <div
            v-for="workspace in paginatedWorkspaces"
            :key="workspace.id"
            class="workspace-card"
            @click="handleCardClick(workspace)"
          >
            <!-- 状态角标 - 左下角小圆点 -->
            <div class="status-badge" :class="{ 'status-error': workspace.status === 0 }"></div>

            <div class="card-header">
              <img src="/src/assets/img/cluster/kubernetes.png" alt="K8s" class="k8s-icon" />
              <div class="workspace-info">
                <h4 class="workspace-name">{{ workspace.name }}</h4>
                <span class="namespace-name">{{ workspace.namespace }}</span>
              </div>
              <ElDropdown
                trigger="click"
                @command="(cmd) => handleCommand(cmd, workspace)"
                @click.stop
              >
                <ElButton circle size="small" class="action-button" @click.stop>
                  <ElIcon>
                    <MoreFilled />
                  </ElIcon>
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem :icon="View" command="manage">查看详情</ElDropdownItem>
                    <ElDropdownItem :icon="Monitor" command="monitoring">监控</ElDropdownItem>
                    <ElDropdownItem :icon="Edit" command="edit">编辑配置</ElDropdownItem>
                    <ElDropdownItem :icon="Position" command="migrate">迁移空间</ElDropdownItem>
                    <ElDropdownItem divided :icon="Delete" command="delete">
                      <span style="color: var(--el-color-danger)">删除</span>
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>

            <div class="card-body">
              <div class="resource-list">
                <div class="resource-item">
                  <ElIcon class="resource-icon cpu">
                    <Cpu />
                  </ElIcon>
                  <span class="resource-name">CPU</span>
                  <span class="resource-value">{{
                    formatResourceDisplay(workspace.cpuAllocated, 'cpu')
                  }}</span>
                </div>
                <div class="resource-item">
                  <ElIcon class="resource-icon memory">
                    <Histogram />
                  </ElIcon>
                  <span class="resource-name">内存</span>
                  <span class="resource-value">{{
                    formatResourceDisplay(workspace.memAllocated, 'memory')
                  }}</span>
                </div>
                <div class="resource-item">
                  <ElIcon class="resource-icon storage">
                    <FolderOpened />
                  </ElIcon>
                  <span class="resource-name">存储</span>
                  <span class="resource-value">{{
                    formatResourceDisplay(workspace.storageAllocated, 'memory')
                  }}</span>
                </div>
                <div class="resource-item">
                  <ElIcon class="resource-icon gpu">
                    <VideoPlay />
                  </ElIcon>
                  <span class="resource-name">GPU</span>
                  <span class="resource-value">{{
                    formatResourceDisplay(workspace.gpuAllocated, 'cpu')
                  }}</span>
                </div>
                <div class="resource-item">
                  <ElIcon class="resource-icon pods">
                    <Box />
                  </ElIcon>
                  <span class="resource-name">Pod</span>
                  <span class="resource-value">
                    {{ workspace.podsAllocated || '无限制' }}
                    <span v-if="workspace.podsAllocated">个</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <span class="create-time">{{ formatTime(workspace.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 - 固定在底部 -->
      <div class="pagination-wrapper">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="workspaces.length"
          :page-sizes="[8, 16, 24, 32]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </template>

    <div v-else class="card-content">
      <ElEmpty description="暂无工作空间" class="empty-container">
        <ElButton type="primary" size="large" @click="handleCreate">
          <ElIcon>
            <Plus />
          </ElIcon>
          创建第一个工作空间
        </ElButton>
      </ElEmpty>
    </div>

    <!-- 迁移对话框 -->
    <MigrateWorkspaceDialog
      v-model="migrateDialogVisible"
      :workspace="selectedWorkspace"
      :current-project="currentProject"
      @success="handleMigrateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    Box,
    MoreFilled,
    View,
    Edit,
    Delete,
    Cpu,
    Histogram,
    FolderOpened,
    VideoPlay,
    Plus,
    Monitor,
    Position,
  } from '@element-plus/icons-vue'
  import type { ProjectWorkspace, Project } from '@/api'
  import { formatResourceDisplay } from '@/utils/resource'
  import { useProjectStore } from '@/store/modules/project'
  import MigrateWorkspaceDialog from './dialog/MigrateWorkspaceDialog.vue'

  interface Props {
    workspaces: ProjectWorkspace[]
    loading: boolean
  }

  interface Emits {
    (e: 'edit', workspace: ProjectWorkspace): void
    (e: 'delete', workspace: ProjectWorkspace): void
    (e: 'manage', workspace: ProjectWorkspace): void
    (e: 'create'): void
    (e: 'refresh'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const router = useRouter()
  const projectStore = useProjectStore()

  // 分页状态
  const currentPage = ref(1)
  const pageSize = ref(10)
  const migrateDialogVisible = ref(false)
  const selectedWorkspace = ref<ProjectWorkspace | null>(null)

  // 当前项目
  const currentProject = computed(() => projectStore.selectedProject)

  // 计算分页后的数据
  const paginatedWorkspaces = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return props.workspaces.slice(start, end)
  })

  const handleCardClick = (workspace: ProjectWorkspace) => {
    emit('manage', workspace)
  }

  const handleCommand = (command: string, workspace: ProjectWorkspace) => {
    switch (command) {
      case 'manage':
        emit('manage', workspace)
        break
      case 'monitoring':
        handleMonitoring(workspace)
        break
      case 'edit':
        emit('edit', workspace)
        break
      case 'migrate':
        handleMigrate(workspace)
        break
      case 'delete':
        emit('delete', workspace)
        break
    }
  }

  const handleMonitoring = (workspace: ProjectWorkspace) => {
    router.push({
      name: 'namespaceMonitoring',
      query: {
        clusterUuid: workspace.clusterUuid,
        clusterId: workspace.projectClusterId,
        namespace: workspace.namespace
      }
    })
  }

  const handleMigrate = (workspace: ProjectWorkspace) => {
    selectedWorkspace.value = workspace
    migrateDialogVisible.value = true
  }

  const handleMigrateSuccess = () => {
    emit('refresh')
  }

  const handleCreate = () => {
    emit('create')
  }

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const handleSizeChange = () => {
    currentPage.value = 1
  }

  const handleCurrentChange = () => {
    // 页码变化时自动处理
  }
</script>

<style lang="scss" scoped>
  .workspace-card-view {
    height: 100%;
    display: flex;
    flex-direction: column;

    .card-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0 16px 0; /* 👈 增加顶部内边距，防止第一排被裁剪 */

      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        padding: 8px 0; /* 👈 给网格添加上下内边距，确保有足够空间显示阴影和边框 */
      }

      .loading-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;

        .skeleton-card {
          padding: 16px;
          background: var(--el-bg-color);
          border-radius: 8px;
          border: 1px solid var(--el-border-color-lighter);
        }
      }

      .empty-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--el-bg-color);
        border-radius: 8px;
        border: 2px dashed var(--el-border-color-light);
      }
    }

    .workspace-card {
      position: relative;
      background: var(--el-bg-color);
      border: 2px solid #e4e7ed;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
      z-index: 1;

      &:hover {
        border: 2px solid #409eff !important;
        box-shadow: 0 8px 24px rgba(64, 158, 255, 0.2);
        transform: translateY(-4px);
        background: #f0f7ff;
        z-index: 10;

        .card-header {
          .action-button {
            opacity: 1;
            background: #e6f2ff;
          }
        }
      }

      // 状态角标 - 左下角小圆点，带呼吸动画
      .status-badge {
        position: absolute;
        bottom: 12px;
        left: 12px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        z-index: 2;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #67c23a;
          animation: breathing 2s ease-in-out infinite;
        }

        &.status-error::before {
          background: #f56c6c;
        }
      }

      @keyframes breathing {
        0%,
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.3);
          opacity: 0.6;
        }
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--el-border-color-lighter);
        flex-shrink: 0;
        position: relative;
        z-index: 1;

        .k8s-icon {
          width: 40px;
          height: 40px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          flex-shrink: 0;
        }

        .workspace-info {
          flex: 1;
          min-width: 0;
          margin-right: 8px;

          .workspace-name {
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            letter-spacing: 0.3px;
          }

          .namespace-name {
            display: inline-block;
            padding: 2px 8px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
            background: var(--el-fill-color-lighter);
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
          }
        }

        .action-button {
          opacity: 0.6;
          transition: all 0.3s;
          position: relative;
          z-index: 10;
          background: white;
          border: 1px solid #dcdfe6;
          flex-shrink: 0;

          &:hover {
            opacity: 1;
            background: var(--el-color-primary);
            color: white;
            border-color: var(--el-color-primary);
            transform: rotate(90deg) scale(1.1);
          }
        }
      }

      .card-body {
        flex: 1;
        margin-bottom: 12px;

        .resource-list {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .resource-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: linear-gradient(
              135deg,
              var(--el-fill-color-lighter) 0%,
              var(--el-fill-color-light) 100%
            );
            border-radius: 6px;
            transition: all 0.3s;
            border-left: 3px solid transparent;

            &:hover {
              background: linear-gradient(
                135deg,
                var(--el-fill-color-light) 0%,
                var(--el-fill-color) 100%
              );
              transform: translateX(4px);

              &:nth-child(1) {
                border-left-color: #409eff;
              }
              &:nth-child(2) {
                border-left-color: #67c23a;
              }
              &:nth-child(3) {
                border-left-color: #e6a23c;
              }
              &:nth-child(4) {
                border-left-color: #f56c6c;
              }
              &:nth-child(5) {
                border-left-color: #909399;
              }
            }

            .resource-icon {
              font-size: 18px;
              flex-shrink: 0;

              &.cpu {
                color: #409eff;
              }

              &.memory {
                color: #67c23a;
              }

              &.storage {
                color: #e6a23c;
              }

              &.gpu {
                color: #f56c6c;
              }

              &.pods {
                color: #909399;
              }
            }

            .resource-name {
              flex: 1;
              font-size: 13px;
              color: var(--el-text-color-regular);
              font-weight: 500;
            }

            .resource-value {
              font-size: 13px;
              font-weight: 700;
              color: var(--el-text-color-primary);
              font-family: 'Monaco', 'Menlo', monospace;
              background: white;
              padding: 2px 8px;
              border-radius: 4px;
            }
          }
        }
      }

      .card-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding-top: 12px;
        border-top: 2px solid var(--el-border-color-lighter);
        flex-shrink: 0;

        .create-time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          display: flex;
          align-items: center;
          gap: 4px;

          &::before {
            content: '📅';
            font-size: 14px;
          }
        }
      }
    }

    .pagination-wrapper {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      padding: 16px 0;
      background: var(--el-bg-color);
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
</style>
