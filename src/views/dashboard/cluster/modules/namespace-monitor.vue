<template>
  <div class="namespace-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper namespace-icon">
              <img src="@/assets/img/monitoring/cluster.png" alt="命名空间" />
            </div>
            <div class="header-title">
              <h3>命名空间</h3>
              <p>Namespace 资源使用排名</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总数</span>
              <span class="value">{{ namespaceData?.total || 0 }}</span>
            </div>
            <div class="stat-badge active">
              <span class="label">活跃</span>
              <span class="value">{{ namespaceData?.active || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="namespace-section">
          <ElRow :gutter="16">
            <ElCol :xs="24" :lg="8">
              <div class="ranking-card cpu-ranking">
                <div class="ranking-header">
                  <h4>
                    <img src="@/assets/img/monitoring/CPU.png" class="ranking-icon-img" alt="CPU" />
                    CPU 使用 Top
                  </h4>
                </div>
                <div class="ranking-list">
                  <div
                    v-for="(item, index) in namespaceData?.topByCPU || []"
                    :key="item.namespace"
                    class="ranking-item"
                  >
                    <div class="rank-badge" :class="`rank-${index + 1}`">
                      {{ index + 1 }}
                    </div>
                    <div class="rank-info">
                      <div class="namespace-name">{{ item.namespace }}</div>
                      <div class="namespace-value">
                        {{ formatValue(item.value, item.unit) }}
                      </div>
                    </div>
                  </div>
                  <ElEmpty
                    v-if="!namespaceData?.topByCPU || namespaceData.topByCPU.length === 0"
                    description="暂无数据"
                    :image-size="80"
                  />
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :lg="8">
              <div class="ranking-card memory-ranking">
                <div class="ranking-header">
                  <h4>
                    <img
                      src="@/assets/img/monitoring/memory.png"
                      class="ranking-icon-img"
                      alt="内存"
                    />
                    内存使用 Top
                  </h4>
                </div>
                <div class="ranking-list">
                  <div
                    v-for="(item, index) in namespaceData?.topByMemory || []"
                    :key="item.namespace"
                    class="ranking-item"
                  >
                    <div class="rank-badge" :class="`rank-${index + 1}`">
                      {{ index + 1 }}
                    </div>
                    <div class="rank-info">
                      <div class="namespace-name">{{ item.namespace }}</div>
                      <div class="namespace-value">
                        {{ formatValue(item.value, item.unit) }}
                      </div>
                    </div>
                  </div>
                  <ElEmpty
                    v-if="!namespaceData?.topByMemory || namespaceData.topByMemory.length === 0"
                    description="暂无数据"
                    :image-size="80"
                  />
                </div>
              </div>
            </ElCol>

            <ElCol :xs="24" :lg="8">
              <div class="ranking-card pod-ranking">
                <div class="ranking-header">
                  <h4>
                    <img src="@/assets/img/monitoring/pod.png" class="ranking-icon-img" alt="Pod" />
                    Pod 数量 Top
                  </h4>
                </div>
                <div class="ranking-list">
                  <div
                    v-for="(item, index) in namespaceData?.topByPods || []"
                    :key="item.namespace"
                    class="ranking-item"
                  >
                    <div class="rank-badge" :class="`rank-${index + 1}`">
                      {{ index + 1 }}
                    </div>
                    <div class="rank-info">
                      <div class="namespace-name">{{ item.namespace }}</div>
                      <div class="namespace-value">
                        {{ formatValue(item.value, item.unit) }}
                      </div>
                    </div>
                  </div>
                  <ElEmpty
                    v-if="!namespaceData?.topByPods || namespaceData.topByPods.length === 0"
                    description="暂无数据"
                    :image-size="80"
                  />
                </div>
              </div>
            </ElCol>
          </ElRow>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无命名空间监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { ClusterNamespaceMetrics } from '@/api/console/cluster-monitor'

  interface Props {
    namespaceData?: ClusterNamespaceMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    namespaceData: undefined,
    loading: false
  })

  const hasData = computed(() => {
    return !!(props.namespaceData && Object.keys(props.namespaceData).length > 0)
  })

  // 格式化数值
  const formatValue = (value: number, unit?: string) => {
    // 如果单位是 bytes，转换成易读格式
    if (unit === 'bytes') {
      const bytes = value
      if (bytes < 1024) return `${bytes.toFixed(2)} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }

    // 如果单位是 cores，保留3位小数
    if (unit === 'cores') {
      return `${value.toFixed(3)} cores`
    }

    // 如果单位是 pods，显示整数
    if (unit === 'pods' || !unit) {
      return `${Math.round(value)} ${unit || 'pods'}`
    }

    // 其他情况保留2位小数
    return `${value.toFixed(2)} ${unit || ''}`
  }
</script>

<style lang="scss" scoped>
  .namespace-monitor {
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
      background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
      border-bottom: 1px solid #f9a8d4;
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

          &.active {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
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

    .namespace-section {
      padding: 20px;

      .ranking-card {
        padding: 20px;
        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        transition: all 0.3s ease;
        margin-bottom: 16px;
        min-height: 400px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        &.cpu-ranking:hover {
          border-color: #667eea;
        }

        &.memory-ranking:hover {
          border-color: #f093fb;
        }

        &.pod-ranking:hover {
          border-color: #43e97b;
        }

        .ranking-header {
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 16px;

          h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            display: flex;
            align-items: center;
            gap: 8px;

            .ranking-icon-img {
              width: 20px;
              height: 20px;
              object-fit: contain;
            }
          }
        }

        .ranking-list {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .ranking-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f5f7fa;
            border-radius: 8px;
            transition: all 0.3s ease;

            &:hover {
              background: #e5e7eb;
              transform: translateX(4px);
            }

            .rank-badge {
              width: 32px;
              height: 32px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 14px;
              color: white;
              flex-shrink: 0;

              &.rank-1 {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
              }

              &.rank-2 {
                background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
                box-shadow: 0 2px 8px rgba(209, 213, 219, 0.4);
              }

              &.rank-3 {
                background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
                box-shadow: 0 2px 8px rgba(251, 146, 60, 0.4);
              }

              &.rank-4,
              &.rank-5,
              &.rank-6,
              &.rank-7,
              &.rank-8,
              &.rank-9,
              &.rank-10 {
                background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
              }
            }

            .rank-info {
              flex: 1;
              display: flex;
              justify-content: space-between;
              align-items: center;

              .namespace-name {
                font-size: 14px;
                font-weight: 500;
                color: #303133;
              }

              .namespace-value {
                font-size: 14px;
                font-weight: 700;
                color: #606266;
              }
            }
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
    .namespace-monitor {
      .card-header {
        padding: 16px 20px;

        .header-stats {
          width: 100%;
        }
      }

      .namespace-section {
        padding: 16px;

        .ranking-card {
          min-height: auto;
        }
      }
    }
  }
</style>
