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
          <ElDescriptionsItem label="Deployment 名称" label-class-name="desc-label" :span="2">
            <ElTag type="primary" size="large" effect="dark">{{ deploymentName }}</ElTag>
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
          <ElDescriptionsItem label="自定义标签" :span="2" label-class-name="desc-label">
            <template v-if="hasCustomLabels">
              <ElTag
                v-for="(value, key) in metadataStore.metadata.labels"
                :key="key"
                class="label-tag"
                type="info"
              >
                {{ key }}={{ value }}
              </ElTag>
            </template>
            <span v-else class="empty-text">无</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="自定义注解" :span="2" label-class-name="desc-label">
            <template v-if="hasCustomAnnotations">
              <ElTag
                v-for="(value, key) in metadataStore.metadata.annotations"
                :key="key"
                class="label-tag"
              >
                {{ key }}={{ value }}
              </ElTag>
            </template>
            <span v-else class="empty-text">无</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- 副本配置 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Copy :size="18" />
              <span>副本配置</span>
            </div>
            <ElTag type="primary">必填</ElTag>
          </div>
        </template>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="副本数">
            <ElTag type="primary" size="large" effect="dark">
              {{ deploymentStore.replicas }} 个
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新策略">
            <ElTag :type="strategyType === 'RollingUpdate' ? 'success' : 'warning'">
              {{ strategyType }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="strategyType === 'RollingUpdate'" label="最大不可用">
            {{ deploymentStore.strategy.rollingUpdate?.maxUnavailable || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="strategyType === 'RollingUpdate'" label="最大超出">
            {{ deploymentStore.strategy.rollingUpdate?.maxSurge || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="保留历史版本">
            {{ deploymentStore.revisionHistoryLimit }} 个
          </ElDescriptionsItem>
          <ElDescriptionsItem label="进度截止时间">
            {{ deploymentStore.progressDeadlineSeconds }} 秒
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最小就绪秒数">
            {{ deploymentStore.minReadySeconds }} 秒
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElAlert
          v-if="deploymentStore.replicas && deploymentStore.replicas > 1"
          type="success"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <template #title>✅ 高可用部署</template>
          当前配置 {{ deploymentStore.replicas }} 个副本，可以提供服务高可用性和负载均衡能力
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
                <div class="detail-row" v-if="container.env && container.env.length > 0">
                  <label>环境变量:</label>
                  <span class="detail-value">{{ container.env.length }} 个</span>
                </div>
                <div
                  class="detail-row"
                  v-if="container.volumeMounts && container.volumeMounts.length > 0"
                >
                  <label>卷挂载:</label>
                  <span class="detail-value">{{ container.volumeMounts.length }} 个</span>
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
              <span>存储配置 ({{ volumeCount }} 个)</span>
            </div>
          </div>
        </template>
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
      </ElCard>

      <!-- 调度策略 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <GitBranch :size="18" />
              <span>调度策略</span>
            </div>
          </div>
        </template>
        <ElDescriptions :column="1" border size="default">
          <ElDescriptionsItem label="节点调度方式" label-class-name="desc-label">
            <ElTag v-if="schedulingStore.nodeSchedulingMode === 'auto'" type="success">
              自动调度
            </ElTag>
            <ElTag v-else-if="schedulingStore.nodeSchedulingMode === 'nodeName'" type="warning">
              指定节点: {{ schedulingStore.nodeName }}
            </ElTag>
            <ElTag v-else-if="schedulingStore.nodeSchedulingMode === 'nodeSelector'" type="info">
              标签选择:
              <span v-for="(value, key) in schedulingStore.nodeSelector" :key="key">
                {{ key }}={{ value }};
              </span>
            </ElTag>
          </ElDescriptionsItem>

          <ElDescriptionsItem
            label="节点亲和性"
            label-class-name="desc-label"
            v-if="hasNodeAffinity"
          >
            <div v-if="schedulingStore.affinity?.nodeAffinity">
              <ElTag
                v-if="
                  schedulingStore.affinity.nodeAffinity
                    .requiredDuringSchedulingIgnoredDuringExecution
                "
                type="danger"
              >
                必须满足条件:
                {{
                  schedulingStore.affinity.nodeAffinity
                    .requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms?.length || 0
                }}
                个
              </ElTag>
              <ElTag
                v-if="
                  schedulingStore.affinity.nodeAffinity
                    .preferredDuringSchedulingIgnoredDuringExecution
                "
                type="success"
              >
                优先满足条件:
                {{
                  schedulingStore.affinity.nodeAffinity
                    .preferredDuringSchedulingIgnoredDuringExecution?.length || 0
                }}
                个
              </ElTag>
            </div>
          </ElDescriptionsItem>

          <ElDescriptionsItem
            label="Pod 亲和性"
            label-class-name="desc-label"
            v-if="hasPodAffinity"
          >
            <ElTag type="success">已配置</ElTag>
          </ElDescriptionsItem>

          <ElDescriptionsItem
            label="Pod 反亲和性"
            label-class-name="desc-label"
            v-if="hasPodAntiAffinity"
          >
            <ElTag type="warning">已配置</ElTag>
          </ElDescriptionsItem>

          <ElDescriptionsItem
            label="污点容忍"
            label-class-name="desc-label"
            v-if="schedulingStore.tolerations.length > 0"
          >
            <ElBadge :value="schedulingStore.tolerations.length" type="info">
              <span>已配置容忍规则</span>
            </ElBadge>
          </ElDescriptionsItem>

          <ElDescriptionsItem
            label="拓扑约束"
            label-class-name="desc-label"
            v-if="schedulingStore.topologySpreadConstraints.length > 0"
          >
            <ElBadge :value="schedulingStore.topologySpreadConstraints.length" type="primary">
              <span>已配置拓扑约束</span>
            </ElBadge>
          </ElDescriptionsItem>

          <ElDescriptionsItem
            label="配置状态"
            label-class-name="desc-label"
            v-if="!hasAnySchedulingConfig"
          >
            <span class="empty-text">未配置任何调度策略，将使用集群默认调度</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- 高级配置 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Settings :size="18" />
              <span>高级配置</span>
            </div>
          </div>
        </template>
        <ElDescriptions :column="2" border size="default">
          <ElDescriptionsItem label="主机网络" label-class-name="desc-label">
            <ElTag :type="advancedStore.networkConfig.hostNetwork ? 'danger' : 'info'">
              {{ advancedStore.networkConfig.hostNetwork ? '已启用' : '未启用' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="DNS策略" label-class-name="desc-label">
            <ElTag type="info">{{ advancedStore.dnsPolicy }}</ElTag>
          </ElDescriptionsItem>

          <ElDescriptionsItem label="重启策略" label-class-name="desc-label">
            <ElTag type="primary">{{ advancedStore.restartPolicy }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="终止宽限期" label-class-name="desc-label">
            {{ advancedStore.terminationGracePeriodSeconds }} 秒
          </ElDescriptionsItem>

          <ElDescriptionsItem label="服务账户" label-class-name="desc-label" :span="2">
            {{ advancedStore.serviceAccountName || '默认' }}
          </ElDescriptionsItem>

          <ElDescriptionsItem
            label="其他配置"
            label-class-name="desc-label"
            :span="2"
            v-if="hasOtherAdvancedConfig"
          >
            <div class="config-tags">
              <ElTag v-if="advancedStore.networkConfig.hostPID" type="warning" size="small">
                主机PID
              </ElTag>
              <ElTag v-if="advancedStore.networkConfig.hostIPC" type="warning" size="small">
                主机IPC
              </ElTag>
              <ElTag
                v-if="advancedStore.networkConfig.shareProcessNamespace"
                type="info"
                size="small"
              >
                共享进程命名空间
              </ElTag>
              <ElTag v-if="advancedStore.priorityClassName" type="primary" size="small">
                优先级类: {{ advancedStore.priorityClassName }}
              </ElTag>
              <ElTag v-if="advancedStore.runtimeClassName" type="primary" size="small">
                运行时类: {{ advancedStore.runtimeClassName }}
              </ElTag>
            </div>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- 预估资源使用 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Cpu :size="18" />
              <span>预估资源使用（总计）</span>
            </div>
          </div>
        </template>
        <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          基于副本数 ({{ deploymentStore.replicas }}) 和容器资源配置计算的总资源使用量
        </ElAlert>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="总 CPU 请求">
            <ElTag type="primary" size="large">{{ totalCpuRequest }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="总 CPU 限制">
            <ElTag type="danger" size="large">{{ totalCpuLimit }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="总内存请求">
            <ElTag type="primary" size="large">{{ totalMemoryRequest }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="总内存限制">
            <ElTag type="danger" size="large">{{ totalMemoryLimit }}</ElTag>
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
    GitBranch,
    Settings,
    Package,
    FileCode,
    Cpu
  } from 'lucide-vue-next'
  import yaml from 'js-yaml'
  import type { V1Volume } from '@kubernetes/client-node'

  // 导入 Store
  import {
    useMetadataStore,
    useContainersStore,
    useVolumesStore,
    useSchedulingStore,
    useAdvancedStore
  } from '@/store/workload'
  import { useDeploymentStore } from '@/store/workload/deployment'

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
  const schedulingStore = useSchedulingStore()
  const advancedStore = useAdvancedStore()
  const deploymentStore = useDeploymentStore()

  // 状态
  const activeView = ref<'summary' | 'yaml'>('summary')
  const validationWarnings = ref<string[]>([])

  // Deployment 名称
  const deploymentName = computed(() => {
    return `${metadataStore.metadata.nameEn}-${metadataStore.metadata.version}`
  })

  // 更新策略类型
  const strategyType = computed(() => {
    return deploymentStore.strategy.type || 'RollingUpdate'
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

  // 计算属性
  const hasCustomLabels = computed(() => {
    return Object.keys(metadataStore.metadata.labels).length > 0
  })

  const hasCustomAnnotations = computed(() => {
    return Object.keys(metadataStore.metadata.annotations).length > 0
  })

  const hasNodeAffinity = computed(() => {
    return !!schedulingStore.affinity?.nodeAffinity
  })

  const hasPodAffinity = computed(() => {
    return !!schedulingStore.affinity?.podAffinity
  })

  const hasPodAntiAffinity = computed(() => {
    return !!schedulingStore.affinity?.podAntiAffinity
  })

  const hasAnySchedulingConfig = computed(() => {
    return (
      schedulingStore.nodeSchedulingMode !== 'auto' ||
      hasNodeAffinity.value ||
      hasPodAffinity.value ||
      hasPodAntiAffinity.value ||
      schedulingStore.tolerations.length > 0 ||
      schedulingStore.topologySpreadConstraints.length > 0
    )
  })

  const hasOtherAdvancedConfig = computed(() => {
    return (
      advancedStore.networkConfig.hostPID ||
      advancedStore.networkConfig.hostIPC ||
      advancedStore.networkConfig.shareProcessNamespace ||
      advancedStore.priorityClassName ||
      advancedStore.runtimeClassName
    )
  })

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
      return `主机路径: ${volume.hostPath.path}, 类型: ${volume.hostPath.type || '默认'}`
    }
    if (volume.configMap) {
      return `ConfigMap: ${volume.configMap.name}`
    }
    if (volume.secret) {
      return `Secret: ${volume.secret.secretName}`
    }
    if (volume.nfs) {
      return `NFS服务器: ${volume.nfs.server}, 路径: ${volume.nfs.path}`
    }
    return '-'
  }

  // 计算总资源
  const calculateTotalResources = (field: string) => {
    const replicas = deploymentStore.replicas || 1
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

    return total * replicas
  }

  const totalCpuRequest = computed(() => {
    const total = calculateTotalResources('cpu-request')
    return total > 0 ? `${total.toFixed(2)} Core` : '-'
  })

  const totalCpuLimit = computed(() => {
    const total = calculateTotalResources('cpu-limit')
    return total > 0 ? `${total.toFixed(2)} Core` : '-'
  })

  const totalMemoryRequest = computed(() => {
    const total = calculateTotalResources('memory-request')
    return total > 0 ? `${total.toFixed(0)} Mi` : '-'
  })

  const totalMemoryLimit = computed(() => {
    const total = calculateTotalResources('memory-limit')
    return total > 0 ? `${total.toFixed(0)} Mi` : '-'
  })

  // YAML 预览
  const yamlPreview = computed(() => {
    try {
      // 这里需要调用主页面的 generateDeploymentObject 方法
      // 暂时返回空对象，实际应该从父组件获取
      const deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: deploymentName.value,
          namespace: metadataStore.namespace
        },
        spec: {
          replicas: deploymentStore.replicas
        }
      }

      return yaml.dump(deployment, {
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

    if (containersStore.mainContainers.length === 0) {
      errors.push('至少需要一个主容器')
    }

    if (!metadataStore.metadata.desc) {
      warnings.push('建议填写描述信息，便于后续管理')
    }

    if (volumesStore.volumes.length === 0) {
      warnings.push('未配置存储卷，Pod 数据将不会持久化')
    }

    if (schedulingStore.nodeSchedulingMode === 'auto' && !hasAnySchedulingConfig.value) {
      warnings.push('未配置任何调度策略，Pod 将由 Kubernetes 默认调度器分配节点')
    }

    if (advancedStore.networkConfig.hostNetwork) {
      warnings.push('已启用主机网络，可能存在安全风险')
    }

    if (advancedStore.networkConfig.hostPID || advancedStore.networkConfig.hostIPC) {
      warnings.push('已启用主机 PID/IPC 命名空间，存在安全风险')
    }

    validationWarnings.value = warnings

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

        .label-tag {
          margin: 2px 4px 2px 0;
        }

        .empty-text {
          color: #909399;
          font-style: italic;
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
            transition: all 0.3s;

            &:hover {
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
              transform: translateY(-2px);
            }

            .container-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              padding-bottom: 12px;
              border-bottom: 1px solid #e4e7ed;

              strong {
                font-size: 14px;
                color: #303133;
              }
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

      .config-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
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
