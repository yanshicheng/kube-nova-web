<template>
  <div class="namespace-top-pods-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M16,17V19H2V17S2,13 9,13 16,17 16,17M12.5,7.5A3.5,3.5 0 0,1 9,11A3.5,3.5 0 0,1 5.5,7.5A3.5,3.5 0 0,1 9,4A3.5,3.5 0 0,1 12.5,7.5M15.94,13A5.32,5.32 0 0,1 18,17V19H22V17S22,13.37 15.94,13M15,4A3.39,3.39 0 0,0 13.07,4.59A5,5 0 0,1 13.07,10.41A3.39,3.39 0 0,0 15,11A3.5,3.5 0 0,0 18.5,7.5A3.5,3.5 0 0,0 15,4Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>Top Pods</h3>
              <p>资源使用 Top 排行</p>
            </div>
          </div>
          <div class="header-stats">
            <ElRadioGroup v-model="activeTab" size="small">
              <ElRadioButton value="cpu">CPU</ElRadioButton>
              <ElRadioButton value="memory">内存</ElRadioButton>
              <ElRadioButton value="network">网络</ElRadioButton>
            </ElRadioGroup>
          </div>
        </div>

        <div class="content-wrapper">
          <!-- CPU Top Pods -->
          <div v-if="activeTab === 'cpu'" class="top-list">
            <div class="section-header">
              <h4
                ><ElIcon><TrendCharts /></ElIcon> CPU 使用 Top {{ topCPUPods.length }}</h4
              >
            </div>
            <div v-if="topCPUPods.length > 0" class="pods-list">
              <div
                v-for="(pod, index) in topCPUPods"
                :key="pod.name"
                class="pod-item"
                :class="{ highlight: index < 3 }"
              >
                <div class="pod-rank" :class="getRankClass(index)">
                  <span v-if="index === 0" class="rank-icon">🥇</span>
                  <span v-else-if="index === 1" class="rank-icon">🥈</span>
                  <span v-else-if="index === 2" class="rank-icon">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="pod-info">
                  <div class="pod-name">
                    <ElIcon><Box /></ElIcon>
                    {{ pod.name }}
                  </div>
                </div>
                <div class="pod-value cpu">
                  <span class="value">{{ formatCPU(pod.value) }}</span>
                  <span class="unit">{{ pod.unit }}</span>
                </div>
                <div class="pod-progress">
                  <ElProgress
                    :percentage="getPercentage(pod.value, topCPUPods[0]?.value || 1)"
                    :stroke-width="8"
                    :show-text="false"
                    color="#667eea"
                  />
                </div>
              </div>
            </div>
            <ElEmpty v-else description="暂无 CPU 使用数据" :image-size="100" />
          </div>

          <!-- Memory Top Pods -->
          <div v-if="activeTab === 'memory'" class="top-list">
            <div class="section-header">
              <h4
                ><ElIcon><Histogram /></ElIcon> 内存使用 Top {{ topMemoryPods.length }}</h4
              >
            </div>
            <div v-if="topMemoryPods.length > 0" class="pods-list">
              <div
                v-for="(pod, index) in topMemoryPods"
                :key="pod.name"
                class="pod-item"
                :class="{ highlight: index < 3 }"
              >
                <div class="pod-rank" :class="getRankClass(index)">
                  <span v-if="index === 0" class="rank-icon">🥇</span>
                  <span v-else-if="index === 1" class="rank-icon">🥈</span>
                  <span v-else-if="index === 2" class="rank-icon">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="pod-info">
                  <div class="pod-name">
                    <ElIcon><Box /></ElIcon>
                    {{ pod.name }}
                  </div>
                </div>
                <div class="pod-value memory">
                  <span class="value">{{ formatBytes(pod.value) }}</span>
                </div>
                <div class="pod-progress">
                  <ElProgress
                    :percentage="getPercentage(pod.value, topMemoryPods[0]?.value || 1)"
                    :stroke-width="8"
                    :show-text="false"
                    color="#f093fb"
                  />
                </div>
              </div>
            </div>
            <ElEmpty v-else description="暂无内存使用数据" :image-size="100" />
          </div>

          <!-- Network Top Pods -->
          <div v-if="activeTab === 'network'" class="top-list">
            <div class="section-header">
              <h4
                ><ElIcon><Connection /></ElIcon> 网络使用 Top {{ topNetworkPods.length }}</h4
              >
            </div>
            <div v-if="topNetworkPods.length > 0" class="pods-list">
              <div
                v-for="(pod, index) in topNetworkPods"
                :key="pod.name"
                class="pod-item"
                :class="{ highlight: index < 3 }"
              >
                <div class="pod-rank" :class="getRankClass(index)">
                  <span v-if="index === 0" class="rank-icon">🥇</span>
                  <span v-else-if="index === 1" class="rank-icon">🥈</span>
                  <span v-else-if="index === 2" class="rank-icon">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="pod-info">
                  <div class="pod-name">
                    <ElIcon><Box /></ElIcon>
                    {{ pod.name }}
                  </div>
                </div>
                <div class="pod-value network">
                  <span class="value">{{ formatBytes(pod.value) }}</span>
                </div>
                <div class="pod-progress">
                  <ElProgress
                    :percentage="getPercentage(pod.value, topNetworkPods[0]?.value || 1)"
                    :stroke-width="8"
                    :show-text="false"
                    color="#4facfe"
                  />
                </div>
              </div>
            </div>
            <ElEmpty v-else description="暂无网络使用数据" :image-size="100" />
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无 Top Pods 数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { TrendCharts, Histogram, Connection, Box } from '@element-plus/icons-vue'
  import type { ResourceRanking } from '@/api/console/namespace-monitor'
  import { formatBytes } from '@/utils/format'

  interface Props {
    topCPUPods?: ResourceRanking[]
    topMemoryPods?: ResourceRanking[]
    topNetworkPods?: ResourceRanking[]
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    topCPUPods: () => [],
    topMemoryPods: () => [],
    topNetworkPods: () => [],
    loading: false
  })

  const activeTab = ref<'cpu' | 'memory' | 'network'>('cpu')

  const hasData = computed(() => {
    return (
      (props.topCPUPods && props.topCPUPods.length > 0) ||
      (props.topMemoryPods && props.topMemoryPods.length > 0) ||
      (props.topNetworkPods && props.topNetworkPods.length > 0)
    )
  })

  const formatCPU = (value: number): string => {
    if (value < 0.001) return (value * 1000).toFixed(0)
    return value.toFixed(3)
  }

  const getPercentage = (value: number, max: number): number => {
    if (!max || max === 0) return 0
    return Math.min((value / max) * 100, 100)
  }

  const getRankClass = (index: number): string => {
    if (index === 0) return 'rank-1'
    if (index === 1) return 'rank-2'
    if (index === 2) return 'rank-3'
    return 'rank-other'
  }
</script>

<style lang="scss" scoped>
  .namespace-top-pods-monitor {
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
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
    }

    .content-wrapper {
      padding: 20px;
    }

    .top-list {
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

      .pods-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .pod-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;

          &.highlight {
            background: linear-gradient(135deg, #fef3c7 0%, #fef9e8 100%);
            border-color: #fcd34d;
          }

          &:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .pod-rank {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            flex-shrink: 0;

            &.rank-1 {
              background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
              box-shadow: 0 4px 12px rgba(250, 204, 21, 0.4);
            }

            &.rank-2 {
              background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
              box-shadow: 0 4px 12px rgba(148, 163, 184, 0.4);
            }

            &.rank-3 {
              background: linear-gradient(135deg, #fdba74 0%, #fb923c 100%);
              box-shadow: 0 4px 12px rgba(251, 146, 60, 0.4);
            }

            &.rank-other {
              background: #e5e7eb;
              color: #6b7280;
            }

            .rank-icon {
              font-size: 24px;
            }

            .rank-number {
              font-size: 20px;
            }
          }

          .pod-info {
            flex: 1;
            min-width: 0;

            .pod-name {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
              display: flex;
              align-items: center;
              gap: 6px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .pod-value {
            font-size: 18px;
            font-weight: 700;
            text-align: right;
            min-width: 120px;

            &.cpu {
              color: #667eea;
            }

            &.memory {
              color: #f093fb;
            }

            &.network {
              color: #4facfe;
            }

            .unit {
              font-size: 13px;
              opacity: 0.7;
              margin-left: 4px;
            }
          }

          .pod-progress {
            width: 150px;
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
</style>
