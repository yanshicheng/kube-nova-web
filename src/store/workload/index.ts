// store/workload/index.ts
import { useMetadataStore, type MetadataConfig } from './metadata'
import { useContainersStore, type ContainerWithId } from './containers'
import { useVolumesStore } from './volumes'
import { useSchedulingStore } from './scheduling'
import { useAdvancedStore } from './advanced'
import { useDeploymentStore } from './deployment'
import { useStatefulSetStore } from './statefulset'
import { useDaemonSetStore } from './daemonset'
import { useJobStore } from './job'
import { useCronJobStore } from './cronjob'

// 导出所有 store 和类型
export { useMetadataStore, type MetadataConfig }
export { useContainersStore, type ContainerWithId }
export { useVolumesStore }
export { useSchedulingStore }
export { useAdvancedStore }
export { useDeploymentStore }
export { useStatefulSetStore }
export { useDaemonSetStore }
export { useJobStore }
export { useCronJobStore }

// 导出资源转换函数
export {
  generatePodFromStores,
  generateDeploymentFromStores,
  generateStatefulSetFromStores,
  generateDaemonSetFromStores,
  generateJobFromStores,
  generateCronJobFromStores,
  updateStoresFromPod,
  updateStoresFromDeployment,
  updateStoresFromStatefulSet,
  updateStoresFromDaemonSet,
  updateStoresFromJob,
  updateStoresFromCronJob
} from './resourceConverter'

/**
 * 重置所有 workload store 的辅助函数
 */
export function resetAllWorkloadStores() {
  const metadataStore = useMetadataStore()
  const containersStore = useContainersStore()
  const volumesStore = useVolumesStore()
  const schedulingStore = useSchedulingStore()
  const advancedStore = useAdvancedStore()
  const deploymentStore = useDeploymentStore()
  const statefulSetStore = useStatefulSetStore()
  const daemonSetStore = useDaemonSetStore()
  const jobStore = useJobStore()
  const cronJobStore = useCronJobStore()

  metadataStore.reset()
  containersStore.reset()
  volumesStore.reset()
  schedulingStore.reset()
  advancedStore.reset()
  deploymentStore.reset()
  statefulSetStore.reset()
  daemonSetStore.reset()
  jobStore.reset()
  cronJobStore.reset()

  console.log(
    '✅ 所有 workload stores (包括 deployment、statefulset、daemonset、job 和 cronjob) 已重置'
  )
}

/**
 * 验证所有基础 store 的配置（不包括资源类型特定的 store）
 */
export function validateAllStores() {
  const metadataStore = useMetadataStore()
  const containersStore = useContainersStore()
  const volumesStore = useVolumesStore()
  const schedulingStore = useSchedulingStore()
  const advancedStore = useAdvancedStore()

  const metadataResult = metadataStore.validate()
  const containersResult = containersStore.validate()
  const volumesResult = volumesStore.validate()
  const schedulingResult = schedulingStore.validate()
  const advancedResult = advancedStore.validate()

  const errors = [
    ...metadataResult.errors,
    ...containersResult.errors,
    ...volumesResult.errors,
    ...schedulingResult.errors,
    ...advancedResult.errors
  ]

  const warnings = [
    ...(volumesResult.warnings || []),
    ...(schedulingResult.warnings || []),
    ...(advancedResult.warnings || [])
  ]

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证包括 Deployment 在内的所有配置
 */
export function validateAllStoresWithDeployment() {
  const result = validateAllStores()
  const deploymentStore = useDeploymentStore()
  const deploymentResult = deploymentStore.validate()

  return {
    valid: result.valid && deploymentResult.valid,
    errors: [...result.errors, ...deploymentResult.errors],
    warnings: [...result.warnings, ...(deploymentResult.warnings || [])]
  }
}

/**
 * 验证包括 StatefulSet 在内的所有配置
 */
export function validateAllStoresWithStatefulSet() {
  const result = validateAllStores()
  const statefulSetStore = useStatefulSetStore()
  const statefulSetResult = statefulSetStore.validate()

  return {
    valid: result.valid && statefulSetResult.valid,
    errors: [...result.errors, ...statefulSetResult.errors],
    warnings: [...result.warnings, ...(statefulSetResult.warnings || [])]
  }
}

/**
 * 验证包括 DaemonSet 在内的所有配置
 */
export function validateAllStoresWithDaemonSet() {
  const result = validateAllStores()
  const daemonSetStore = useDaemonSetStore()
  const daemonSetResult = daemonSetStore.validate()

  return {
    valid: result.valid && daemonSetResult.valid,
    errors: [...result.errors, ...daemonSetResult.errors],
    warnings: [...result.warnings, ...(daemonSetResult.warnings || [])]
  }
}

/**
 * 验证包括 Job 在内的所有配置
 */
export function validateAllStoresWithJob() {
  const result = validateAllStores()
  const jobStore = useJobStore()
  const jobResult = jobStore.validate()

  return {
    valid: result.valid && jobResult.valid,
    errors: [...result.errors, ...jobResult.errors],
    warnings: [...result.warnings, ...(jobResult.warnings || [])]
  }
}

/**
 * 验证包括 CronJob 在内的所有配置
 */
export function validateAllStoresWithCronJob() {
  const result = validateAllStores()
  const cronJobStore = useCronJobStore()
  const cronJobResult = cronJobStore.validate()

  return {
    valid: result.valid && cronJobResult.valid,
    errors: [...result.errors, ...cronJobResult.errors],
    warnings: [...result.warnings, ...(cronJobResult.warnings || [])]
  }
}

/**
 * 根据资源类型验证对应的所有配置
 * @param resourceType 资源类型
 */
export function validateStoresByResourceType(
  resourceType: 'pod' | 'deployment' | 'statefulset' | 'daemonset' | 'job' | 'cronjob'
) {
  switch (resourceType) {
    case 'deployment':
      return validateAllStoresWithDeployment()
    case 'statefulset':
      return validateAllStoresWithStatefulSet()
    case 'daemonset':
      return validateAllStoresWithDaemonSet()
    case 'job':
      return validateAllStoresWithJob()
    case 'cronjob':
      return validateAllStoresWithCronJob()
    case 'pod':
    default:
      return validateAllStores()
  }
}
