<template>
  <div class="pods-on-node" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <img src="@/assets/img/monitoring/pod.png" alt="Pod" class="icon" />
            <div class="header-title">
              <h3>Node 上的 Pod</h3>
              <p>{{ podsData?.nodeName }} - {{ podsData?.totalPods || 0 }} 个 Pod</p>
            </div>
          </div>
          <div class="header-stats">
            <ElTag type="success" size="large">Running: {{ podsData?.runningPods || 0 }}</ElTag>
            <ElTag v-if="podsData?.pendingPods" type="warning" size="large">
              Pending: {{ podsData.pendingPods }}
            </ElTag>
            <ElTag v-if="podsData?.failedPods" type="danger" size="large">
              Failed: {{ podsData.failedPods }}
            </ElTag>
          </div>
        </div>

        <div class="content-wrapper">
          <ElRow :gutter="20">
            <!-- CPU TOP -->
            <ElCol :xs="24" :md="12">
              <div class="top-section">
                <div class="section-header">
                  <h4>
                    <img
                      src="@/assets/img/monitoring/CPU.png"
                      alt="CPU"
                      class="header-icon-small"
                    />
                    CPU 使用 TOP {{ podsData?.topPodsByCPU?.length || 0 }}
                  </h4>
                </div>
                <div class="top-list">
                  <div v-for="(pod, index) in podsData?.topPodsByCPU" :key="index" class="top-item">
                    <div class="rank">{{ index + 1 }}</div>
                    <div class="pod-info">
                      <div class="pod-name">{{ pod.podName }}</div>
                      <div class="pod-namespace">{{ pod.namespace }}</div>
                    </div>
                    <div class="pod-value cpu">{{ pod.value.toFixed(3) }} {{ pod.unit }}</div>
                  </div>
                </div>
              </div>
            </ElCol>

            <!-- Memory TOP -->
            <ElCol :xs="24" :md="12">
              <div class="top-section">
                <div class="section-header">
                  <h4>
                    <img
                      src="@/assets/img/monitoring/memory.png"
                      alt="Memory"
                      class="header-icon-small"
                    />
                    内存使用 TOP {{ podsData?.topPodsByMem?.length || 0 }}
                  </h4>
                </div>
                <div class="top-list">
                  <div v-for="(pod, index) in podsData?.topPodsByMem" :key="index" class="top-item">
                    <div class="rank">{{ index + 1 }}</div>
                    <div class="pod-info">
                      <div class="pod-name">{{ pod.podName }}</div>
                      <div class="pod-namespace">{{ pod.namespace }}</div>
                    </div>
                    <div class="pod-value memory">{{ formatBytes(pod.value) }}</div>
                  </div>
                </div>
              </div>
            </ElCol>
          </ElRow>

          <!-- Pod 列表 -->
          <div class="pods-list-section">
            <div class="section-header">
              <h4>
                <ElIcon><List /></ElIcon>
                Pod 列表
              </h4>
              <div class="header-actions">
                <ElInput
                  v-model="searchQuery"
                  placeholder="搜索 Pod..."
                  clearable
                  size="small"
                  style="width: 250px"
                >
                  <template #prefix>
                    <ElIcon><Search /></ElIcon>
                  </template>
                </ElInput>
                <ElSelect
                  v-model="phaseFilter"
                  placeholder="状态过滤"
                  size="small"
                  style="width: 120px"
                >
                  <ElOption label="全部" value="" />
                  <ElOption label="Running" value="Running" />
                  <ElOption label="Pending" value="Pending" />
                  <ElOption label="Failed" value="Failed" />
                  <ElOption label="Succeeded" value="Succeeded" />
                </ElSelect>
              </div>
            </div>

            <ElTable :data="filteredPods" stripe border>
              <ElTableColumn prop="namespace" label="Namespace" width="150" />
              <ElTableColumn prop="podName" label="Pod Name" min-width="200">
                <template #default="{ row }">
                  <ElLink type="primary" @click="handlePodClick(row)">
                    {{ row.podName }}
                  </ElLink>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="phase" label="Phase" width="100">
                <template #default="{ row }">
                  <ElTag :type="getPhaseType(row.phase)" size="small">
                    {{ row.phase }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="cpuUsage" label="CPU" width="120">
                <template #default="{ row }">{{ row.cpuUsage.toFixed(3) }} cores</template>
              </ElTableColumn>
              <ElTableColumn prop="memoryUsage" label="Memory" width="120">
                <template #default="{ row }">{{ formatBytes(row.memoryUsage) }}</template>
              </ElTableColumn>
              <ElTableColumn prop="restartCount" label="Restarts" width="100" align="center">
                <template #default="{ row }">
                  <ElTag v-if="row.restartCount > 0" type="warning" size="small">
                    {{ row.restartCount }}
                  </ElTag>
                  <span v-else>0</span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无 Pod 数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { List, Search } from '@element-plus/icons-vue'
  import { formatBytes } from '@/utils/format'
  import type { NodePodMetrics, NodePodBrief } from '@/api/console/node-monitor'

  interface Props {
    podsData?: NodePodMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    podsData: undefined,
    loading: false
  })

  const router = useRouter()
  const searchQuery = ref('')
  const phaseFilter = ref('')

  const hasData = computed(() => {
    return !!(props.podsData && Object.keys(props.podsData).length > 0)
  })

  const filteredPods = computed(() => {
    if (!props.podsData?.podList) return []

    let pods = props.podsData.podList

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      pods = pods.filter(
        (pod) =>
          pod.podName.toLowerCase().includes(query) || pod.namespace.toLowerCase().includes(query)
      )
    }

    // 状态过滤
    if (phaseFilter.value) {
      pods = pods.filter((pod) => pod.phase === phaseFilter.value)
    }

    return pods
  })

  const getPhaseType = (phase: string) => {
    switch (phase) {
      case 'Running':
        return 'success'
      case 'Pending':
        return 'warning'
      case 'Failed':
        return 'danger'
      case 'Succeeded':
        return 'success'
      default:
        return 'info'
    }
  }

  const handlePodClick = (pod: NodePodBrief) => {
    // 跳转到 Pod 监控页面
    router.push({
      path: '/monitor/pod',
      query: {
        clusterUuid: router.currentRoute.value.query.clusterUuid,
        namespace: pod.namespace,
        podName: pod.podName
      }
    })
  }
</script>

<style lang="scss" scoped>
  .pods-on-node {
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
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-bottom: 1px solid #fecaca;
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

      .header-stats {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    .content-wrapper {
      padding: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e6e9f0;
      flex-wrap: wrap;
      gap: 12px;

      h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 8px;

        .header-icon-small {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }

    .top-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      height: 100%;

      .top-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .top-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          transition: all 0.3s ease;

          &:hover {
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .rank {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            color: white;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            flex-shrink: 0;
          }

          .pod-info {
            flex: 1;
            min-width: 0;

            .pod-name {
              font-weight: 600;
              color: #303133;
              font-size: 14px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .pod-namespace {
              font-size: 12px;
              color: #909399;
              margin-top: 2px;
            }
          }

          .pod-value {
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;

            &.cpu {
              color: #667eea;
            }

            &.memory {
              color: #f093fb;
            }
          }
        }
      }
    }

    .pods-list-section {
      margin-top: 20px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
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
    .pods-on-node {
      .content-wrapper {
        padding: 18px;
      }

      .top-section {
        margin-bottom: 20px;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;

        .header-actions {
          width: 100%;

          > * {
            flex: 1;
          }
        }
      }
    }
  }
</style>
