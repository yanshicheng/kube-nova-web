<template>
  <div class="pod-status-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper status-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,9H13V15H11V9M12,17A1,1 0 0,1 13,18A1,1 0 0,1 12,19A1,1 0 0,1 11,18A1,1 0 0,1 12,17Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>Pod 状态与重启</h3>
              <p>运行状态和容器健康</p>
            </div>
          </div>
          <div class="header-stats">
            <ElTag :type="getPhaseType(statusData?.current?.phase)" size="large" effect="dark">
              {{ statusData?.current?.phase || 'Unknown' }}
            </ElTag>
            <ElTag
              :type="statusData?.current?.ready ? 'success' : 'warning'"
              size="large"
              effect="plain"
            >
              {{ statusData?.current?.ready ? '就绪' : '未就绪' }}
            </ElTag>
          </div>
        </div>

        <div class="content-wrapper">
          <ElRow :gutter="20">
            <!-- Pod 状态信息 -->
            <ElCol :xs="24" :lg="12">
              <div class="status-section">
                <div class="section-header">
                  <h4>
                    <ElIcon><InfoFilled /></ElIcon>
                    当前状态
                  </h4>
                </div>
                <div class="status-content">
                  <div class="status-item">
                    <span class="label">阶段:</span>
                    <ElTag :type="getPhaseType(statusData?.current?.phase)" size="large">
                      {{ statusData?.current?.phase || 'Unknown' }}
                    </ElTag>
                  </div>
                  <div class="status-item">
                    <span class="label">就绪状态:</span>
                    <ElTag :type="statusData?.current?.ready ? 'success' : 'danger'" size="large">
                      {{ statusData?.current?.ready ? '就绪' : '未就绪' }}
                    </ElTag>
                  </div>
                  <div v-if="statusData?.current?.reason" class="status-item">
                    <span class="label">原因:</span>
                    <span class="value reason">{{ statusData.current.reason }}</span>
                  </div>
                  <div v-if="statusData?.current?.message" class="status-item">
                    <span class="label">消息:</span>
                    <span class="value message">{{ statusData.current.message }}</span>
                  </div>
                </div>

                <!-- 容器状态 -->
                <div v-if="statusData?.current?.containerStates?.length" class="containers-status">
                  <div class="section-header">
                    <h4>
                      <ElIcon><Box /></ElIcon>
                      容器状态
                      <ElTag type="info" size="small">
                        {{ statusData.current.containerStates.length }}
                      </ElTag>
                    </h4>
                  </div>
                  <div
                    class="container-item"
                    v-for="container in statusData.current.containerStates"
                    :key="container.containerName"
                  >
                    <div class="container-header">
                      <span class="container-name">
                        <ElIcon><Box /></ElIcon>
                        {{ container.containerName }}
                      </span>
                      <ElTag :type="container.ready ? 'success' : 'warning'" size="small">
                        {{ container.state }}
                      </ElTag>
                    </div>
                    <div class="container-info">
                      <span class="info-item">
                        <ElIcon><RefreshRight /></ElIcon>
                        重启: <strong>{{ container.restartCount }}</strong>
                      </span>
                      <span v-if="container.reason" class="info-item reason">
                        <ElIcon><Warning /></ElIcon>
                        {{ container.reason }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 无容器状态 -->
                <ElEmpty v-else description="暂无容器状态信息" :image-size="80" />
              </div>
            </ElCol>

            <!-- 重启信息 -->
            <ElCol :xs="24" :lg="12">
              <div class="restart-section">
                <div class="section-header">
                  <h4>
                    <ElIcon><RefreshRight /></ElIcon>
                    重启统计
                  </h4>
                </div>
                <div class="restart-summary">
                  <div class="summary-item">
                    <div class="summary-icon" :class="{ warning: totalRestarts > 0 }">
                      <ElIcon><RefreshRight /></ElIcon>
                    </div>
                    <div class="summary-content">
                      <div class="summary-label">总重启次数</div>
                      <div class="summary-value" :class="{ warning: totalRestarts > 0 }">
                        {{ totalRestarts }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 按容器统计 -->
                <div v-if="restartData?.byContainer?.length" class="restart-by-container">
                  <div class="section-header">
                    <h4>
                      <ElIcon><Histogram /></ElIcon>
                      按容器统计
                    </h4>
                  </div>
                  <div
                    class="restart-item"
                    v-for="container in restartData.byContainer"
                    :key="container.containerName"
                  >
                    <span class="container-name">
                      <ElIcon><Box /></ElIcon>
                      {{ container.containerName }}
                    </span>
                    <ElTag :type="container.restartCount > 0 ? 'warning' : 'success'" size="small">
                      {{ container.restartCount }} 次
                    </ElTag>
                  </div>
                </div>

                <!-- 最近重启事件 -->
                <div v-if="restartData?.recentRestarts?.length" class="recent-restarts">
                  <div class="section-header">
                    <h4>
                      <ElIcon><Clock /></ElIcon>
                      最近重启事件
                      <ElTag type="warning" size="small">
                        {{ restartData.recentRestarts.length }}
                      </ElTag>
                    </h4>
                  </div>
                  <div
                    class="restart-event"
                    v-for="(event, index) in restartData.recentRestarts.slice(0, 5)"
                    :key="index"
                  >
                    <div class="event-time">
                      <ElIcon><Clock /></ElIcon>
                      {{ formatTime(event.timestamp) }}
                    </div>
                    <div class="event-detail">
                      <span class="event-container">
                        <ElIcon><Box /></ElIcon>
                        {{ event.containerName }}
                      </span>
                      <span class="event-reason">{{ event.reason }}</span>
                      <ElTag type="danger" size="small"> 退出码: {{ event.exitCode }} </ElTag>
                    </div>
                  </div>
                </div>

                <!-- 无重启事件 -->
                <ElEmpty v-else description="暂无重启记录" :image-size="80">
                  <template #image>
                    <ElIcon :size="80" color="#67c23a">
                      <CircleCheck />
                    </ElIcon>
                  </template>
                </ElEmpty>
              </div>
            </ElCol>
          </ElRow>

          <!-- 状态历史时间线 -->
          <div v-if="statusData?.transitions?.length" class="status-history">
            <div class="section-header">
              <h4>
                <ElIcon><Timer /></ElIcon>
                状态变更历史
                <ElTag type="info" size="small">
                  {{ statusData.transitions.length }}
                </ElTag>
              </h4>
            </div>
            <ElTimeline>
              <ElTimelineItem
                v-for="(transition, index) in statusData.transitions.slice(0, 10)"
                :key="index"
                :timestamp="formatTime(transition.timestamp)"
                placement="top"
                :type="getTransitionType(transition.toPhase)"
              >
                <div class="transition-content">
                  <ElTag :type="getPhaseType(transition.fromPhase)" size="small">
                    {{ transition.fromPhase }}
                  </ElTag>
                  <ElIcon class="arrow"><Right /></ElIcon>
                  <ElTag :type="getPhaseType(transition.toPhase)" size="small">
                    {{ transition.toPhase }}
                  </ElTag>
                  <span v-if="transition.reason" class="reason"> ({{ transition.reason }}) </span>
                </div>
              </ElTimelineItem>
            </ElTimeline>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无状态数据" :image-size="150">
          <template #image>
            <svg viewBox="0 0 24 24" width="150" height="150">
              <path
                fill="#dcdfe6"
                d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"
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
  import {
    InfoFilled,
    Box,
    RefreshRight,
    Warning,
    Histogram,
    Clock,
    Timer,
    Right,
    CircleCheck
  } from '@element-plus/icons-vue'
  import type { PodStatusMetrics, RestartMetrics } from '@/api/console/pod-monitor'

  interface Props {
    statusData?: PodStatusMetrics
    restartData?: RestartMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    statusData: undefined,
    restartData: undefined,
    loading: false
  })

  // ==================== 计算属性 ====================

  /** 是否有数据 */
  const hasData = computed(() => {
    return !!(props.statusData || props.restartData)
  })

  /** 总重启次数 */
  const totalRestarts = computed(() => {
    return props.restartData?.totalRestarts || 0
  })

  // ==================== 工具函数 ====================

  /** 格式化时间 */
  const formatTime = (timestamp: string): string => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /** 获取阶段类型 */
  const getPhaseType = (phase?: string) => {
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

  /** 获取转换类型 */
  const getTransitionType = (toPhase: string) => {
    switch (toPhase) {
      case 'Running':
        return 'success'
      case 'Failed':
        return 'danger'
      case 'Pending':
        return 'warning'
      default:
        return 'primary'
    }
  }
</script>

<style lang="scss" scoped>
  .pod-status-monitor {
    .monitor-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      animation: slideInUp 0.5s ease-out;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-bottom: 1px solid #bae6fd;
      flex-wrap: wrap;
      gap: 20px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

          &.status-icon {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }
        }

        .header-title {
          h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #1a202c;
          }

          p {
            margin: 4px 0 0;
            font-size: 14px;
            color: #718096;
          }
        }
      }

      .header-stats {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }

    .content-wrapper {
      padding: 24px 32px 32px;
    }

    .section-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e6e9f0;

      h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .status-section,
    .restart-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      height: 100%;

      .status-content {
        .status-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e6e9f0;

          .label {
            font-weight: 500;
            color: #606266;
            margin-right: 12px;
            min-width: 80px;
          }

          .value {
            color: #303133;
            flex: 1;

            &.message {
              font-size: 13px;
              line-height: 1.6;
              color: #606266;
            }

            &.reason {
              color: #e6a23c;
              font-weight: 500;
            }
          }
        }
      }

      .containers-status {
        margin-top: 20px;

        .container-item {
          padding: 16px;
          margin-bottom: 12px;
          background: white;
          border-radius: 8px;
          border-left: 3px solid #409eff;
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
            transform: translateX(4px);
          }

          .container-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .container-name {
              font-weight: 600;
              color: #303133;
              display: flex;
              align-items: center;
              gap: 6px;
            }
          }

          .container-info {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 13px;
            color: #909399;

            .info-item {
              display: flex;
              align-items: center;
              gap: 4px;

              strong {
                color: #303133;
                font-weight: 600;
              }

              &.reason {
                color: #e6a23c;
                font-weight: 500;
              }
            }
          }
        }
      }

      .restart-summary {
        margin-bottom: 20px;

        .summary-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: white;
          border-radius: 12px;
          border: 2px solid #e6e9f0;

          .summary-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: #065f46;

            &.warning {
              background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
              color: #991b1b;
              animation: pulse 2s ease-in-out infinite;
            }
          }

          .summary-content {
            flex: 1;

            .summary-label {
              font-size: 14px;
              color: #909399;
              margin-bottom: 8px;
            }

            .summary-value {
              font-size: 36px;
              font-weight: 700;
              color: #67c23a;

              &.warning {
                color: #f56c6c;
              }
            }
          }
        }
      }

      .restart-by-container {
        margin-bottom: 20px;

        .restart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          margin-bottom: 8px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e6e9f0;
          transition: all 0.3s ease;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
          }

          .container-name {
            font-weight: 500;
            color: #303133;
            display: flex;
            align-items: center;
            gap: 6px;
          }
        }
      }

      .recent-restarts {
        .restart-event {
          padding: 12px 16px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
          border-radius: 8px;
          border-left: 3px solid #f56c6c;

          .event-time {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .event-detail {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            font-size: 13px;

            .event-container {
              font-weight: 600;
              color: #303133;
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .event-reason {
              color: #606266;
            }
          }
        }
      }
    }

    .status-history {
      margin-top: 24px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;

      .transition-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;

        .arrow {
          color: #909399;
          font-weight: bold;
        }

        .reason {
          color: #909399;
          font-size: 13px;
        }
      }
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: white;
      border-radius: 16px;
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  // 响应式处理
  @media (max-width: 768px) {
    .pod-status-monitor {
      .card-header {
        padding: 16px 20px;

        .header-left {
          .icon-wrapper {
            width: 40px;
            height: 40px;
          }

          .header-title h3 {
            font-size: 16px;
          }
        }
      }

      .content-wrapper {
        padding: 20px;
      }
    }
  }
</style>
