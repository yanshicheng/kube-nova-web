<template>
  <div class="monitor-overview" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="overview-grid">
        <!-- CPU 卡片 -->
        <div class="metric-card cpu-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M17,17H7V7H17M21,11V9H19V7C19,5.89 18.1,5 17,5H15V3H13V5H11V3H9V5H7C5.89,5 5,5.89 5,7V9H3V11H5V13H3V15H5V17C5,18.1 5.9,19 7,19H9V21H11V19H13V21H15V19H17C18.1,19 19,18.1 19,17V15H21V13H19V11M15,15H9V9H15V15Z"
              />
            </svg>
          </div>
          <div class="card-content">
            <div class="card-label">CPU 使用</div>
            <div class="card-value">
              {{ overviewData?.cpu?.usagePercent?.toFixed(1) || '0.0' }}%
            </div>
            <div class="card-detail">
              {{ overviewData?.cpu?.usageCores?.toFixed(3) || '0.000' }} /
              {{ overviewData?.cpu?.limitCores?.toFixed(2) || 'N/A' }} cores
            </div>
            <div class="card-progress">
              <div
                class="progress-bar"
                :style="{ width: `${overviewData?.cpu?.usagePercent || 0}%` }"
                :class="getUsageLevelClass(overviewData?.cpu?.usagePercent)"
              ></div>
            </div>
          </div>
          <div class="card-badge" :class="getUsageLevel(overviewData?.cpu?.usagePercent)">
            {{ getUsageLevelText(overviewData?.cpu?.usagePercent) }}
          </div>
        </div>

        <!-- 内存卡片 -->
        <div class="metric-card memory-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z"
              />
            </svg>
          </div>
          <div class="card-content">
            <div class="card-label">内存使用</div>
            <div class="card-value">
              {{ overviewData?.memory?.usagePercent?.toFixed(1) || '0.0' }}%
            </div>
            <div class="card-detail">
              {{ formatBytes(overviewData?.memory?.usageBytes) }} /
              {{ formatBytes(overviewData?.memory?.limitBytes) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar memory"
                :style="{ width: `${overviewData?.memory?.usagePercent || 0}%` }"
                :class="getUsageLevelClass(overviewData?.memory?.usagePercent)"
              ></div>
            </div>
          </div>
          <div class="card-badge" :class="getUsageLevel(overviewData?.memory?.usagePercent)">
            {{ getUsageLevelText(overviewData?.memory?.usagePercent) }}
          </div>
        </div>

        <!-- 网络卡片 -->
        <div class="metric-card network-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M17,3A2,2 0 0,1 19,5V15A2,2 0 0,1 17,17H13V19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H7C5.89,17 5,16.1 5,15V5A2,2 0 0,1 7,3H17M17,5H7V15H17V5Z"
              />
            </svg>
          </div>
          <div class="card-content">
            <div class="card-label">网络流量</div>
            <div class="network-stats">
              <div class="stat-row receive">
                <ElIcon><Bottom /></ElIcon>
                <span class="stat-label">接收</span>
                <span class="stat-value">{{
                  formatBytes(overviewData?.network?.receiveBytes)
                }}</span>
              </div>
              <div class="stat-row transmit">
                <ElIcon><Top /></ElIcon>
                <span class="stat-label">发送</span>
                <span class="stat-value">{{
                  formatBytes(overviewData?.network?.transmitBytes)
                }}</span>
              </div>
            </div>
          </div>
          <div
            v-if="overviewData?.network?.receiveErrors || overviewData?.network?.transmitErrors"
            class="card-badge danger"
          >
            错误
          </div>
        </div>

        <!-- 状态卡片 -->
        <div class="metric-card status-card">
          <div class="card-icon">
            <span class="status-emoji">
              {{ getStatusEmoji(overviewData?.status?.phase) }}
            </span>
          </div>
          <div class="card-content">
            <div class="card-label">Pod 状态</div>
            <div class="status-info">
              <ElTag :type="getStatusType(overviewData?.status?.phase)" size="small" effect="dark">
                {{ overviewData?.status?.phase || 'Unknown' }}
              </ElTag>
              <div class="status-detail">
                <span class="detail-item">
                  <ElIcon><RefreshRight /></ElIcon>
                  重启: {{ overviewData?.restartCount || 0 }} 次
                </span>
                <span v-if="overviewData?.status?.ready" class="detail-item ready">
                  <ElIcon><CircleCheck /></ElIcon>
                  就绪
                </span>
                <span v-else class="detail-item not-ready">
                  <ElIcon><Warning /></ElIcon>
                  未就绪
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无概览数据" :image-size="120">
          <template #image>
            <svg viewBox="0 0 24 24" width="120" height="120">
              <path
                fill="#dcdfe6"
                d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
              />
            </svg>
          </template>
        </ElEmpty>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Bottom, Top, RefreshRight, CircleCheck, Warning } from '@element-plus/icons-vue'
  import type { PodOverview } from '@/api/console/pod-monitor'

  interface Props {
    overviewData?: PodOverview
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    overviewData: undefined,
    loading: false
  })

  // ==================== 计算属性 ====================

  /** 是否有数据 */
  const hasData = computed(() => {
    return !!(props.overviewData && Object.keys(props.overviewData).length > 0)
  })

  // ==================== 工具函数 ====================

  /** 格式化字节 */
  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  /** 获取使用等级 */
  const getUsageLevel = (percent?: number): string => {
    if (!percent) return 'normal'
    if (percent < 50) return 'normal'
    if (percent < 80) return 'warning'
    return 'danger'
  }

  /** 获取使用等级类名 */
  const getUsageLevelClass = (percent?: number): string => {
    if (!percent) return 'level-normal'
    if (percent < 50) return 'level-normal'
    if (percent < 80) return 'level-warning'
    return 'level-danger'
  }

  /** 获取使用等级文本 */
  const getUsageLevelText = (percent?: number): string => {
    if (!percent) return '正常'
    if (percent < 50) return '正常'
    if (percent < 80) return '偏高'
    return '过高'
  }

  /** 获取状态类型 */
  const getStatusType = (phase?: string) => {
    switch (phase) {
      case 'Running':
        return 'success'
      case 'Pending':
        return 'warning'
      case 'Failed':
        return 'danger'
      case 'Succeeded':
        return 'success'
      default:
        return 'info'
    }
  }

  /** 获取状态表情 */
  const getStatusEmoji = (phase?: string): string => {
    switch (phase) {
      case 'Running':
        return '✅'
      case 'Pending':
        return '⏳'
      case 'Failed':
        return '❌'
      case 'Succeeded':
        return '🎉'
      default:
        return '❓'
    }
  }
</script>

<style lang="scss" scoped>
  .monitor-overview {
    background: white;
    border-radius: 10px;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    margin-bottom: 12px;
    min-height: 90px;
  }

  .overview-grid {
    display: flex;
    gap: 8px;
    width: 100%;

    > .metric-card {
      flex: 1;
      min-width: 0;
    }
  }

  .metric-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px 8px;
    border: 1.5px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.3s ease;
    overflow: hidden;
    min-height: 90px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      border-color: #c0c4cc;

      &::before {
        opacity: 1;
      }
    }

    &.cpu-card::before {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    &.memory-card::before {
      background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
    }

    &.network-card::before {
      background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    }

    &.status-card::before {
      background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
    }

    .card-icon {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      align-self: flex-start;

      svg {
        color: #606266;
      }

      .status-emoji {
        font-size: 18px;
      }
    }

    .card-content {
      flex: 1;
      min-width: 0;

      .card-label {
        font-size: 10px;
        color: #909399;
        margin-bottom: 2px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-value {
        font-size: 18px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
        margin-bottom: 2px;
      }

      .card-detail {
        font-size: 9px;
        color: #909399;
        margin-top: 1px;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-progress {
        margin-top: 3px;
        height: 3px;
        background: #f5f7fa;
        border-radius: 2px;
        overflow: hidden;

        .progress-bar {
          height: 100%;
          border-radius: 2px;
          transition:
            width 0.6s ease,
            background 0.3s ease;

          &.level-normal {
            background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
          }

          &.level-warning {
            background: linear-gradient(90deg, #e6a23c 0%, #f3c969 100%);
          }

          &.level-danger {
            background: linear-gradient(90deg, #f56c6c 0%, #f89898 100%);
          }

          &.memory {
            background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
          }
        }
      }

      .network-stats {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 2px;

        .stat-row {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 9px;
          padding: 2px 4px;
          border-radius: 3px;
          transition: background 0.3s ease;

          &.receive {
            background: linear-gradient(135deg, #e0f7ff 0%, #f0f9ff 100%);
            color: #0369a1;
          }

          &.transmit {
            background: linear-gradient(135deg, #fed7aa 0%, #fef3c7 100%);
            color: #92400e;
          }

          .stat-label {
            font-weight: 500;
            font-size: 9px;
          }

          .stat-value {
            margin-left: auto;
            font-weight: 700;
            font-size: 9px;
            white-space: nowrap;
          }
        }
      }

      .status-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 2px;

        .status-detail {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 9px;

          .detail-item {
            display: flex;
            align-items: center;
            gap: 3px;
            color: #606266;

            &.ready {
              color: #67c23a;
              font-weight: 500;
            }

            &.not-ready {
              color: #f56c6c;
              font-weight: 500;
            }

            .el-icon {
              font-size: 10px;
            }
          }
        }
      }
    }

    .card-badge {
      position: absolute;
      top: 5px;
      right: 5px;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;

      &.normal {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        color: #065f46;
      }

      &.warning {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #92400e;
      }

      &.danger {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #991b1b;
      }
    }
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  // 动画
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  // 响应式
  @media (max-width: 768px) {
    .monitor-overview {
      padding: 10px;
    }

    .overview-grid {
      flex-direction: column;
      gap: 8px;
    }

    .metric-card {
      padding: 10px;
      flex-direction: row;
      align-items: center;
      gap: 10px;

      .card-icon {
        width: 32px;
        height: 32px;

        svg {
          width: 18px;
          height: 18px;
        }

        .status-emoji {
          font-size: 20px;
        }
      }

      .card-content {
        .card-value {
          font-size: 20px;
        }
      }
    }
  }
</style>
