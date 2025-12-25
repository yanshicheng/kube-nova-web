<template>
  <div class="etcd-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper etcd-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>Etcd 监控</h3>
              <p>分布式键值存储 - 集群状态与性能</p>
            </div>
          </div>
          <div class="header-stats">
            <ElTag :type="etcdStatus.type" effect="plain" size="large">
              {{ etcdStatus.text }}
            </ElTag>
          </div>
        </div>

        <!-- 核心指标 -->
        <div class="metrics-section">
          <ElRow :gutter="16">
            <ElCol :xs="24" :sm="12" :lg="6">
              <div class="metric-card primary">
                <div class="metric-icon">💾</div>
                <div class="metric-content">
                  <div class="metric-label">数据库大小</div>
                  <div class="metric-value">{{ formatBytes(etcdData?.dbSizeBytes) }}</div>
                  <div class="metric-detail">
                    使用中: {{ formatBytes(etcdData?.dbSizeInUse) }}
                  </div>
                  <div
                    v-if="etcdData?.dbSizeLimit && etcdData.dbSizeLimit > 0"
                    class="progress-bar"
                  >
                    <div
                      class="progress-fill"
                      :style="{ width: getDBUsagePercent() + '%' }"
                      :class="{ warning: getDBUsagePercent() > 80 }"
                    ></div>
                  </div>
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="6">
              <div class="metric-card" :class="{ warning: (etcdData?.commitLatency || 0) > 0.025 }">
                <div class="metric-icon">⚡</div>
                <div class="metric-content">
                  <div class="metric-label">提交延迟</div>
                  <div class="metric-value">{{ formatLatency(etcdData?.commitLatency) }}</div>
                  <div
                    class="metric-badge"
                    :class="getLatencyLevel(etcdData?.commitLatency, 0.025)"
                  >
                    {{ getLatencyLevelText(etcdData?.commitLatency, 0.025) }}
                  </div>
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="6">
              <div class="metric-card">
                <div class="metric-icon">👥</div>
                <div class="metric-content">
                  <div class="metric-label">集群成员</div>
                  <div class="metric-value">{{ formatInteger(etcdData?.memberCount) }} 个</div>
                  <div
                    class="metric-badge"
                    :class="{ success: etcdData?.hasLeader, danger: !etcdData?.hasLeader }"
                  >
                    {{ etcdData?.hasLeader ? '有Leader' : '无Leader' }}
                  </div>
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="6">
              <div class="metric-card">
                <div class="metric-icon">📊</div>
                <div class="metric-content">
                  <div class="metric-label">键总数</div>
                  <div class="metric-value">{{ formatInteger(etcdData?.keyTotal) }} 个</div>
                </div>
              </div>
            </ElCol>
          </ElRow>
        </div>

        <!-- 集群状态 -->
        <div class="cluster-status">
          <div class="status-header">
            <h4>集群状态</h4>
          </div>
          <div class="status-items">
            <div class="status-item" :class="{ active: etcdData?.hasLeader }">
              <span class="status-label">Leader状态</span>
              <span class="status-value">{{ etcdData?.hasLeader ? '正常' : '异常' }}</span>
            </div>
            <div class="status-item" :class="{ warning: (etcdData?.leaderChanges || 0) > 0 }">
              <span class="status-label">Leader变更</span>
              <span class="status-value">{{ formatInteger(etcdData?.leaderChanges) }} 次/h</span>
            </div>
            <div class="status-item">
              <span class="status-label">角色</span>
              <span class="status-value">{{
                etcdData?.isLearner ? 'Learner' : 'Voting Member'
              }}</span>
            </div>
          </div>
        </div>

        <!-- 图表 -->
        <div class="chart-section">
          <div class="chart-header">
            <h4>Etcd 性能趋势</h4>
            <div class="chart-legend">
              <span class="legend-item">
                <i class="legend-dot" style="background: #409eff"></i>
                DB大小
              </span>
              <span class="legend-item">
                <i class="legend-dot" style="background: #f56c6c"></i>
                提交延迟
              </span>
              <span class="legend-item">
                <i class="legend-dot" style="background: #e6a23c"></i>
                失败提案
              </span>
            </div>
          </div>
          <div ref="etcdChartRef" class="chart"></div>
        </div>

        <!-- 详细指标 -->
        <div class="detail-panel">
          <div class="panel-toggle" @click="toggleDetail">
            <span>详细指标</span>
            <i :class="['arrow', showDetail ? 'up' : 'down']">▼</i>
          </div>
          <Transition name="slide">
            <div v-if="showDetail" class="panel-content">
              <!-- 性能延迟 -->
              <div class="detail-section">
                <div class="section-title">性能延迟</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">Commit延迟</span>
                    <span class="value">{{ formatLatency(etcdData?.commitLatency) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">WAL Fsync</span>
                    <span class="value">{{ formatLatency(etcdData?.walFsyncLatency) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Apply延迟</span>
                    <span class="value">{{ formatLatency(etcdData?.applyLatency) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Snapshot延迟</span>
                    <span class="value">{{ formatLatency(etcdData?.snapshotLatency) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Compact延迟</span>
                    <span class="value">{{ formatLatency(etcdData?.compactLatency) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Peer RTT</span>
                    <span class="value">{{ formatLatency(etcdData?.peerRTT) }}</span>
                  </div>
                </div>
              </div>

              <!-- 操作统计 -->
              <div class="detail-section">
                <div class="section-title">Proposal 状态</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">待处理</span>
                    <span class="value">{{ formatInteger(etcdData?.proposalsPending) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">已应用</span>
                    <span class="value">{{ formatInteger(etcdData?.proposalsApplied) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">已提交</span>
                    <span class="value">{{ formatInteger(etcdData?.proposalsCommitted) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">失败</span>
                    <span class="value danger">{{ formatInteger(etcdData?.proposalsFailed) }}</span>
                  </div>
                </div>
              </div>

              <!-- 操作速率 -->
              <div class="detail-section">
                <div class="section-title">操作速率</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">GET</span>
                    <span class="value">{{ formatNumber(etcdData?.getRate) }} /s</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">PUT</span>
                    <span class="value">{{ formatNumber(etcdData?.putRate) }} /s</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">DELETE</span>
                    <span class="value">{{ formatNumber(etcdData?.deleteRate) }} /s</span>
                  </div>
                </div>
              </div>

              <!-- 网络指标 -->
              <div class="detail-section">
                <div class="section-title">网络指标</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">发送速率</span>
                    <span class="value">{{ formatBytes(etcdData?.networkSendRate) }}/s</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">接收速率</span>
                    <span class="value">{{ formatBytes(etcdData?.networkRecvRate) }}/s</span>
                  </div>
                </div>
              </div>

              <!-- 异常统计 -->
              <div class="detail-section">
                <div class="section-title">异常与慢操作</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">慢Apply</span>
                    <span class="value danger">{{ formatInteger(etcdData?.slowApplies) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">慢Commit</span>
                    <span class="value danger">{{ formatInteger(etcdData?.slowCommits) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无 Etcd 监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import * as echarts from 'echarts'
  import type { EtcdMetrics } from '@/api/console/cluster-monitor'

  interface Props {
    etcdData?: EtcdMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    etcdData: undefined,
    loading: false
  })

  const etcdChartRef = ref<HTMLElement>()
  let etcdChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null
  const showDetail = ref(false)

  const hasData = computed(() => {
    return !!(props.etcdData && Object.keys(props.etcdData).length > 0)
  })

  const toggleDetail = () => (showDetail.value = !showDetail.value)

  // ==================== 格式化函数 ====================
  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return value.toFixed(2)
  }

  const formatInteger = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return Math.round(value).toString()
  }

  const formatLatency = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0 ms'
    const ms = value * 1000
    if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`
    if (ms < 1000) return `${ms.toFixed(2)} ms`
    return `${(ms / 1000).toFixed(2)} s`
  }

  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const getLatencyLevel = (latency?: number, threshold?: number) => {
    if (!latency || !threshold) return 'good'
    if (latency > threshold * 2) return 'critical'
    if (latency > threshold) return 'warning'
    return 'good'
  }

  const getLatencyLevelText = (latency?: number, threshold?: number) => {
    if (!latency || !threshold) return '正常'
    if (latency > threshold * 2) return '严重'
    if (latency > threshold) return '偏高'
    return '正常'
  }

  const getDBUsagePercent = (): number => {
    if (!props.etcdData?.dbSizeLimit || props.etcdData.dbSizeLimit === 0) return 0
    return (props.etcdData.dbSizeBytes / props.etcdData.dbSizeLimit) * 100
  }

  const etcdStatus = computed(() => {
    const data = props.etcdData
    if (!data) return { type: 'info', text: '未知' }

    if (!data.hasLeader) return { type: 'danger', text: '无 Leader' }
    if (data.proposalsFailed > 0 || data.slowCommits > 0 || data.slowApplies > 0) {
      return { type: 'danger', text: '异常' }
    }
    if (data.commitLatency > 0.025 || data.walFsyncLatency > 0.01) {
      return { type: 'warning', text: '需关注' }
    }
    return { type: 'success', text: '正常' }
  })

  // ==================== 图表初始化 ====================
  const initChart = () => {
    if (!etcdChartRef.value) return
    etcdChart = echarts.init(etcdChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (value: number) =>
            new Date(value).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'DB 大小',
          position: 'left',
          axisLabel: { formatter: (value: number) => formatBytes(value) }
        },
        {
          type: 'value',
          name: '延迟 ms / 失败数',
          position: 'right'
        }
      ],
      series: []
    }

    etcdChart.setOption(option)
  }

  const updateChart = () => {
    if (!etcdChart || !props.etcdData?.trend) return

    const trend = props.etcdData.trend
    if (trend.length === 0) return

    const dbSizeData = trend.map((item) => [item.timestamp * 1000, item.dbSizeBytes || 0])
    const latencyData = trend.map((item) => [
      item.timestamp * 1000,
      (item.commitLatency || 0) * 1000
    ])
    const failedData = trend.map((item) => [item.timestamp * 1000, item.proposalsFailed || 0])

    etcdChart.setOption({
      series: [
        {
          name: 'DB 大小',
          type: 'line',
          yAxisIndex: 0,
          data: dbSizeData,
          smooth: true,
          lineStyle: { width: 2, color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          }
        },
        {
          name: '提交延迟',
          type: 'line',
          yAxisIndex: 1,
          data: latencyData,
          smooth: true,
          lineStyle: { width: 2, color: '#f56c6c' }
        },
        {
          name: '失败提案',
          type: 'line',
          yAxisIndex: 1,
          data: failedData,
          smooth: true,
          lineStyle: { width: 2, color: '#e6a23c' }
        }
      ]
    })
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      etcdChart?.resize()
    }, 300)
  }

  watch(
    () => props.etcdData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!etcdChart) initChart()
          updateChart()
        }
      })
    },
    { deep: true, immediate: true }
  )

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    etcdChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .etcd-monitor {
    .monitor-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      animation: slideInUp 0.5s ease-out;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-bottom: 1px solid #86efac;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

          &.etcd-icon {
            background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
          }

          svg {
            width: 20px;
            height: 20px;
          }
        }

        .header-title {
          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #1a202c;
          }

          p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #718096;
          }
        }
      }
    }

    .metrics-section {
      padding: 20px;

      .metric-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        transition: all 0.3s ease;
        margin-bottom: 16px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        &.primary {
          border-color: #c7d2fe;
        }

        &.warning {
          border-color: #e6a23c;
          background: #fef5e7;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: white;
          flex-shrink: 0;
        }

        .metric-content {
          flex: 1;

          .metric-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 6px;
          }

          .metric-value {
            font-size: 20px;
            font-weight: 700;
            color: #303133;
          }

          .metric-detail {
            font-size: 12px;
            color: #606266;
            margin-top: 4px;
          }

          .metric-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 500;
            margin-top: 6px;

            &.good {
              background: #e8f5e9;
              color: #388e3c;
            }
            &.warning {
              background: #fff3e0;
              color: #f57c00;
            }
            &.critical {
              background: #ffebee;
              color: #d32f2f;
            }
            &.success {
              background: #e8f5e9;
              color: #388e3c;
            }
            &.danger {
              background: #ffebee;
              color: #d32f2f;
            }
          }

          .progress-bar {
            margin-top: 8px;
            height: 4px;
            background: #e4e7ed;
            border-radius: 2px;
            overflow: hidden;

            .progress-fill {
              height: 100%;
              background: #409eff;
              transition: width 0.5s ease;

              &.warning {
                background: #e6a23c;
              }
            }
          }
        }
      }
    }

    .cluster-status {
      margin: 20px;
      padding: 16px;
      background: #f4f4f5;
      border-radius: 8px;

      .status-header {
        margin-bottom: 12px;

        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }
      }

      .status-items {
        display: flex;
        gap: 10px;

        .status-item {
          flex: 1;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e4e7ed;

          &.active {
            border-color: #67c23a;
            background: #f0f9ff;
          }

          &.warning {
            border-color: #e6a23c;
          }

          .status-label {
            font-size: 11px;
            color: #909399;
            display: block;
            margin-bottom: 4px;
          }

          .status-value {
            font-size: 13px;
            font-weight: 500;
            color: #303133;
          }
        }
      }
    }

    .chart-section {
      margin: 20px;
      padding-top: 16px;
      border-top: 1px solid #e4e7ed;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        .chart-legend {
          display: flex;
          gap: 12px;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #909399;

            .legend-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }
          }
        }
      }

      .chart {
        height: 280px;
        width: 100%;
      }
    }

    .detail-panel {
      margin: 20px;
      border-top: 1px solid #e4e7ed;
      padding-top: 12px;

      .panel-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: #f4f4f5;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        user-select: none;

        &:hover {
          background: #e9e9eb;
        }

        span {
          font-size: 12px;
          font-weight: 500;
          color: #606266;
        }

        .arrow {
          font-size: 11px;
          color: #909399;
          transition: transform 0.3s ease;

          &.up {
            transform: rotate(180deg);
          }
        }
      }

      .panel-content {
        padding: 12px 0;

        .detail-section {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .section-title {
            font-size: 12px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e4e7ed;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;

            .detail-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px;
              background: #f4f4f5;
              border-radius: 6px;

              .label {
                font-size: 11px;
                color: #909399;
              }

              .value {
                font-size: 13px;
                font-weight: 500;
                color: #303133;

                &.danger {
                  color: #f56c6c;
                }
              }
            }
          }
        }
      }
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 350px;
      background: white;
      border-radius: 12px;
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

  .slide-enter-active,
  .slide-leave-active {
    transition: all 0.3s ease;
    max-height: 2000px;
    overflow: hidden;
  }

  .slide-enter-from,
  .slide-leave-to {
    max-height: 0;
    opacity: 0;
  }

  @media (max-width: 768px) {
    .etcd-monitor {
      .card-header {
        padding: 16px 20px;
      }

      .metrics-section {
        padding: 16px;
      }

      .cluster-status .status-items {
        flex-direction: column;
      }
    }
  }
</style>
