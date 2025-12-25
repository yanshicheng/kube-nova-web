<template>
  <div class="memory-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <img src="@/assets/img/monitoring/memory.png" alt="Memory" class="icon" />
            <div class="header-title">
              <h3>内存使用情况</h3>
              <p>内存与交换空间监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge avg">
              <span class="label">平均使用率</span>
              <span class="value">{{
                formatPercentage(memoryData?.summary?.avgUsagePercent)
              }}</span>
            </div>
            <div class="stat-badge peak">
              <span class="label">峰值使用率</span>
              <span class="value">{{
                formatPercentage(memoryData?.summary?.maxUsagePercent)
              }}</span>
            </div>
            <div class="stat-badge used">
              <span class="label">已用</span>
              <span class="value">{{ formatBytes(memoryData?.current?.usedBytes) }}</span>
            </div>
            <div class="stat-badge total">
              <span class="label">总量</span>
              <span class="value">{{ formatBytes(memoryData?.current?.totalBytes) }}</span>
            </div>
            <div class="stat-badge available">
              <span class="label">可用</span>
              <span class="value">{{ formatBytes(memoryData?.current?.availableBytes) }}</span>
            </div>
            <div
              v-if="
                memoryData?.current?.swapUsagePercent && memoryData.current.swapUsagePercent > 0
              "
              class="stat-badge swap"
            >
              <ElIcon><Warning /></ElIcon>
              <span class="label">Swap使用</span>
              <span class="value">{{ formatPercentage(memoryData.current.swapUsagePercent) }}</span>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <div class="chart-header">
            <h4>
              <ElIcon><TrendCharts /></ElIcon>
              使用趋势
            </h4>
            <div v-if="memoryData?.trend" class="chart-info">
              共 {{ memoryData.trend.length }} 个数据点
            </div>
          </div>
          <div ref="memoryChartRef" class="chart"></div>
        </div>

        <!-- 内存详细信息 -->
        <div class="memory-details">
          <div class="detail-section">
            <h5>内存分布</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Used</span>
                <span class="value">{{ formatBytes(memoryData?.current?.usedBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Free</span>
                <span class="value">{{ formatBytes(memoryData?.current?.freeBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Available</span>
                <span class="value">{{ formatBytes(memoryData?.current?.availableBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Buffers</span>
                <span class="value">{{ formatBytes(memoryData?.current?.buffersBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Cached</span>
                <span class="value">{{ formatBytes(memoryData?.current?.cachedBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Active</span>
                <span class="value">{{ formatBytes(memoryData?.current?.activeBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Inactive</span>
                <span class="value">{{ formatBytes(memoryData?.current?.inactiveBytes) }}</span>
              </div>
            </div>
          </div>

          <div v-if="memoryData?.current?.swapTotalBytes" class="detail-section">
            <h5>Swap 信息</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Swap Total</span>
                <span class="value">{{ formatBytes(memoryData.current.swapTotalBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Swap Used</span>
                <span class="value">{{ formatBytes(memoryData.current.swapUsedBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Swap Free</span>
                <span class="value">{{ formatBytes(memoryData.current.swapFreeBytes) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Swap In Rate</span>
                <span class="value">{{ formatBytes(memoryData.current.swapInRate) }}/s</span>
              </div>
              <div class="detail-item">
                <span class="label">Swap Out Rate</span>
                <span class="value">{{ formatBytes(memoryData.current.swapOutRate) }}/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无内存监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Warning, TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import { formatBytes, formatPercentage, smartFormatTime } from '@/utils/format'
  import type { NodeMemoryMetrics } from '@/api/console/node-monitor'

  interface Props {
    memoryData?: NodeMemoryMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    memoryData: undefined,
    loading: false
  })

  const memoryChartRef = ref<HTMLElement>()
  let memoryChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.memoryData && Object.keys(props.memoryData).length > 0)
  })

  // 转换时间戳为毫秒
  const convertTimestamp = (timestamp: any): number => {
    if (typeof timestamp === 'string') {
      return new Date(timestamp).getTime()
    } else if (typeof timestamp === 'number') {
      if (timestamp < 10000000000) {
        return timestamp * 1000
      }
      return timestamp
    }
    return Date.now()
  }

  const initChart = () => {
    if (!memoryChartRef.value) return
    memoryChart = echarts.init(memoryChartRef.value)

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
              item.seriesName === '使用率 (%)'
                ? `${item.value[1].toFixed(3)}%`
                : formatBytes(item.value[1])
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
        data: ['已用内存', '可用内存', '使用率 (%)'],
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
          name: '内存',
          position: 'left',
          nameTextStyle: { color: '#4a5568', fontSize: 13 },
          axisLine: { lineStyle: { color: '#e6e9f0' } },
          axisLabel: {
            formatter: (value: number) => formatBytes(value),
            color: '#718096'
          },
          splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '使用率 (%)',
          position: 'right',
          nameTextStyle: { color: '#4a5568', fontSize: 13 },
          axisLine: { lineStyle: { color: '#e6e9f0' } },
          axisLabel: { formatter: '{value}%', color: '#718096' },
          min: 0,
          max: 100,
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '已用内存',
          type: 'line',
          smooth: true,
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
        },
        {
          name: '可用内存',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#67c23a' }
        },
        {
          name: '使用率 (%)',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
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
        }
      ]
    }

    memoryChart.setOption(option)
  }

  const updateChart = () => {
    if (!memoryChart || !props.memoryData?.trend || props.memoryData.trend.length === 0) {
      return
    }

    const usedData = props.memoryData.trend.map((item) => [
      convertTimestamp(item.timestamp),
      item.usedBytes
    ])
    const availableData = props.memoryData.trend.map((item) => [
      convertTimestamp(item.timestamp),
      item.availableBytes
    ])
    const percentData = props.memoryData.trend.map((item) => [
      convertTimestamp(item.timestamp),
      item.usagePercent
    ])

    memoryChart.setOption({
      series: [{ data: usedData }, { data: availableData }, { data: percentData }]
    })
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => memoryChart?.resize(), 300)
  }

  watch(
    () => props.memoryData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!memoryChart) initChart()
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
    memoryChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .memory-monitor {
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
      background: linear-gradient(135deg, #fef5f8 0%, #fee8ef 100%);
      border-bottom: 1px solid #fecdd7;
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

          &.used {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
          }

          &.total {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
          }

          &.available {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.swap {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
            color: #9f1239;
            animation: pulse 2s ease-in-out infinite;
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

    .memory-details {
      padding: 20px;
      background: #f9fafb;
      border-top: 1px solid #e6e9f0;

      .detail-section {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;

          .detail-item {
            padding: 12px;
            background: white;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 3px solid #f093fb;

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

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @media (max-width: 768px) {
    .memory-monitor {
      .card-header {
        padding: 14px 18px;

        .header-stats {
          width: 100%;
        }
      }

      .chart-section {
        padding: 18px;

        .chart {
          height: 300px;
        }
      }

      .memory-details .detail-section .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
