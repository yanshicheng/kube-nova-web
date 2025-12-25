<template>
  <div class="pod-metrics" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M7.5,22A3.5,3.5 0 0,1 4,18.5V17.5A3.5,3.5 0 0,1 7.5,14A3.5,3.5 0 0,1 11,17.5V18.5A3.5,3.5 0 0,1 7.5,22M16.5,22A3.5,3.5 0 0,1 13,18.5V17.5A3.5,3.5 0 0,1 16.5,14A3.5,3.5 0 0,1 20,17.5V18.5A3.5,3.5 0 0,1 16.5,22Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>Pod 指标</h3>
              <p>Pod 状态与趋势</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总计</span>
              <span class="value">{{ podData?.total || 0 }}</span>
            </div>
            <div class="stat-badge running">
              <span class="label">Running</span>
              <span class="value">{{ podData?.running || 0 }}</span>
            </div>
            <div class="stat-badge pending">
              <span class="label">Pending</span>
              <span class="value">{{ podData?.pending || 0 }}</span>
            </div>
            <div class="stat-badge failed">
              <span class="label">Failed</span>
              <span class="value">{{ podData?.failed || 0 }}</span>
            </div>
            <div v-if="podData?.totalRestarts" class="stat-badge restarts">
              <ElIcon><Warning /></ElIcon>
              <span class="value">{{ podData.totalRestarts }} 次重启</span>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <div class="status-grid">
            <div class="status-item running">
              <div class="status-icon">✅</div>
              <div class="status-info">
                <div class="status-label">Running</div>
                <div class="status-value">{{ podData?.running || 0 }}</div>
              </div>
            </div>
            <div class="status-item pending">
              <div class="status-icon">⏳</div>
              <div class="status-info">
                <div class="status-label">Pending</div>
                <div class="status-value">{{ podData?.pending || 0 }}</div>
              </div>
            </div>
            <div class="status-item failed">
              <div class="status-icon">❌</div>
              <div class="status-info">
                <div class="status-label">Failed</div>
                <div class="status-value">{{ podData?.failed || 0 }}</div>
              </div>
            </div>
            <div class="status-item succeeded">
              <div class="status-icon">🎉</div>
              <div class="status-info">
                <div class="status-label">Succeeded</div>
                <div class="status-value">{{ podData?.succeeded || 0 }}</div>
              </div>
            </div>
            <div class="status-item unknown">
              <div class="status-icon">❓</div>
              <div class="status-info">
                <div class="status-label">Unknown</div>
                <div class="status-value">{{ podData?.unknown || 0 }}</div>
              </div>
            </div>
          </div>

          <div v-if="podData?.trend?.length" class="chart-section">
            <div class="section-header">
              <h4
                ><ElIcon><TrendCharts /></ElIcon> Pod 数量趋势</h4
              >
            </div>
            <div ref="chartRef" class="chart"></div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无 Pod 数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Warning, TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { NamespacePodStatistics } from '@/api/console/namespace-monitor'

  interface Props {
    podData?: NamespacePodStatistics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    podData: undefined,
    loading: false
  })

  const chartRef = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null

  const hasData = computed(() => {
    return !!(props.podData && Object.keys(props.podData).length > 0)
  })

  const initChart = () => {
    if (!chartRef.value) return
    chart = echarts.init(chartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['Total', 'Running', 'Pending', 'Failed'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '50px',
        top: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: 'Pods',
        minInterval: 1
      },
      series: [
        {
          name: 'Total',
          type: 'line',
          data: props.podData?.trend?.map((t) => [t.timestamp, t.total]) || [],
          smooth: true,
          itemStyle: { color: '#409eff' }
        },
        {
          name: 'Running',
          type: 'line',
          data: props.podData?.trend?.map((t) => [t.timestamp, t.running]) || [],
          smooth: true,
          itemStyle: { color: '#67c23a' }
        },
        {
          name: 'Pending',
          type: 'line',
          data: props.podData?.trend?.map((t) => [t.timestamp, t.pending]) || [],
          smooth: true,
          itemStyle: { color: '#e6a23c' }
        },
        {
          name: 'Failed',
          type: 'line',
          data: props.podData?.trend?.map((t) => [t.timestamp, t.failed]) || [],
          smooth: true,
          itemStyle: { color: '#f56c6c' }
        }
      ]
    }

    chart.setOption(option)
  }

  watch(
    () => props.podData,
    () => {
      nextTick(() => {
        if (hasData.value && props.podData?.trend?.length) {
          if (!chart) initChart()
          else {
            chart.setOption({
              series: [
                { data: props.podData.trend.map((t) => [t.timestamp, t.total]) },
                { data: props.podData.trend.map((t) => [t.timestamp, t.running]) },
                { data: props.podData.trend.map((t) => [t.timestamp, t.pending]) },
                { data: props.podData.trend.map((t) => [t.timestamp, t.failed]) }
              ]
            })
          }
        }
      })
    },
    { deep: true }
  )

  onMounted(() => {
    if (hasData.value && props.podData?.trend?.length) {
      initChart()
    }
    window.addEventListener('resize', () => chart?.resize())
  })

  onUnmounted(() => {
    chart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .pod-metrics {
    .monitor-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-bottom: 1px solid #60a5fa;
      flex-wrap: wrap;
      gap: 14px;

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
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

      .header-stats {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .stat-badge {
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          .value {
            font-weight: 700;
            font-size: 14px;
          }

          &.total {
            background: rgba(255, 255, 255, 0.9);
            color: #1e40af;
          }

          &.running {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.pending {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }

          &.failed {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
          }

          &.restarts {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
            animation: pulse 2s ease-in-out infinite;
          }
        }
      }
    }

    .content-wrapper {
      padding: 20px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;

      .status-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 12px;
        border-left: 4px solid;

        &.running {
          border-left-color: #67c23a;
        }

        &.pending {
          border-left-color: #e6a23c;
        }

        &.failed {
          border-left-color: #f56c6c;
        }

        &.succeeded {
          border-left-color: #409eff;
        }

        &.unknown {
          border-left-color: #909399;
        }

        .status-icon {
          font-size: 32px;
        }

        .status-info {
          .status-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .status-value {
            font-size: 24px;
            font-weight: 700;
            color: #303133;
          }
        }
      }
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

    .chart-section {
      .chart {
        width: 100%;
        height: 350px;
      }
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
</style>
