<template>
  <div class="system-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <img src="@/assets/img/monitoring/monitoring.png" alt="System" class="icon" />
            <div class="header-title">
              <h3>系统监控</h3>
              <p>进程与文件描述符</p>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <ElRow :gutter="20">
            <!-- 进程信息 -->
            <ElCol :xs="24" :md="12">
              <div class="process-section">
                <div class="section-header">
                  <h4>
                    <ElIcon><Operation /></ElIcon>
                    进程状态
                  </h4>
                </div>
                <div class="process-stats">
                  <div class="stat-card running">
                    <div class="stat-icon">
                      <ElIcon><VideoPlay /></ElIcon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-label">Running</div>
                      <div class="stat-value">{{ systemData?.processes?.running || 0 }}</div>
                    </div>
                  </div>
                  <div class="stat-card blocked">
                    <div class="stat-icon">
                      <ElIcon><VideoPause /></ElIcon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-label">Blocked</div>
                      <div class="stat-value">{{ systemData?.processes?.blocked || 0 }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>

            <!-- 文件描述符 -->
            <ElCol :xs="24" :md="12">
              <div class="fd-section">
                <div class="section-header">
                  <h4>
                    <ElIcon><Document /></ElIcon>
                    文件描述符
                  </h4>
                </div>
                <div class="fd-stats">
                  <div class="fd-overview">
                    <div class="fd-circle" :class="getFdLevelClass()">
                      <div class="fd-percent">
                        {{ formatPercentage(systemData?.fileDescriptors?.usagePercent) }}
                      </div>
                      <div class="fd-label">使用率</div>
                    </div>
                    <div class="fd-details">
                      <div class="fd-detail-item">
                        <span class="label">已分配:</span>
                        <span class="value">{{
                          formatNumber(systemData?.fileDescriptors?.allocated)
                        }}</span>
                      </div>
                      <div class="fd-detail-item">
                        <span class="label">最大值:</span>
                        <span class="value">{{
                          formatNumber(systemData?.fileDescriptors?.maximum)
                        }}</span>
                      </div>
                      <div class="fd-detail-item">
                        <span class="label">可用:</span>
                        <span class="value">{{ formatNumber(getAvailableFd()) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>
          </ElRow>

          <!-- 文件描述符趋势图 -->
          <div v-if="systemData?.fileDescriptors?.trend?.length" class="fd-chart-section">
            <div class="section-header">
              <h4>
                <ElIcon><TrendCharts /></ElIcon>
                文件描述符使用趋势
              </h4>
            </div>
            <div class="fd-chart-container">
              <div ref="fdChartRef" class="fd-chart"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无系统监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Operation, Document, VideoPlay, VideoPause, TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import { formatPercentage, formatNumber, smartFormatTime } from '@/utils/format'
  import type { NodeSystemMetrics } from '@/api/console/node-monitor'

  interface Props {
    systemData?: NodeSystemMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    systemData: undefined,
    loading: false
  })

  const fdChartRef = ref<HTMLElement>()
  let fdChart: echarts.ECharts | null = null

  const hasData = computed(() => {
    return !!(props.systemData && Object.keys(props.systemData).length > 0)
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

  const getAvailableFd = (): number => {
    const allocated = props.systemData?.fileDescriptors?.allocated || 0
    const maximum = props.systemData?.fileDescriptors?.maximum || 0
    return maximum - allocated
  }

  const getFdLevelClass = (): string => {
    const percent = props.systemData?.fileDescriptors?.usagePercent || 0
    if (percent < 50) return 'level-normal'
    if (percent < 80) return 'level-warning'
    return 'level-danger'
  }

  /**
   * 格式化数量（用于Y轴标签）
   */
  const formatCount = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0'
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
    return value.toFixed(0)
  }

  const initFdChart = () => {
    if (!fdChartRef.value) return
    fdChart = echarts.init(fdChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          const timestamp = params[0].value[0]
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${smartFormatTime(timestamp)}</div>`
          params.forEach((item: any) => {
            const rawValue = item.value[1]
            const value =
              item.seriesName === '使用率'
                ? `${(rawValue || 0).toFixed(3)}%`
                : formatNumber(rawValue)
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
        data: ['已分配', '使用率'],
        bottom: 10,
        textStyle: { fontSize: 13, color: '#4a5568' }
      },
      grid: {
        left: '70px',
        right: '70px',
        bottom: '60px',
        top: '50px',
        containLabel: false
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
          name: '数量',
          nameLocation: 'middle',
          nameGap: 50,
          nameTextStyle: {
            color: '#4a5568',
            fontSize: 13,
            fontWeight: 500
          },
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#409eff' } },
          axisLabel: {
            formatter: (value: number) => formatCount(value),
            color: '#718096',
            fontSize: 11,
            margin: 8
          },
          splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '使用率',
          nameLocation: 'middle',
          nameGap: 45,
          nameTextStyle: {
            color: '#4a5568',
            fontSize: 13,
            fontWeight: 500
          },
          position: 'right',
          axisLine: { show: true, lineStyle: { color: '#f56c6c' } },
          axisLabel: {
            formatter: '{value}%',
            color: '#718096',
            fontSize: 11,
            margin: 8
          },
          min: 0,
          max: 100,
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '已分配',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.25)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          }
        },
        {
          name: '使用率',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#f56c6c' }
        }
      ]
    }

    fdChart.setOption(option)
  }

  const updateFdChart = () => {
    if (!fdChart || !props.systemData?.fileDescriptors?.trend) return

    const allocatedData = props.systemData.fileDescriptors.trend.map((item) => [
      convertTimestamp(item.timestamp),
      item.allocated || 0
    ])
    const percentData = props.systemData.fileDescriptors.trend.map((item) => [
      convertTimestamp(item.timestamp),
      item.usagePercent || 0
    ])

    fdChart.setOption({
      series: [{ data: allocatedData }, { data: percentData }]
    })
  }

  const handleResize = () => {
    fdChart?.resize()
  }

  watch(
    () => props.systemData,
    () => {
      nextTick(() => {
        if (hasData.value && props.systemData?.fileDescriptors?.trend?.length) {
          if (!fdChart) initFdChart()
          updateFdChart()
        }
      })
    },
    { deep: true }
  )

  onMounted(() => {
    if (hasData.value && props.systemData?.fileDescriptors?.trend?.length) {
      initFdChart()
      updateFdChart()
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    fdChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .system-monitor {
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
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-bottom: 1px solid #fbbf24;

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

    .process-section,
    .fd-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      height: 100%;
    }

    .process-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .stat-card {
        padding: 20px;
        background: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-left: 4px solid;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &.running {
          border-left-color: #67c23a;

          .stat-icon {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }
        }

        &.blocked {
          border-left-color: #e6a23c;

          .stat-icon {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-content {
          flex: 1;

          .stat-label {
            font-size: 13px;
            color: #909399;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
          }
        }
      }
    }

    .fd-stats {
      .fd-overview {
        display: flex;
        align-items: center;
        gap: 24px;

        .fd-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 8px solid;
          transition: all 0.3s ease;

          &.level-normal {
            border-color: #67c23a;
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          }

          &.level-warning {
            border-color: #e6a23c;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          }

          &.level-danger {
            border-color: #f56c6c;
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          }

          .fd-percent {
            font-size: 28px;
            font-weight: 700;
            color: #303133;
          }

          .fd-label {
            font-size: 13px;
            color: #606266;
            margin-top: 4px;
          }
        }

        .fd-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;

          .fd-detail-item {
            padding: 12px;
            background: white;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .label {
              font-size: 13px;
              color: #606266;
            }

            .value {
              font-size: 16px;
              font-weight: 700;
              color: #303133;
            }
          }
        }
      }
    }

    .fd-chart-section {
      margin-top: 20px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;

      .fd-chart-container {
        background: white;
        border-radius: 8px;
        padding: 16px;

        .fd-chart {
          width: 100%;
          height: 320px;
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
    .system-monitor {
      .content-wrapper {
        padding: 18px;
      }

      .process-stats {
        grid-template-columns: 1fr;
      }

      .fd-stats .fd-overview {
        flex-direction: column;

        .fd-circle {
          width: 120px;
          height: 120px;
        }

        .fd-details {
          width: 100%;
        }
      }
    }
  }
</style>
