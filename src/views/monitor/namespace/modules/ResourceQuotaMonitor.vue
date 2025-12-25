<template>
  <div class="resource-quota-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M12,3C12.55,3 13,3.45 13,4C13,4.55 12.55,5 12,5C11.45,5 11,4.55 11,4C11,3.45 11.45,3 12,3M7,7H17V5H19V19H5V5H7V7M12,17L17,12L15.59,10.59L12,14.17L9.91,12.09L8.5,13.5L12,17Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>资源配额</h3>
              <p>Namespace 配额使用情况</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge" :class="getQuotaLevelClass(quotaData?.cpu?.usagePercent)">
              <span class="label">CPU</span>
              <span class="value">{{ formatPercentage(quotaData?.cpu?.usagePercent) }}</span>
            </div>
            <div class="stat-badge" :class="getQuotaLevelClass(quotaData?.memory?.usagePercent)">
              <span class="label">内存</span>
              <span class="value">{{ formatPercentage(quotaData?.memory?.usagePercent) }}</span>
            </div>
            <div class="stat-badge" :class="getQuotaLevelClass(quotaData?.pods?.usagePercent)">
              <span class="label">Pods</span>
              <span class="value">{{ formatPercentage(quotaData?.pods?.usagePercent) }}</span>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <div class="quota-grid">
            <!-- CPU 配额 -->
            <div class="quota-item">
              <div class="quota-header">
                <div class="quota-icon cpu">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M17,17H7V7H17M21,11V9H19V7C19,5.89 18.1,5 17,5H15V3H13V5H11V3H9V5H7C5.89,5 5,5.89 5,7V9H3V11H5V13H3V15H5V17C5,18.1 5.9,19 7,19H9V21H11V19H13V21H15V19H17C18.1,19 19,18.1 19,17V15H21V13H19V11M15,15H9V9H15V15Z"
                    />
                  </svg>
                </div>
                <span class="quota-name">CPU 配额</span>
              </div>
              <div class="quota-values">
                <div class="value-item">
                  <span class="value-label">已使用</span>
                  <span class="value-number">{{ formatCores(quotaData?.cpu?.used) }}</span>
                </div>
                <div class="value-divider">/</div>
                <div class="value-item">
                  <span class="value-label">总配额</span>
                  <span class="value-number">{{ formatCores(quotaData?.cpu?.hard) }}</span>
                </div>
              </div>
              <div class="quota-progress">
                <ElProgress
                  :percentage="quotaData?.cpu?.usagePercent || 0"
                  :color="getQuotaColor(quotaData?.cpu?.usagePercent)"
                  :stroke-width="12"
                  :show-text="false"
                />
              </div>
              <div class="quota-status" :class="getQuotaLevel(quotaData?.cpu?.usagePercent)">
                <ElIcon v-if="quotaData && quotaData.cpu && quotaData.cpu.usagePercent >= 90"
                  ><Warning
                /></ElIcon>
                <ElIcon v-else-if="quotaData && quotaData.cpu && quotaData.cpu.usagePercent >= 70"
                  ><InfoFilled
                /></ElIcon>
                <ElIcon v-else><CircleCheck /></ElIcon>
                <span>{{ getQuotaStatusText(quotaData?.cpu?.usagePercent) }}</span>
              </div>
            </div>

            <!-- 内存配额 -->
            <div class="quota-item">
              <div class="quota-header">
                <div class="quota-icon memory">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z"
                    />
                  </svg>
                </div>
                <span class="quota-name">内存配额</span>
              </div>
              <div class="quota-values">
                <div class="value-item">
                  <span class="value-label">已使用</span>
                  <span class="value-number">{{ formatBytes(quotaData?.memory?.used) }}</span>
                </div>
                <div class="value-divider">/</div>
                <div class="value-item">
                  <span class="value-label">总配额</span>
                  <span class="value-number">{{ formatBytes(quotaData?.memory?.hard) }}</span>
                </div>
              </div>
              <div class="quota-progress">
                <ElProgress
                  :percentage="quotaData?.memory?.usagePercent || 0"
                  :color="getQuotaColor(quotaData?.memory?.usagePercent)"
                  :stroke-width="12"
                  :show-text="false"
                />
              </div>
              <div class="quota-status" :class="getQuotaLevel(quotaData?.memory?.usagePercent)">
                <ElIcon v-if="quotaData && quotaData.memory && quotaData.memory.usagePercent >= 90"
                  ><Warning
                /></ElIcon>
                <ElIcon
                  v-else-if="quotaData && quotaData.memory && quotaData.memory.usagePercent >= 70"
                  ><InfoFilled
                /></ElIcon>
                <ElIcon v-else><CircleCheck /></ElIcon>
                <span>{{ getQuotaStatusText(quotaData?.memory?.usagePercent) }}</span>
              </div>
            </div>

            <!-- Pods 配额 -->
            <div class="quota-item">
              <div class="quota-header">
                <div class="quota-icon pods">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M7.5,22A3.5,3.5 0 0,1 4,18.5V17.5A3.5,3.5 0 0,1 7.5,14A3.5,3.5 0 0,1 11,17.5V18.5A3.5,3.5 0 0,1 7.5,22M16.5,22A3.5,3.5 0 0,1 13,18.5V17.5A3.5,3.5 0 0,1 16.5,14A3.5,3.5 0 0,1 20,17.5V18.5A3.5,3.5 0 0,1 16.5,22Z"
                    />
                  </svg>
                </div>
                <span class="quota-name">Pods 配额</span>
              </div>
              <div class="quota-values">
                <div class="value-item">
                  <span class="value-label">已使用</span>
                  <span class="value-number">{{ quotaData?.pods?.used || 0 }}</span>
                </div>
                <div class="value-divider">/</div>
                <div class="value-item">
                  <span class="value-label">总配额</span>
                  <span class="value-number">{{ quotaData?.pods?.hard || 0 }}</span>
                </div>
              </div>
              <div class="quota-progress">
                <ElProgress
                  :percentage="quotaData?.pods?.usagePercent || 0"
                  :color="getQuotaColor(quotaData?.pods?.usagePercent)"
                  :stroke-width="12"
                  :show-text="false"
                />
              </div>
              <div class="quota-status" :class="getQuotaLevel(quotaData?.pods?.usagePercent)">
                <ElIcon v-if="quotaData && quotaData.pods && quotaData.pods.usagePercent >= 90"
                  ><Warning
                /></ElIcon>
                <ElIcon v-else-if="quotaData && quotaData.pods && quotaData.pods.usagePercent >= 70"
                  ><InfoFilled
                /></ElIcon>
                <ElIcon v-else><CircleCheck /></ElIcon>
                <span>{{ getQuotaStatusText(quotaData?.pods?.usagePercent) }}</span>
              </div>
            </div>
          </div>

          <!-- 其他资源配额 -->
          <div
            v-if="quotaData?.allResources && quotaData.allResources.length > 0"
            class="other-resources"
          >
            <div class="section-header">
              <h4
                ><ElIcon><List /></ElIcon> 其他资源配额</h4
              >
            </div>
            <div class="resources-grid">
              <div
                v-for="resource in quotaData.allResources"
                :key="resource.resource"
                class="resource-item"
              >
                <div class="resource-info">
                  <span class="resource-name">{{ resource.resource }}</span>
                  <span class="resource-usage">{{ resource.used }} / {{ resource.hard }}</span>
                </div>
                <ElProgress
                  :percentage="resource.percent"
                  :color="getQuotaColor(resource.percent)"
                  :stroke-width="8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无资源配额数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Warning, InfoFilled, CircleCheck, List } from '@element-plus/icons-vue'
  import type { NamespaceQuotaMetrics } from '@/api/console/namespace-monitor'
  import { formatBytes, formatPercentage } from '@/utils/format'

  interface Props {
    quotaData?: NamespaceQuotaMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    quotaData: undefined,
    loading: false
  })

  const hasData = computed(() => {
    return !!(props.quotaData && Object.keys(props.quotaData).length > 0)
  })

  const formatCores = (cores?: number): string => {
    if (!cores || cores === 0) return '0'
    if (cores < 1) return `${(cores * 1000).toFixed(0)}m`
    return `${cores.toFixed(3)}`
  }

  const getQuotaLevel = (percent?: number): string => {
    if (!percent) return 'safe'
    if (percent < 70) return 'safe'
    if (percent < 90) return 'warning'
    return 'critical'
  }

  const getQuotaLevelClass = (percent?: number): string => {
    const level = getQuotaLevel(percent)
    return `level-${level}`
  }

  const getQuotaColor = (percent?: number): string => {
    if (!percent) return '#67c23a'
    if (percent < 70) return '#67c23a'
    if (percent < 90) return '#e6a23c'
    return '#f56c6c'
  }

  const getQuotaStatusText = (percent?: number): string => {
    if (!percent) return '充足'
    if (percent < 70) return '充足'
    if (percent < 90) return '注意'
    return '紧张'
  }
</script>

<style lang="scss" scoped>
  .resource-quota-monitor {
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
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border-bottom: 1px solid #fed7aa;
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
          background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
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

          .label {
            opacity: 0.8;
          }

          .value {
            font-weight: 700;
            font-size: 14px;
          }

          &.level-safe {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.level-warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }

          &.level-critical {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
          }
        }
      }
    }

    .content-wrapper {
      padding: 20px;
    }

    .quota-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 24px;

      .quota-item {
        padding: 20px;
        background: #f9fafb;
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        transition: all 0.3s ease;

        &:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .quota-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;

          .quota-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;

            &.cpu {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            &.memory {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }

            &.pods {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
          }

          .quota-name {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
          }
        }

        .quota-values {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;

          .value-item {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .value-label {
              font-size: 12px;
              color: #909399;
            }

            .value-number {
              font-size: 18px;
              font-weight: 700;
              color: #303133;
            }
          }

          .value-divider {
            font-size: 20px;
            color: #dcdfe6;
            font-weight: 300;
          }
        }

        .quota-progress {
          margin-bottom: 12px;
        }

        .quota-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;

          &.safe {
            color: #67c23a;
          }

          &.warning {
            color: #e6a23c;
          }

          &.critical {
            color: #f56c6c;
          }
        }
      }
    }

    .other-resources {
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

      .resources-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;

        .resource-item {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;

          .resource-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .resource-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }

            .resource-usage {
              font-size: 13px;
              color: #606266;
              font-weight: 600;
            }
          }
        }
      }
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      background: white;
      border-radius: 12px;
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  @media (max-width: 768px) {
    .resource-quota-monitor {
      .quota-grid {
        grid-template-columns: 1fr;
      }

      .other-resources .resources-grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
