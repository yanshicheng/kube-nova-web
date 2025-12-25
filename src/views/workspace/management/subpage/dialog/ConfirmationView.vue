<template>
  <div class="confirmation-content">
    <div class="confirmation-header">
      <ElIcon><DocumentChecked /></ElIcon>
      <span>请确认工作空间配置</span>
    </div>

    <!-- 基础信息确认 -->
    <div class="confirm-section">
      <div class="section-title">
        <ElIcon><FolderOpened /></ElIcon>
        基础信息
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">工作空间名称</span>
          <span class="value">{{ formData.name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">命名空间</span>
          <span class="value code">{{ formData.namespace || '-' }}</span>
        </div>
        <div class="info-item full-width">
          <span class="label">描述</span>
          <span class="value">{{ formData.description || '无' }}</span>
        </div>
      </div>
    </div>

    <!-- 资源配置确认 -->
    <div class="confirm-section">
      <div class="section-title">
        <ElIcon><Cpu /></ElIcon>
        基础资源配置
      </div>
      <div class="resource-summary-grid">
        <div class="resource-summary-item">
          <ElIcon class="icon cpu"><Cpu /></ElIcon>
          <div class="info">
            <span class="label">CPU 配额</span>
            <span class="value">{{ formatResourceDisplay(formData.cpuAllocated, 'cpu') }}</span>
            <span class="available">剩余: {{ getAvailableResource('cpu') }}</span>
          </div>
        </div>
        <div class="resource-summary-item">
          <ElIcon class="icon memory"><Memo /></ElIcon>
          <div class="info">
            <span class="label">内存配额</span>
            <span class="value">{{ formatResourceDisplay(formData.memAllocated, 'memory') }}</span>
            <span class="available">剩余: {{ getAvailableResource('memory') }}</span>
          </div>
        </div>
        <div class="resource-summary-item">
          <ElIcon class="icon storage"><Files /></ElIcon>
          <div class="info">
            <span class="label">存储配额</span>
            <span class="value">{{
              formatResourceDisplay(formData.storageAllocated, 'memory')
            }}</span>
            <span class="available">剩余: {{ getAvailableResource('storage') }}</span>
          </div>
        </div>
        <div
          class="resource-summary-item"
          v-if="formData.gpuAllocated && formData.gpuAllocated !== '0'"
        >
          <ElIcon class="icon gpu"><VideoPlay /></ElIcon>
          <div class="info">
            <span class="label">GPU 配额</span>
            <span class="value">{{ formatResourceDisplay(formData.gpuAllocated, 'cpu') }}</span>
            <span class="available">剩余: {{ getAvailableResource('gpu') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 对象限制确认 -->
    <div class="confirm-section">
      <div class="section-title">
        <ElIcon><Files /></ElIcon>
        对象资源限制
      </div>

      <div class="object-group">
        <h4 class="group-title">工作负载</h4>
        <div class="object-limits-grid">
          <div class="limit-item">
            <span class="limit-name">Pod</span>
            <ElTag :type="formData.podsAllocated ? 'primary' : 'info'" size="small">
              {{ formData.podsAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">Deployment</span>
            <ElTag :type="formData.deploymentsAllocated ? 'primary' : 'info'" size="small">
              {{ formData.deploymentsAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">StatefulSet</span>
            <ElTag :type="formData.statefulsetsAllocated ? 'primary' : 'info'" size="small">
              {{ formData.statefulsetsAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">DaemonSet</span>
            <ElTag :type="formData.daemonsetsAllocated ? 'primary' : 'info'" size="small">
              {{ formData.daemonsetsAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">Job</span>
            <ElTag :type="formData.jobsAllocated ? 'primary' : 'info'" size="small">
              {{ formData.jobsAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">CronJob</span>
            <ElTag :type="formData.cronjobsAllocated ? 'primary' : 'info'" size="small">
              {{ formData.cronjobsAllocated || '无限制' }}
            </ElTag>
          </div>
        </div>
      </div>

      <div class="object-group">
        <h4 class="group-title">网络资源</h4>
        <div class="object-limits-grid">
          <div class="limit-item">
            <span class="limit-name">Service</span>
            <ElTag :type="formData.serviceAllocated ? 'primary' : 'info'" size="small">
              {{ formData.serviceAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">Ingress</span>
            <ElTag :type="formData.ingressesAllocated ? 'primary' : 'info'" size="small">
              {{ formData.ingressesAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">LoadBalancer</span>
            <ElTag :type="formData.loadbalancersAllocated ? 'primary' : 'info'" size="small">
              {{ formData.loadbalancersAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">NodePort</span>
            <ElTag :type="formData.nodeportsAllocated ? 'primary' : 'info'" size="small">
              {{ formData.nodeportsAllocated || '无限制' }}
            </ElTag>
          </div>
        </div>
      </div>

      <div class="object-group">
        <h4 class="group-title">配置与存储</h4>
        <div class="object-limits-grid">
          <div class="limit-item">
            <span class="limit-name">ConfigMap</span>
            <ElTag :type="formData.configmapAllocated ? 'primary' : 'info'" size="small">
              {{ formData.configmapAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">Secret</span>
            <ElTag :type="formData.secretAllocated ? 'primary' : 'info'" size="small">
              {{ formData.secretAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">PVC</span>
            <ElTag :type="formData.pvcAllocated ? 'primary' : 'info'" size="small">
              {{ formData.pvcAllocated || '无限制' }}
            </ElTag>
          </div>
          <div class="limit-item">
            <span class="limit-name">临时存储</span>
            <ElTag
              :type="
                formData.ephemeralStorageAllocated && formData.ephemeralStorageAllocated !== '0'
                  ? 'primary'
                  : 'info'
              "
              size="small"
            >
              {{
                formData.ephemeralStorageAllocated && formData.ephemeralStorageAllocated !== '0'
                  ? formatResourceDisplay(formData.ephemeralStorageAllocated, 'memory')
                  : '无限制'
              }}
            </ElTag>
          </div>
        </div>
      </div>
    </div>

    <!-- LimitRange 确认 -->
    <div class="confirm-section">
      <div class="section-title">
        <ElIcon><Setting /></ElIcon>
        限制策略配置
      </div>
      <ElTabs>
        <ElTabPane label="Pod 限制">
          <div class="limit-info-grid">
            <div class="limit-info">
              <span class="label">最大 CPU</span>
              <span class="value">{{ formatResourceDisplay(formData.podMaxCpu, 'cpu') }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最大内存</span>
              <span class="value">{{
                formatResourceDisplay(formData.podMaxMemory, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最大临时存储</span>
              <span class="value">{{
                formatResourceDisplay(formData.podMaxEphemeralStorage, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最小 CPU</span>
              <span class="value">{{ formatResourceDisplay(formData.podMinCpu, 'cpu') }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最小内存</span>
              <span class="value">{{
                formatResourceDisplay(formData.podMinMemory, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最小临时存储</span>
              <span class="value">{{
                formatResourceDisplay(formData.podMinEphemeralStorage, 'memory')
              }}</span>
            </div>
          </div>
        </ElTabPane>
        <ElTabPane label="容器限制">
          <div class="limit-info-grid">
            <div class="limit-info">
              <span class="label">最大 CPU</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerMaxCpu, 'cpu')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最大内存</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerMaxMemory, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最大临时存储</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerMaxEphemeralStorage, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最小 CPU</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerMinCpu, 'cpu')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最小内存</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerMinMemory, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">最小临时存储</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerMinEphemeralStorage, 'memory')
              }}</span>
            </div>
          </div>
        </ElTabPane>
        <ElTabPane label="默认值">
          <div class="limit-info-grid">
            <div class="limit-info">
              <span class="label">默认 CPU 限制</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerDefaultCpu, 'cpu')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">默认内存限制</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerDefaultMemory, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">默认临时存储限制</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerDefaultEphemeralStorage, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">默认 CPU 请求</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerDefaultRequestCpu, 'cpu')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">默认内存请求</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerDefaultRequestMemory, 'memory')
              }}</span>
            </div>
            <div class="limit-info">
              <span class="label">默认临时存储请求</span>
              <span class="value">{{
                formatResourceDisplay(formData.containerDefaultRequestEphemeralStorage, 'memory')
              }}</span>
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <!-- 重要提示 -->
    <ElAlert title="重要提示" type="warning" :closable="false" show-icon style="margin-top: 20px">
      <template #default>
        <ul style="margin: 0; padding-left: 20px">
          <li>命名空间创建后将无法修改，请仔细核对</li>
          <li>CPU 和内存配额为必填项，请确保已正确设置</li>
          <li>资源配额设置后可以修改，但不能小于已使用的资源量</li>
          <li>所有资源单位将按照您选择的单位提交到后端</li>
        </ul>
      </template>
    </ElAlert>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import {
    DocumentChecked,
    FolderOpened,
    Cpu,
    Files,
    Setting,
    Memo,
    VideoPlay
  } from '@element-plus/icons-vue'
  import type { ProjectCluster } from '@/api'
  import { formatResourceDisplay, parseCpu, parseMemory } from '@/utils/resource'

  interface Props {
    formData: Record<string, any>
    cluster: ProjectCluster | null
  }

  const props = defineProps<Props>()

  // 获取可用资源
  const getAvailableResource = (type: string) => {
    if (!props.cluster) return '-'

    const allocated = props.formData

    switch (type) {
      case 'cpu': {
        const clusterCpu = parseCpu(props.cluster.cpuCapacity).value
        const clusterAllocated = parseCpu(props.cluster.cpuAllocated).value
        const workspaceCpu = parseCpu(allocated.cpuAllocated).value
        const available = clusterCpu - clusterAllocated - workspaceCpu
        return formatResourceDisplay(available, 'cpu')
      }
      case 'memory': {
        const clusterMem = parseMemory(props.cluster.memCapacity).value
        const clusterAllocated = parseMemory(props.cluster.memAllocated).value
        const workspaceMem = parseMemory(allocated.memAllocated).value
        const available = clusterMem - clusterAllocated - workspaceMem
        return formatResourceDisplay(available + 'Gi', 'memory')
      }
      case 'storage': {
        const clusterStorage = parseMemory(props.cluster.storageLimit).value
        const clusterAllocated = parseMemory(props.cluster.storageAllocated).value
        const workspaceStorage = parseMemory(allocated.storageAllocated).value
        const available = clusterStorage - clusterAllocated - workspaceStorage
        return formatResourceDisplay(available + 'Gi', 'memory')
      }
      case 'gpu': {
        const available =
          props.cluster.gpuCapacity -
          props.cluster.gpuAllocated -
          (parseCpu(allocated.gpuAllocated).value || 0)
        return formatResourceDisplay(available, 'cpu')
      }
      default:
        return '-'
    }
  }
</script>

<style lang="scss" scoped>
  .confirmation-content {
    .confirmation-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;

      .el-icon {
        font-size: 24px;
      }
    }

    .confirm-section {
      margin-bottom: 24px;
      padding: 20px;
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f0f2f5;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .info-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 6px;

          &.full-width {
            grid-column: span 2;
          }

          .label {
            flex-shrink: 0;
            width: 120px;
            color: var(--el-text-color-secondary);
            font-size: 14px;
          }

          .value {
            flex: 1;
            color: var(--el-text-color-primary);
            font-weight: 500;
            word-break: break-word;

            &.code {
              font-family: 'Monaco', 'Menlo', monospace;
              background: #fff;
              padding: 2px 8px;
              border-radius: 4px;
              border: 1px solid #dcdfe6;
            }
          }
        }
      }

      .resource-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;

        .resource-summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;
          border: 1px solid #e4e7ed;

          .icon {
            font-size: 32px;
            padding: 8px;
            border-radius: 8px;

            &.cpu {
              color: #409eff;
              background: rgba(64, 158, 255, 0.1);
            }
            &.memory {
              color: #67c23a;
              background: rgba(103, 194, 58, 0.1);
            }
            &.storage {
              color: #e6a23c;
              background: rgba(230, 162, 60, 0.1);
            }
            &.gpu {
              color: #f56c6c;
              background: rgba(245, 108, 108, 0.1);
            }
          }

          .info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;

            .label {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }

            .value {
              font-size: 16px;
              font-weight: 600;
              color: var(--el-text-color-primary);
            }

            .available {
              font-size: 11px;
              color: var(--el-text-color-placeholder);
            }
          }
        }
      }

      .object-group {
        margin-bottom: 20px;
        padding: 16px;
        background: #f9f9f9;
        border-radius: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .group-title {
          margin: 0 0 12px;
          padding-left: 8px;
          border-left: 3px solid var(--el-color-primary);
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .object-limits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;

          .limit-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #ebeef5;

            .limit-name {
              flex: 1;
              font-size: 13px;
              color: var(--el-text-color-primary);
            }
          }
        }
      }

      .limit-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        padding-top: 12px;

        .limit-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 6px;

          .label {
            color: var(--el-text-color-secondary);
            font-size: 13px;
          }

          .value {
            color: var(--el-text-color-primary);
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', monospace;
          }
        }
      }
    }
  }
</style>
