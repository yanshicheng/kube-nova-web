<template>
  <div class="workload-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper workload-icon">
              <img src="@/assets/img/monitoring/pod.png" alt="工作负载" />
            </div>
            <div class="header-title">
              <h3>工作负载</h3>
              <p>Pod、Deployment、StatefulSet、DaemonSet、Job、Service</p>
            </div>
          </div>
        </div>

        <div class="workload-section">
          <ElRow :gutter="16">
            <ElCol :xs="24" :sm="12" :lg="8">
              <div class="workload-card pod-card">
                <div class="card-icon">
                  <img src="@/assets/img/monitoring/pod.png" alt="Pod" />
                </div>
                <div class="card-content">
                  <div class="card-title">Pod</div>
                  <div class="card-stats">
                    <div class="stat-item total">
                      <span class="label">总计</span>
                      <span class="value">{{ workloadData?.pods?.total || 0 }}</span>
                    </div>
                    <div class="stat-item running">
                      <span class="label">运行中</span>
                      <span class="value">{{ workloadData?.pods?.running || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">待调度</span>
                      <span class="value">{{ workloadData?.pods?.pending || 0 }}</span>
                    </div>
                    <div v-if="workloadData?.pods?.failed" class="stat-item failed">
                      <span class="label">失败</span>
                      <span class="value">{{ workloadData.pods.failed }}</span>
                    </div>
                  </div>
<!--                  <div v-if="workloadData?.pods?.trend" class="mini-chart">-->
<!--                    <div ref="podChartRef" style="width: 100%; height: 80px"></div>-->
<!--                  </div>-->
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="8">
              <div class="workload-card deployment-card">
                <div class="card-icon">
                  <img src="@/assets/img/monitoring/server.png" alt="Deployment" />
                </div>
                <div class="card-content">
                  <div class="card-title">Deployment</div>
                  <div class="card-stats">
                    <div class="stat-item total">
                      <span class="label">总计</span>
                      <span class="value">{{ workloadData?.deployments?.total || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">可用副本</span>
                      <span class="value">{{
                        workloadData?.deployments?.availableReplicas || 0
                      }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">不可用</span>
                      <span class="value">{{
                        workloadData?.deployments?.unavailableReplicas || 0
                      }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">更新中</span>
                      <span class="value">{{ workloadData?.deployments?.updating || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="8">
              <div class="workload-card statefulset-card">
                <div class="card-icon">
                  <img src="@/assets/img/monitoring/disk.png" alt="StatefulSet" />
                </div>
                <div class="card-content">
                  <div class="card-title">StatefulSet</div>
                  <div class="card-stats">
                    <div class="stat-item total">
                      <span class="label">总计</span>
                      <span class="value">{{ workloadData?.statefulSets?.total || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">就绪副本</span>
                      <span class="value">{{
                        workloadData?.statefulSets?.readyReplicas || 0
                      }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">当前副本</span>
                      <span class="value">{{
                        workloadData?.statefulSets?.currentReplicas || 0
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="8">
              <div class="workload-card daemonset-card">
                <div class="card-icon">
                  <img src="@/assets/img/monitoring/cluster.png" alt="DaemonSet" />
                </div>
                <div class="card-content">
                  <div class="card-title">DaemonSet</div>
                  <div class="card-stats">
                    <div class="stat-item total">
                      <span class="label">总计</span>
                      <span class="value">{{ workloadData?.daemonSets?.total || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">期望 Pod</span>
                      <span class="value">{{ workloadData?.daemonSets?.desiredPods || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">可用 Pod</span>
                      <span class="value">{{ workloadData?.daemonSets?.availablePods || 0 }}</span>
                    </div>
                    <div v-if="workloadData?.daemonSets?.unavailablePods" class="stat-item failed">
                      <span class="label">不可用</span>
                      <span class="value">{{ workloadData.daemonSets.unavailablePods }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="8">
              <div class="workload-card job-card">
                <div class="card-icon">
                  <img src="@/assets/img/monitoring/monitoring.png" alt="Job" />
                </div>
                <div class="card-content">
                  <div class="card-title">Job & CronJob</div>
                  <div class="card-stats">
                    <div class="stat-item">
                      <span class="label">活跃 Job</span>
                      <span class="value">{{ workloadData?.jobs?.active || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">成功</span>
                      <span class="value">{{ workloadData?.jobs?.succeeded || 0 }}</span>
                    </div>
                    <div v-if="workloadData?.jobs?.failed" class="stat-item failed">
                      <span class="label">失败</span>
                      <span class="value">{{ workloadData.jobs.failed }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="label">CronJob</span>
                      <span class="value">{{ workloadData?.jobs?.cronJobsTotal || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :sm="12" :lg="8">
              <div class="workload-card service-card">
                <div class="card-icon">
                  <img src="@/assets/img/monitoring/nonetwork.png" alt="Service" />
                </div>
                <div class="card-content">
                  <div class="card-title">Service</div>
                  <div class="card-stats">
                    <div class="stat-item total">
                      <span class="label">总计</span>
                      <span class="value">{{ workloadData?.services?.total || 0 }}</span>
                    </div>
                    <div
                      v-for="typeCount in workloadData?.services?.byType || []"
                      :key="typeCount.type"
                      class="stat-item"
                    >
                      <span class="label">{{ typeCount.type }}</span>
                      <span class="value">{{ typeCount.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>
          </ElRow>

          <div
            v-if="
              workloadData?.pods?.highRestartPods && workloadData.pods.highRestartPods.length > 0
            "
            class="high-restart-section"
          >
            <div class="section-header">
              <h4>
                <ElIcon><Warning /></ElIcon>
                高频重启 Pod
                <ElTag type="warning" size="small">
                  {{ workloadData.pods.highRestartPods.length }}
                </ElTag>
              </h4>
            </div>
            <ElTable :data="workloadData.pods.highRestartPods" stripe>
              <ElTableColumn prop="namespace" label="命名空间" width="180" />
              <ElTableColumn prop="podName" label="Pod 名称" min-width="200" />
              <ElTableColumn prop="restartCount" label="重启次数" width="120" align="center">
                <template #default="{ row }">
                  <ElTag type="danger" size="small">{{ row.restartCount }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="restartRate" label="重启率" width="150" align="center">
                <template #default="{ row }">
                  {{ row.restartRate?.toFixed(2) || '0' }} 次/小时
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无工作负载监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Warning } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { ClusterWorkloadMetrics } from '@/api/console/cluster-monitor'

  interface Props {
    workloadData?: ClusterWorkloadMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    workloadData: undefined,
    loading: false
  })

  const podChartRef = ref<HTMLElement>()
  let podChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.workloadData && Object.keys(props.workloadData).length > 0)
  })

  const initPodChart = () => {
    if (!podChartRef.value) return
    podChart = echarts.init(podChartRef.value)

    const option: echarts.EChartsOption = {
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: { type: 'time', show: false },
      yAxis: { type: 'value', show: false },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const date = new Date(params[0].value[0])
          const timeStr = date.toLocaleString('zh-CN')
          return `${timeStr}<br/>运行中: ${params[0].value[1]}`
        }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#43e97b' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#43e97b40' },
              { offset: 1, color: '#43e97b10' }
            ])
          },
          data: []
        }
      ]
    }

    podChart.setOption(option)
  }

  const updatePodChart = () => {
    if (!podChart || !props.workloadData?.pods?.trend) return

    const data = props.workloadData.pods.trend.map((item) => [item.timestamp * 1000, item.running])
    podChart.setOption({ series: [{ data }] })
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      podChart?.resize()
    }, 300)
  }

  watch(
    () => props.workloadData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!podChart) initPodChart()
          updatePodChart()
        }
      })
    },
    { deep: true }
  )

  onMounted(() => {
    if (hasData.value) {
      initPodChart()
      updatePodChart()
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    podChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .workload-monitor {
    .monitor-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      animation: slideInUp 0.5s ease-out;
    }

    .card-header {
      padding: 20px 24px;
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-bottom: 1px solid #86efac;

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
    }

    .workload-section {
      padding: 20px;

      .workload-card {
        padding: 20px;
        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        transition: all 0.3s ease;
        margin-bottom: 16px;
        display: flex;
        gap: 16px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .card-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          flex-shrink: 0;
          padding: 10px;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }

        .card-content {
          flex: 1;

          .card-title {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 12px;
          }

          .card-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;

            .stat-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 6px 10px;
              background: #f5f7fa;
              border-radius: 6px;

              &.total {
                background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);

                .label {
                  color: #4338ca;
                }

                .value {
                  color: #4338ca;
                }
              }

              &.running {
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);

                .label {
                  color: #065f46;
                }

                .value {
                  color: #065f46;
                }
              }

              &.failed {
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);

                .label {
                  color: #991b1b;
                }

                .value {
                  color: #991b1b;
                }
              }

              .label {
                font-size: 12px;
                color: #606266;
              }

              .value {
                font-size: 14px;
                font-weight: 700;
                color: #303133;
              }
            }
          }

          .mini-chart {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
          }
        }
      }

      .high-restart-section {
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
    .workload-monitor {
      .card-header {
        padding: 16px 20px;
      }

      .workload-section {
        padding: 16px;

        .workload-card {
          flex-direction: column;
          align-items: center;
          text-align: center;

          .card-content .card-stats {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }
</style>
