<template>
  <div class="cpu-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <img src="@/assets/img/monitoring/CPU.png" alt="CPU" class="icon" />
            <div class="header-title">
              <h3>CPU 使用情况</h3>
              <p>处理器负载与性能</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge avg">
              <span class="label">平均使用率</span>
              <span class="value">{{ formatPercentage(cpuData?.summary?.avgUsagePercent) }}</span>
            </div>
            <div class="stat-badge peak">
              <span class="label">峰值</span>
              <span class="value">{{ formatPercentage(cpuData?.summary?.maxUsagePercent) }}</span>
            </div>
            <div class="stat-badge load">
              <span class="label">平均负载(5m)</span>
              <span class="value">{{ cpuData?.summary?.avgLoad5?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="stat-badge cores">
              <span class="label">总核心</span>
              <span class="value">{{ cpuData?.current?.totalCores || 0 }}</span>
              <span class="unit">cores</span>
            </div>
            <div class="stat-badge context">
              <span class="label">上下文切换</span>
              <span class="value">{{
                formatCompactNumber(cpuData?.current?.contextSwitchRate)
              }}</span>
              <span class="unit">/s</span>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <div class="chart-header">
            <h4>
              <ElIcon><TrendCharts /></ElIcon>
              使用趋势
            </h4>
            <div v-if="cpuData?.trend" class="chart-info">
              共 {{ cpuData.trend.length }} 个数据点
            </div>
          </div>
          <div ref="cpuChartRef" class="chart"></div>
        </div>

        <!-- CPU 详细信息 -->
        <div class="cpu-details">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">User</span>
              <span class="value">{{ formatPercentage(cpuData?.current?.userPercent) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">System</span>
              <span class="value">{{ formatPercentage(cpuData?.current?.systemPercent) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">IOWait</span>
              <span class="value">{{ formatPercentage(cpuData?.current?.iowaitPercent) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Steal</span>
              <span class="value">{{ formatPercentage(cpuData?.current?.stealPercent) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Load1</span>
              <span class="value">{{ cpuData?.current?.load1?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Load5</span>
              <span class="value">{{ cpuData?.current?.load5?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Load15</span>
              <span class="value">{{ cpuData?.current?.load15?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无 CPU 监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import { formatPercentage, formatCompactNumber, smartFormatTime } from '@/utils/format'
  import type { NodeCPUMetrics } from '@/api/console/node-monitor'

  interface Props {
    cpuData?: NodeCPUMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    cpuData: undefined,
    loading: false
  })

  const cpuChartRef = ref<HTMLElement>()
  let cpuChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.cpuData && Object.keys(props.cpuData).length > 0)
  })

  // 转换时间戳为毫秒
  const convertTimestamp = (timestamp: any): number => {
    if (typeof timestamp === 'string') {
      return new Date(timestamp).getTime()
    } else if (typeof timestamp === 'number') {
      // 如果是秒级时间戳（10位），转换为毫秒
      if (timestamp < 10000000000) {
        return timestamp * 1000
      }
      return timestamp
    }
    return Date.now()
  }

  const initChart = () => {
    if (!cpuChartRef.value) return
    cpuChart = echarts.init(cpuChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          const timestamp = params[0].value[0]
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${smartFormatTime(timestamp)}</div>`
          params.forEach((item: any) => {
            const value =
              item.seriesName === 'Load5'
                ? item.value[1].toFixed(2)
                : `${item.value[1].toFixed(3)}%`
            result += `<div style="margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
            <span>${item.seriesName}: </span>
            <span style="font-weight: 600;">${value}</span>
          </div>`
          })
          return result
        }
      },
      legend: {
        data: ['使用率 (%)', 'Load5'],
        bottom: 10,
        textStyle: { fontSize: 13, color: '#4a5568' }
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
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: {
          color: '#718096',
          fontSize: 12,
          formatter: (value: number) => {
            return smartFormatTime(value, 'HH:mm:ss')
          }
        },
        splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
      },
      yAxis: [
        {
          type: 'value',
          name: '使用率 (%)',
          position: 'left',
          nameTextStyle: { color: '#4a5568', fontSize: 13 },
          axisLine: { lineStyle: { color: '#e6e9f0' } },
          axisLabel: { formatter: '{value}%', color: '#718096' },
          splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } },
          min: 0,
          max: 100
        },
        {
          type: 'value',
          name: 'Load',
          position: 'right',
          nameTextStyle: { color: '#4a5568', fontSize: 13 },
          axisLine: { lineStyle: { color: '#e6e9f0' } },
          axisLabel: { color: '#718096' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '使用率 (%)',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#667eea' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.25)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ])
          }
        },
        {
          name: 'Load5',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#f5576c' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 87, 108, 0.25)' },
              { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
            ])
          }
        }
      ]
    }

    cpuChart.setOption(option)
  }

  const updateChart = () => {
    if (!cpuChart || !props.cpuData?.trend || props.cpuData.trend.length === 0) {
      return
    }

    const usageData = props.cpuData.trend.map((item) => [
      convertTimestamp(item.timestamp),
      item.usagePercent
    ])
    const loadData = props.cpuData.trend.map((item) => [
      convertTimestamp(item.timestamp),
      item.load5
    ])

    cpuChart.setOption({
      series: [{ data: usageData }, { data: loadData }]
    })
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => cpuChart?.resize(), 300)
  }

  watch(
    () => props.cpuData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!cpuChart) initChart()
          updateChart()
        }
      })
    },
    { deep: true }
  )

  onMounted(() => {
    if (hasData.value) {
      initChart()
      updateChart()
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    cpuChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .cpu-monitor {
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
      background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
      border-bottom: 1px solid #c4b5fd;
      flex-wrap: wrap;
      gap: 14px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .icon {
          width: 40px;
          height: 40px;
          object-fit: contain;
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

          &.avg {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4c51bf;
          }

          &.peak {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }

          &.load {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
            color: #9f1239;
          }

          &.cores {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
          }

          &.context {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          .label {
            opacity: 0.8;
          }

          .value {
            font-weight: 700;
            font-size: 14px;
          }

          .unit {
            opacity: 0.7;
            font-size: 11px;
          }
        }
      }
    }

    .chart-section {
      padding: 20px;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1a202c;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chart-info {
          font-size: 12px;
          color: #909399;
          padding: 4px 12px;
          background: #f5f7fa;
          border-radius: 6px;
        }
      }

      .chart {
        width: 100%;
        height: 380px;
      }
    }

    .cpu-details {
      padding: 20px;
      background: #f9fafb;
      border-top: 1px solid #e6e9f0;

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;

        .detail-item {
          padding: 12px;
          background: white;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 3px solid #667eea;

          .label {
            font-size: 13px;
            color: #606266;
            font-weight: 500;
          }

          .value {
            font-size: 15px;
            font-weight: 700;
            color: #303133;
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

  @media (max-width: 768px) {
    .cpu-monitor {
      .card-header {
        padding: 14px 18px;

        .header-stats {
          width: 100%;

          .stat-badge {
            padding: 5px 10px;
            font-size: 11px;
          }
        }
      }

      .chart-section {
        padding: 18px;

        .chart {
          height: 300px;
        }
      }
    }
  }
</style>
