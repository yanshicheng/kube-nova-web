<!-- /views/workspace/management/management/basic.vue - 完整版 -->
<template>
  <div class="basic-info-tab">
    <!-- 基础信息 -->
    <div class="info-section">
      <h3 class="section-title">
        <ElIcon><InfoFilled /></ElIcon>
        基础信息
      </h3>
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="工作空间名称">
          <span class="value-text">{{ workspace?.name || '-' }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="Kubernetes 命名空间">
          <code class="code-text">{{ workspace?.namespace || '-' }}</code>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="所属集群">
          <span class="value-text">{{ workspace?.clusterName || '-' }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="集群 UUID">
          <code class="code-text">{{ workspace?.clusterUuid || '-' }}</code>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="描述" :span="2">
          <span class="description-text">{{ workspace?.description || '暂无描述' }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">
          <span class="time-text">{{ formatTime(workspace?.createdAt) }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="更新时间">
          <span class="time-text">{{ formatTime(workspace?.updatedAt) }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <!-- 资源配额 -->
    <div class="info-section">
      <h3 class="section-title">
        <ElIcon><DataAnalysis /></ElIcon>
        资源配额
      </h3>
      <ElRow :gutter="20">
        <ElCol :span="6">
          <div class="resource-card">
            <div class="resource-icon cpu">
              <ElIcon :size="36"><Cpu /></ElIcon>
            </div>
            <div class="resource-info">
              <div class="resource-label">CPU 配额</div>
              <div class="resource-value">{{
                formatResourceDisplay(workspace?.cpuAllocated, 'cpu')
              }}</div>
            </div>
          </div>
        </ElCol>

        <ElCol :span="6">
          <div class="resource-card">
            <div class="resource-icon memory">
              <ElIcon :size="36"><Memo /></ElIcon>
            </div>
            <div class="resource-info">
              <div class="resource-label">内存配额</div>
              <div class="resource-value">{{
                formatResourceDisplay(workspace?.memAllocated, 'memory')
              }}</div>
            </div>
          </div>
        </ElCol>

        <ElCol :span="6">
          <div class="resource-card">
            <div class="resource-icon storage">
              <ElIcon :size="36"><Files /></ElIcon>
            </div>
            <div class="resource-info">
              <div class="resource-label">存储配额</div>
              <div class="resource-value">{{
                formatResourceDisplay(workspace?.storageAllocated, 'memory')
              }}</div>
            </div>
          </div>
        </ElCol>

        <ElCol :span="6">
          <div class="resource-card">
            <div class="resource-icon pods">
              <ElIcon :size="36"><Box /></ElIcon>
            </div>
            <div class="resource-info">
              <div class="resource-label">Pod 限制</div>
              <div class="resource-value">
                {{ workspace?.podsAllocated ? `${workspace.podsAllocated} 个` : '无限制' }}
              </div>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </div>

    <!-- 资源限制 -->
    <div class="info-section">
      <h3 class="section-title">
        <ElIcon><Operation /></ElIcon>
        对象资源限制
      </h3>

      <!-- 工作负载 -->
      <div class="resource-group">
        <h4 class="group-title">工作负载</h4>
        <ElRow :gutter="16">
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">Deployment</span>
              <span class="limit-value">{{ formatLimit(workspace?.deploymentsAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">StatefulSet</span>
              <span class="limit-value">{{ formatLimit(workspace?.statefulsetsAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">DaemonSet</span>
              <span class="limit-value">{{ formatLimit(workspace?.daemonsetsAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">Job</span>
              <span class="limit-value">{{ formatLimit(workspace?.jobsAllocated) }}</span>
            </div>
          </ElCol>
        </ElRow>
      </div>

      <!-- 网络资源 -->
      <div class="resource-group">
        <h4 class="group-title">网络资源</h4>
        <ElRow :gutter="16">
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">Service</span>
              <span class="limit-value">{{ formatLimit(workspace?.serviceAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">Ingress</span>
              <span class="limit-value">{{ formatLimit(workspace?.ingressesAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">LoadBalancer</span>
              <span class="limit-value">{{ formatLimit(workspace?.loadbalancersAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">NodePort</span>
              <span class="limit-value">{{ formatLimit(workspace?.nodeportsAllocated) }}</span>
            </div>
          </ElCol>
        </ElRow>
      </div>

      <!-- 配置与存储 -->
      <div class="resource-group">
        <h4 class="group-title">配置与存储</h4>
        <ElRow :gutter="16">
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">ConfigMap</span>
              <span class="limit-value">{{ formatLimit(workspace?.configmapAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">Secret</span>
              <span class="limit-value">{{ formatLimit(workspace?.secretAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">PVC</span>
              <span class="limit-value">{{ formatLimit(workspace?.pvcAllocated) }}</span>
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="limit-item">
              <span class="limit-label">临时存储</span>
              <span class="limit-value">
                {{
                  workspace?.ephemeralStorageAllocated
                    ? formatResourceDisplay(workspace.ephemeralStorageAllocated, 'memory')
                    : '无限制'
                }}
              </span>
            </div>
          </ElCol>
        </ElRow>
      </div>
    </div>

    <!-- Pod 级别限制 -->
    <div class="info-section">
      <h3 class="section-title">
        <ElIcon><SetUp /></ElIcon>
        Pod 级别限制
      </h3>
      <ElRow :gutter="16">
        <ElCol :span="12">
          <div class="pod-limit-card">
            <h4 class="pod-limit-title">资源上限</h4>
            <div class="pod-limit-grid">
              <div class="pod-limit-item">
                <span class="label">Pod 最大 CPU</span>
                <span class="value">{{ formatResourceDisplay(workspace?.podMaxCpu, 'cpu') }}</span>
              </div>
              <div class="pod-limit-item">
                <span class="label">Pod 最大内存</span>
                <span class="value">{{
                  formatResourceDisplay(workspace?.podMaxMemory, 'memory')
                }}</span>
              </div>
              <div class="pod-limit-item">
                <span class="label">Pod 最大临时存储</span>
                <span class="value">{{
                  formatResourceDisplay(workspace?.podMaxEphemeralStorage, 'memory')
                }}</span>
              </div>
            </div>
          </div>
        </ElCol>
        <ElCol :span="12">
          <div class="pod-limit-card">
            <h4 class="pod-limit-title">资源下限</h4>
            <div class="pod-limit-grid">
              <div class="pod-limit-item">
                <span class="label">Pod 最小 CPU</span>
                <span class="value">{{ formatResourceDisplay(workspace?.podMinCpu, 'cpu') }}</span>
              </div>
              <div class="pod-limit-item">
                <span class="label">Pod 最小内存</span>
                <span class="value">{{
                  formatResourceDisplay(workspace?.podMinMemory, 'memory')
                }}</span>
              </div>
              <div class="pod-limit-item">
                <span class="label">Pod 最小临时存储</span>
                <span class="value">{{
                  formatResourceDisplay(workspace?.podMinEphemeralStorage, 'memory')
                }}</span>
              </div>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    InfoFilled,
    DataAnalysis,
    Operation,
    SetUp,
    Cpu,
    Memo,
    Files,
    Box
  } from '@element-plus/icons-vue'
  import type { ProjectWorkspace } from '@/api'
  import { formatResourceDisplay } from '@/utils/resource'

  interface Props {
    workspace: ProjectWorkspace | null
    loading: boolean
  }

  defineProps<Props>()

  // 格式化限制值
  const formatLimit = (value: number | undefined): string => {
    if (!value || value === 0) return '无限制'
    return `${value} 个`
  }

  // 格式化时间
  const formatTime = (timestamp: number | undefined): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
</script>

<style lang="scss" scoped>
  .basic-info-tab {
    padding-bottom: 20px;

    .info-section {
      margin-bottom: 32px;
      background: var(--el-bg-color);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        padding-bottom: 12px;
        border-bottom: 2px solid var(--el-border-color-light);

        .el-icon {
          color: var(--el-color-primary);
          font-size: 20px;
        }
      }
    }

    // 基础信息样式
    .value-text {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .code-text {
      padding: 4px 8px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      color: var(--el-color-primary);
    }

    .description-text {
      color: var(--el-text-color-regular);
      line-height: 1.6;
    }

    .time-text {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    // 资源卡片
    .resource-card {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 12px;
      padding: 20px;
      height: 100%;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
        border-color: var(--el-border-color);
      }

      .resource-icon {
        width: 72px;
        height: 72px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;

        &.cpu {
          background: linear-gradient(
            135deg,
            rgba(64, 158, 255, 0.1) 0%,
            rgba(64, 158, 255, 0.2) 100%
          );
          color: #409eff;
        }

        &.memory {
          background: linear-gradient(
            135deg,
            rgba(103, 194, 58, 0.1) 0%,
            rgba(103, 194, 58, 0.2) 100%
          );
          color: #67c23a;
        }

        &.storage {
          background: linear-gradient(
            135deg,
            rgba(230, 162, 60, 0.1) 0%,
            rgba(230, 162, 60, 0.2) 100%
          );
          color: #e6a23c;
        }

        &.pods {
          background: linear-gradient(
            135deg,
            rgba(245, 108, 108, 0.1) 0%,
            rgba(245, 108, 108, 0.2) 100%
          );
          color: #f56c6c;
        }
      }

      .resource-info {
        text-align: center;

        .resource-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin-bottom: 8px;
        }

        .resource-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        }
      }
    }

    // 资源分组
    .resource-group {
      margin-bottom: 20px;
      padding: 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .group-title {
        margin: 0 0 16px;
        padding-left: 12px;
        border-left: 4px solid var(--el-color-primary);
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .limit-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--el-bg-color);
        border-radius: 6px;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s;

        &:hover {
          border-color: var(--el-color-primary-light-5);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .limit-label {
          font-size: 14px;
          color: var(--el-text-color-regular);
          font-weight: 500;
        }

        .limit-value {
          font-size: 14px;
          color: var(--el-color-primary);
          font-weight: 600;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        }
      }
    }

    // Pod限制卡片
    .pod-limit-card {
      padding: 20px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      height: 100%;

      .pod-limit-title {
        margin: 0 0 16px;
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        padding-bottom: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .pod-limit-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .pod-limit-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;

          .label {
            font-size: 13px;
            color: var(--el-text-color-regular);
          }

          .value {
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          }
        }
      }
    }

    :deep(.el-descriptions) {
      .el-descriptions__label {
        font-weight: 500;
        color: var(--el-text-color-regular);
        background: var(--el-fill-color-lighter);
      }

      .el-descriptions__content {
        font-weight: 400;
      }
    }
  }
</style>
