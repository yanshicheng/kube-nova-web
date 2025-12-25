// 文件路径: src/store/workload/statefulset.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type {
  V1StatefulSetUpdateStrategy,
  V1PersistentVolumeClaim,
  V1StatefulSetPersistentVolumeClaimRetentionPolicy
} from '@kubernetes/client-node'
import { useMetadataStore } from './metadata'

export const useStatefulSetStore = defineStore('workload-statefulset', () => {
  // 副本数
  const replicas = ref<number>(1)

  // Headless Service 名称（必需）
  const serviceName = ref<string>('')

  // 是否手动修改过 serviceName（用于判断是否需要自动更新）
  const serviceNameManuallySet = ref<boolean>(false)

  // Pod 管理策略
  const podManagementPolicy = ref<'OrderedReady' | 'Parallel'>('OrderedReady')

  // 获取 metadata store
  const metadataStore = useMetadataStore()

  // 监听 metadata 变化，自动更新 serviceName
  watch(
    () => [metadataStore.metadata.nameEn, metadataStore.metadata.version],
    ([newNameEn, newVersion]) => {
      // 只有在没有手动设置过的情况下才自动更新
      if (!serviceNameManuallySet.value && newNameEn && newVersion) {
        serviceName.value = `${newNameEn}-${newVersion}`
        console.log(`📝 自动更新 serviceName: ${serviceName.value}`)
      }
    },
    { immediate: true }
  )

  // 更新策略
  const updateStrategy = ref<V1StatefulSetUpdateStrategy>({
    type: 'RollingUpdate',
    rollingUpdate: {
      partition: 0,
      maxUnavailable: 1
    }
  })

  // 历史版本限制
  const revisionHistoryLimit = ref<number>(10)

  // 最小就绪秒数
  const minReadySeconds = ref<number>(0)

  // PVC 模板
  const volumeClaimTemplates = ref<V1PersistentVolumeClaim[]>([])

  // PVC 保留策略
  const persistentVolumeClaimRetentionPolicy =
    ref<V1StatefulSetPersistentVolumeClaimRetentionPolicy>({
      whenDeleted: 'Retain',
      whenScaled: 'Retain'
    })

  // 设置副本数
  function setReplicas(count: number) {
    if (count >= 0) {
      replicas.value = count
    }
  }

  // 设置 Service 名称
  function setServiceName(name: string) {
    serviceName.value = name
    // 标记为手动设置，阻止自动更新
    if (name && name.trim()) {
      serviceNameManuallySet.value = true
      console.log(`✋ serviceName 已手动设置为: ${name}`)
    }
  }

  // 设置 Pod 管理策略
  function setPodManagementPolicy(policy: typeof podManagementPolicy.value) {
    podManagementPolicy.value = policy
  }

  // 设置更新策略
  function setUpdateStrategy(strategy: V1StatefulSetUpdateStrategy) {
    updateStrategy.value = { ...strategy }
  }

  // 设置历史版本限制
  function setRevisionHistoryLimit(limit: number) {
    if (limit >= 0) {
      revisionHistoryLimit.value = limit
    }
  }

  // 设置最小就绪秒数
  function setMinReadySeconds(seconds: number) {
    if (seconds >= 0) {
      minReadySeconds.value = seconds
    }
  }

  // 添加 PVC 模板
  function addVolumeClaimTemplate(template: V1PersistentVolumeClaim) {
    volumeClaimTemplates.value.push(template)
  }

  // 移除 PVC 模板
  function removeVolumeClaimTemplate(index: number) {
    if (index >= 0 && index < volumeClaimTemplates.value.length) {
      volumeClaimTemplates.value.splice(index, 1)
    }
  }

  // 更新 PVC 模板
  function updateVolumeClaimTemplate(index: number, template: V1PersistentVolumeClaim) {
    if (index >= 0 && index < volumeClaimTemplates.value.length) {
      volumeClaimTemplates.value[index] = template
    }
  }

  // 设置 PVC 保留策略
  function setPersistentVolumeClaimRetentionPolicy(
    policy: V1StatefulSetPersistentVolumeClaimRetentionPolicy
  ) {
    persistentVolumeClaimRetentionPolicy.value = { ...policy }
  }

  // 验证
  function validate() {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证副本数
    if (replicas.value === undefined || replicas.value < 0) {
      errors.push('副本数不能为负数')
    }

    if (replicas.value === 0) {
      warnings.push('副本数为 0，StatefulSet 将不会创建任何 Pod')
    }

    // 验证 Service 名称（必需）
    if (!serviceName.value || !serviceName.value.trim()) {
      errors.push('Service 名称不能为空')
    } else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(serviceName.value)) {
      errors.push('Service 名称格式不正确')
    }

    // 验证更新策略
    if (updateStrategy.value.type === 'RollingUpdate') {
      const rollingUpdate = updateStrategy.value.rollingUpdate
      if (rollingUpdate) {
        if (rollingUpdate.partition !== undefined && rollingUpdate.partition < 0) {
          errors.push('分区值不能为负数')
        }
        if (
          rollingUpdate.maxUnavailable !== undefined &&
          typeof rollingUpdate.maxUnavailable === 'number' &&
          rollingUpdate.maxUnavailable < 0
        ) {
          errors.push('最大不可用数不能为负数')
        }
      }
    }

    // 验证 PVC 模板
    volumeClaimTemplates.value.forEach((template, index) => {
      if (!template.metadata?.name) {
        errors.push(`PVC 模板 ${index + 1}: 缺少名称`)
      }
      if (!template.spec?.accessModes || template.spec.accessModes.length === 0) {
        errors.push(`PVC 模板 ${index + 1}: 缺少访问模式`)
      }
      if (!template.spec?.resources?.requests?.storage) {
        errors.push(`PVC 模板 ${index + 1}: 缺少存储容量`)
      }
    })

    // 验证历史版本限制
    if (revisionHistoryLimit.value === 0) {
      warnings.push('历史版本限制为 0 将禁用回滚功能')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 转换为 K8s 格式
  function toK8sFormat() {
    const spec: any = {
      serviceName: serviceName.value,
      replicas: replicas.value,
      podManagementPolicy: podManagementPolicy.value
    }

    // 更新策略
    if (updateStrategy.value) {
      spec.updateStrategy = { ...updateStrategy.value }
    }

    // 可选字段
    if (revisionHistoryLimit.value !== 10) {
      spec.revisionHistoryLimit = revisionHistoryLimit.value
    }

    if (minReadySeconds.value > 0) {
      spec.minReadySeconds = minReadySeconds.value
    }

    // PVC 模板
    if (volumeClaimTemplates.value.length > 0) {
      spec.volumeClaimTemplates = volumeClaimTemplates.value.map((template) => ({
        ...template
      }))
    }

    // PVC 保留策略
    if (persistentVolumeClaimRetentionPolicy.value) {
      spec.persistentVolumeClaimRetentionPolicy = {
        ...persistentVolumeClaimRetentionPolicy.value
      }
    }

    return spec
  }

  // 从 K8s 格式加载
  function loadFromK8s(spec: any) {
    if (!spec) {
      reset()
      return
    }

    replicas.value = spec.replicas !== undefined ? spec.replicas : 1

    // 加载 serviceName 时标记为手动设置，避免被自动更新覆盖
    if (spec.serviceName) {
      serviceName.value = spec.serviceName
      serviceNameManuallySet.value = true
    } else {
      serviceName.value = ''
      serviceNameManuallySet.value = false
    }

    podManagementPolicy.value = spec.podManagementPolicy || 'OrderedReady'

    if (spec.updateStrategy) {
      updateStrategy.value = JSON.parse(JSON.stringify(spec.updateStrategy))
    } else {
      updateStrategy.value = {
        type: 'RollingUpdate',
        rollingUpdate: {
          partition: 0,
          maxUnavailable: 1
        }
      }
    }

    revisionHistoryLimit.value =
      spec.revisionHistoryLimit !== undefined ? spec.revisionHistoryLimit : 10
    minReadySeconds.value = spec.minReadySeconds || 0

    if (spec.volumeClaimTemplates && Array.isArray(spec.volumeClaimTemplates)) {
      volumeClaimTemplates.value = JSON.parse(JSON.stringify(spec.volumeClaimTemplates))
    } else {
      volumeClaimTemplates.value = []
    }

    if (spec.persistentVolumeClaimRetentionPolicy) {
      persistentVolumeClaimRetentionPolicy.value = JSON.parse(
        JSON.stringify(spec.persistentVolumeClaimRetentionPolicy)
      )
    } else {
      persistentVolumeClaimRetentionPolicy.value = {
        whenDeleted: 'Retain',
        whenScaled: 'Retain'
      }
    }

    console.log('✅ StatefulSet store 已从 K8s 格式加载')
  }

  // 重置
  function reset() {
    replicas.value = 1
    serviceName.value = ''
    serviceNameManuallySet.value = false // 重置手动设置标记
    podManagementPolicy.value = 'OrderedReady'
    updateStrategy.value = {
      type: 'RollingUpdate',
      rollingUpdate: {
        partition: 0,
        maxUnavailable: 1
      }
    }
    revisionHistoryLimit.value = 10
    minReadySeconds.value = 0
    volumeClaimTemplates.value = []
    persistentVolumeClaimRetentionPolicy.value = {
      whenDeleted: 'Retain',
      whenScaled: 'Retain'
    }
    console.log('StatefulSet store 已重置')
  }

  return {
    // State
    replicas,
    serviceName,
    podManagementPolicy,
    updateStrategy,
    revisionHistoryLimit,
    minReadySeconds,
    volumeClaimTemplates,
    persistentVolumeClaimRetentionPolicy,

    // Actions
    setReplicas,
    setServiceName,
    setPodManagementPolicy,
    setUpdateStrategy,
    setRevisionHistoryLimit,
    setMinReadySeconds,
    addVolumeClaimTemplate,
    removeVolumeClaimTemplate,
    updateVolumeClaimTemplate,
    setPersistentVolumeClaimRetentionPolicy,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})
