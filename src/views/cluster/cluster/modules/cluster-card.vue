<template>
  <div class="cluster-card" @click="handleClick">
    <!-- 环境标签 -->
    <div
      class="env-ribbon"
      :style="{ background: getEnvironmentConfig(cluster.environment).gradient }"
    >
      <span>{{ getEnvironmentConfig(cluster.environment).shortLabel }}</span>
    </div>

    <!-- 卡片主体 -->
    <div class="card-body">
      <!-- 头部信息 -->
      <div class="card-header">
        <div class="cluster-identity">
          <div class="avatar-wrapper" @click.stop="handleAvatarClick">
            <div class="cluster-avatar">
              <img v-if="cluster.avatar" :src="cluster.avatar" alt="集群头像" />
              <component v-else :is="getClusterTypeConfig(cluster.clusterType).icon || Server" />
            </div>
            <div class="avatar-edit" :class="{ loading: avatarLoading }">
              <Camera v-if="!avatarLoading" />
              <el-icon v-else class="is-loading">
                <Loading />
              </el-icon>
            </div>
          </div>

          <div class="cluster-info">
            <h3 class="cluster-name">{{ cluster.name }}</h3>
            <div class="cluster-meta">
              <component :is="getClusterTypeConfig(cluster.clusterType).icon || Server" />
              <span>{{ getClusterTypeConfig(cluster.clusterType).shortLabel }}</span>
              <ElDivider direction="vertical" />
              <span class="version-text">{{ cluster.version || '1.28.2' }}</span>
            </div>
          </div>
        </div>

        <div class="cluster-id">#{{ cluster.id }}</div>
      </div>

      <!-- 状态展示区 -->
      <div class="status-section">
        <div
          class="status-item"
          :style="{ background: healthStatusConfig[cluster.healthStatus]?.bgColor }"
        >
          <component
            :is="healthStatusConfig[cluster.healthStatus]?.icon"
            :style="{ color: healthStatusConfig[cluster.healthStatus]?.color }"
          />
          <div class="status-text">
            <span class="status-label">健康状态</span>
            <span
              class="status-value"
              :style="{ color: healthStatusConfig[cluster.healthStatus]?.color }"
            >
              {{ healthStatusConfig[cluster.healthStatus]?.label }}
            </span>
          </div>
        </div>

        <div class="status-item" :style="{ background: syncStatusConfig[cluster.status]?.bgColor }">
          <component
            :is="syncStatusConfig[cluster.status]?.icon"
            :class="{ 'spinning-icon': syncStatusConfig[cluster.status]?.spinning || syncLoading }"
            :style="{ color: syncStatusConfig[cluster.status]?.color }"
          />
          <div class="status-text">
            <span class="status-label">同步状态</span>
            <span class="status-value" :style="{ color: syncStatusConfig[cluster.status]?.color }">
              {{ syncLoading ? '同步中' : syncStatusConfig[cluster.status]?.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- 资源监控区 -->
      <div class="resource-monitor">
        <h4 class="monitor-title">
          <Activity />
          资源分配率
        </h4>

        <div class="resource-grid">
          <div class="resource-item">
            <div class="resource-header">
              <Cpu class="resource-icon" />
              <span class="resource-name">CPU</span>
              <span class="resource-value">{{ formatPercentage(cluster.cpuUsage) }}%</span>
            </div>
            <div class="progress-wrapper">
              <div class="progress-bg">
                <div
                  class="progress-fill"
                  :style="{
                    width: getProgressWidth(cluster.cpuUsage),
                    background: getProgressColor(cluster.cpuUsage)
                  }"
                ></div>
              </div>
            </div>
          </div>

          <div class="resource-item">
            <div class="resource-header">
              <MemoryStick class="resource-icon" />
              <span class="resource-name">内存</span>
              <span class="resource-value">{{ formatPercentage(cluster.memoryUsage) }}%</span>
            </div>
            <div class="progress-wrapper">
              <div class="progress-bg">
                <div
                  class="progress-fill"
                  :style="{
                    width: getProgressWidth(cluster.memoryUsage),
                    background: getProgressColor(cluster.memoryUsage)
                  }"
                ></div>
              </div>
            </div>
          </div>

          <div class="resource-item">
            <div class="resource-header">
              <Box class="resource-icon" />
              <span class="resource-name">Pod</span>
              <span class="resource-value">{{ formatPercentage(cluster.podUsage) }}%</span>
            </div>
            <div class="progress-wrapper">
              <div class="progress-bg">
                <div
                  class="progress-fill"
                  :style="{
                    width: getProgressWidth(cluster.podUsage),
                    background: getProgressColor(cluster.podUsage)
                  }"
                ></div>
              </div>
            </div>
          </div>

          <div class="resource-item">
            <div class="resource-header">
              <HardDrive class="resource-icon" />
              <span class="resource-name">存储</span>
              <span class="resource-value">{{ formatStorage(cluster.storageUsage) }}%</span>
            </div>
            <div class="progress-wrapper">
              <div class="progress-bg">
                <div
                  class="progress-fill"
                  :style="{
                    width: getProgressWidth(cluster.storageUsage),
                    background: getProgressColor(cluster.storageUsage)
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建时间 -->
      <div class="create-time">
        <Clock class="time-icon" />
        <span>创建于 {{ formatTimestamp(cluster.createdAt) }}</span>
      </div>

      <!-- 操作按钮区 -->
      <div class="action-buttons">
        <button
          class="btn-sync"
          :class="{ loading: syncLoading }"
          @click.stop="handleSync"
          :disabled="syncLoading || deleteLoading"
        >
          <RefreshCw :class="{ 'spinning-icon': syncLoading }" />
          <span>{{ syncLoading ? '同步中' : '同步' }}</span>
        </button>

        <button
          class="btn-delete"
          :class="{ loading: deleteLoading }"
          @click.stop="handleDelete"
          :disabled="deleteLoading || syncLoading"
        >
          <Trash2 v-if="!deleteLoading" />
          <el-icon v-else class="is-loading">
            <Loading />
          </el-icon>
          <span>{{ deleteLoading ? '删除中' : '删除' }}</span>
        </button>
      </div>

      <!-- 进入控制台按钮 -->
      <div class="console-button" :class="{ disabled: syncLoading || deleteLoading }">
        <div class="console-content">
          <Terminal />
          <span>进入控制台</span>
        </div>
        <ArrowRight class="console-arrow" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { ElDivider, ElIcon } from 'element-plus'
  import { Loading } from '@element-plus/icons-vue'
  import {
    Server,
    Camera,
    Activity,
    Cpu,
    MemoryStick,
    Box,
    HardDrive,
    Trash2,
    Terminal,
    ArrowRight,
    RefreshCw,
    Clock
  } from 'lucide-vue-next'
  import type { Cluster } from '@/api/manager/cluster'
  import {
    environmentOptions,
    clusterTypeOptions,
    healthStatusConfig,
    syncStatusConfig
  } from '../constants'

  interface Props {
    cluster: Cluster
    syncLoading?: boolean
  }

  interface Emits {
    (e: 'click', id: number): void
    (e: 'sync', cluster: Cluster): void
    (e: 'delete', cluster: Cluster): void
    (e: 'update-avatar', cluster: Cluster): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 本地加载状态
  const avatarLoading = ref(false)
  const deleteLoading = ref(false)

  // 获取环境配置
  const getEnvironmentConfig = (environment: string) => {
    if (!environment) {
      return {
        shortLabel: 'DEV',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    }
    return (
      environmentOptions.find((env) => env.value === environment) || {
        shortLabel: environment.toUpperCase().substring(0, 4),
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    )
  }

  // 获取集群类型配置
  const getClusterTypeConfig = (clusterType: string) => {
    return (
      clusterTypeOptions.find((type) => type.value === clusterType) || {
        shortLabel: 'Standard',
        icon: Server
      }
    )
  }

  /**
   * 解析百分比字符串为数字
   * 支持格式: "33.9%", "33.9", 33.9, undefined, null
   */
  const parsePercentage = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null) return 0
    if (typeof value === 'number') return value
    const numStr = String(value).replace('%', '').trim()
    const num = parseFloat(numStr)
    return isNaN(num) ? 0 : num
  }

  // 格式化百分比显示（只显示整数部分）
  const formatPercentage = (value: string | number | undefined | null): string => {
    const num = parsePercentage(value)
    return Math.round(num).toString()
  }

  // 格式化存储容量（保留一位小数）
  const formatStorage = (value: string | number | undefined | null): string => {
    const num = parsePercentage(value)
    return num.toFixed(1)
  }

  // 获取进度条颜色
  const getProgressColor = (value: string | number | undefined | null): string => {
    const num = parsePercentage(value)
    if (num >= 80) return 'linear-gradient(90deg, #ef4444, #dc2626)'
    if (num >= 60) return 'linear-gradient(90deg, #f59e0b, #d97706)'
    return 'linear-gradient(90deg, #10b981, #059669)'
  }

  // 获取进度条宽度
  const getProgressWidth = (value: string | number | undefined | null): string => {
    const num = parsePercentage(value)
    return `${Math.min(num, 100)}%`
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp: number | undefined | null): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // 事件处理
  const handleClick = () => {
    if (props.syncLoading || deleteLoading.value) return
    emit('click', props.cluster.id)
  }

  const handleSync = async () => {
    if (props.syncLoading || deleteLoading.value) return
    emit('sync', props.cluster)
  }

  const handleDelete = async () => {
    if (props.syncLoading || deleteLoading.value) return

    deleteLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      emit('delete', props.cluster)
    } finally {
      deleteLoading.value = false
    }
  }

  const handleAvatarClick = async () => {
    if (props.syncLoading || deleteLoading.value) return

    avatarLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      emit('update-avatar', props.cluster)
    } finally {
      avatarLoading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .cluster-card {
    position: relative;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #ebeef5;

    &:hover:not(.disabled) {
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);

      .avatar-edit {
        opacity: 1;
      }

      .console-button:not(.disabled) {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

        .console-content {
          color: white;
        }

        .console-arrow {
          transform: translateX(4px);
          color: white;
        }
      }
    }

    .env-ribbon {
      position: absolute;
      top: 20px;
      right: -30px;
      padding: 8px 40px;
      color: white;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      transform: rotate(45deg);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 15;
      min-width: 100px;
      text-align: center;
    }

    .card-body {
      padding: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;

        .cluster-identity {
          display: flex;
          align-items: center;
          gap: 16px;

          .avatar-wrapper {
            position: relative;

            .cluster-avatar {
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background: white;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              svg {
                width: 24px;
                height: 24px;
                color: #667eea;
              }
            }

            .avatar-edit {
              position: absolute;
              inset: 0;
              background: rgba(0, 0, 0, 0.6);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transition: opacity 0.3s;

              &.loading {
                opacity: 1;
                background: rgba(102, 126, 234, 0.8);
              }

              svg,
              .el-icon {
                width: 20px;
                height: 20px;
                color: white;

                &.is-loading {
                  animation: rotating 2s linear infinite;
                }
              }
            }
          }

          .cluster-info {
            .cluster-name {
              font-size: 18px;
              font-weight: 600;
              color: #303133;
              margin: 0 0 8px 0;
              line-height: 1.2;
            }

            .cluster-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              color: #606266;

              svg {
                width: 14px;
                height: 14px;
              }

              .version-text {
                font-family: monospace;
                color: #409eff;
              }

              :deep(.el-divider--vertical) {
                height: 14px;
                margin: 0 8px;
              }
            }
          }
        }

        .cluster-id {
          font-size: 12px;
          color: #c0c4cc;
          font-family: monospace;
        }
      }

      .status-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;

        .status-item {
          padding: 10px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;

          svg {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
          }

          .status-text {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .status-label {
              font-size: 11px;
              color: #909399;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .status-value {
              font-size: 13px;
              font-weight: 600;
            }
          }
        }
      }

      .resource-monitor {
        margin-bottom: 16px;

        .monitor-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #606266;
          margin-bottom: 12px;

          svg {
            width: 14px;
            height: 14px;
          }
        }

        .resource-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .resource-item {
            .resource-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;

              .resource-icon {
                width: 14px;
                height: 14px;
                color: #909399;
              }

              .resource-name {
                flex: 1;
                font-size: 12px;
                color: #606266;
              }

              .resource-value {
                font-size: 12px;
                font-weight: 600;
                color: #303133;
              }
            }

            .progress-wrapper {
              .progress-bg {
                height: 4px;
                background: #f0f2f5;
                border-radius: 2px;
                overflow: hidden;

                .progress-fill {
                  height: 100%;
                  border-radius: 2px;
                  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }
              }
            }
          }
        }
      }

      .create-time {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 12px;
        background: #f8fafc;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 12px;
        color: #909399;

        .time-icon {
          width: 14px;
          height: 14px;
          color: #c0c4cc;
        }
      }

      .action-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;

        button {
          flex: 1;
          height: 36px;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          svg,
          .el-icon {
            width: 14px;
            height: 14px;

            &.is-loading {
              animation: rotating 2s linear infinite;
            }
          }

          &.btn-sync {
            background: #ecf5ff;
            color: #409eff;

            &:hover:not(:disabled) {
              background: #409eff;
              color: white;
              transform: scale(1.05);
            }

            &.loading {
              background: #409eff;
              color: white;
            }
          }

          &.btn-delete {
            background: #fef0f0;
            color: #f56c6c;

            &:hover:not(:disabled) {
              background: #f56c6c;
              color: white;
              transform: scale(1.05);
            }

            &.loading {
              background: #f56c6c;
              color: white;
            }
          }
        }
      }

      .console-button {
        padding: 14px;
        background: #f5f7fa;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.3s;

        &.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .console-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #606266;

          svg {
            width: 16px;
            height: 16px;
          }
        }

        .console-arrow {
          width: 16px;
          height: 16px;
          transition: transform 0.3s;
          color: #909399;
        }
      }
    }
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .spinning-icon {
    animation: rotating 1s linear infinite;
  }
</style>
