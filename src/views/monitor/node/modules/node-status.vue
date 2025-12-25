<template>
  <div class="node-status-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <img src="@/assets/img/monitoring/cluster.png" alt="Status" class="icon" />
            <div class="header-title">
              <h3>Node 状态</h3>
              <p>Kubernetes 节点信息</p>
            </div>
          </div>
          <div class="header-stats">
            <ElTag :type="getReadyType()" size="large" effect="dark">
              {{ getReadyStatus() }}
            </ElTag>
          </div>
        </div>

        <div class="content-wrapper">
          <ElRow :gutter="20">
            <!-- Node Conditions -->
            <ElCol :xs="24" :lg="12">
              <div class="status-section">
                <div class="section-header">
                  <h4>
                    <ElIcon><InfoFilled /></ElIcon>
                    节点状况
                  </h4>
                </div>
                <div class="conditions-list">
                  <div
                    v-for="condition in statusData?.conditions"
                    :key="condition.type"
                    class="condition-item"
                    :class="{ warning: shouldWarn(condition) }"
                  >
                    <div class="condition-header">
                      <span class="condition-type">{{ condition.type }}</span>
                      <ElTag :type="condition.status ? 'success' : 'info'" size="small">
                        {{ condition.status ? 'True' : 'False' }}
                      </ElTag>
                    </div>
                    <div v-if="condition.reason" class="condition-reason">
                      {{ condition.reason }}
                    </div>
                    <div v-if="condition.message" class="condition-message">
                      {{ condition.message }}
                    </div>
                    <div class="condition-time">
                      Last Transition: {{ smartFormatTime(condition.lastTransitionTime) }}
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>

            <!-- 资源容量 -->
            <ElCol :xs="24" :lg="12">
              <div class="capacity-section">
                <div class="section-header">
                  <h4>
                    <ElIcon><Monitor /></ElIcon>
                    资源容量
                  </h4>
                </div>
                <div class="capacity-grid">
                  <div class="capacity-item">
                    <div class="capacity-label">CPU</div>
                    <div class="capacity-bars">
                      <div class="bar-row">
                        <span class="bar-label">Capacity</span>
                        <div class="bar-wrapper">
                          <div class="bar" style="width: 100%; background: #e6e9f0">
                            <span class="bar-text">{{ statusData?.capacity?.cpuCores }} cores</span>
                          </div>
                        </div>
                      </div>
                      <div class="bar-row">
                        <span class="bar-label">Allocatable</span>
                        <div class="bar-wrapper">
                          <div
                            class="bar"
                            :style="{
                              width: `${getAllocatablePercent('cpu')}%`,
                              background: '#67c23a'
                            }"
                          >
                            <span class="bar-text"
                              >{{ statusData?.allocatable?.cpuCores }} cores</span
                            >
                          </div>
                        </div>
                      </div>
                      <div class="bar-row">
                        <span class="bar-label">Allocated</span>
                        <div class="bar-wrapper">
                          <div
                            class="bar"
                            :style="{
                              width: `${getAllocatedPercent('cpu')}%`,
                              background: '#409eff'
                            }"
                          >
                            <span class="bar-text"
                              >{{ statusData?.allocated?.cpuCores?.toFixed(2) }} cores</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="capacity-item">
                    <div class="capacity-label">Memory</div>
                    <div class="capacity-bars">
                      <div class="bar-row">
                        <span class="bar-label">Capacity</span>
                        <div class="bar-wrapper">
                          <div class="bar" style="width: 100%; background: #e6e9f0">
                            <span class="bar-text">{{
                              formatBytes(statusData?.capacity?.memoryBytes)
                            }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="bar-row">
                        <span class="bar-label">Allocatable</span>
                        <div class="bar-wrapper">
                          <div
                            class="bar"
                            :style="{
                              width: `${getAllocatablePercent('memory')}%`,
                              background: '#67c23a'
                            }"
                          >
                            <span class="bar-text">{{
                              formatBytes(statusData?.allocatable?.memoryBytes)
                            }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="bar-row">
                        <span class="bar-label">Allocated</span>
                        <div class="bar-wrapper">
                          <div
                            class="bar"
                            :style="{
                              width: `${getAllocatedPercent('memory')}%`,
                              background: '#409eff'
                            }"
                          >
                            <span class="bar-text">{{
                              formatBytes(statusData?.allocated?.memoryBytes)
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="capacity-item">
                    <div class="capacity-label">Pods</div>
                    <div class="capacity-bars">
                      <div class="bar-row">
                        <span class="bar-label">Capacity</span>
                        <div class="bar-wrapper">
                          <div class="bar" style="width: 100%; background: #e6e9f0">
                            <span class="bar-text">{{ statusData?.capacity?.pods }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="bar-row">
                        <span class="bar-label">Allocated</span>
                        <div class="bar-wrapper">
                          <div
                            class="bar"
                            :style="{
                              width: `${getAllocatedPercent('pods')}%`,
                              background: '#409eff'
                            }"
                          >
                            <span class="bar-text">{{ statusData?.allocated?.pods }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ElCol>
          </ElRow>

          <!-- Node Info -->
          <div class="node-info-section">
            <div class="section-header">
              <h4>
                <ElIcon><Document /></ElIcon>
                节点信息
              </h4>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Kubelet Version:</span>
                <span class="value">{{ statusData?.nodeInfo?.kubeletVersion }}</span>
              </div>
              <div class="info-item">
                <span class="label">Container Runtime:</span>
                <span class="value">{{ statusData?.nodeInfo?.containerRuntimeVersion }}</span>
              </div>
              <div class="info-item">
                <span class="label">Kernel Version:</span>
                <span class="value">{{ statusData?.nodeInfo?.kernelVersion }}</span>
              </div>
              <div class="info-item">
                <span class="label">OS Image:</span>
                <span class="value">{{ statusData?.nodeInfo?.osImage }}</span>
              </div>
              <div class="info-item">
                <span class="label">Architecture:</span>
                <span class="value">{{ statusData?.nodeInfo?.architecture }}</span>
              </div>
              <div class="info-item">
                <span class="label">Uptime:</span>
                <span class="value">{{ formatDuration(statusData?.nodeInfo?.uptimeSeconds) }}</span>
              </div>
            </div>
          </div>

          <!-- Kubelet Metrics -->
          <div v-if="statusData?.kubeletMetrics" class="kubelet-section">
            <div class="section-header">
              <h4>
                <ElIcon><DataAnalysis /></ElIcon>
                Kubelet 指标
              </h4>
            </div>
            <div class="kubelet-stats">
              <div class="stat-item">
                <span class="label">Running Pods</span>
                <span class="value">{{ statusData.kubeletMetrics.runningPods }}</span>
              </div>
              <div class="stat-item">
                <span class="label">Running Containers</span>
                <span class="value">{{ statusData.kubeletMetrics.runningContainers }}</span>
              </div>
              <div class="stat-item">
                <span class="label">PLEG Relist Duration</span>
                <span class="value"
                  >{{ statusData.kubeletMetrics.plegRelistDuration.toFixed(2) }}ms</span
                >
              </div>
              <div class="stat-item">
                <span class="label">Runtime Ops Rate</span>
                <span class="value"
                  >{{ statusData.kubeletMetrics.runtimeOpsRate.toFixed(2) }}/s</span
                >
              </div>
              <div class="stat-item">
                <span class="label">Runtime Ops Error Rate</span>
                <span class="value"
                  >{{ statusData.kubeletMetrics.runtimeOpsErrorRate.toFixed(2) }}/s</span
                >
              </div>
            </div>
          </div>

          <!-- Taints -->
          <div v-if="statusData?.taints?.length" class="taints-section">
            <div class="section-header">
              <h4>
                <ElIcon><Warning /></ElIcon>
                Taints
                <ElTag type="warning" size="small">{{ statusData.taints.length }}</ElTag>
              </h4>
            </div>
            <div class="taints-list">
              <ElTag
                v-for="(taint, index) in statusData.taints"
                :key="index"
                type="warning"
                size="large"
              >
                {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
              </ElTag>
            </div>
          </div>

          <!-- Labels -->
          <div v-if="statusData?.labels" class="labels-section">
            <div class="section-header">
              <h4>
                <ElIcon><PriceTag /></ElIcon>
                Labels
                <ElTag type="info" size="small">{{ Object.keys(statusData.labels).length }}</ElTag>
              </h4>
            </div>
            <div class="labels-list">
              <ElTag v-for="(value, key) in statusData.labels" :key="key" type="info" size="small">
                {{ key }}: {{ value }}
              </ElTag>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无状态数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import {
    InfoFilled,
    Monitor,
    Document,
    DataAnalysis,
    Warning,
    PriceTag
  } from '@element-plus/icons-vue'
  import { formatBytes, formatDuration, smartFormatTime } from '@/utils/format'
  import type { NodeK8sStatus } from '@/api/console/node-monitor'

  interface Props {
    statusData?: NodeK8sStatus
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    statusData: undefined,
    loading: false
  })

  const hasData = computed(() => {
    return !!(props.statusData && Object.keys(props.statusData).length > 0)
  })

  const getReadyStatus = (): string => {
    const ready = props.statusData?.conditions?.find((c) => c.type === 'Ready')
    return ready?.status ? 'Ready' : 'NotReady'
  }

  const getReadyType = () => {
    const ready = props.statusData?.conditions?.find((c) => c.type === 'Ready')
    return ready?.status ? 'success' : 'danger'
  }

  const shouldWarn = (condition: any): boolean => {
    const warningTypes = ['MemoryPressure', 'DiskPressure', 'PIDPressure']
    return warningTypes.includes(condition.type) && condition.status
  }

  const getAllocatablePercent = (type: 'cpu' | 'memory' | 'pods'): number => {
    if (!props.statusData?.capacity || !props.statusData?.allocatable) return 0
    const capacity =
      type === 'cpu'
        ? props.statusData.capacity.cpuCores
        : type === 'memory'
          ? props.statusData.capacity.memoryBytes
          : props.statusData.capacity.pods
    const allocatable =
      type === 'cpu'
        ? props.statusData.allocatable.cpuCores
        : type === 'memory'
          ? props.statusData.allocatable.memoryBytes
          : props.statusData.allocatable.pods
    return (allocatable / capacity) * 100
  }

  const getAllocatedPercent = (type: 'cpu' | 'memory' | 'pods'): number => {
    if (!props.statusData?.capacity || !props.statusData?.allocated) return 0
    const capacity =
      type === 'cpu'
        ? props.statusData.capacity.cpuCores
        : type === 'memory'
          ? props.statusData.capacity.memoryBytes
          : props.statusData.capacity.pods
    const allocated =
      type === 'cpu'
        ? props.statusData.allocated.cpuCores
        : type === 'memory'
          ? props.statusData.allocated.memoryBytes
          : props.statusData.allocated.pods
    return (allocated / capacity) * 100
  }
</script>

<style lang="scss" scoped>
  .node-status-monitor {
    .monitor-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      animation: slideInUp 0.5s ease-out;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-bottom: 1px solid #bae6fd;

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .header-title {
          h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #1a202c;
          }

          p {
            margin: 4px 0 0;
            font-size: 14px;
            color: #718096;
          }
        }
      }
    }

    .content-wrapper {
      padding: 24px 32px 32px;
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

    .status-section,
    .capacity-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      height: 100%;
    }

    .conditions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .condition-item {
        padding: 16px;
        background: white;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;

        &.warning {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }

        .condition-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .condition-type {
            font-weight: 600;
            color: #303133;
          }
        }

        .condition-reason,
        .condition-message {
          font-size: 13px;
          color: #606266;
          margin-bottom: 4px;
        }

        .condition-time {
          font-size: 12px;
          color: #909399;
          margin-top: 8px;
        }
      }
    }

    .capacity-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .capacity-item {
        .capacity-label {
          font-weight: 600;
          color: #303133;
          margin-bottom: 12px;
        }

        .capacity-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .bar-row {
            display: flex;
            align-items: center;
            gap: 12px;

            .bar-label {
              min-width: 80px;
              font-size: 12px;
              color: #606266;
            }

            .bar-wrapper {
              flex: 1;
              height: 24px;
              background: #f5f7fa;
              border-radius: 4px;
              overflow: hidden;
              position: relative;

              .bar {
                height: 100%;
                display: flex;
                align-items: center;
                padding: 0 8px;
                transition: width 0.6s ease;

                .bar-text {
                  font-size: 11px;
                  font-weight: 600;
                  color: white;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }
              }
            }
          }
        }
      }
    }

    .node-info-section,
    .kubelet-section,
    .taints-section,
    .labels-section {
      margin-top: 24px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 12px;

      .info-item {
        padding: 12px;
        background: white;
        border-radius: 8px;
        display: flex;
        gap: 8px;

        .label {
          font-weight: 500;
          color: #606266;
        }

        .value {
          color: #303133;
          flex: 1;
          text-align: right;
        }
      }
    }

    .kubelet-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;

      .stat-item {
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

    .taints-list,
    .labels-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: white;
      border-radius: 16px;
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
    .node-status-monitor {
      .card-header {
        padding: 16px 20px;
      }

      .content-wrapper {
        padding: 20px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
