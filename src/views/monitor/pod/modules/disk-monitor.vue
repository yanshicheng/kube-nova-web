<template>
  <div class="disk-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper disk-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12,16A6,6 0 0,0 18,10C18,6.69 15.31,4 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.58L12.95,12.77C12.65,12.89 12.33,13 12,13C11.67,13 11.35,12.89 11.05,12.77L6.83,18.58L9.42,19.58L11.91,13.27C11.95,13.28 12,13.28 12,13.28C12.03,13.28 12.06,13.28 12.09,13.27Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>磁盘 I/O</h3>
              <p>磁盘读写监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总 I/O</span>
              <span class="value">{{ formatBytes(totalIO) }}</span>
            </div>
            <div class="stat-badge read">
              <span class="label">总读取</span>
              <span class="value">{{ formatBytes(diskData?.summary?.totalReadBytes || 0) }}</span>
            </div>
            <div class="stat-badge write">
              <span class="label">总写入</span>
              <span class="value">{{ formatBytes(diskData?.summary?.totalWriteBytes || 0) }}</span>
            </div>
            <div class="stat-badge avg-read">
              <span class="label">平均读取速率</span>
              <span class="value">{{
                formatByteRate(diskData?.summary?.avgReadBytesPerSec || 0)
              }}</span>
            </div>
            <div class="stat-badge avg-write">
              <span class="label">平均写入速率</span>
              <span class="value">{{
                formatByteRate(diskData?.summary?.avgWriteBytesPerSec || 0)
              }}</span>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="chart-section">
          <div class="chart-header">
            <h4>
              <ElIcon><TrendCharts /></ElIcon>
              I/O 趋势
            </h4>
            <div class="chart-controls">
              <ElRadioGroup v-model="chartDisplayMode" size="small">
                <ElRadioButton label="rate">速率</ElRadioButton>
                <ElRadioButton label="io">累计 I/O</ElRadioButton>
              </ElRadioGroup>
            </div>
            <div v-if="diskData?.trend" class="chart-info">
              共 {{ diskData.trend.length }} 个数据点
            </div>
          </div>
          <div ref="diskChartRef" class="chart"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无磁盘监控数据" :image-size="150">
          <template #image>
            <svg viewBox="0 0 24 24" width="150" height="150">
              <path
                fill="#dcdfe6"
                d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12,16A6,6 0 0,0 18,10C18,6.69 15.31,4 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9Z"
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
  import { TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { DiskMetrics } from '@/api/console/pod-monitor'

  interface Props {
    diskData?: DiskMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    diskData: undefined,
    loading: false
  })

  const diskChartRef = ref<HTMLElement>()
  let diskChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  // 图表显示模式: rate(速率) 或 io(累计I/O)
  const chartDisplayMode = ref<'rate' | 'io'>('rate')

  // ==================== 计算属性 ====================

  /** 是否有数据 */
  const hasData = computed(() => {
    return !!(props.diskData && Object.keys(props.diskData).length > 0)
  })

  /** 总 I/O */
  const totalIO = computed(() => {
    const read = props.diskData?.summary?.totalReadBytes || 0
    const write = props.diskData?.summary?.totalWriteBytes || 0
    return read + write
  })

  // ==================== 工具函数 ====================

  // 🔧 智能格式化时间戳
  const smartFormatTime = (timestamp: any): string => {
    try {
      let date: Date

      if (typeof timestamp === 'number') {
        if (timestamp < 10000000000) {
          date = new Date(timestamp * 1000) // 秒级转毫秒
        } else {
          date = new Date(timestamp) // 毫秒级
        }
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else {
        return '-'
      }

      if (isNaN(date.getTime())) return '-'

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
      return '-'
    }
  }

  /** 格式化字节 */
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  /** 格式化字节率 */
  const formatByteRate = (bytesPerSec: number): string => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 B/s'
    const k = 1024
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))
    return `${(bytesPerSec / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  /**
   * 从趋势数据计算速率数据
   */
  const calculateRateData = (type: 'read' | 'write'): Array<[string, number]> => {
    if (!props.diskData?.trend || props.diskData.trend.length < 2) {
      return []
    }

    const trend = props.diskData.trend
    const rateData: Array<[string, number]> = []

    for (let i = 1; i < trend.length; i++) {
      const currentPoint = trend[i]
      const prevPoint = trend[i - 1]

      const currentBytes = type === 'read' ? currentPoint.readBytes : currentPoint.writeBytes
      const prevBytes = type === 'read' ? prevPoint.readBytes : prevPoint.writeBytes

      // 计算时间差 (秒)
      const timeDiff =
        (new Date(currentPoint.timestamp).getTime() - new Date(prevPoint.timestamp).getTime()) /
        1000

      if (timeDiff > 0) {
        // 计算速率 (bytes/s)
        const rate = Math.max(0, (currentBytes - prevBytes) / timeDiff)
        rateData.push([currentPoint.timestamp, rate])
      }
    }

    return rateData
  }

  // ==================== 图表管理 ====================

  /** 初始化图表 */
  /** 初始化图表 */
  const initChart = () => {
    if (!diskChartRef.value) return

    diskChart = echarts.init(diskChartRef.value)

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
          // 🔥 使用 smartFormatTime 正确格式化时间
          let result = `<div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${smartFormatTime(params[0].value[0])}</div>`
          params.forEach((item: any) => {
            let value: string
            if (chartDisplayMode.value === 'rate') {
              value = formatByteRate(item.value[1])
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
        data: ['读取', '写入'],
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
        name: '数据量',
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
              return formatByteRate(value)
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
          name: '读取',
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
            color: '#67c23a'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.25)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
            ])
          }
        },
        {
          name: '写入',
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
            color: '#e6a23c'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(230, 162, 60, 0.25)' },
              { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
            ])
          }
        }
      ]
    }

    diskChart.setOption(option)
  }

  /**
   * 更新图表数据
   * ✅ 优化：添加动态 Y 轴范围调整
   */
  const updateChart = () => {
    if (!diskChart || !props.diskData?.trend || props.diskData.trend.length === 0) {
      console.warn('磁盘图表:无数据或图表未初始化')
      return
    }

    let readData: Array<[string, number]>
    let writeData: Array<[string, number]>
    let yAxisName: string

    if (chartDisplayMode.value === 'rate') {
      // 显示速率
      readData = calculateRateData('read')
      writeData = calculateRateData('write')
      yAxisName = '速率'
    } else {
      // 显示累计 I/O
      readData = props.diskData.trend.map((item) => [item.timestamp, item.readBytes])
      writeData = props.diskData.trend.map((item) => [item.timestamp, item.writeBytes])
      yAxisName = '累计 I/O'
    }

    // ✅ 动态计算 Y 轴范围
    const allValues = [
      ...readData.map((d) => d[1] as number),
      ...writeData.map((d) => d[1] as number)
    ].filter((v) => !isNaN(v) && v >= 0)

    if (allValues.length === 0) {
      console.warn('磁盘图表：没有有效的数据点')
      return
    }

    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)

    const valueRange = maxValue - minValue

    let yMax: number
    let yMin: number

    if (valueRange > 0) {
      // 有数据变化，留出 10% 的上下空间
      yMax = maxValue + valueRange * 0.1
      yMin = Math.max(0, minValue - valueRange * 0.1)
    } else {
      // 数据基本不变
      if (maxValue < 1024) {
        // 小于 1KB
        yMax = maxValue * 2 || 1024
        yMin = 0
      } else {
        // 大于 1KB
        yMax = maxValue * 1.2
        yMin = Math.max(0, maxValue * 0.8)
      }
    }

    // 确保最小范围
    if (yMax < 1024) {
      yMax = 1024 // 至少 1KB
    }

    diskChart.setOption({
      yAxis: {
        name: yAxisName,
        // ✅ 动态设置 Y 轴范围
        min: yMin,
        max: yMax
      },
      series: [
        {
          data: readData
        },
        {
          data: writeData
        }
      ]
    })
  }

  /** 窗口大小改变时调整图表(防抖) */
  const handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = setTimeout(() => {
      diskChart?.resize()
    }, 300)
  }

  // ==================== 监听数据变化 ====================
  watch(
    () => props.diskData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!diskChart) {
            initChart()
          }
          updateChart()
        }
      })
    },
    { deep: true }
  )

  // 监听图表显示模式变化
  watch(chartDisplayMode, () => {
    if (hasData.value && diskChart) {
      updateChart()
    }
  })

  // ==================== 生命周期 ====================
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
    diskChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  /* 样式从原文件复制 - 保持不变 */
  .disk-monitor {
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
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-bottom: 1px solid #a7f3d0;
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

          &.disk-icon {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

        .stat-badge {
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          &.total {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4c51bf;
          }

          &.read {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.write {
            background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
            color: #92400e;
          }

          &.avg-read {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
          }

          &.avg-write {
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

  // 响应式处理
  @media (max-width: 768px) {
    .disk-monitor {
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
