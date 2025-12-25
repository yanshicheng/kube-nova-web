<template>
  <div class="network-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <!-- 卡片头部 - 保持不变 -->
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper network-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M17,3A2,2 0 0,1 19,5V15A2,2 0 0,1 17,17H13V19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H7C5.89,17 5,16.1 5,15V5A2,2 0 0,1 7,3H17M17,5H7V15H17V5Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>网络 I/O</h3>
              <p>网络流量与速率监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总流量</span>
              <span class="value">{{ formatBytes(totalTraffic) }}</span>
            </div>
            <div class="stat-badge receive">
              <span class="label">总接收</span>
              <span class="value">{{
                formatBytes(networkData?.summary?.totalReceiveBytes || 0)
              }}</span>
            </div>
            <div class="stat-badge transmit">
              <span class="label">总发送</span>
              <span class="value">{{
                formatBytes(networkData?.summary?.totalTransmitBytes || 0)
              }}</span>
            </div>
            <div class="stat-badge avg-receive">
              <span class="label">平均接收速率</span>
              <span class="value">{{
                formatBitRate(networkData?.summary?.avgReceiveBytesPerSec || 0)
              }}</span>
            </div>
            <div class="stat-badge avg-transmit">
              <span class="label">平均发送速率</span>
              <span class="value">{{
                formatBitRate(networkData?.summary?.avgTransmitBytesPerSec || 0)
              }}</span>
            </div>
            <div
              v-if="networkData?.summary?.totalErrors && networkData.summary.totalErrors > 0"
              class="stat-badge error"
            >
              <ElIcon><Warning /></ElIcon>
              <span class="label">错误</span>
              <span class="value">{{ networkData.summary.totalErrors }}</span>
              <span class="unit">次</span>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="chart-section">
          <div class="chart-header">
            <h4>
              <ElIcon><TrendCharts /></ElIcon>
              网络速率趋势
            </h4>
            <div class="chart-controls">
              <ElRadioGroup v-model="chartDisplayMode" size="small">
                <ElRadioButton label="rate">速率</ElRadioButton>
                <ElRadioButton label="traffic">累计流量</ElRadioButton>
              </ElRadioGroup>
            </div>
            <div v-if="networkData?.trend" class="chart-info">
              共 {{ networkData.trend.length }} 个数据点
            </div>
          </div>
          <div ref="networkChartRef" class="chart"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无网络监控数据" :image-size="150">
          <template #image>
            <svg viewBox="0 0 24 24" width="150" height="150">
              <path
                fill="#dcdfe6"
                d="M17,3A2,2 0 0,1 19,5V15A2,2 0 0,1 17,17H13V19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H7C5.89,17 5,16.1 5,15V5A2,2 0 0,1 7,3H17M17,5H7V15H17V5Z"
              />
            </svg>
          </template>
        </ElEmpty>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Warning, TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { NetworkMetrics } from '@/api/console/pod-monitor'

  interface Props {
    networkData?: NetworkMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    networkData: undefined,
    loading: false
  })

  const networkChartRef = ref<HTMLElement>()
  let networkChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const chartDisplayMode = ref<'rate' | 'traffic'>('rate')

  const hasData = computed(() => {
    return !!(props.networkData && Object.keys(props.networkData).length > 0)
  })

  const totalTraffic = computed(() => {
    const receive = props.networkData?.summary?.totalReceiveBytes || 0
    const transmit = props.networkData?.summary?.totalTransmitBytes || 0
    return receive + transmit
  })

  // ==================== 🔧 核心修复函数 ====================

  /**
   * 智能格式化时间戳（直接在组件内修复）
   */
  const smartFormatTime = (timestamp: any): string => {
    try {
      let date: Date

      if (typeof timestamp === 'number') {
        // 🔥 关键修复：时间戳 < 10000000000 认为是秒级
        if (timestamp < 10000000000) {
          date = new Date(timestamp * 1000) // 秒级转毫秒
        } else {
          date = new Date(timestamp) // 毫秒级
        }
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp) // ISO 字符串
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else {
        return '-'
      }

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.error('❌ 无效的时间戳:', timestamp)
        return '-'
      }

      // 格式化为中文时间
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch (error) {
      console.error('❌ 时间格式化错误:', error, timestamp)
      return '-'
    }
  }

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatBitRate = (bytesPerSec: number): string => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 bit/s'
    const bitsPerSec = bytesPerSec * 8
    const k = 1000
    const sizes = ['bit/s', 'Kbit/s', 'Mbit/s', 'Gbit/s', 'Tbit/s']
    const i = Math.min(Math.floor(Math.log(bitsPerSec) / Math.log(k)), sizes.length - 1)
    return `${(bitsPerSec / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatByteRate = (bytesPerSec: number): string => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 B/s'
    const k = 1024
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
    const i = Math.min(Math.floor(Math.log(bytesPerSec) / Math.log(k)), sizes.length - 1)
    return `${(bytesPerSec / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const calculateRateData = (type: 'receive' | 'transmit'): Array<[string, number]> => {
    if (!props.networkData?.trend || props.networkData.trend.length < 2) {
      return []
    }

    const trend = props.networkData.trend
    const rateData: Array<[string, number]> = []

    for (let i = 1; i < trend.length; i++) {
      const currentPoint = trend[i]
      const prevPoint = trend[i - 1]

      const currentBytes =
        type === 'receive' ? currentPoint.receiveBytes : currentPoint.transmitBytes
      const prevBytes = type === 'receive' ? prevPoint.receiveBytes : prevPoint.transmitBytes

      const timeDiff =
        (new Date(currentPoint.timestamp).getTime() - new Date(prevPoint.timestamp).getTime()) /
        1000

      if (timeDiff > 0) {
        const rate = Math.max(0, (currentBytes - prevBytes) / timeDiff)
        rateData.push([currentPoint.timestamp, rate])
      }
    }

    return rateData
  }

  const initChart = () => {
    if (!networkChartRef.value) return

    networkChart = echarts.init(networkChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e6e9f0',
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: 13
        },
        padding: [12, 16],
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''

          // 🔥 使用修复后的时间格式化函数
          const formattedTime = smartFormatTime(params[0].value[0])
          let result = `<div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${formattedTime}</div>`

          params.forEach((item: any) => {
            let value: string
            if (chartDisplayMode.value === 'rate') {
              value = formatBitRate(item.value[1])
            } else {
              value = formatBytes(item.value[1])
            }
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
        data: ['接收', '发送'],
        textStyle: {
          fontSize: 13,
          color: '#4a5568'
        },
        orient: 'horizontal',
        bottom: 10,
        left: 'center',
        itemWidth: 20,
        itemHeight: 12,
        itemGap: 24
      },
      grid: {
        left: '3%',
        right: '1%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: '#e6e9f0',
            width: 1
          }
        },
        axisLabel: {
          color: '#718096',
          fontSize: 12
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f0f2f5',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '速率',
        nameTextStyle: {
          color: '#4a5568',
          fontSize: 13
        },
        nameGap: 25,
        nameLocation: 'end',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e6e9f0',
            width: 1
          }
        },
        axisLabel: {
          formatter: (value: number) => {
            if (chartDisplayMode.value === 'rate') {
              return formatBitRate(value)
            } else {
              return formatBytes(value)
            }
          },
          color: '#718096',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: '#f0f2f5',
            type: 'dashed'
          }
        }
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
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#4facfe'
          },
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
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#fa8c16'
          },
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
      console.warn('网络图表: 无数据或图表未初始化')
      return
    }

    let receiveData: Array<[string, number]>
    let transmitData: Array<[string, number]>
    let yAxisName: string

    if (chartDisplayMode.value === 'rate') {
      receiveData = calculateRateData('receive')
      transmitData = calculateRateData('transmit')
      yAxisName = '速率'
    } else {
      receiveData = props.networkData.trend.map((item) => [item.timestamp, item.receiveBytes])
      transmitData = props.networkData.trend.map((item) => [item.timestamp, item.transmitBytes])
      yAxisName = '累计流量'
    }

    const allValues = [
      ...receiveData.map((d) => d[1] as number),
      ...transmitData.map((d) => d[1] as number)
    ].filter((v) => !isNaN(v) && v >= 0)

    if (allValues.length === 0) {
      console.warn('网络图表：没有有效的数据点')
      return
    }

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
        name: yAxisName,
        min: yMin,
        max: yMax
      },
      series: [
        {
          data: receiveData
        },
        {
          data: transmitData
        }
      ]
    })
  }

  const handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = setTimeout(() => {
      networkChart?.resize()
    }, 300)
  }

  watch(
    () => props.networkData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!networkChart) {
            initChart()
          }
          updateChart()
        }
      })
    },
    { deep: true }
  )

  watch(chartDisplayMode, () => {
    if (hasData.value && networkChart) {
      updateChart()
    }
  })

  onMounted(() => {
    if (hasData.value) {
      initChart()
      updateChart()
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    networkChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  /* 样式保持不变 */
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
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

          svg {
            width: 20px;
            height: 20px;
          }

          &.network-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
        }

        .header-title {
          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #1a202c;
            line-height: 1.3;
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
        flex: 1;
        justify-content: flex-end;
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

          &.receive {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.transmit {
            background: linear-gradient(135deg, #fed7aa 0%, #fbbf24 100%);
            color: #92400e;
          }

          &.avg-receive {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
          }

          &.avg-transmit {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }

          &.error {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
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
      padding: 2px;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1a202c;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chart-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          justify-content: center;
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
    .network-monitor {
      .card-header {
        padding: 14px 18px;

        .header-left {
          .icon-wrapper {
            width: 32px;
            height: 32px;

            svg {
              width: 18px;
              height: 18px;
            }
          }

          .header-title h3 {
            font-size: 15px;
          }
        }

        .header-stats {
          width: 100%;

          .stat-badge {
            padding: 5px 10px;
            font-size: 11px;

            .value {
              font-size: 13px;
            }
          }
        }
      }

      .chart-section {
        padding: 18px;

        .chart-header {
          .chart-controls {
            width: 100%;
            justify-content: flex-start;
            flex-direction: column;
            align-items: flex-start;
          }

          h4 {
            font-size: 15px;
          }
        }

        .chart {
          height: 300px;
        }
      }
    }
  }
</style>
