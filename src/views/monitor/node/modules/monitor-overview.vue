<template>
  <div class="monitor-overview" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="overview-grid">
        <!-- CPU 卡片 -->
        <div class="metric-card cpu-card">
          <div class="card-icon">
            <img src="@/assets/img/monitoring/CPU.png" alt="CPU" />
          </div>
          <div class="card-content">
            <div class="card-label">CPU 使用率</div>
            <div class="card-value">
              {{ formatPercentage(overviewData?.cpu?.usagePercent) }}
            </div>
            <div class="card-detail">
              Load5: {{ overviewData?.cpu?.load5?.toFixed(2) || '0.00' }} /
              {{ overviewData?.cpu?.cores || 0 }} cores
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
            <img src="@/assets/img/monitoring/memory.png" alt="Memory" />
          </div>
          <div class="card-content">
            <div class="card-label">内存使用</div>
            <div class="card-value">
              {{ formatPercentage(overviewData?.memory?.usagePercent) }}
            </div>
            <div class="card-detail">
              {{ formatBytes(overviewData?.memory?.usedBytes) }} /
              {{ formatBytes(overviewData?.memory?.totalBytes) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar memory"
                :style="{ width: `${overviewData?.memory?.usagePercent || 0}%` }"
                :class="getUsageLevelClass(overviewData?.memory?.usagePercent)"
              ></div>
            </div>
            <div v-if="overviewData?.memory?.swapUsagePercent" class="card-extra">
              <ElIcon><Warning /></ElIcon>
              Swap: {{ formatPercentage(overviewData.memory.swapUsagePercent) }}
            </div>
          </div>
          <div class="card-badge" :class="getUsageLevel(overviewData?.memory?.usagePercent)">
            {{ getUsageLevelText(overviewData?.memory?.usagePercent) }}
          </div>
        </div>

        <!-- 磁盘卡片 -->
        <div class="metric-card disk-card">
          <div class="card-icon">
            <img src="@/assets/img/monitoring/disk.png" alt="Disk" />
          </div>
          <div class="card-content">
            <div class="card-label">磁盘使用</div>
            <div class="card-value">
              {{ formatPercentage(overviewData?.disk?.usagePercent) }}
            </div>
            <div class="card-detail">
              {{ formatBytes(overviewData?.disk?.usedBytes) }} /
              {{ formatBytes(overviewData?.disk?.totalBytes) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar disk"
                :style="{ width: `${overviewData?.disk?.usagePercent || 0}%` }"
                :class="getUsageLevelClass(overviewData?.disk?.usagePercent)"
              ></div>
            </div>
          </div>
          <div class="card-badge" :class="getUsageLevel(overviewData?.disk?.usagePercent)">
            {{ getUsageLevelText(overviewData?.disk?.usagePercent) }}
          </div>
        </div>

        <!-- 网络卡片 -->
        <div class="metric-card network-card">
          <div class="card-icon">
            <img src="@/assets/img/monitoring/nonetwork.png" alt="Network" />
          </div>
          <div class="card-content">
            <div class="card-label">网络流量</div>
            <div class="network-stats">
              <div class="stat-row receive">
                <ElIcon><Bottom /></ElIcon>
                <span class="stat-label">接收</span>
                <span class="stat-value">{{
                  formatBitRate(overviewData?.network?.receiveBytesPerSec)
                }}</span>
              </div>
              <div class="stat-row transmit">
                <ElIcon><Top /></ElIcon>
                <span class="stat-label">发送</span>
                <span class="stat-value">{{
                  formatBitRate(overviewData?.network?.transmitBytesPerSec)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pod 状态卡片 -->
        <div class="metric-card pods-card">
          <div class="card-icon">
            <img src="@/assets/img/monitoring/pod.png" alt="Pod" />
          </div>
          <div class="card-content">
            <div class="card-label">Pod 状态</div>
            <div class="pods-info">
              <div class="pod-stat">
                <span class="label">Total</span>
                <span class="value">{{ overviewData?.pods?.total || 0 }}</span>
              </div>
              <div class="pod-stat running">
                <span class="label">Running</span>
                <span class="value">{{ overviewData?.pods?.running || 0 }}</span>
              </div>
              <div v-if="overviewData?.pods?.pending" class="pod-stat pending">
                <span class="label">Pending</span>
                <span class="value">{{ overviewData.pods.pending }}</span>
              </div>
              <div v-if="overviewData?.pods?.failed" class="pod-stat failed">
                <span class="label">Failed</span>
                <span class="value">{{ overviewData.pods.failed }}</span>
              </div>
            </div>
          </div>
          <div class="card-badge" :class="overviewData?.ready ? 'normal' : 'warning'">
            {{ overviewData?.ready ? '健康' : '异常' }}
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无概览数据" :image-size="120" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Bottom, Top, Warning } from '@element-plus/icons-vue'
  import { formatBytes, formatBitRate, formatPercentage } from '@/utils/format'

  interface Props {
    overviewData?: any
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    overviewData: undefined,
    loading: false
  })

  const hasData = computed(() => {
    return !!(props.overviewData && Object.keys(props.overviewData).length > 0)
  })

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
  .monitor-overview {
    background: white;
    border-radius: 12px;
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
      background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
    }

    &.network-card::before {
      background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    }

    &.pods-card::before {
      background: linear-gradient(90deg, #fa709a 0%, #fee140 100%);
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      align-self: flex-start;

      img {
        width: 18px;
        height: 18px;
        object-fit: contain;
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

      .card-extra {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: #e6a23c;
        margin-top: 6px;
      }

      .card-progress {
        margin-top: 4px;
        height: 3px;
        background: #f5f7fa;
        border-radius: 2px;
        overflow: hidden;

        .progress-bar {
          height: 100%;
          border-radius: 3px;
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
          }
        }
      }

      .pods-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 3px;
        margin-top: 3px;

        .pod-stat {
          padding: 4px;
          border-radius: 4px;
          background: #f5f7fa;
          display: flex;
          flex-direction: column;
          gap: 2px;

          .label {
            font-size: 8px;
            color: #909399;
          }

          .value {
            font-size: 14px;
            font-weight: 700;
            color: #303133;
          }

          &.running {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);

            .value {
              color: #065f46;
            }
          }

          &.pending {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);

            .value {
              color: #92400e;
            }
          }

          &.failed {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);

            .value {
              color: #991b1b;
            }
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
      text-transform: uppercase;
      letter-spacing: 0.5px;

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

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  @media (max-width: 768px) {
    .monitor-overview {
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

        img {
          width: 20px;
          height: 20px;
        }
      }

      .card-content .card-value {
        font-size: 22px;
      }
    }
  }
</style>
