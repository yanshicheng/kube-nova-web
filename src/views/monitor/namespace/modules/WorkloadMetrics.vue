<template>
  <div class="workload-metrics" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper">⚙️</div>
            <div class="header-title">
              <h3>工作负载统计</h3>
              <p>Deployments, StatefulSets, DaemonSets, Jobs</p>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
          <!-- Deployments -->
          <div class="workload-section">
            <h4>Deployments</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">总数</span>
                <span class="value">{{ workloadData?.deployments?.total || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">期望副本</span>
                <span class="value">{{ workloadData?.deployments?.desiredReplicas || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">可用副本</span>
                <span class="value success">{{
                  workloadData?.deployments?.availableReplicas || 0
                }}</span>
              </div>
              <div class="stat-item">
                <span class="label">不可用副本</span>
                <span class="value failed">{{
                  workloadData?.deployments?.unavailableReplicas || 0
                }}</span>
              </div>
            </div>
          </div>

          <!-- StatefulSets -->
          <div class="workload-section">
            <h4>StatefulSets</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">总数</span>
                <span class="value">{{ workloadData?.statefulSets?.total || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">期望副本</span>
                <span class="value">{{ workloadData?.statefulSets?.desiredReplicas || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">就绪副本</span>
                <span class="value success">{{
                  workloadData?.statefulSets?.readyReplicas || 0
                }}</span>
              </div>
            </div>
          </div>

          <!-- DaemonSets -->
          <div class="workload-section">
            <h4>DaemonSets</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">总数</span>
                <span class="value">{{ workloadData?.daemonSets?.total || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">期望调度</span>
                <span class="value">{{ workloadData?.daemonSets?.desiredScheduled || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">当前调度</span>
                <span class="value success">{{
                  workloadData?.daemonSets?.currentScheduled || 0
                }}</span>
              </div>
            </div>
          </div>

          <!-- Jobs -->
          <div class="workload-section">
            <h4>Jobs</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">活跃</span>
                <span class="value">{{ workloadData?.jobs?.active || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">成功</span>
                <span class="value success">{{ workloadData?.jobs?.succeeded || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">失败</span>
                <span class="value failed">{{ workloadData?.jobs?.failed || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">CronJobs</span>
                <span class="value">{{ workloadData?.jobs?.cronJobsTotal || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ElEmpty description="暂无工作负载数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { NamespaceWorkloadMetrics } from '@/api/console/namespace-monitor'

  interface Props {
    workloadData?: NamespaceWorkloadMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    workloadData: undefined,
    loading: false
  })

  const hasData = computed(() => {
    return !!(props.workloadData && Object.keys(props.workloadData).length > 0)
  })
</script>

<style lang="scss" scoped>
  .workload-metrics {
    .monitor-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .card-header {
      padding: 20px 24px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-bottom: 1px solid #fcd34d;

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
          font-size: 24px;
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

    .workload-section {
      margin-bottom: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;

        .stat-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: white;
          border-radius: 6px;

          .label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .value {
            font-size: 20px;
            font-weight: 700;
            color: #303133;

            &.success {
              color: #67c23a;
            }

            &.failed {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
</style>
