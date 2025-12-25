<template>
  <div class="disk-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper disk-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12,16A6,6 0 0,0 18,10C18,6.69 15.31,4 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>磁盘监控</h3>
              <p>文件系统与磁盘 I/O</p>
            </div>
          </div>
        </div>

        <!-- 文件系统 -->
        <div v-if="filesystems?.length" class="filesystems-section">
          <div class="section-header">
            <h4>
              <ElIcon><Folder /></ElIcon>
              文件系统
              <ElTag type="info" size="small">{{ filesystems.length }}</ElTag>
            </h4>
          </div>
          <div class="filesystem-list">
            <div v-for="fs in filesystems" :key="fs.mountpoint" class="filesystem-item">
              <div class="fs-header">
                <div class="fs-info">
                  <span class="mountpoint">{{ fs.mountpoint }}</span>
                  <ElTag size="small">{{ fs.fsType }}</ElTag>
                  <span class="device">{{ fs.device }}</span>
                </div>
                <div class="fs-usage">
                  <span class="usage-percent" :class="getUsageLevelClass(fs.current.usagePercent)">
                    {{ fs.current.usagePercent.toFixed(1) }}%
                  </span>
                  <span class="usage-detail">
                    {{ formatBytes(fs.current.usedBytes) }} /
                    {{ formatBytes(fs.current.totalBytes) }}
                  </span>
                </div>
              </div>
              <div class="fs-progress">
                <div
                  class="progress-bar"
                  :style="{ width: `${fs.current.usagePercent}%` }"
                  :class="getUsageLevelClass(fs.current.usagePercent)"
                ></div>
              </div>
              <div class="fs-details">
                <div class="detail-item">
                  <span class="label">Available:</span>
                  <span class="value">{{ formatBytes(fs.current.availableBytes) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Inodes:</span>
                  <span class="value">
                    {{ fs.current.inodePercent.toFixed(1) }}% ({{
                      fs.current.usedInodes.toLocaleString()
                    }}
                    / {{ fs.current.totalInodes.toLocaleString() }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 磁盘设备 -->
        <div v-if="devices?.length" class="devices-section">
          <div class="section-header">
            <h4>
              <ElIcon><Memo /></ElIcon>
              磁盘设备 I/O
              <ElTag type="info" size="small">{{ devices.length }}</ElTag>
            </h4>
          </div>
          <ElTabs v-model="activeDevice" type="card" @tab-change="handleDeviceChange">
            <ElTabPane
              v-for="device in devices"
              :key="device.device"
              :label="device.device"
              :name="device.device"
            >
              <div class="device-content">
                <!-- 设备统计 -->
                <div class="device-stats">
                  <div class="stat-card">
                    <div class="stat-label">平均读取</div>
                    <div class="stat-value"
                      >{{ formatBytes(device.summary.avgReadBytesPerSec) }}/s</div
                    >
                    <div class="stat-sub"
                      >峰值: {{ formatBytes(device.summary.maxReadBytesPerSec) }}/s</div
                    >
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">平均写入</div>
                    <div class="stat-value"
                      >{{ formatBytes(device.summary.avgWriteBytesPerSec) }}/s</div
                    >
                    <div class="stat-sub"
                      >峰值: {{ formatBytes(device.summary.maxWriteBytesPerSec) }}/s</div
                    >
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">I/O 利用率</div>
                    <div class="stat-value">{{ device.summary.avgIOUtilization.toFixed(1) }}%</div>
                    <div class="stat-sub"
                      >峰值: {{ device.summary.maxIOUtilization.toFixed(1) }}%</div
                    >
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">当前状态</div>
                    <div class="stat-detail">
                      <div>Read: {{ device.current.readIOPS.toFixed(0) }} IOPS</div>
                      <div>Write: {{ device.current.writeIOPS.toFixed(0) }} IOPS</div>
                      <div>Await: {{ device.current.avgAwaitMs.toFixed(2) }} ms</div>
                    </div>
                  </div>
                </div>

                <!-- 设备图表 -->
                <div class="device-chart-wrapper">
                  <div
                    :ref="(el) => setDeviceChartRef(device.device, el)"
                    class="device-chart"
                  ></div>
                </div>
              </div>
            </ElTabPane>
          </ElTabs>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无磁盘监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Folder, Memo } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { NodeDiskMetrics } from '@/api/console/node-monitor'
  import { formatBytes, smartFormatTime } from '@/utils/format'

  interface Props {
    diskData?: NodeDiskMetrics
    loading?: boolean
    filesystems?: any[]
    devices?: any[]
  }

  const props = withDefaults(defineProps<Props>(), {
    diskData: undefined,
    loading: false,
    filesystems: () => [],
    devices: () => []
  })

  const activeDevice = ref<string>('')
  const deviceChartRefs = ref<Record<string, HTMLElement>>({})
  const deviceCharts = ref<Record<string, echarts.ECharts>>({})

  const hasData = computed(() => {
    return (props.filesystems?.length || 0) > 0 || (props.devices?.length || 0) > 0
  })

  // 设置图表引用
  const setDeviceChartRef = (deviceName: string, el: any) => {
    if (el) {
      deviceChartRefs.value[deviceName] = el
    }
  }

  const getUsageLevelClass = (percent: number): string => {
    if (percent < 50) return 'level-normal'
    if (percent < 80) return 'level-warning'
    return 'level-danger'
  }

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

  /**
   * 格式化速率显示（专门用于Y轴标签）
   * 确保返回有效字符串，避免 undefined
   */
  const formatDiskRate = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0 B/s'
    }
    const result = formatBytes(value)
    // 确保 formatBytes 返回有效值
    if (!result || result === 'undefined' || result === 'NaN') {
      return '0 B/s'
    }
    return result + '/s'
  }

  const initDeviceChart = (device: any) => {
    const chartEl = deviceChartRefs.value[device.device]
    if (!chartEl) {
      console.warn('Chart element not found for device:', device.device)
      return
    }

    // 销毁已存在的图表实例
    if (deviceCharts.value[device.device]) {
      deviceCharts.value[device.device].dispose()
    }

    const chart = echarts.init(chartEl)
    deviceCharts.value[device.device] = chart

    // 处理趋势数据，确保时间戳正确
    const trendData =
      device.trend?.map((item: any) => ({
        ...item,
        timestampMs: convertTimestamp(item.timestamp)
      })) || []

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''

          const timestamp = params[0].value[0]
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${smartFormatTime(timestamp)}</div>`

          params.forEach((item: any) => {
            const rawValue = item.value[1]
            let displayValue: string
            if (item.seriesName === 'I/O 利用率') {
              displayValue = `${(rawValue || 0).toFixed(2)}%`
            } else {
              displayValue = formatDiskRate(rawValue)
            }
            result += `<div style="margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
              <span>${item.seriesName}: </span>
              <span style="font-weight: 600;">${displayValue}</span>
            </div>`
          })
          return result
        }
      },
      legend: {
        data: ['读取速率', '写入速率', 'I/O 利用率'],
        bottom: 10,
        textStyle: { fontSize: 13, color: '#4a5568' }
      },
      grid: {
        left: '80px',
        right: '80px',
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
          name: '速率',
          nameLocation: 'middle',
          nameGap: 55,
          nameTextStyle: {
            color: '#4a5568',
            fontSize: 13,
            fontWeight: 500
          },
          position: 'left',
          axisLine: { show: true, lineStyle: { color: '#67c23a' } },
          axisLabel: {
            formatter: (value: number) => {
              return formatDiskRate(value)
            },
            color: '#718096',
            fontSize: 11,
            margin: 8
          },
          splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '利用率',
          nameLocation: 'middle',
          nameGap: 50,
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
          name: '读取速率',
          type: 'line',
          smooth: true,
          data: trendData.map((item: any) => [item.timestampMs, item.readBytesPerSec || 0]),
          itemStyle: { color: '#67c23a' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
            ])
          }
        },
        {
          name: '写入速率',
          type: 'line',
          smooth: true,
          data: trendData.map((item: any) => [item.timestampMs, item.writeBytesPerSec || 0]),
          itemStyle: { color: '#e6a23c' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
              { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
            ])
          }
        },
        {
          name: 'I/O 利用率',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: trendData.map((item: any) => [item.timestampMs, item.ioUtilizationPercent || 0]),
          itemStyle: { color: '#f56c6c' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false
        }
      ]
    }

    chart.setOption(option)

    // 确保图表正确渲染
    setTimeout(() => {
      chart.resize()
    }, 100)
  }

  // 处理设备切换
  const handleDeviceChange = (deviceName: any) => {
    nextTick(() => {
      const device = props.devices?.find((d) => d.device === deviceName)
      if (device) {
        initDeviceChart(device)
      }
    })
  }

  // 监听设备数据变化
  watch(
    () => props.devices,
    (newDevices) => {
      if (newDevices && newDevices.length > 0) {
        // 设置第一个设备为活动设备
        if (!activeDevice.value || !newDevices.find((d) => d.device === activeDevice.value)) {
          activeDevice.value = newDevices[0].device
        }

        // 等待 DOM 更新后初始化图表
        nextTick(() => {
          // 只初始化当前活动设备的图表
          const device = newDevices.find((d) => d.device === activeDevice.value)
          if (device) {
            initDeviceChart(device)
          }
        })
      }
    },
    { immediate: true, deep: true }
  )

  // 处理窗口大小变化
  const handleResize = () => {
    Object.values(deviceCharts.value).forEach((chart) => {
      if (chart && !chart.isDisposed()) {
        chart.resize()
      }
    })
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    // 销毁所有图表实例
    Object.values(deviceCharts.value).forEach((chart) => {
      if (chart && !chart.isDisposed()) {
        chart.dispose()
      }
    })
    deviceCharts.value = {}
  })
</script>

<style lang="scss" scoped>
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

          svg {
            width: 20px;
            height: 20px;
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
    }

    .filesystems-section,
    .devices-section {
      padding: 20px;

      .section-header {
        margin-bottom: 16px;

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
    }

    .filesystem-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .filesystem-item {
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #10b981;

        .fs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 12px;

          .fs-info {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;

            .mountpoint {
              font-weight: 600;
              color: #303133;
              font-size: 14px;
            }

            .device {
              font-size: 12px;
              color: #909399;
            }
          }

          .fs-usage {
            display: flex;
            align-items: center;
            gap: 12px;

            .usage-percent {
              font-size: 20px;
              font-weight: 700;

              &.level-normal {
                color: #67c23a;
              }

              &.level-warning {
                color: #e6a23c;
              }

              &.level-danger {
                color: #f56c6c;
              }
            }

            .usage-detail {
              font-size: 13px;
              color: #606266;
            }
          }
        }

        .fs-progress {
          height: 8px;
          background: #e6e9f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;

          .progress-bar {
            height: 100%;
            transition: width 0.6s ease;

            &.level-normal {
              background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
            }

            &.level-warning {
              background: linear-gradient(90deg, #e6a23c 0%, #f3c969 100%);
            }

            &.level-danger {
              background: linear-gradient(90deg, #f56c6c 0%, #f89898 100%);
            }
          }
        }

        .fs-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;

          .detail-item {
            font-size: 13px;

            .label {
              color: #909399;
              margin-right: 8px;
            }

            .value {
              color: #303133;
              font-weight: 500;
            }
          }
        }
      }
    }

    .device-content {
      padding: 20px 0;

      .device-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 20px;

        .stat-card {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 3px solid #10b981;

          .stat-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
          }

          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #303133;
            margin-bottom: 4px;
          }

          .stat-sub {
            font-size: 12px;
            color: #606266;
          }

          .stat-detail {
            font-size: 12px;
            color: #606266;

            div {
              margin-bottom: 4px;

              &:last-child {
                margin-bottom: 0;
              }
            }
          }
        }
      }

      .device-chart-wrapper {
        background: #fafafa;
        border-radius: 8px;
        padding: 16px;

        .device-chart {
          width: 100%;
          height: 380px;
          min-height: 380px;
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
    .disk-monitor {
      .filesystems-section,
      .devices-section {
        padding: 18px;
      }

      .filesystem-list .filesystem-item {
        padding: 14px;

        .fs-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .fs-details {
          grid-template-columns: 1fr;
        }
      }

      .device-content .device-stats {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
