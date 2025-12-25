<template>
  <div class="namespace-network-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M17,3A2,2 0 0,1 19,5V15A2,2 0 0,1 17,17H13V19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H7C5.89,17 5,16.1 5,15V5A2,2 0 0,1 7,3H17M17,5H7V15H17V5Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>网络流量</h3>
              <p>入站与出站网络监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总流量</span>
              <span class="value">{{ formatBytes(totalTraffic) }}</span>
            </div>
            <div class="stat-badge ingress">
              <span class="label">入站总量</span>
              <span class="value">{{
                formatBytes(networkData?.summary?.totalReceiveBytes || 0)
              }}</span>
            </div>
            <div class="stat-badge egress">
              <span class="label">出站总量</span>
              <span class="value">{{
                formatBytes(networkData?.summary?.totalTransmitBytes || 0)
              }}</span>
            </div>
            <div class="stat-badge avg-ingress">
              <span class="label">平均入站速率</span>
              <span class="value">{{
                formatBitRate(networkData?.summary?.avgReceiveBytesPerSec || 0)
              }}</span>
            </div>
            <div class="stat-badge avg-egress">
              <span class="label">平均出站速率</span>
              <span class="value">{{
                formatBitRate(networkData?.summary?.avgTransmitBytesPerSec || 0)
              }}</span>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <div class="chart-header">
            <h4
              ><ElIcon><TrendCharts /></ElIcon> 网络速率趋势</h4
            >
            <div v-if="networkData?.trend" class="chart-info">
              共 {{ networkData.trend.length }} 个数据点
            </div>
          </div>
          <div ref="chartRef" class="chart"></div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无网络监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { NamespaceNetworkMetrics } from '@/api/console/namespace-monitor'
  import { formatBytes, formatBitRate, smartFormatTime } from '@/utils/format'

  interface Props {
    networkData?: NamespaceNetworkMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    networkData: undefined,
    loading: false
  })

  const chartRef = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null

  const hasData = computed(() => {
    return !!(props.networkData && Object.keys(props.networkData).length > 0)
  })

  const totalTraffic = computed(() => {
    const ingress = props.networkData?.summary?.totalReceiveBytes || 0
    const egress = props.networkData?.summary?.totalTransmitBytes || 0
    return ingress + egress
  })

  const initChart = () => {
    if (!chartRef.value) return
    chart = echarts.init(chartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''

          const timestamp = params[0].data[0]
          const formattedTime = smartFormatTime(timestamp, 'YYYY-MM-DD HH:mm:ss')

          let html = `<div style="font-weight: bold; margin-bottom: 8px;">${formattedTime}</div>`

          params.forEach((param: any) => {
            const value = param.data[1]
            const formattedValue = formatBitRate(value)
            html += `
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
                <span style="flex: 1;">${param.seriesName}:</span>
                <span style="font-weight: bold; margin-left: 12px;">${formattedValue}</span>
              </div>
            `
          })

          return html
        }
      },
      legend: {
        data: ['入站速率', '出站速率'],
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
        boundaryGap: false,
        axisLabel: {
          formatter: (value: number) => smartFormatTime(value, 'HH:mm:ss')
        }
      },
      yAxis: {
        type: 'value',
        name: '速率',
        axisLabel: {
          formatter: (value: number) => formatBitRate(value)
        }
      },
      series: [
        {
          name: '入站速率',
          type: 'line',
          data: props.networkData?.trend?.map((t) => [t.timestamp, t.receiveBytesPerSec]) || [],
          smooth: true,
          itemStyle: { color: '#4facfe' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(79, 172, 254, 0.25)' },
              { offset: 1, color: 'rgba(79, 172, 254, 0.05)' }
            ])
          }
        },
        {
          name: '出站速率',
          type: 'line',
          data: props.networkData?.trend?.map((t) => [t.timestamp, t.transmitBytesPerSec]) || [],
          smooth: true,
          itemStyle: { color: '#fa8c16' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(250, 140, 22, 0.25)' },
              { offset: 1, color: 'rgba(250, 140, 22, 0.05)' }
            ])
          }
        }
      ]
    }

    chart.setOption(option)
  }

  watch(
    () => props.networkData,
    () => {
      nextTick(() => {
        if (hasData.value && props.networkData?.trend?.length) {
          if (!chart) initChart()
          else {
            chart.setOption({
              series: [
                { data: props.networkData.trend.map((t) => [t.timestamp, t.receiveBytesPerSec]) },
                { data: props.networkData.trend.map((t) => [t.timestamp, t.transmitBytesPerSec]) }
              ]
            })
          }
        }
      })
    },
    { deep: true }
  )

  onMounted(() => {
    if (hasData.value && props.networkData?.trend?.length) {
      initChart()
    }
    window.addEventListener('resize', () => chart?.resize())
  })

  onUnmounted(() => {
    chart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .namespace-network-monitor {
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
      background: linear-gradient(135deg, #e0f7ff 0%, #d0eeff 100%);
      border-bottom: 1px solid #b3e5fc;
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
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

          &.total {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4338ca;
          }

          &.ingress {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.egress {
            background: linear-gradient(135deg, #fed7aa 0%, #fbbf24 100%);
            color: #92400e;
          }

          &.avg-ingress {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
          }

          &.avg-egress {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }

          .label {
            opacity: 0.8;
          }

          .value {
            font-weight: 700;
            font-size: 14px;
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
        height: 350px;
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

  @media (max-width: 768px) {
    .namespace-network-monitor {
      .card-header {
        padding: 14px 18px;

        .header-stats {
          width: 100%;
        }
      }

      .chart-section .chart {
        height: 300px;
      }
    }
  }
</style>
