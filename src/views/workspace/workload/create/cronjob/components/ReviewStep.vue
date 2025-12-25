<template>
  <div class="review-step">
    <div class="review-actions">
      <ElButton @click="activeView = 'summary'" :type="activeView === 'summary' ? 'primary' : ''">
        <FileText :size="16" />
        配置汇总
      </ElButton>
      <ElButton @click="activeView = 'yaml'" :type="activeView === 'yaml' ? 'primary' : ''">
        <Code :size="16" />
        YAML预览
      </ElButton>
    </div>

    <!-- 配置汇总视图 -->
    <div v-show="activeView === 'summary'" class="config-summary">
      <!-- 元数据信息 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Info :size="18" />
              <span>元数据配置</span>
            </div>
            <ElTag type="primary">必填</ElTag>
          </div>
        </template>
        <ElDescriptions :column="2" border size="default">
          <ElDescriptionsItem label="CronJob 名称" label-class-name="desc-label" :span="2">
            <ElTag type="primary" size="large" effect="dark">{{ cronJobName }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="中文名称" label-class-name="desc-label">
            <strong>{{ metadataStore.metadata.nameCn }}</strong>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="版本号" label-class-name="desc-label">
            <ElTag type="success">{{ metadataStore.metadata.version }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="命名空间" label-class-name="desc-label">
            <ElTag type="info">{{ metadataStore.namespace }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="英文名称" label-class-name="desc-label">
            {{ metadataStore.metadata.nameEn }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="描述信息" :span="2" label-class-name="desc-label">
            {{ metadataStore.metadata.desc || '无' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- CronJob 配置 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Calendar :size="18" />
              <span>CronJob 配置</span>
            </div>
            <ElTag type="primary">必填</ElTag>
          </div>
        </template>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="Cron 表达式" :span="2">
            <code style="font-size: 14px; font-weight: 600">{{ cronJobStore.schedule }}</code>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="执行频率" :span="2" v-if="cronDescription">
            <ElTag type="success" size="large">{{ cronDescription }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="时区" v-if="cronJobStore.timeZone">
            {{ cronJobStore.timeZone }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="并发策略">
            <ElTag :type="getConcurrencyTagType()">
              {{ getConcurrencyText() }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="cronJobStore.suspend ? 'warning' : 'success'">
              {{ cronJobStore.suspend ? '已暂停' : '运行中' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem
            label="启动截止时间"
            v-if="cronJobStore.startingDeadlineSeconds"
          >
            {{ cronJobStore.startingDeadlineSeconds }} 秒
          </ElDescriptionsItem>
          <ElDescriptionsItem label="成功任务历史">
            {{ cronJobStore.successfulJobsHistoryLimit }} 个
          </ElDescriptionsItem>
          <ElDescriptionsItem label="失败任务历史">
            {{ cronJobStore.failedJobsHistoryLimit }} 个
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title>⏰ 定时任务</template>
          将按照 Cron 表达式 <code>{{ cronJobStore.schedule }}</code>
          {{ cronDescription ? `（${cronDescription}）` : '' }}定期创建 Job
        </ElAlert>
      </ElCard>

      <!-- Job 模板配置 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <FileText :size="18" />
              <span>Job 模板配置</span>
            </div>
          </div>
        </template>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="完成次数">
            <ElTag type="primary" size="large" effect="dark">
              {{ cronJobStore.jobTemplate.completions }} 次
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="并行度">
            <ElTag type="primary" size="large" effect="dark">
              {{ cronJobStore.jobTemplate.parallelism }} 个
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="重试次数">
            {{ cronJobStore.jobTemplate.backoffLimit }} 次
          </ElDescriptionsItem>
          <ElDescriptionsItem label="完成模式">
            <ElTag>{{ cronJobStore.jobTemplate.completionMode }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem
            label="活动截止时间"
            v-if="cronJobStore.jobTemplate.activeDeadlineSeconds"
          >
            {{ cronJobStore.jobTemplate.activeDeadlineSeconds }} 秒
          </ElDescriptionsItem>
          <ElDescriptionsItem
            label="完成后保留时间"
            v-if="cronJobStore.jobTemplate.ttlSecondsAfterFinished !== undefined"
          >
            {{ cronJobStore.jobTemplate.ttlSecondsAfterFinished }} 秒
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElAlert type="success" :closable="false" show-icon style="margin-top: 16px">
          <template #title>✅ 每次执行</template>
          每个 Job 将创建 {{ cronJobStore.jobTemplate.completions }} 个成功的 Pod，每次最多运行
          {{ cronJobStore.jobTemplate.parallelism }} 个并行 Pod
        </ElAlert>
      </ElCard>

      <!-- 容器信息 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Box :size="18" />
              <span>容器配置 ({{ containerCount }} 个)</span>
            </div>
            <ElTag type="primary">必填</ElTag>
          </div>
        </template>

        <!-- 初始化容器 -->
        <div v-if="containersStore.initContainers.length > 0" class="container-section">
          <div class="section-title">
            <Package :size="16" />
            <span>初始化容器</span>
            <ElBadge :value="containersStore.initContainers.length" type="info" />
          </div>
          <div class="containers-grid">
            <div
              v-for="container in containersStore.initContainers"
              :key="container.id"
              class="container-card"
            >
              <div class="container-header">
                <strong>{{ container.name }}</strong>
                <ElTag size="small" type="info">Init</ElTag>
              </div>
              <div class="container-details">
                <div class="detail-row">
                  <label>镜像:</label>
                  <span class="detail-value">{{ container.image || '未配置' }}</span>
                </div>
                <div class="detail-row" v-if="container.resources">
                  <label>资源:</label>
                  <span class="detail-value">
                    CPU: {{ container.resources?.requests?.cpu || '-' }} /
                    {{ container.resources?.limits?.cpu || '-' }}
                    <br />
                    内存: {{ container.resources?.requests?.memory || '-' }} /
                    {{ container.resources?.limits?.memory || '-' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主容器 -->
        <div
          class="container-section"
          :style="containersStore.initContainers.length > 0 ? 'margin-top: 24px' : ''"
        >
          <div class="section-title">
            <Box :size="16" />
            <span>主容器</span>
            <ElBadge :value="containersStore.mainContainers.length" type="success" />
          </div>
          <div class="containers-grid">
            <div
              v-for="container in containersStore.mainContainers"
              :key="container.id"
              class="container-card"
            >
              <div class="container-header">
                <strong>{{ container.name }}</strong>
                <ElTag size="small" type="success">Main</ElTag>
              </div>
              <div class="container-details">
                <div class="detail-row">
                  <label>镜像:</label>
                  <span class="detail-value">{{ container.image || '未配置' }}</span>
                </div>
                <div class="detail-row" v-if="container.ports && container.ports.length > 0">
                  <label>端口:</label>
                  <span class="detail-value">
                    {{ container.ports.map((p) => p.containerPort).join(', ') }}
                  </span>
                </div>
                <div class="detail-row" v-if="container.resources">
                  <label>资源:</label>
                  <span class="detail-value">
                    CPU: {{ container.resources?.requests?.cpu || '-' }} /
                    {{ container.resources?.limits?.cpu || '-' }}
                    <br />
                    内存: {{ container.resources?.requests?.memory || '-' }} /
                    {{ container.resources?.limits?.memory || '-' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElCard>

      <!-- 存储卷信息 -->
      <ElCard v-if="hasVolumes" class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <HardDrive :size="18" />
              <span>存储配置</span>
            </div>
          </div>
        </template>

        <div>
          <div class="storage-section-title">存储卷 ({{ volumeCount }} 个)</div>
          <ElTable :data="volumesStore.volumes" size="default" stripe>
            <ElTableColumn prop="name" label="卷名称" width="200" />
            <ElTableColumn label="卷类型" width="150">
              <template #default="{ row }">
                <ElTag type="primary">{{ getVolumeType(row) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="配置详情" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getVolumeConfig(row) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElCard>

      <!-- 预估资源使用 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Cpu :size="18" />
              <span>预估资源使用（单个 Pod）</span>
            </div>
          </div>
        </template>
        <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          基于容器资源配置计算的单个 Pod 资源使用量
        </ElAlert>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="CPU 请求">
            <ElTag type="primary" size="large">{{ cpuRequest }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="CPU 限制">
            <ElTag type="danger" size="large">{{ cpuLimit }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="内存请求">
            <ElTag type="primary" size="large">{{ memoryRequest }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="内存限制">
            <ElTag type="danger" size="large">{{ memoryLimit }}</ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>
    </div>

    <!-- YAML 预览视图 -->
    <div v-show="activeView === 'yaml'" class="yaml-preview">
      <ElCard>
        <template #header>
          <div class="yaml-header">
            <div class="header-left">
              <FileCode :size="18" />
              <span>完整 YAML 配置</span>
            </div>
            <ElButton size="small" @click="copyYaml" :icon="Copy">复制</ElButton>
          </div>
        </template>
        <pre class="yaml-content">{{ yamlPreview }}</pre>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  FileText,
  Code,
  Info,
  Copy,
  Box,
  HardDrive,
  Package,
  FileCode,
  Cpu,
  Calendar
} from 'lucide-vue-next'
import yaml from 'js-yaml'
import type { V1Volume } from '@kubernetes/client-node'

// 导入 Store
import { useMetadataStore, useContainersStore, useVolumesStore } from '@/store/workload'
import { useCronJobStore } from '@/store/workload/cronjob'

// Props
interface Props {
  mode?: string
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  validate: [result: { valid: boolean; errors: string[]; warnings: string[] }]
}>()

// Store
const metadataStore = useMetadataStore()
const containersStore = useContainersStore()
const volumesStore = useVolumesStore()
const cronJobStore = useCronJobStore()

// 状态
const activeView = ref<'summary' | 'yaml'>('summary')

// CronJob 名称
const cronJobName = computed(() => {
  return `${metadataStore.metadata.nameEn}-${metadataStore.metadata.version}`
})

// 容器数量
const containerCount = computed(() => {
  return containersStore.initContainers.length + containersStore.mainContainers.length
})

// 存储卷数量
const volumeCount = computed(() => {
  return volumesStore.volumes.length
})

// 是否有存储卷
const hasVolumes = computed(() => {
  return volumeCount.value > 0
})

// 解析 Cron 表达式描述
const cronDescription = computed(() => {
  const expr = cronJobStore.schedule
  if (!expr || !expr.trim()) return ''

  const parts = expr.trim().split(/\s+/)
  if (parts.length < 5) return ''

  try {
    const [minute, hour, day, month, weekday] = parts

    if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      return '每分钟'
    }
    if (minute === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      return '每小时'
    }
    if (hour !== '*' && day === '*' && month === '*' && weekday === '*') {
      return `每天 ${hour}:${minute.padStart(2, '0')}`
    }
    if (minute.startsWith('*/')) {
      const interval = minute.substring(2)
      return `每 ${interval} 分钟`
    }
    if (hour.startsWith('*/')) {
      const interval = hour.substring(2)
      return `每 ${interval} 小时`
    }
    return '自定义调度'
  } catch {
    return ''
  }
})

// 获取并发策略标签类型
function getConcurrencyTagType() {
  switch (cronJobStore.concurrencyPolicy) {
    case 'Allow':
      return 'success'
    case 'Forbid':
      return 'warning'
    case 'Replace':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取并发策略文本
function getConcurrencyText() {
  switch (cronJobStore.concurrencyPolicy) {
    case 'Allow':
      return '允许并发'
    case 'Forbid':
      return '禁止并发'
    case 'Replace':
      return '替换运行'
    default:
      return cronJobStore.concurrencyPolicy
  }
}

// 卷类型映射
const volumeTypeMap: Record<string, string> = {
  emptyDir: 'EmptyDir',
  persistentVolumeClaim: 'PVC',
  hostPath: 'HostPath',
  configMap: 'ConfigMap',
  secret: 'Secret',
  nfs: 'NFS'
}

// 获取存储卷类型
function getVolumeType(volume: V1Volume): string {
  for (const [key, label] of Object.entries(volumeTypeMap)) {
    if (volume[key as keyof V1Volume]) return label
  }
  return '其他'
}

// 获取存储卷配置
function getVolumeConfig(volume: V1Volume): string {
  if (volume.emptyDir) {
    const medium = volume.emptyDir.medium || '磁盘'
    const sizeLimit = volume.emptyDir.sizeLimit || '无限制'
    return `介质: ${medium}, 大小限制: ${sizeLimit}`
  }
  if (volume.persistentVolumeClaim) {
    return `Claim: ${volume.persistentVolumeClaim.claimName}${volume.persistentVolumeClaim.readOnly ? ' (只读)' : ''}`
  }
  if (volume.hostPath) {
    return `主机路径: ${volume.hostPath.path}`
  }
  if (volume.configMap) {
    return `ConfigMap: ${volume.configMap.name}`
  }
  if (volume.secret) {
    return `Secret: ${volume.secret.secretName}`
  }
  if (volume.nfs) {
    return `NFS: ${volume.nfs.server}:${volume.nfs.path}`
  }
  return '-'
}

// 计算资源
const calculateResources = (field: string) => {
  const containers = [...containersStore.mainContainers, ...containersStore.initContainers]
  let total = 0

  containers.forEach((container) => {
    const value =
      field === 'cpu-request'
        ? container.resources?.requests?.cpu
        : field === 'cpu-limit'
          ? container.resources?.limits?.cpu
          : field === 'memory-request'
            ? container.resources?.requests?.memory
            : container.resources?.limits?.memory

    if (value) {
      if (typeof value === 'string') {
        if (field.startsWith('cpu')) {
          if (value.endsWith('m')) {
            total += parseFloat(value) / 1000
          } else {
            total += parseFloat(value)
          }
        } else {
          if (value.endsWith('Mi')) {
            total += parseFloat(value)
          } else if (value.endsWith('Gi')) {
            total += parseFloat(value) * 1024
          } else if (value.endsWith('Ki')) {
            total += parseFloat(value) / 1024
          }
        }
      }
    }
  })

  return total
}

const cpuRequest = computed(() => {
  const total = calculateResources('cpu-request')
  return total > 0 ? `${total.toFixed(2)} Core` : '-'
})

const cpuLimit = computed(() => {
  const total = calculateResources('cpu-limit')
  return total > 0 ? `${total.toFixed(2)} Core` : '-'
})

const memoryRequest = computed(() => {
  const total = calculateResources('memory-request')
  return total > 0 ? `${total.toFixed(0)} Mi` : '-'
})

const memoryLimit = computed(() => {
  const total = calculateResources('memory-limit')
  return total > 0 ? `${total.toFixed(0)} Mi` : '-'
})

// YAML 预览
const yamlPreview = computed(() => {
  try {
    const cronJob = {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      metadata: {
        name: cronJobName.value,
        namespace: metadataStore.namespace
      },
      spec: {
        schedule: cronJobStore.schedule,
        concurrencyPolicy: cronJobStore.concurrencyPolicy
      }
    }

    return yaml.dump(cronJob, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    })
  } catch (error) {
    return '# YAML 生成失败'
  }
})

// 复制 YAML
const copyYaml = async () => {
  try {
    await navigator.clipboard.writeText(yamlPreview.value)
    ElMessage.success('YAML 已复制到剪贴板')
  } catch (error) {
  }
}

// 验证
function validate() {
  const errors: string[] = []
  const warnings: string[] = []

  if (!metadataStore.metadata.nameCn) {
    errors.push('缺少中文名称')
  }
  if (!metadataStore.metadata.nameEn) {
    errors.push('缺少英文名称')
  }
  if (!metadataStore.metadata.version) {
    errors.push('缺少版本号')
  }
  if (!cronJobStore.schedule) {
    errors.push('缺少 Cron 表达式')
  }
  if (containersStore.mainContainers.length === 0) {
    errors.push('至少需要一个主容器')
  }

  if (!metadataStore.metadata.desc) {
    warnings.push('建议填写描述信息')
  }

  emit('validate', {
    valid: errors.length === 0,
    errors,
    warnings
  })

  return errors.length === 0
}

// 挂载时验证
onMounted(() => {
  validate()
})

// 导出
defineExpose({
  validate
})
</script>

<style lang="scss" scoped>
.review-step {
  .review-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .el-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  }

  .config-summary {
    .summary-card {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 16px;
        }
      }

      ::v-deep(.desc-label) {
        font-weight: 500;
        background: #fafafa;
      }

      .storage-section-title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #303133;
      }

      code {
        padding: 2px 6px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      }
    }

    .container-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .containers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;

        .container-card {
          background: #f5f7fa;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          padding: 16px;

          .container-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e4e7ed;
          }

          .container-details {
            .detail-row {
              display: flex;
              margin-bottom: 8px;
              font-size: 13px;

              &:last-child {
                margin-bottom: 0;
              }

              label {
                min-width: 70px;
                color: #909399;
                font-weight: 500;
              }

              .detail-value {
                flex: 1;
                color: #606266;
                word-break: break-all;
                line-height: 1.5;
              }
            }
          }
        }
      }
    }
  }

  .yaml-preview {
    .yaml-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
      }
    }

    .yaml-content {
      margin: 0;
      padding: 16px;
      background: #282c34;
      color: #abb2bf;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
      max-height: 600px;
    }
  }
}
</style>