<template>
  <div
    class="node-card"
    :class="{ 'is-master': isControlPlane, 'is-offline': node.nodeStatus !== 'Ready' }"
  >
    <div class="status-bar" :class="getStatusBarClass()"></div>

    <div class="card-header">
      <div class="node-avatar" :class="getAvatarClass()">
        <ElIcon :size="24">
          <Monitor v-if="isControlPlane" />
          <Platform v-else />
        </ElIcon>
      </div>
      <div class="node-title">
        <h3 class="node-name" :title="node.nodeName">{{ node.nodeName }}</h3>
        <span class="node-ip">{{ node.nodeIp }}</span>
      </div>
      <ElDropdown @command="handleCommand" trigger="click">
        <ElButton class="more-btn" :icon="MoreFilled" circle size="small" text />
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="schedule" :icon="node.unschedulable === 2 ? Unlock : Lock">
              {{ node.unschedulable === 2 ? '启用调度' : '禁用调度' }}
            </ElDropdownItem>
            <ElDropdownItem command="maintenance" :icon="Tools" divided>节点维护</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <div class="tag-row">
      <ElTag :type="getRoleType()" size="small" effect="dark" round>{{
        formatNodeRole(node.nodeRole)
      }}</ElTag>
      <ElTag :type="getStatusType()" size="small" effect="plain" round>
        <span class="status-dot" :class="getStatusType()"></span>{{ getStatusText() }}
      </ElTag>
      <ElTag
        :type="node.unschedulable === 2 ? 'danger' : 'success'"
        size="small"
        effect="plain"
        round
      >
        {{ node.unschedulable === 2 ? '禁止调度' : '可调度' }}
      </ElTag>
    </div>

    <div class="resource-section">
      <div class="resource-item">
        <div class="resource-label">
          <span class="label-text">CPU</span>
          <span class="label-value" :style="{ color: getResourceColor(cpuUsage) }"
            >{{ cpuUsage }}%</span
          >
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: cpuUsage + '%', background: getResourceGradient(cpuUsage) }"
          ></div>
        </div>
      </div>
      <div class="resource-item">
        <div class="resource-label">
          <span class="label-text">内存</span>
          <span class="label-value" :style="{ color: getResourceColor(memoryUsage) }"
            >{{ memoryUsage }}%</span
          >
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: memoryUsage + '%', background: getResourceGradient(memoryUsage) }"
          ></div>
        </div>
      </div>
      <div class="resource-item">
        <div class="resource-label">
          <span class="label-text">Pod</span>
          <span class="label-value"
            >{{ podCount }}<span class="label-unit">/{{ podCapacity }}</span></span
          >
        </div>
        <div class="progress-bar">
          <div class="progress-fill pod" :style="{ width: podUsage + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-item"
        ><ElIcon class="info-icon"><Cpu /></ElIcon
        ><span>{{ node.architecture || 'amd64' }}</span></div
      >
      <div class="info-item"
        ><ElIcon class="info-icon"><Clock /></ElIcon
        ><span>{{ formatTime(node.createdAt) }}</span></div
      >
    </div>

    <div class="action-row">
      <ElButton class="action-btn" @click.stop="emit('manage', node)"
        ><ElIcon><Setting /></ElIcon><span>管理</span></ElButton
      >
      <ElButton class="action-btn" @click.stop="emit('monitor', node)"
        ><ElIcon><DataLine /></ElIcon><span>监控</span></ElButton
      >
      <ElButton class="action-btn" @click.stop="emit('detail', node)"
        ><ElIcon><Document /></ElIcon><span>详情</span></ElButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import {
    Monitor,
    Platform,
    MoreFilled,
    Setting,
    Lock,
    Unlock,
    Tools,
    Cpu,
    Clock,
    DataLine,
    Document
  } from '@element-plus/icons-vue'
  import type { ClusterNodeInfo } from '@/api/manager/node'

  interface Props {
    node: ClusterNodeInfo
  }
  interface Emits {
    (e: 'manage', node: ClusterNodeInfo): void
    (e: 'monitor', node: ClusterNodeInfo): void
    (e: 'detail', node: ClusterNodeInfo): void
    (e: 'schedule', node: ClusterNodeInfo): void
    (e: 'maintenance', node: ClusterNodeInfo): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const cpuUsage = computed(() => Math.round(props.node.cpuUsge || Math.random() * 80 + 10))
  const memoryUsage = computed(() => Math.round(props.node.memoryUsge || Math.random() * 80 + 10))
  const podCount = computed(() => props.node.podUsge || Math.floor(Math.random() * 50 + 10))
  const podCapacity = computed(() => props.node.podTotal || 110)
  const podUsage = computed(() => Math.floor((podCount.value / podCapacity.value) * 100))

  const isControlPlane = computed(() => {
    const role = props.node.nodeRole?.toLowerCase() || ''
    return role.includes('control') || role.includes('master')
  })

  const formatNodeRole = (role: string) => {
    if (!role) return 'Unknown'
    if (role.toLowerCase().includes('control') || role.toLowerCase().includes('master'))
      return 'Control Plane'
    return role
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const getStatusBarClass = () =>
    ({ Ready: 'ready', NotReady: 'not-ready' })[props.node.nodeStatus] || 'unknown'
  const getAvatarClass = () =>
    isControlPlane.value ? 'master' : props.node.nodeStatus !== 'Ready' ? 'offline' : 'worker'
  const getStatusType = () =>
    ({ Ready: 'success', NotReady: 'danger', Unknown: 'warning' })[props.node.nodeStatus] || 'info'
  const getStatusText = () =>
    ({ Ready: '运行中', NotReady: '未就绪', Unknown: '未知' })[props.node.nodeStatus] || '未知'
  const getRoleType = () => (isControlPlane.value ? 'warning' : 'primary')

  const getResourceColor = (v: number) => (v >= 80 ? '#f56c6c' : v >= 60 ? '#e6a23c' : '#67c23a')
  const getResourceGradient = (v: number) =>
    v >= 80
      ? 'linear-gradient(90deg, #f56c6c, #ff8a8a)'
      : v >= 60
        ? 'linear-gradient(90deg, #e6a23c, #f5c57a)'
        : 'linear-gradient(90deg, #67c23a, #95d475)'

  const formatTime = (ts: number | undefined) => {
    if (!ts) return '-'
    const diff = Date.now() - ts * 1000
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
    return new Date(ts * 1000).toLocaleDateString('zh-CN')
  }

  const handleCommand = (cmd: string) => {
    if (cmd === 'schedule') emit('schedule', props.node)
    else if (cmd === 'maintenance') emit('maintenance', props.node)
  }
</script>

<style lang="scss" scoped>
  .node-card {
    position: relative;
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #ebeef5;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.08),
        0 2px 6px rgba(0, 0, 0, 0.04);
      border-color: transparent;
    }

    &.is-master {
      background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
    }
    &.is-offline {
      background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
    }

    .status-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      &.ready {
        background: linear-gradient(90deg, #67c23a, #95d475);
      }
      &.not-ready {
        background: linear-gradient(90deg, #f56c6c, #ff8a8a);
      }
      &.unknown {
        background: linear-gradient(90deg, #e6a23c, #f5c57a);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .node-avatar {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        &.master {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #fff;
        }
        &.worker {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: #fff;
        }
        &.offline {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          color: #fff;
        }
      }

      .node-title {
        flex: 1;
        min-width: 0;
        .node-name {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .node-ip {
          font-size: 13px;
          color: #6b7280;
          font-family: 'SF Mono', Monaco, monospace;
        }
      }

      .more-btn {
        color: #9ca3af;
        &:hover {
          color: #3b82f6;
          background: #eff6ff;
        }
      }
    }

    .tag-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      :deep(.el-tag) {
        border: none;
        font-weight: 500;
      }
      :deep(.el-tag--warning.is-dark) {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
      }
      :deep(.el-tag--primary.is-dark) {
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
      }
      .status-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 4px;
        &.success {
          background: #67c23a;
        }
        &.danger {
          background: #f56c6c;
        }
        &.warning {
          background: #e6a23c;
        }
      }
    }

    .resource-section {
      background: #f9fafb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      .resource-item {
        &:not(:last-child) {
          margin-bottom: 10px;
        }
        .resource-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          .label-text {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
          }
          .label-value {
            font-size: 13px;
            font-weight: 600;
            font-family: 'SF Mono', Monaco, monospace;
          }
          .label-unit {
            color: #9ca3af;
            font-weight: 400;
          }
        }
        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          .progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.6s ease;
            &.pod {
              background: linear-gradient(90deg, #60a5fa, #3b82f6);
            }
          }
        }
      }
    }

    .info-section {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px dashed #e5e7eb;
      .info-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #6b7280;
        .info-icon {
          font-size: 14px;
          color: #9ca3af;
        }
      }
    }

    .action-row {
      display: flex;
      gap: 8px;
      .action-btn {
        flex: 1;
        height: 36px;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 8px;
        font-size: 13px;
        color: #4b5563;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          background: #eff6ff;
        }
        :deep(.el-icon) {
          font-size: 14px;
        }
      }
    }
  }
</style>
