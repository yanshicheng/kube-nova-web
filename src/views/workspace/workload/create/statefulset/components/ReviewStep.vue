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
          <ElDescriptionsItem label="StatefulSet 名称" label-class-name="desc-label" :span="2">
            <ElTag type="primary" size="large" effect="dark">{{ statefulSetName }}</ElTag>
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

      <!-- StatefulSet 配置 -->
      <ElCard class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <Database :size="18" />
              <span>StatefulSet 配置</span>
            </div>
            <ElTag type="primary">必填</ElTag>
          </div>
        </template>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="Service 名称">
            <ElTag type="primary" size="large" effect="dark">
              {{ statefulSetStore.serviceName }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="副本数">
            <ElTag type="primary" size="large" effect="dark">
              {{ statefulSetStore.replicas }} 个
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Pod 管理策略">
            <ElTag :type="podManagementType">
              {{ statefulSetStore.podManagementPolicy }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新策略">
            <ElTag :type="strategyType === 'RollingUpdate' ? 'success' : 'warning'">
              {{ strategyType }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="strategyType === 'RollingUpdate'" label="分区 (Partition)">
            {{ statefulSetStore.updateStrategy.rollingUpdate?.partition || 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="strategyType === 'RollingUpdate'" label="最大不可用">
            {{ statefulSetStore.updateStrategy.rollingUpdate?.maxUnavailable || 1 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="保留历史版本">
            {{ statefulSetStore.revisionHistoryLimit }} 个
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最小就绪秒数">
            {{ statefulSetStore.minReadySeconds }} 秒
          </ElDescriptionsItem>
          <ElDescriptionsItem label="删除时 PVC" :span="2">
            <ElTag :type="pvcRetentionDeletedType">
              {{ statefulSetStore.persistentVolumeClaimRetentionPolicy.whenDeleted }}
            </ElTag>
            <span style="margin-left: 8px; color: #909399; font-size: 13px">
              StatefulSet 删除时{{
                statefulSetStore.persistentVolumeClaimRetentionPolicy.whenDeleted === 'Retain'
                  ? '保留'
                  : '删除'
              }}PVC
            </span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="缩容时 PVC" :span="2">
            <ElTag :type="pvcRetentionScaledType">
              {{ statefulSetStore.persistentVolumeClaimRetentionPolicy.whenScaled }}
            </ElTag>
            <span style="margin-left: 8px; color: #909399; font-size: 13px">
              副本数减少时{{
                statefulSetStore.persistentVolumeClaimRetentionPolicy.whenScaled === 'Retain'
                  ? '保留'
                  : '删除'
              }}多余 PVC
            </span>
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElAlert
          v-if="statefulSetStore.replicas && statefulSetStore.replicas > 1"
          type="success"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <template #title>✅ 有状态服务部署</template>
          当前配置 {{ statefulSetStore.replicas }} 个副本，每个 Pod 都有唯一的网络标识和持久化存储
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
      <ElCard v-if="hasVolumes || hasVolumeClaimTemplates" class="summary-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <HardDrive :size="18" />
              <span>存储配置</span>
            </div>
          </div>
        </template>

        <!-- 普通存储卷 -->
        <div v-if="hasVolumes">
          <div class="storage-section-title">普通存储卷 ({{ volumeCount }} 个)</div>
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

        <!-- PVC 模板 -->
        <div v-if="hasVolumeClaimTemplates" :style="hasVolumes ? 'margin-top: 24px' : ''">
          <div class="storage-section-title">
            持久卷声明模板 ({{ statefulSetStore.volumeClaimTemplates.length }} 个)
          </div>
          <ElTable :data="statefulSetStore.volumeClaimTemplates" size="default" stripe>
            <ElTableColumn prop="metadata.name" label="PVC 名称" width="200" />
            <ElTableColumn label="访问模式" width="200">
              <template #default="{ row }">
                <ElTag
                  v-for="mode in row.spec?.accessModes"
                  :key="mode"
                  size="small"
                  type="success"
                  style="margin-right: 4px"
                >
                  {{ mode }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="存储容量" width="150">
              <template #default="{ row }">
                {{ row.spec?.resources?.requests?.storage || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="存储类" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.spec?.storageClassName || '默认' }}
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
              <span>预估资源使用（总计）</span>
            </div>
          </div>
        </template>
        <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          基于副本数 ({{ statefulSetStore.replicas }}) 和容器资源配置计算的总资源使用量
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
          <ElDescriptionsItem v-if="totalStorageRequest" label="总存储请求" :span="2">
            <ElTag type="warning" size="large">{{ totalStorageRequest }}</ElTag>
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
    Database
  } from 'lucide-vue-next'
  import yaml from 'js-yaml'
  import type { V1Volume } from '@kubernetes/client-node'

  // 导入 Store
  import { useMetadataStore, useContainersStore, useVolumesStore } from '@/store/workload'
  import { useStatefulSetStore } from '@/store/workload/statefulset'

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
  const statefulSetStore = useStatefulSetStore()

  // 状态
  const activeView = ref<'summary' | 'yaml'>('summary')
  const validationWarnings = ref<string[]>([])

  // StatefulSet 名称
  const statefulSetName = computed(() => {
    return `${metadataStore.metadata.nameEn}-${metadataStore.metadata.version}`
  })

  // 更新策略类型
  const strategyType = computed(() => {
    return statefulSetStore.updateStrategy.type || 'RollingUpdate'
  })

  // Pod 管理策略类型
  const podManagementType = computed(() => {
    return statefulSetStore.podManagementPolicy === 'OrderedReady' ? 'success' : 'warning'
  })

  // PVC 保留策略类型
  const pvcRetentionDeletedType = computed(() => {
    return statefulSetStore.persistentVolumeClaimRetentionPolicy.whenDeleted === 'Retain'
      ? 'success'
      : 'danger'
  })

  const pvcRetentionScaledType = computed(() => {
    return statefulSetStore.persistentVolumeClaimRetentionPolicy.whenScaled === 'Retain'
      ? 'success'
      : 'danger'
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

  // 是否有 PVC 模板
  const hasVolumeClaimTemplates = computed(() => {
    return statefulSetStore.volumeClaimTemplates.length > 0
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

  // 计算总资源
  const calculateTotalResources = (field: string) => {
    const replicas = statefulSetStore.replicas || 1
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

  // 计算总存储请求
  const totalStorageRequest = computed(() => {
    if (statefulSetStore.volumeClaimTemplates.length === 0) return ''

    let total = 0
    const replicas = statefulSetStore.replicas || 1

    statefulSetStore.volumeClaimTemplates.forEach((template) => {
      const storage = template.spec?.resources?.requests?.storage
      if (storage) {
        const value = parseFloat(storage)
        if (storage.endsWith('Gi')) {
          total += value * 1024
        } else if (storage.endsWith('Mi')) {
          total += value
        }
      }
    })

    return total > 0 ? `${(total * replicas).toFixed(0)} Mi` : ''
  })

  // YAML 预览
  const yamlPreview = computed(() => {
    try {
      const statefulSet = {
        apiVersion: 'apps/v1',
        kind: 'StatefulSet',
        metadata: {
          name: statefulSetName.value,
          namespace: metadataStore.namespace
        },
        spec: {
          serviceName: statefulSetStore.serviceName,
          replicas: statefulSetStore.replicas
        }
      }

      return yaml.dump(statefulSet, {
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
    if (!statefulSetStore.serviceName) {
      errors.push('缺少 Service 名称')
    }
    if (containersStore.mainContainers.length === 0) {
      errors.push('至少需要一个主容器')
    }

    if (!metadataStore.metadata.desc) {
      warnings.push('建议填写描述信息')
    }

    if (statefulSetStore.volumeClaimTemplates.length === 0) {
      warnings.push('未配置 PVC 模板，StatefulSet 通常需要持久化存储')
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

        .storage-section-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #303133;
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
