<template>
  <div class="network-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <img src="@/assets/img/monitoring/nonetwork.png" alt="Network" class="icon" />
            <div class="header-title">
              <h3>网络 I/O</h3>
              <p>网络接口流量监控</p>
            </div>
          </div>
          <div class="header-controls">
            <ElSelect
              :model-value="selectedInterface"
              placeholder="选择网卡"
              size="small"
              style="width: 180px"
              @change="handleInterfaceChange"
            >
              <ElOption label="全部接口" value="all" />
              <ElOption v-for="iface in interfaces" :key="iface" :label="iface" :value="iface" />
            </ElSelect>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-section">
          <div class="stat-item">
            <span class="label">平均接收速率</span>
            <span class="value">{{ formatBitRate(getAverageReceiveRate()) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">平均发送速率</span>
            <span class="value">{{ formatBitRate(getAverageTransmitRate()) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">接收错误</span>
            <span class="value error">{{ getTotalReceiveErrors() }}</span>
          </div>
          <div class="stat-item">
            <span class="label">发送错误</span>
            <span class="value error">{{ getTotalTransmitErrors() }}</span>
          </div>
        </div>

        <!-- 图表 -->
        <div class="chart-section">
          <div class="chart-header">
            <h4>
              <ElIcon><TrendCharts /></ElIcon>
              网络速率趋势
            </h4>
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
  import { TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import { formatBitRate, smartFormatTime } from '@/utils/format'
  import type { NodeNetworkMetrics, NodeNetworkInterfaceMetrics } from '@/api/console/node-monitor'

  interface Props {
    networkData?: NodeNetworkMetrics | NodeNetworkInterfaceMetrics
    loading?: boolean
    interfaces?: string[]
    selectedInterface?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    networkData: undefined,
    loading: false,
    interfaces: () => [],
    selectedInterface: 'all'
  })

  interface Emits {
    (e: 'interface-change', interfaceName: string): void
  }

  const emit = defineEmits<Emits>()

  const networkChartRef = ref<HTMLElement>()
  let networkChart: echarts.ECharts | null = null

  const hasData = computed(() => {
    return !!(props.networkData && Object.keys(props.networkData).length > 0)
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

  const handleInterfaceChange = (interfaceName: string) => {
    emit('interface-change', interfaceName)
  }

  const getAverageReceiveRate = (): number => {
    if ('interfaces' in props.networkData!) {
      return props.networkData.interfaces.reduce(
        (sum, i) => sum + i.summary.avgReceiveBytesPerSec,
        0
      )
    }
    return (props.networkData as NodeNetworkInterfaceMetrics).summary.avgReceiveBytesPerSec || 0
  }

  const getAverageTransmitRate = (): number => {
    if ('interfaces' in props.networkData!) {
      return props.networkData.interfaces.reduce(
        (sum, i) => sum + i.summary.avgTransmitBytesPerSec,
        0
      )
    }
    return (props.networkData as NodeNetworkInterfaceMetrics).summary.avgTransmitBytesPerSec || 0
  }

  const getTotalReceiveErrors = (): number => {
    if ('interfaces' in props.networkData!) {
      return props.networkData.interfaces.reduce((sum, i) => sum + i.summary.totalReceiveErrors, 0)
    }
    return (props.networkData as NodeNetworkInterfaceMetrics).summary.totalReceiveErrors || 0
  }

  const getTotalTransmitErrors = (): number => {
    if ('interfaces' in props.networkData!) {
      return props.networkData.interfaces.reduce((sum, i) => sum + i.summary.totalTransmitErrors, 0)
    }
    return (props.networkData as NodeNetworkInterfaceMetrics).summary.totalTransmitErrors || 0
  }

  const initChart = () => {
    if (!networkChartRef.value) return
    networkChart = echarts.init(networkChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          const timestamp = params[0].value[0]
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${smartFormatTime(timestamp)}</div>`
          params.forEach((item: any) => {
            result += `<div style="margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
            <span>${item.seriesName}: </span>
            <span style="font-weight: 600;">${formatBitRate(item.value[1])}</span>
          </div>`
          })
          return result
        }
      },
      legend: {
        data: ['接收', '发送'],
        bottom: 10,
        textStyle: { fontSize: 13, color: '#4a5568' }
      },
      grid: {
        left: '3%',
        right: '1%',
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
      yAxis: {
        type: 'value',
        name: '速率',
        nameTextStyle: { color: '#4a5568', fontSize: 13 },
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: {
          formatter: (value: number) => formatBitRate(value),
          color: '#718096'
        },
        splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
      },
      series: [
        {
          name: '接收',
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
          name: '发送',
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
    if (!networkChart || !props.networkData) return

    let receiveData: Array<[number, number]> = []
    let transmitData: Array<[number, number]> = []

    if ('interfaces' in props.networkData) {
      // 聚合所有接口数据
      const allTimestamps = new Set<string>()
      props.networkData.interfaces.forEach((iface) => {
        iface.trend.forEach((point) => allTimestamps.add(point.timestamp))
      })

      Array.from(allTimestamps)
        .sort()
        .forEach((timestamp) => {
          let totalReceive = 0
          let totalTransmit = 0
          props.networkData.interfaces.forEach((iface) => {
            const point = iface.trend.find((p) => p.timestamp === timestamp)
            if (point) {
              totalReceive += point.receiveBytesPerSec
              totalTransmit += point.transmitBytesPerSec
            }
          })
          receiveData.push([convertTimestamp(timestamp), totalReceive])
          transmitData.push([convertTimestamp(timestamp), totalTransmit])
        })
    } else {
      // 单个接口数据
      receiveData = props.networkData.trend.map((item) => [
        convertTimestamp(item.timestamp),
        item.receiveBytesPerSec
      ])
      transmitData = props.networkData.trend.map((item) => [
        convertTimestamp(item.timestamp),
        item.transmitBytesPerSec
      ])
    }

    networkChart.setOption({
      series: [{ data: receiveData }, { data: transmitData }]
    })
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
    window.addEventListener('resize', () => networkChart?.resize())
  })

  onUnmounted(() => {
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
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      padding: 20px;
      background: #f9fafb;
      border-bottom: 1px solid #e6e9f0;

      .stat-item {
        padding: 12px;
        background: white;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 3px solid #4facfe;

        .label {
          font-size: 13px;
          color: #606266;
          font-weight: 500;
        }

        .value {
          font-size: 15px;
          font-weight: 700;
          color: #303133;

          &.error {
            color: #f56c6c;
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
        padding: 14px 18px;
      }

      .stats-section {
        padding: 18px;
        grid-template-columns: 1fr;
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
