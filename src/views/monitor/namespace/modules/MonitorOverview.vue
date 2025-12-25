<template>
  <div class="namespace-monitor-overview" v-loading="loading">
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
            <div class="card-label">CPU 使用率</div>
            <div class="card-value">
              {{ formatPercentage(overviewData?.resources?.cpu?.current?.usagePercent) }}
            </div>
            <div class="card-detail">
              Load: {{ formatCores(overviewData?.resources?.cpu?.current?.usageCores) }} /
              {{ formatCores(overviewData?.resources?.cpu?.limits) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar"
                :style="{
                  width: `${overviewData?.resources?.cpu?.current?.usagePercent || 0}%`
                }"
                :class="getUsageLevelClass(overviewData?.resources?.cpu?.current?.usagePercent)"
              ></div>
            </div>
          </div>
          <div
            class="card-badge"
            :class="getUsageLevel(overviewData?.resources?.cpu?.current?.usagePercent)"
          >
            {{ getUsageLevelText(overviewData?.resources?.cpu?.current?.usagePercent) }}
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
              {{ formatPercentage(overviewData?.resources?.memory?.current?.usagePercent) }}
            </div>
            <div class="card-detail">
              {{ formatBytes(overviewData?.resources?.memory?.current?.workingSetBytes) }} /
              {{ formatBytes(overviewData?.resources?.memory?.limits) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar memory"
                :style="{
                  width: `${overviewData?.resources?.memory?.current?.usagePercent || 0}%`
                }"
                :class="getUsageLevelClass(overviewData?.resources?.memory?.current?.usagePercent)"
              ></div>
            </div>
          </div>
          <div
            class="card-badge"
            :class="getUsageLevel(overviewData?.resources?.memory?.current?.usagePercent)"
          >
            {{ getUsageLevelText(overviewData?.resources?.memory?.current?.usagePercent) }}
          </div>
        </div>

        <!-- 磁盘使用卡片 -->
        <div class="metric-card disk-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12.1,16L11.22,13.77C10.23,13.4 9.5,12.47 9.5,11.37C9.5,9.93 10.67,8.77 12.11,8.77C13.55,8.77 14.72,9.93 14.72,11.37C14.72,12.47 13.99,13.4 13,13.77L12.12,16C15.41,16 18.1,13.31 18.1,10A6,6 0 0,0 12,4M12,9.5A1.5,1.5 0 0,0 10.5,11A1.5,1.5 0 0,0 12,12.5A1.5,1.5 0 0,0 13.5,11A1.5,1.5 0 0,0 12,9.5Z"
              />
            </svg>
          </div>
          <div class="card-content">
            <div class="card-label">磁盘使用</div>
            <div class="card-value">
              {{ formatPercentage(overviewData?.resources?.disk?.usagePercent || 0) }}
            </div>
            <div class="card-detail">
              {{ formatBytes(overviewData?.resources?.disk?.used || 0) }} /
              {{ formatBytes(overviewData?.resources?.disk?.total || 0) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar disk"
                :style="{
                  width: `${overviewData?.resources?.disk?.usagePercent || 0}%`
                }"
                :class="getUsageLevelClass(overviewData?.resources?.disk?.usagePercent)"
              ></div>
            </div>
          </div>
          <div
            class="card-badge"
            :class="getUsageLevel(overviewData?.resources?.disk?.usagePercent)"
          >
            {{ getUsageLevelText(overviewData?.resources?.disk?.usagePercent) }}
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
              <div class="stat-row ingress">
                <ElIcon><Bottom /></ElIcon>
                <span class="stat-label">接收</span>
                <span class="stat-value">{{
                  formatBitRate(overviewData?.network?.current?.receiveBytesPerSec || 0)
                }}</span>
              </div>
              <div class="stat-row egress">
                <ElIcon><Top /></ElIcon>
                <span class="stat-label">发送</span>
                <span class="stat-value">{{
                  formatBitRate(overviewData?.network?.current?.transmitBytesPerSec || 0)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pod 状态卡片 -->
        <div class="metric-card pod-card">
          <div class="card-icon">
            <span class="status-emoji">📦</span>
          </div>
          <div class="card-content">
            <div class="card-label">Pod 状态</div>
            <div class="pod-stats">
              <div class="stat-item">
                <span class="stat-count total">{{
                  overviewData?.workloads?.pods?.total || 0
                }}</span>
                <span class="stat-text">Total</span>
              </div>
              <div class="stat-item">
                <span class="stat-count running">{{
                  overviewData?.workloads?.pods?.running || 0
                }}</span>
                <span class="stat-text">Running</span>
              </div>
            </div>
          </div>
          <div
            v-if="overviewData?.workloads?.pods?.failed && overviewData.workloads.pods.failed > 0"
            class="card-badge danger"
          >
            异常
          </div>
          <div v-else class="card-badge normal">健康</div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无概览数据" :image-size="120" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Bottom, Top } from '@element-plus/icons-vue'
  import type { NamespaceMetrics } from '@/api/console/namespace-monitor'
  import { formatBytes, formatBitRate, formatPercentage } from '@/utils/format'

  interface Props {
    overviewData?: NamespaceMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    overviewData: undefined,
    loading: false
  })

  // ==================== 计算属性 ====================

  const hasData = computed(() => {
    return !!(props.overviewData && Object.keys(props.overviewData).length > 0)
  })

  // ==================== 工具函数 ====================

  const formatCores = (cores?: number): string => {
    if (!cores || cores === 0) return '0'
    if (cores < 1) return `${(cores * 1000).toFixed(0)}m`
    return `${cores.toFixed(2)} cores`
  }

  const getUsageLevel = (percent?: number): string => {
    if (!percent) return 'normal'
    if (percent < 50) return 'normal'
    if (percent < 80) return 'warning'
    return 'danger'
  }

  const getUsageLevelClass = (percent?: number): string => {
    if (!percent) return 'level-normal'
    if (percent < 50) return 'level-normal'
    if (percent < 80) return 'level-warning'
    return 'level-danger'
  }

  const getUsageLevelText = (percent?: number): string => {
    if (!percent) return '正常'
    if (percent < 50) return '正常'
    if (percent < 80) return '偏高'
    return '过高'
  }
</script>

<style lang="scss" scoped>
  .namespace-monitor-overview {
    background: white;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    margin-bottom: 16px;
    min-height: 100px;
  }

  .overview-grid {
    display: flex;
    gap: 10px;
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
    gap: 4px;
    padding: 8px;
    border: 1.5px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.3s ease;
    overflow: hidden;
    background: #fafbfc;
    min-height: 100px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
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

    &.disk-card::before {
      background: linear-gradient(90deg, #ffa726 0%, #fb8c00 100%);
    }

    &.network-card::before {
      background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    }

    &.pod-card::before {
      background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
    }

    .card-icon {
      width: 28px;
      height: 28px;
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
        width: 16px;
        height: 16px;
      }

      .status-emoji {
        font-size: 16px;
      }
    }

    .card-content {
      flex: 1;
      min-width: 0;

      .card-label {
        font-size: 10px;
        color: #909399;
        margin-bottom: 3px;
        font-weight: 500;
      }

      .card-value {
        font-size: 20px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
        margin-bottom: 3px;
      }

      .card-detail {
        font-size: 9px;
        color: #909399;
        margin-top: 1px;
        line-height: 1.3;
      }

      .card-progress {
        margin-top: 4px;
        height: 3px;
        background: #f0f2f5;
        border-radius: 2px;
        overflow: hidden;

        .progress-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;

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

          &.disk {
            background: linear-gradient(90deg, #ffa726 0%, #fb8c00 100%);
          }
        }
      }

      .network-stats {
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-top: 3px;

        .stat-row {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 9px;
          padding: 3px 5px;
          border-radius: 4px;

          &.ingress {
            background: linear-gradient(135deg, #e0f7ff 0%, #f0f9ff 100%);
            color: #0369a1;
          }

          &.egress {
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
          }
        }
      }

      .pod-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 3px;
        margin-top: 3px;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e4e7ed;

          .stat-count {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 2px;

            &.total {
              color: #409eff;
            }

            &.running {
              color: #67c23a;
            }

            &.pending {
              color: #e6a23c;
            }

            &.failed {
              color: #f56c6c;
            }
          }

          .stat-text {
            font-size: 8px;
            color: #909399;
            font-weight: 500;
          }
        }
      }
    }

    .card-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 600;

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
    min-height: 120px;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  @media (max-width: 768px) {
    .namespace-monitor-overview {
      padding: 12px;
    }

    .overview-grid {
      flex-direction: column;
    }

    .metric-card {
      padding: 12px;
      flex-direction: row;
      align-items: center;

      .card-icon {
        width: 36px;
        height: 36px;

        svg {
          width: 18px;
          height: 18px;
        }

        .status-emoji {
          font-size: 18px;
        }
      }

      .card-content .card-value {
        font-size: 22px;
      }
    }
  }
</style>
