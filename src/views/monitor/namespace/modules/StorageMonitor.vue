<template>
  <div class="namespace-storage-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12,16A6,6 0 0,0 18,10C18,6.69 15.31,4 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.58L12.95,12.77C12.65,12.89 12.33,13 12,13C11.67,13 11.35,12.89 11.05,12.77L6.83,18.58L9.42,19.58L11.91,13.27C11.95,13.28 12,13.28 12,13.28C12.03,13.28 12.06,13.28 12.09,13.27Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>存储统计</h3>
              <p>PVC 和存储容量监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge total">
              <span class="label">总 PVC</span>
              <span class="value">{{ storageData?.pvcTotal || 0 }}</span>
            </div>
            <div class="stat-badge bound">
              <span class="label">已绑定</span>
              <span class="value">{{ storageData?.pvcBound || 0 }}</span>
            </div>
            <div class="stat-badge pending">
              <span class="label">待绑定</span>
              <span class="value">{{ storageData?.pvcPending || 0 }}</span>
            </div>
            <div class="stat-badge usage">
              <span class="label">总容量</span>
              <span class="value">{{ formatBytes(storageData?.totalRequestedBytes || 0) }}</span>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <div class="status-grid">
            <div class="status-item total">
              <div class="status-icon">📊</div>
              <div class="status-info">
                <div class="status-label">总 PVC 数量</div>
                <div class="status-value">{{ storageData?.pvcTotal || 0 }}</div>
              </div>
            </div>
            <div class="status-item bound">
              <div class="status-icon">✅</div>
              <div class="status-info">
                <div class="status-label">已绑定</div>
                <div class="status-value">{{ storageData?.pvcBound || 0 }}</div>
              </div>
            </div>
            <div class="status-item pending">
              <div class="status-icon">⏳</div>
              <div class="status-info">
                <div class="status-label">待绑定</div>
                <div class="status-value">{{ storageData?.pvcPending || 0 }}</div>
              </div>
            </div>
          </div>

          <div
            v-if="storageData?.byStorageClass && storageData.byStorageClass.length > 0"
            class="storage-classes"
          >
            <div class="section-header">
              <h4
                ><ElIcon><Files /></ElIcon> 按存储类统计</h4
              >
            </div>
            <div class="storage-class-list">
              <div
                v-for="sc in storageData.byStorageClass"
                :key="sc.storageClass"
                class="storage-class-item"
              >
                <div class="sc-info">
                  <span class="sc-name">{{ sc.storageClass }}</span>
                  <span class="sc-count">{{ sc.pvcCount }} 个PVC</span>
                </div>
                <div class="sc-size">{{ formatBytes(sc.totalBytes) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无存储数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Files } from '@element-plus/icons-vue'
  import type { NamespaceStorageMetrics } from '@/api/console/namespace-monitor'
  import { formatBytes } from '@/utils/format'

  interface Props {
    storageData?: NamespaceStorageMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    storageData: undefined,
    loading: false
  })

  const hasData = computed(() => {
    return !!(props.storageData && Object.keys(props.storageData).length > 0)
  })
</script>

<style lang="scss" scoped>
  .namespace-storage-monitor {
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

          &.total {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4c51bf;
          }

          &.bound {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.pending {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }

          &.usage {
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

    .content-wrapper {
      padding: 20px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .status-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 12px;
        border-left: 4px solid;

        &.total {
          border-left-color: #409eff;
        }

        &.bound {
          border-left-color: #67c23a;
        }

        &.pending {
          border-left-color: #e6a23c;
        }

        .status-icon {
          font-size: 32px;
        }

        .status-info {
          .status-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .status-value {
            font-size: 24px;
            font-weight: 700;
            color: #303133;
          }
        }
      }
    }

    .storage-classes {
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

      .storage-class-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .storage-class-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;

          .sc-info {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .sc-name {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }

            .sc-count {
              font-size: 12px;
              color: #909399;
            }
          }

          .sc-size {
            font-size: 16px;
            font-weight: 700;
            color: #409eff;
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
