<template>
  <div class="storage-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper storage-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12,16A6,6 0 0,0 18,10C18,6.69 15.31,4 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.58L12.95,12.77C12.65,12.89 12.33,13 12,13C11.67,13 11.35,12.89 11.05,12.77L6.83,18.58L9.42,19.58L11.91,13.27C11.95,13.28 12,13.28 12,13.28C12.03,13.28 12.06,13.28 12.09,13.27Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>集群存储</h3>
              <p>PV、PVC、StorageClass 监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge pv">
              <span class="label">PV 总数</span>
              <span class="value">{{ storageData?.pvTotal || 0 }}</span>
            </div>
            <div class="stat-badge pvc">
              <span class="label">PVC 总数</span>
              <span class="value">{{ storageData?.pvcTotal || 0 }}</span>
            </div>
            <div class="stat-badge bound">
              <span class="label">已绑定</span>
              <span class="value">{{ storageData?.pvBound || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 存储详情 -->
        <div class="storage-section">
          <ElRow :gutter="16">
            <!-- PV 状态 -->
            <ElCol :xs="24" :lg="12">
              <div class="storage-card pv-card">
                <div class="card-header">
                  <h4>
                    <span class="card-icon">💾</span>
                    PersistentVolume
                  </h4>
                </div>
                <div class="storage-stats">
                  <div class="stat-item total">
                    <span class="label">总计</span>
                    <span class="value">{{ storageData?.pvTotal || 0 }}</span>
                  </div>
                  <div class="stat-item bound">
                    <span class="label">已绑定</span>
                    <span class="value">{{ storageData?.pvBound || 0 }}</span>
                  </div>
                  <div class="stat-item available">
                    <span class="label">可用</span>
                    <span class="value">{{ storageData?.pvAvailable || 0 }}</span>
                  </div>
                  <div v-if="storageData?.pvFailed" class="stat-item failed">
                    <span class="label">失败</span>
                    <span class="value">{{ storageData.pvFailed }}</span>
                  </div>
                </div>
                <div class="chart-container">
                  <div ref="pvChartRef" style="width: 100%; height: 200px"></div>
                </div>
              </div>
            </ElCol>

            <!-- PVC 状态 -->
            <ElCol :xs="24" :lg="12">
              <div class="storage-card pvc-card">
                <div class="card-header">
                  <h4>
                    <span class="card-icon">📋</span>
                    PersistentVolumeClaim
                  </h4>
                </div>
                <div class="storage-stats">
                  <div class="stat-item total">
                    <span class="label">总计</span>
                    <span class="value">{{ storageData?.pvcTotal || 0 }}</span>
                  </div>
                  <div class="stat-item bound">
                    <span class="label">已绑定</span>
                    <span class="value">{{ storageData?.pvcBound || 0 }}</span>
                  </div>
                  <div v-if="storageData?.pvcPending" class="stat-item pending">
                    <span class="label">待绑定</span>
                    <span class="value">{{ storageData.pvcPending }}</span>
                  </div>
                  <div v-if="storageData?.pvcLost" class="stat-item failed">
                    <span class="label">丢失</span>
                    <span class="value">{{ storageData.pvcLost }}</span>
                  </div>
                </div>
                <div class="chart-container">
                  <div ref="pvcChartRef" style="width: 100%; height: 200px"></div>
                </div>
              </div>
            </ElCol>
          </ElRow>

          <!-- StorageClass 使用情况 -->
          <div
            v-if="storageData?.storageClasses && storageData.storageClasses.length > 0"
            class="storage-class-section"
          >
            <div class="section-header">
              <h4>
                <ElIcon><Folder /></ElIcon>
                StorageClass 使用情况
                <ElTag type="info" size="small">
                  {{ storageData.storageClasses.length }}
                </ElTag>
              </h4>
            </div>
            <ElTable :data="storageData.storageClasses" stripe>
              <ElTableColumn prop="storageClass" label="StorageClass" min-width="200">
                <template #default="{ row }">
                  <span class="storage-class-name">
                    <ElIcon><Folder /></ElIcon>
                    {{ row.storageClass }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="pvcCount" label="PVC 数量" width="150" align="center">
                <template #default="{ row }">
                  <ElTag type="primary" size="small">{{ row.pvcCount }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="totalBytes" label="总容量" width="180" align="right">
                <template #default="{ row }">
                  {{ formatBytes(row.totalBytes) }}
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无存储监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Folder } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { ClusterStorageMetrics } from '@/api/console/cluster-monitor'
  import { formatBytes } from '@/utils/format'

  interface Props {
    storageData?: ClusterStorageMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    storageData: undefined,
    loading: false
  })

  const pvChartRef = ref<HTMLElement>()
  const pvcChartRef = ref<HTMLElement>()
  let pvChart: echarts.ECharts | null = null
  let pvcChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.storageData && Object.keys(props.storageData).length > 0)
  })

  // ✅ 只负责初始化图表结构（不设置数据）
  const initPVChart = () => {
    if (!pvChartRef.value) return
    pvChart = echarts.init(pvChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 12 }
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: [],
          color: ['#67c23a', '#409eff', '#f56c6c']
        }
      ]
    }

    pvChart.setOption(option)
  }

  // ✅ 专门负责更新 PV 图表数据
  const updatePVChart = () => {
    if (!pvChart || !props.storageData) return

    const data = [
      { value: props.storageData.pvBound || 0, name: '已绑定' },
      { value: props.storageData.pvAvailable || 0, name: '可用' },
      { value: props.storageData.pvFailed || 0, name: '失败' }
    ].filter((item) => item.value > 0)

    pvChart.setOption({
      series: [{ data }]
    })
  }

  const initPVCChart = () => {
    if (!pvcChartRef.value) return
    pvcChart = echarts.init(pvcChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 12 }
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: [],
          color: ['#67c23a', '#e6a23c', '#f56c6c']
        }
      ]
    }

    pvcChart.setOption(option)
  }

  // ✅ 专门负责更新 PVC 图表数据
  const updatePVCChart = () => {
    if (!pvcChart || !props.storageData) return

    const data = [
      { value: props.storageData.pvcBound || 0, name: '已绑定' },
      { value: props.storageData.pvcPending || 0, name: '待绑定' },
      { value: props.storageData.pvcLost || 0, name: '丢失' }
    ].filter((item) => item.value > 0)

    pvcChart.setOption({
      series: [{ data }]
    })
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      pvChart?.resize()
      pvcChart?.resize()
    }, 300)
  }

  // ✅ 核心修复：watch 每次都更新数据
  watch(
    () => props.storageData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          // 确保图表已初始化
          if (!pvChart) initPVChart()
          if (!pvcChart) initPVCChart()

          // ✅ 每次数据变化都更新图表
          updatePVChart()
          updatePVCChart()
        }
      })
    },
    { deep: true, immediate: true }
  )

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    pvChart?.dispose()
    pvcChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  /* 样式保持不变 */
  .storage-monitor {
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
      border-bottom: 1px solid #fcd34d;
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

          &.storage-icon {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }

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

          &.pv {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4338ca;
          }

          &.pvc {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.bound {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
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

    .storage-section {
      padding: 20px;

      .storage-card {
        padding: 20px;
        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        transition: all 0.3s ease;
        margin-bottom: 16px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .card-header {
          padding: 0 0 16px 0;
          border-bottom: 2px solid #e5e7eb;
          background: transparent;
          margin-bottom: 16px;

          h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            display: flex;
            align-items: center;
            gap: 8px;

            .card-icon {
              font-size: 20px;
            }
          }
        }

        .storage-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;

          .stat-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px;
            border-radius: 8px;
            background: #f5f7fa;

            &.total {
              background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);

              .label {
                color: #4338ca;
              }

              .value {
                color: #4338ca;
              }
            }

            &.bound,
            &.available {
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);

              .label {
                color: #065f46;
              }

              .value {
                color: #065f46;
              }
            }

            &.pending {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);

              .label {
                color: #92400e;
              }

              .value {
                color: #92400e;
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
              font-size: 18px;
              font-weight: 700;
              color: #303133;
            }
          }
        }

        .chart-container {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
      }

      .storage-class-section {
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

        .storage-class-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
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
    .storage-monitor {
      .card-header {
        padding: 16px 20px;

        .header-stats {
          width: 100%;
        }
      }

      .storage-section {
        padding: 16px;

        .storage-card .storage-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }
  }
</style>
