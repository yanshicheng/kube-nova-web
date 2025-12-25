<template>
  <div class="cluster-overview" v-loading="loading">
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
              {{ formatPercentage(overviewData?.resources?.cpu?.usagePercent) }}
            </div>
            <div class="card-detail">
              使用: {{ formatCores(overviewData?.resources?.cpu?.usage) }} /
              {{ formatCores(overviewData?.resources?.cpu?.allocatable) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar"
                :style="{ width: `${overviewData?.resources?.cpu?.usagePercent || 0}%` }"
                :class="getUsageLevelClass(overviewData?.resources?.cpu?.usagePercent)"
              ></div>
            </div>
          </div>
          <div
            class="card-badge"
            :class="getUsageLevel(overviewData?.resources?.cpu?.usagePercent)"
          >
            {{ getUsageLevelText(overviewData?.resources?.cpu?.usagePercent) }}
          </div>
        </div>

        <!-- 内存卡片 -->
        <div class="metric-card memory-card">
          <div class="card-icon">
            <img src="@/assets/img/monitoring/memory.png" alt="内存" />
          </div>
          <div class="card-content">
            <div class="card-label">内存使用率</div>
            <div class="card-value">
              {{ formatPercentage(overviewData?.resources?.memory?.usagePercent) }}
            </div>
            <div class="card-detail">
              使用: {{ formatBytes(overviewData?.resources?.memory?.usage) }} /
              {{ formatBytes(overviewData?.resources?.memory?.allocatable) }}
            </div>
            <div class="card-progress">
              <div
                class="progress-bar memory"
                :style="{ width: `${overviewData?.resources?.memory?.usagePercent || 0}%` }"
                :class="getUsageLevelClass(overviewData?.resources?.memory?.usagePercent)"
              ></div>
            </div>
          </div>
          <div
            class="card-badge"
            :class="getUsageLevel(overviewData?.resources?.memory?.usagePercent)"
          >
            {{ getUsageLevelText(overviewData?.resources?.memory?.usagePercent) }}
          </div>
        </div>

        <!-- 节点卡片 -->
        <div class="metric-card node-card">
          <div class="card-icon">
            <img src="@/assets/img/monitoring/server.png" alt="节点" />
          </div>
          <div class="card-content">
            <div class="card-label">集群节点</div>
            <div class="node-stats">
              <div class="stat-row total">
                <span class="stat-label">总计</span>
                <span class="stat-value">{{ overviewData?.nodes?.total || 0 }}</span>
              </div>
              <div class="stat-row ready">
                <ElIcon><CircleCheck /></ElIcon>
                <span class="stat-label">就绪</span>
                <span class="stat-value">{{ overviewData?.nodes?.ready || 0 }}</span>
              </div>
              <div v-if="overviewData?.nodes?.notReady" class="stat-row not-ready">
                <ElIcon><CircleClose /></ElIcon>
                <span class="stat-label">未就绪</span>
                <span class="stat-value">{{ overviewData.nodes.notReady }}</span>
              </div>
            </div>
          </div>
          <div
            v-if="overviewData?.nodes?.notReady && overviewData.nodes.notReady > 0"
            class="card-badge danger"
          >
            异常
          </div>
          <div v-else class="card-badge normal">健康</div>
        </div>

        <!-- Pod 卡片 -->
        <div class="metric-card pod-card">
          <div class="card-icon">
            <img src="@/assets/img/monitoring/pod.png" alt="Pod" />
          </div>
          <div class="card-content">
            <div class="card-label">Pod 状态</div>
            <div class="pod-stats">
              <div class="stat-row running">
                <ElIcon><VideoPlay /></ElIcon>
                <span class="stat-label">运行中</span>
                <span class="stat-value">{{ overviewData?.workloads?.pods?.running || 0 }}</span>
              </div>
              <div class="stat-row total">
                <span class="stat-label">总计</span>
                <span class="stat-value">{{ overviewData?.workloads?.pods?.total || 0 }}</span>
              </div>
              <div v-if="overviewData?.workloads?.pods?.failed" class="stat-row failed">
                <ElIcon><CircleClose /></ElIcon>
                <span class="stat-label">失败</span>
                <span class="stat-value">{{ overviewData.workloads.pods.failed }}</span>
              </div>
            </div>
          </div>
          <div
            v-if="overviewData?.workloads?.pods?.failed && overviewData.workloads.pods.failed > 0"
            class="card-badge warning"
          >
            有失败
          </div>
          <div v-else class="card-badge normal">正常</div>
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
  import { CircleCheck, CircleClose, VideoPlay } from '@element-plus/icons-vue'
  import type { ClusterOverview } from '@/api/console/cluster-monitor'
  import { formatBytes, formatCores, formatPercentage } from '@/utils/format'

  interface Props {
    overviewData?: ClusterOverview
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
    if (percent < 60) return 'normal'
    if (percent < 80) return 'warning'
    return 'danger'
  }

  const getUsageLevelClass = (percent?: number): string => {
    if (!percent) return 'level-normal'
    if (percent < 60) return 'level-normal'
    if (percent < 80) return 'level-warning'
    return 'level-danger'
  }

  const getUsageLevelText = (percent?: number): string => {
    if (!percent) return '正常'
    if (percent < 60) return '正常'
    if (percent < 80) return '偏高'
    return '过高'
  }
</script>

<style lang="scss" scoped>
  .cluster-overview {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    margin-bottom: 16px;
    min-height: auto;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* ✅ 强制4列 */
    gap: 12px;
  }

  .metric-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px; /* ✅ 减小内边距 */
    border: 2px solid #e4e7ed;
    border-radius: 12px;
    transition: all 0.3s ease;
    overflow: hidden;
    min-height: 100px; /* ✅ 降低最小高度 */

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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

    &.node-card::before {
      background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    }

    &.pod-card::before {
      background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
    }

    .card-icon {
      width: 48px; /* ✅ 减小图标 */
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      padding: 8px;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .card-content {
      flex: 1;
      min-width: 0;

      .card-label {
        font-size: 12px; /* ✅ 减小字体 */
        color: #909399;
        margin-bottom: 6px;
        font-weight: 500;
      }

      .card-value {
        font-size: 26px; /* ✅ 减小字体 */
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
        margin-bottom: 6px;
      }

      .card-detail {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }

      .card-progress {
        margin-top: 10px;
        height: 5px; /* ✅ 减小进度条高度 */
        background: #f5f7fa;
        border-radius: 3px;
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

      .node-stats,
      .pod-stats {
        display: flex;
        flex-direction: column;
        gap: 6px; /* ✅ 减小间距 */
        margin-top: 6px;

        .stat-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px; /* ✅ 减小字体 */
          padding: 4px 10px; /* ✅ 减小内边距 */
          border-radius: 5px;
          transition: background 0.3s ease;

          &.total {
            background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
            color: #4338ca;
          }

          &.ready,
          &.running {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.not-ready,
          &.failed {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
          }

          .stat-label {
            font-weight: 500;
          }

          .stat-value {
            margin-left: auto;
            font-weight: 700;
          }
        }
      }
    }

    .card-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 3px 10px; /* ✅ 减小内边距 */
      border-radius: 10px;
      font-size: 11px; /* ✅ 减小字体 */
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
    min-height: 160px;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* ✅ 响应式：当屏幕宽度小于1400px时改为2列 */
  @media (max-width: 1400px) {
    .overview-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .cluster-overview {
      padding: 12px;
    }

    .overview-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .metric-card {
      padding: 14px;

      .card-icon {
        width: 42px;
        height: 42px;
      }

      .card-content {
        .card-value {
          font-size: 22px;
        }
      }
    }
  }
</style>
