<template>
  <div class="network-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper network-icon">
              <img src="@/assets/img/monitoring/nonetwork.png" alt="网络" />
            </div>
            <div class="header-title">
              <h3>集群网络</h3>
              <p>网络流量与带宽监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge ingress">
              <span class="label">入流量速率</span>
              <span class="value">{{
                formatBitRate(networkData?.totalIngressBytesPerSec || 0)
              }}</span>
            </div>
            <div class="stat-badge egress">
              <span class="label">出流量速率</span>
              <span class="value">{{
                formatBitRate(networkData?.totalEgressBytesPerSec || 0)
              }}</span>
            </div>
            <div class="stat-badge total">
              <span class="label">总流量速率</span>
              <span class="value">{{ formatBitRate(totalTrafficRate) }}</span>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <div class="chart-header">
            <h4>
              <img src="@/assets/img/monitoring/nonetwork.png" class="chart-icon" alt="网络" />
              网络流量趋势
            </h4>
            <div v-if="networkData?.trend" class="chart-info">
              共 {{ networkData.trend.length }} 个数据点
            </div>
          </div>
          <div ref="networkChartRef" class="chart"></div>
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
  import * as echarts from 'echarts'
  import type { ClusterNetworkMetrics } from '@/api/console/cluster-monitor'
  import { formatBitRate } from '@/utils/format'

  interface Props {
    networkData?: ClusterNetworkMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    networkData: undefined,
    loading: false
  })

  const networkChartRef = ref<HTMLElement>()
  let networkChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.networkData && Object.keys(props.networkData).length > 0)
  })

  const totalTrafficRate = computed(() => {
    const ingress = props.networkData?.totalIngressBytesPerSec || 0
    const egress = props.networkData?.totalEgressBytesPerSec || 0
    return ingress + egress
  })

  const initChart = () => {
    if (!networkChartRef.value) return
    networkChart = echarts.init(networkChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#999' }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e6e9f0',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        padding: [12, 16],
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          let result = `<div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${new Date(params[0].value[0]).toLocaleString()}</div>`
          params.forEach((item: any) => {
            const value = formatBitRate(item.value[1])
            result += `<div style="margin: 4px 0; display: flex; align-items: center; font-size: 13px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
              <span style="flex: 1;">${item.seriesName}:</span>
              <span style="font-weight: 600; margin-left: 12px;">${value}</span>
            </div>`
          })
          return result
        }
      },
      legend: {
        data: ['入流量', '出流量'],
        bottom: 8,
        textStyle: { fontSize: 13, color: '#4a5568' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e6e9f0', width: 1 } },
        axisLabel: { color: '#718096', fontSize: 12 },
        splitLine: {
          show: true,
          lineStyle: { color: '#f0f2f5', type: 'dashed' }
        }
      },
      yAxis: {
        type: 'value',
        name: '流量速率',
        nameTextStyle: { color: '#4a5568', fontSize: 13 },
        nameGap: 25,
        nameLocation: 'end',
        axisLine: {
          show: true,
          lineStyle: { color: '#e6e9f0', width: 1 }
        },
        axisLabel: {
          formatter: (value: number) => formatBitRate(value),
          color: '#718096',
          fontSize: 12
        },
        splitLine: {
          lineStyle: { color: '#f0f2f5', type: 'dashed' }
        }
      },
      series: [
        {
          name: '入流量',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#4facfe' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(79, 172, 254, 0.25)' },
              { offset: 1, color: 'rgba(79, 172, 254, 0.05)' }
            ])
          }
        },
        {
          name: '出流量',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
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

    networkChart.setOption(option)
  }

  const updateChart = () => {
    if (!networkChart || !props.networkData?.trend || props.networkData.trend.length === 0) {
      return
    }

    const ingressData = props.networkData.trend.map((item) => [
      item.timestamp * 1000,
      item.ingressBytesPerSec
    ])
    const egressData = props.networkData.trend.map((item) => [
      item.timestamp * 1000,
      item.egressBytesPerSec
    ])

    const allValues = [
      ...ingressData.map((d) => d[1] as number),
      ...egressData.map((d) => d[1] as number)
    ].filter((v) => !isNaN(v) && v >= 0)

    if (allValues.length === 0) return

    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)
    const valueRange = maxValue - minValue

    let yMax: number
    let yMin: number

    if (valueRange > 0) {
      yMax = maxValue + valueRange * 0.1
      yMin = Math.max(0, minValue - valueRange * 0.1)
    } else {
      if (maxValue < 1024) {
        yMax = maxValue * 2 || 1024
        yMin = 0
      } else {
        yMax = maxValue * 1.2
        yMin = Math.max(0, maxValue * 0.8)
      }
    }

    networkChart.setOption({
      yAxis: {
        min: yMin,
        max: yMax
      },
      series: [{ data: ingressData }, { data: egressData }]
    })
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      networkChart?.resize()
    }, 300)
  }

  watch(
    () => props.networkData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!networkChart) initChart()
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
    networkChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .network-monitor {
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
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 6px;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
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

          &.ingress {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.egress {
            background: linear-gradient(135deg, #fed7aa 0%, #fbbf24 100%);
            color: #92400e;
          }

          &.total {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4338ca;
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

          .chart-icon {
            width: 20px;
            height: 20px;
            object-fit: contain;
          }
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
    .network-monitor {
      .card-header {
        padding: 16px 20px;

        .header-stats {
          width: 100%;
        }
      }

      .chart-section {
        padding: 16px;

        .chart {
          height: 300px;
        }
      }
    }
  }
</style>
