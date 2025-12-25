<template>
  <div class="resource-usage-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header" :class="resourceType">
          <div class="header-left">
            <div class="icon-wrapper">
              <svg v-if="resourceType === 'cpu'" viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M17,17H7V7H17M21,11V9H19V7C19,5.89 18.1,5 17,5H15V3H13V5H11V3H9V5H7C5.89,5 5,5.89 5,7V9H3V11H5V13H3V15H5V17C5,18.1 5.9,19 7,19H9V21H11V19H13V21H15V19H17C18.1,19 19,18.1 19,17V15H21V13H19V11M15,15H9V9H15V15Z"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>{{ resourceType === 'cpu' ? 'CPU 使用情况' : '内存使用情况' }}</h3>
              <p>资源使用趋势</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge current">
              <span class="label">当前</span>
              <span class="value">{{ formatCurrentValue() }}</span>
            </div>
            <div class="stat-badge percent">
              <span class="label">使用率</span>
              <span class="value">{{ formatPercentage(getCurrentPercent()) }}</span>
            </div>
            <div class="stat-badge avg">
              <span class="label">平均</span>
              <span class="value">{{ formatAvgValue() }}</span>
            </div>
            <div class="stat-badge max">
              <span class="label">峰值</span>
              <span class="value">{{ formatMaxValue() }}</span>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <!-- 趋势图 -->
          <div v-if="resourceData?.trend?.length" class="chart-section">
            <div class="section-header">
              <h4
                ><ElIcon><TrendCharts /></ElIcon> 使用趋势</h4
              >
            </div>
            <div ref="chartRef" class="chart"></div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty
          :description="`暂无${resourceType === 'cpu' ? 'CPU' : '内存'}数据`"
          :image-size="150"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { NamespaceCPUMetrics, NamespaceMemoryMetrics } from '@/api/console/namespace-monitor'
  import { formatBytes, formatPercentage, smartFormatTime } from '@/utils/format'

  interface Props {
    resourceType: 'cpu' | 'memory'
    resourceData?: NamespaceCPUMetrics | NamespaceMemoryMetrics
    loading?: boolean
    active?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    resourceData: undefined,
    loading: false,
    active: true // 默认激活，确保图表能正常初始化
  })

  const chartRef = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null
  const chartInitialized = ref(false)

  const hasData = computed(() => {
    return !!(props.resourceData && Object.keys(props.resourceData).length > 0)
  })

  const formatCurrentValue = (): string => {
    if (!props.resourceData?.current) return '0'
    if (props.resourceType === 'cpu') {
      const cpuData = props.resourceData as NamespaceCPUMetrics
      const value = cpuData.current.usageCores || 0
      if (value < 0.001) return `${(value * 1000).toFixed(0)}m`
      return `${value.toFixed(3)} cores`
    } else {
      const memData = props.resourceData as NamespaceMemoryMetrics
      const value = memData.current.workingSetBytes || 0
      return formatBytes(value)
    }
  }

  const getCurrentPercent = (): number => {
    return props.resourceData?.current?.usagePercent || 0
  }

  const formatAvgValue = (): string => {
    if (!props.resourceData?.current) return '0'
    if (props.resourceType === 'cpu') {
      const cpuData = props.resourceData as NamespaceCPUMetrics
      const value = cpuData.current.avgCores || 0
      if (value < 0.001) return `${(value * 1000).toFixed(0)}m`
      return `${value.toFixed(3)} cores`
    } else {
      const memData = props.resourceData as NamespaceMemoryMetrics
      const value = memData.current.avgBytes || 0
      return formatBytes(value)
    }
  }

  const formatMaxValue = (): string => {
    if (!props.resourceData?.current) return '0'
    if (props.resourceType === 'cpu') {
      const cpuData = props.resourceData as NamespaceCPUMetrics
      const value = cpuData.current.maxCores || 0
      if (value < 0.001) return `${(value * 1000).toFixed(0)}m`
      return `${value.toFixed(3)} cores`
    } else {
      const memData = props.resourceData as NamespaceMemoryMetrics
      const value = memData.current.maxBytes || 0
      return formatBytes(value)
    }
  }

  const formatCoresValue = (value: number): string => {
    if (value < 0.001) return `${(value * 1000).toFixed(0)}m`
    return `${value.toFixed(3)} cores`
  }

  const initChart = () => {
    if (!chartRef.value) {
      console.warn(`⚠️  ${props.resourceType} 图表 ref 不存在`)
      return
    }

    // 检查 DOM 宽高是否有效
    const width = chartRef.value.clientWidth
    const height = chartRef.value.clientHeight


    if (width === 0 || height === 0) {
      console.warn(`⚠️  ${props.resourceType} 图表容器尺寸为 0，延迟初始化`)
      // 重试机制
      setTimeout(() => {
        initChart()
      }, 200)
      return
    }

    if (chart) {
      chart.dispose()
      chart = null
    }

    chart = echarts.init(chartRef.value)
    chartInitialized.value = true

    const trendData = props.resourceData?.trend || []

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''

          const timestamp = params[0].data[0]
          const formattedTime = smartFormatTime(timestamp, 'YYYY-MM-DD HH:mm:ss')

          let html = `<div style="font-weight: bold; margin-bottom: 8px;">${formattedTime}</div>`

          params.forEach((param: any, index: number) => {
            const value = param.data[1]
            let formattedValue = ''

            if (index === 0) {
              // 第一个系列：使用量
              if (props.resourceType === 'cpu') {
                formattedValue = formatCoresValue(value)
              } else {
                formattedValue = formatBytes(value)
              }
            } else {
              // 第二个系列：使用率
              formattedValue = `${value.toFixed(3)}%`
            }

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
        data: ['使用量', '使用率'],
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
      yAxis: [
        {
          type: 'value',
          name: props.resourceType === 'cpu' ? 'Cores' : 'Memory',
          axisLabel: {
            formatter: (value: number) => {
              if (props.resourceType === 'cpu') {
                if (value < 0.001) return `${(value * 1000).toFixed(0)}m`
                return `${value.toFixed(3)}`
              } else {
                return formatBytes(value)
              }
            }
          }
        },
        {
          type: 'value',
          name: '使用率 (%)',
          position: 'right',
          min: 0,
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        }
      ],
      series: [
        {
          name: '使用量',
          type: 'line',
          data: trendData.map((t: any) => [
            t.timestamp,
            props.resourceType === 'cpu' ? t.usageCores : t.workingSetBytes
          ]),
          smooth: true,
          itemStyle: { color: props.resourceType === 'cpu' ? '#667eea' : '#f093fb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color:
                  props.resourceType === 'cpu'
                    ? 'rgba(102, 126, 234, 0.3)'
                    : 'rgba(240, 147, 251, 0.3)'
              },
              {
                offset: 1,
                color:
                  props.resourceType === 'cpu'
                    ? 'rgba(102, 126, 234, 0.05)'
                    : 'rgba(240, 147, 251, 0.05)'
              }
            ])
          }
        },
        {
          name: '使用率',
          type: 'line',
          yAxisIndex: 1,
          data: trendData.map((t: any) => [t.timestamp, t.usagePercent]),
          smooth: true,
          itemStyle: { color: '#e6a23c' }
        }
      ]
    }

    chart.setOption(option)
  }

  // 监听数据变化
  watch(
    () => [props.resourceData, props.active],
    async () => {
      if (!hasData.value || !props.active) return

      await nextTick()

      // 延迟一点时间等待 DOM 完全渲染
      setTimeout(() => {
        if (props.resourceData?.trend?.length) {
          if (!chart || !chartInitialized.value) {
            initChart()
          } else {
            const trendData = props.resourceData.trend
            chart.setOption({
              series: [
                {
                  data: trendData.map((t: any) => [
                    t.timestamp,
                    props.resourceType === 'cpu' ? t.usageCores : t.workingSetBytes
                  ])
                },
                { data: trendData.map((t: any) => [t.timestamp, t.usagePercent]) }
              ]
            })
          }
        }
      }, 150) // 增加延迟时间到 150ms
    },
    { deep: true, immediate: true } // 改为 immediate: true
  )

  onMounted(() => {
    window.addEventListener('resize', () => chart?.resize())
  })

  onUnmounted(() => {
    chart?.dispose()
    chart = null
    chartInitialized.value = false
  })
</script>

<style lang="scss" scoped>
  .resource-usage-monitor {
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
      border-bottom: 1px solid;
      flex-wrap: wrap;
      gap: 14px;

      &.cpu {
        background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
        border-bottom-color: #c4b5fd;
      }

      &.memory {
        background: linear-gradient(135deg, #fef5f8 0%, #fee8ef 100%);
        border-bottom-color: #fecdd7;
      }

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

      &.cpu .icon-wrapper {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.memory .icon-wrapper {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
          background: rgba(255, 255, 255, 0.8);

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

    .content-wrapper {
      padding: 20px;
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
</style>
