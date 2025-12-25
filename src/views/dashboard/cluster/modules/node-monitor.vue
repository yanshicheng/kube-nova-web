<template>
  <div class="node-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper node-icon">
              <img src="@/assets/img/monitoring/server.png" alt="节点" />
            </div>
            <div class="header-title">
              <h3>节点状态</h3>
              <p>集群节点健康与资源监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总节点</span>
              <span class="value">{{ nodeData?.total || 0 }}</span>
            </div>
            <div class="stat-badge ready">
              <span class="label">就绪</span>
              <span class="value">{{ nodeData?.ready || 0 }}</span>
            </div>
            <div v-if="nodeData?.notReady && nodeData.notReady > 0" class="stat-badge not-ready">
              <span class="label">未就绪</span>
              <span class="value">{{ nodeData.notReady }}</span>
            </div>
            <div class="stat-badge avg-cpu">
              <span class="label">平均 CPU</span>
              <span class="value">{{ formatPercent3(nodeData?.avgCPUUsage) }}</span>
            </div>
            <div class="stat-badge avg-memory">
              <span class="label">平均内存</span>
              <span class="value">{{ formatPercent3(nodeData?.avgMemoryUsage) }}</span>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <ElRow :gutter="16">
            <ElCol :xs="24" :lg="12">
              <div class="chart-container">
                <div class="chart-header">
                  <h4>
                    <img src="@/assets/img/monitoring/server.png" class="chart-icon" alt="节点" />
                    节点状态趋势
                  </h4>
                </div>
                <div ref="nodeStatusChartRef" class="chart"></div>
              </div>
            </ElCol>

            <ElCol :xs="24" :lg="12">
              <div class="chart-container">
                <div class="chart-header">
                  <h4>
                    <img
                      src="@/assets/img/monitoring/monitoring.png"
                      class="chart-icon"
                      alt="监控"
                    />
                    平均资源使用
                  </h4>
                </div>
                <div ref="nodeResourceChartRef" class="chart"></div>
              </div>
            </ElCol>
          </ElRow>

          <div v-if="nodeData?.nodeList && nodeData.nodeList.length > 0" class="node-list">
            <div class="section-header">
              <h4>
                <ElIcon><List /></ElIcon>
                节点详情
                <ElTag type="info" size="small">{{ nodeData.nodeList.length }}</ElTag>
              </h4>
            </div>
            <ElRow :gutter="16">
              <ElCol
                v-for="node in nodeData.nodeList"
                :key="node.nodeName"
                :xs="24"
                :sm="12"
                :lg="8"
              >
                <div class="node-card" :class="{ 'not-ready': !node.ready }">
                  <div class="node-header">
                    <span class="node-name">
                      <img src="@/assets/img/monitoring/server.png" class="node-icon" alt="节点" />
                      {{ node.nodeName }}
                    </span>
                    <ElTag :type="node.ready ? 'success' : 'danger'" size="small">
                      {{ node.ready ? '就绪' : '未就绪' }}
                    </ElTag>
                  </div>
                  <div class="node-metrics">
                    <div class="metric-item">
                      <span class="metric-label">CPU</span>
                      <ElProgress
                        :percentage="node.cpuUsage"
                        :color="getProgressColor(node.cpuUsage)"
                        :stroke-width="8"
                      />
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">内存</span>
                      <ElProgress
                        :percentage="node.memoryUsage"
                        :color="getProgressColor(node.memoryUsage)"
                        :stroke-width="8"
                      />
                    </div>
                    <div class="metric-item">
                      <span class="metric-label">Pod 数量</span>
                      <span class="metric-value">{{ node.podsCount }}</span>
                    </div>
                  </div>
                  <div v-if="node.memoryPressure || node.diskPressure" class="node-warnings">
                    <ElTag v-if="node.memoryPressure" type="warning" size="small" effect="plain">
                      内存压力
                    </ElTag>
                    <ElTag v-if="node.diskPressure" type="warning" size="small" effect="plain">
                      磁盘压力
                    </ElTag>
                  </div>
                </div>
              </ElCol>
            </ElRow>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无节点监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { List } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { ClusterNodeMetrics } from '@/api/console/cluster-monitor'

  interface Props {
    nodeData?: ClusterNodeMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    nodeData: undefined,
    loading: false
  })

  const nodeStatusChartRef = ref<HTMLElement>()
  const nodeResourceChartRef = ref<HTMLElement>()
  let nodeStatusChart: echarts.ECharts | null = null
  let nodeResourceChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.nodeData && Object.keys(props.nodeData).length > 0)
  })

  // 格式化百分比：保留3位小数
  const formatPercent3 = (value?: number) => {
    if (value === undefined || value === null) return '0.000%'
    return `${value.toFixed(3)}%`
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return '#67c23a'
    if (percentage < 80) return '#e6a23c'
    return '#f56c6c'
  }

  const initNodeStatusChart = () => {
    if (!nodeStatusChartRef.value) return
    nodeStatusChart = echarts.init(nodeStatusChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e6e9f0',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        padding: [12, 16],
        // ✅ 添加自定义格式化
        formatter: (params: any) => {
          const date = new Date(params[0].axisValue).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`
          params.forEach((param: any) => {
            const value = param.value[1]
            html += `
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color};"></span>
              <span>${param.seriesName}:</span>
              <span style="font-weight: 600;">${value}</span>
            </div>
          `
          })
          return html
        }
      },
      legend: {
        data: ['就绪节点', '未就绪节点'],
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
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#718096', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        name: '节点数',
        nameTextStyle: { color: '#4a5568', fontSize: 13 },
        axisLine: { show: true, lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#718096', fontSize: 12 },
        splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
      },
      series: [
        {
          name: '就绪节点',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#67c23a' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.25)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
            ])
          }
        },
        {
          name: '未就绪节点',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#f56c6c' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.25)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
            ])
          }
        }
      ]
    }

    nodeStatusChart.setOption(option)
  }

  const updateCharts = () => {
    if (!props.nodeData) return

    if (nodeStatusChart && props.nodeData.trend) {
      const readyData = props.nodeData.trend.map((item) => [item.timestamp * 1000, item.readyNodes])
      const notReadyData = props.nodeData.trend.map((item) => [
        item.timestamp * 1000,
        item.notReadyNodes
      ])

      nodeStatusChart.setOption({
        series: [{ data: readyData }, { data: notReadyData }]
      })
    }

    if (nodeResourceChart && props.nodeData.trend) {
      const cpuData = props.nodeData.trend.map((item) => [item.timestamp * 1000, item.avgCPUUsage])
      const memoryData = props.nodeData.trend.map((item) => [
        item.timestamp * 1000,
        item.avgMemoryUsage
      ])

      nodeResourceChart.setOption({
        series: [{ data: cpuData }, { data: memoryData }]
      })
    }
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      nodeStatusChart?.resize()
      nodeResourceChart?.resize()
    }, 300)
  }

  watch(
    () => props.nodeData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!nodeStatusChart) initNodeStatusChart()
          if (!nodeResourceChart) initNodeResourceChart()
          updateCharts()
        }
      })
    },
    { deep: true }
  )
  const initNodeResourceChart = () => {
    if (!nodeResourceChartRef.value) return
    nodeResourceChart = echarts.init(nodeResourceChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e6e9f0',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        padding: [12, 16],
        // ✅ 添加百分比格式化（保留3位小数）
        formatter: (params: any) => {
          const date = new Date(params[0].axisValue).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`
          params.forEach((param: any) => {
            const value = param.value[1]
            const formattedValue = value.toFixed(3) + '%'
            html += `
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color};"></span>
              <span>${param.seriesName}:</span>
              <span style="font-weight: 600;">${formattedValue}</span>
            </div>
          `
          })
          return html
        }
      },
      legend: {
        data: ['平均 CPU 使用率', '平均内存使用率'],
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
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#718096', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        name: '使用率 (%)',
        nameTextStyle: { color: '#4a5568', fontSize: 13 },
        axisLine: { show: true, lineStyle: { color: '#e6e9f0' } },
        axisLabel: {
          // ✅ Y轴标签格式化：保留3位小数
          formatter: (value: number) => {
            return value.toFixed(3) + '%'
          },
          color: '#718096',
          fontSize: 12
        },
        splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
      },
      series: [
        {
          name: '平均 CPU 使用率',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#667eea' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.25)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ])
          }
        },
        {
          name: '平均内存使用率',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#f093fb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(240, 147, 251, 0.25)' },
              { offset: 1, color: 'rgba(240, 147, 251, 0.05)' }
            ])
          }
        }
      ]
    }

    nodeResourceChart.setOption(option)
  }
  onMounted(() => {
    if (hasData.value) {
      initNodeStatusChart()
      initNodeResourceChart()
      updateCharts()
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    nodeStatusChart?.dispose()
    nodeResourceChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .node-monitor {
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
      background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
      border-bottom: 1px solid #bae6fd;
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

          &.total {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4338ca;
          }

          &.ready {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.not-ready {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
          }

          &.avg-cpu {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
          }

          &.avg-memory {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
            color: #9f1239;
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

      .chart-container {
        margin-bottom: 20px;

        .chart-header {
          margin-bottom: 16px;

          h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            display: flex;
            align-items: center;
            gap: 8px;

            .chart-icon {
              width: 20px;
              height: 20px;
              object-fit: contain;
            }
          }
        }

        .chart {
          width: 100%;
          height: 280px;
        }
      }

      .node-list {
        margin-top: 24px;

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

        .node-card {
          padding: 16px;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;
          margin-bottom: 16px;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            border-color: #0ea5e9;
          }

          &.not-ready {
            border-color: #f56c6c;
            background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
          }

          .node-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .node-name {
              font-weight: 600;
              color: #303133;
              display: flex;
              align-items: center;
              gap: 6px;

              .node-icon {
                width: 18px;
                height: 18px;
                object-fit: contain;
              }
            }
          }

          .node-metrics {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .metric-item {
              display: flex;
              align-items: center;
              gap: 12px;

              .metric-label {
                font-size: 13px;
                color: #606266;
                min-width: 60px;
              }

              .metric-value {
                font-weight: 600;
                color: #303133;
              }
            }
          }

          .node-warnings {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
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
    .node-monitor {
      .card-header {
        padding: 16px 20px;

        .header-stats {
          width: 100%;
        }
      }

      .chart-section {
        padding: 16px;

        .chart-container .chart {
          height: 240px;
        }
      }
    }
  }
</style>
