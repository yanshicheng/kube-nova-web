<template>
  <div class="basic-info-tab">
    <ElRow :gutter="20">
      <ElCol :span="12">
        <div class="info-section">
          <h4 class="section-title"><ElIcon><InfoFilled /></ElIcon>基本信息</h4>
          <div class="info-grid">
            <div class="info-item"><span class="label">节点名称</span><span class="value">{{ nodeDetail.name || '-' }}</span></div>
            <div class="info-item"><span class="label">主机名</span><span class="value">{{ nodeDetail.hostname || '-' }}</span></div>
            <div class="info-item"><span class="label">节点 UUID</span><span class="value mono">{{ nodeDetail.nodeUuid || '-' }}</span></div>
            <div class="info-item"><span class="label">IP 地址</span><span class="value mono">{{ nodeDetail.nodeIp || '-' }}</span></div>
            <div class="info-item"><span class="label">节点角色</span><span class="value"><ElTag :type="getRoleType()" size="small">{{ nodeDetail.roles || '-' }}</ElTag></span></div>
            <div class="info-item"><span class="label">状态</span><span class="value"><ElTag :type="getStatusType()" size="small">{{ nodeDetail.status || '-' }}</ElTag></span></div>
            <div class="info-item"><span class="label">调度状态</span><span class="value"><ElTag :type="nodeDetail.unschedulable === 2 ? 'danger' : 'success'" size="small">{{ nodeDetail.unschedulable === 2 ? '禁止调度' : '允许调度' }}</ElTag></span></div>
            <div class="info-item"><span class="label">加入时间</span><span class="value">{{ formatTime(nodeDetail.joinAt) }}</span></div>
          </div>
        </div>
      </ElCol>
      <ElCol :span="12">
        <div class="info-section">
          <h4 class="section-title"><ElIcon><Platform /></ElIcon>系统信息</h4>
          <div class="info-grid">
            <div class="info-item"><span class="label">操作系统</span><span class="value">{{ nodeDetail.operatingSystem || '-' }}</span></div>
            <div class="info-item"><span class="label">系统镜像</span><span class="value">{{ nodeDetail.osImage || '-' }}</span></div>
            <div class="info-item"><span class="label">内核版本</span><span class="value mono">{{ nodeDetail.kernelVersion || '-' }}</span></div>
            <div class="info-item"><span class="label">架构</span><span class="value">{{ nodeDetail.architecture || '-' }}</span></div>
            <div class="info-item"><span class="label">容器运行时</span><span class="value mono">{{ nodeDetail.runtime || '-' }}</span></div>
            <div class="info-item"><span class="label">Kubelet 版本</span><span class="value mono">{{ nodeDetail.kubeletVersion || '-' }}</span></div>
            <div class="info-item"><span class="label">GPU 支持</span><span class="value"><ElTag :type="nodeDetail.isGpu === 1 ? 'success' : 'info'" size="small">{{ nodeDetail.isGpu === 1 ? '是' : '否' }}</ElTag></span></div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <ElRow :gutter="20" style="margin-top: 20px">
      <ElCol :span="12">
        <div class="info-section">
          <h4 class="section-title"><ElIcon><Cpu /></ElIcon>资源配置</h4>
          <div class="info-grid">
            <div class="info-item"><span class="label">CPU 核心数</span><span class="value">{{ nodeDetail.cpu || '-' }} 核</span></div>
            <div class="info-item"><span class="label">内存容量</span><span class="value">{{ formatMemory(nodeDetail.memory) }}</span></div>
            <div class="info-item"><span class="label">Pod 容量</span><span class="value">{{ nodeDetail.pods || '-' }} 个</span></div>
          </div>
        </div>
      </ElCol>
      <ElCol :span="12">
        <div class="info-section">
          <h4 class="section-title"><ElIcon><Connection /></ElIcon>网络信息</h4>
          <div class="info-grid">
            <div class="info-item"><span class="label">Pod CIDR</span><span class="value mono">{{ nodeDetail.podCidr || '-' }}</span></div>
            <div class="info-item"><span class="label">Pod CIDRs</span><span class="value mono">{{ nodeDetail.podCidrs || '-' }}</span></div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <div class="info-section" style="margin-top: 20px">
      <h4 class="section-title"><ElIcon><Clock /></ElIcon>时间信息</h4>
      <div class="info-grid">
        <div class="info-item"><span class="label">创建时间</span><span class="value">{{ formatTime(nodeDetail.createdAt) }}</span></div>
        <div class="info-item"><span class="label">更新时间</span><span class="value">{{ formatTime(nodeDetail.updatedAt) }}</span></div>
        <div class="info-item"><span class="label">创建人</span><span class="value">{{ nodeDetail.createdBy || '-' }}</span></div>
        <div class="info-item"><span class="label">更新人</span><span class="value">{{ nodeDetail.updatedBy || '-' }}</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InfoFilled, Platform, Cpu, Connection, Clock } from '@element-plus/icons-vue'
import type { ClusterNodeDetail } from '@/api/manager/node'

interface Props {
  nodeDetail: Partial<ClusterNodeDetail>
  nodeId: number
}

const props = defineProps<Props>()

const getRoleType = () => {
  const roles = props.nodeDetail.roles || ''
  return roles.includes('master') || roles.includes('control') ? 'danger' : 'info'
}

const getStatusType = () => {
  const types: Record<string, string> = { Ready: 'success', NotReady: 'danger', Unknown: 'warning' }
  return types[props.nodeDetail.status || 'Unknown'] || 'info'
}

const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

const formatMemory = (memory: number | undefined) => {
  if (!memory) return '-'
  if (memory >= 1024) return `${(memory / 1024).toFixed(2)} GB`
  return `${memory} MB`
}
</script>

<style lang="scss" scoped>
.basic-info-tab {
  .info-section {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 20px;
    height: 100%;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .el-icon { color: var(--el-color-primary); }
    }

    .info-grid {
      display: grid;
      gap: 12px;

      .info-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        .label {
          flex-shrink: 0;
          width: 100px;
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }

        .value {
          flex: 1;
          font-size: 13px;
          color: var(--el-text-color-primary);
          word-break: break-all;

          &.mono {
            font-family: 'SF Mono', Monaco, Consolas, monospace;
          }
        }
      }
    }
  }
}
</style>