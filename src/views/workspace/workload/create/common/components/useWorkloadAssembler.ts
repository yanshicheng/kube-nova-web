// composables/useWorkloadAssembler.ts
import { computed } from 'vue'
import type { V1Pod, V1Deployment, V1StatefulSet } from '@kubernetes/client-node'
import {
  useMetadataStore,
  useContainersStore,
  useVolumesStore,
  useSchedulingStore,
  useAdvancedStore
} from '@/store/workload'

/**
 * Workload 数据组装器
 * 用于将各个 store 的数据组装成最终的 K8s 资源对象
 */
export function useWorkloadAssembler() {
  const metadataStore = useMetadataStore()
  const containersStore = useContainersStore()
  const volumesStore = useVolumesStore()
  const schedulingStore = useSchedulingStore()
  const advancedStore = useAdvancedStore()

  /**
   * 组装 Pod 配置
   */
  const assemblePod = computed((): V1Pod => {
    const { metadata, namespace } = metadataStore
    const containers = containersStore.toK8sFormat()
    const volumes = volumesStore.toK8sFormat()
    const schedulingSpec = schedulingStore.toK8sFormat()
    const advancedSpec = advancedStore.toK8sFormat()

    // 组装完整的 labels
    const labels: Record<string, string> = {
      app: metadata.nameEn,
      version: metadata.version,
      ...metadata.labels
    }

    // 组装完整的 annotations
    const annotations: Record<string, string> = {
      'ikubeops.com/project-name': metadata.nameCn,
      'created-by': 'kube-nova',
      ...metadata.annotations
    }

    if (metadata.desc) {
      annotations.description = metadata.desc
    }

    return {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: `${metadata.nameEn}-${metadata.version}`,
        namespace: namespace,
        labels,
        annotations
      },
      spec: {
        ...containers,
        volumes,
        ...schedulingSpec,
        ...advancedSpec
      }
    } as V1Pod
  })

  /**
   * 组装 Deployment 配置
   */
  const assembleDeployment = computed((): V1Deployment => {
    const { metadata, namespace } = metadataStore
    const containers = containersStore.toK8sFormat()
    const volumes = volumesStore.toK8sFormat()
    const schedulingSpec = schedulingStore.toK8sFormat()
    const advancedSpec = advancedStore.toK8sFormat()

    // 组装完整的 labels
    const labels: Record<string, string> = {
      app: metadata.nameEn,
      version: metadata.version,
      ...metadata.labels
    }

    // 组装完整的 annotations
    const annotations: Record<string, string> = {
      'ikubeops.com/project-name': metadata.nameCn,
      'created-by': 'kube-nova',
      ...metadata.annotations
    }

    if (metadata.desc) {
      annotations.description = metadata.desc
    }

    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: metadata.nameEn,
        namespace: namespace,
        labels,
        annotations
      },
      spec: {
        replicas: 1, // 默认副本数，可以在组件中配置
        selector: {
          matchLabels: {
            app: metadata.nameEn
          }
        },
        template: {
          metadata: {
            labels,
            annotations
          },
          spec: {
            ...containers,
            volumes,
            ...schedulingSpec,
            ...advancedSpec
          }
        }
      }
    } as V1Deployment
  })

  /**
   * 组装 StatefulSet 配置
   */
  const assembleStatefulSet = computed((): V1StatefulSet => {
    const { metadata, namespace } = metadataStore
    const containers = containersStore.toK8sFormat()
    const volumes = volumesStore.toK8sFormat()
    const schedulingSpec = schedulingStore.toK8sFormat()
    const advancedSpec = advancedStore.toK8sFormat()

    // 组装完整的 labels
    const labels: Record<string, string> = {
      app: metadata.nameEn,
      version: metadata.version,
      ...metadata.labels
    }

    // 组装完整的 annotations
    const annotations: Record<string, string> = {
      'ikubeops.com/project-name': metadata.nameCn,
      'created-by': 'kube-nova',
      ...metadata.annotations
    }

    if (metadata.desc) {
      annotations.description = metadata.desc
    }

    return {
      apiVersion: 'apps/v1',
      kind: 'StatefulSet',
      metadata: {
        name: metadata.nameEn,
        namespace: namespace,
        labels,
        annotations
      },
      spec: {
        serviceName: metadata.nameEn, // StatefulSet 需要关联一个 Headless Service
        replicas: 1,
        selector: {
          matchLabels: {
            app: metadata.nameEn
          }
        },
        template: {
          metadata: {
            labels,
            annotations
          },
          spec: {
            ...containers,
            volumes,
            ...schedulingSpec,
            ...advancedSpec
          }
        },
        volumeClaimTemplates: [] // 可以在组件中配置
      }
    } as V1StatefulSet
  })

  /**
   * 从 Pod 加载数据到各个 store
   */
  function loadPod(pod: V1Pod) {
    // 加载元数据
    metadataStore.loadFromExisting({
      nameCn: pod.metadata?.annotations?.['ikubeops.com/project-name'] || '',
      nameEn: pod.metadata?.labels?.['app'] || '',
      version: pod.metadata?.labels?.['version'] || '',
      desc: pod.metadata?.annotations?.['description'] || '',
      labels: pod.metadata?.labels || {},
      annotations: pod.metadata?.annotations || {}
    })
    metadataStore.setNamespace(pod.metadata?.namespace || 'default')
    metadataStore.setResourceType('pod')

    // 加载容器
    containersStore.loadFromK8s({
      initContainers: pod.spec?.initContainers,
      containers: pod.spec?.containers
    })

    // 加载存储卷
    volumesStore.loadFromK8s(pod.spec?.volumes || [])

    // 加载调度配置
    schedulingStore.loadFromK8s(pod.spec || {})

    // 加载高级配置
    advancedStore.loadFromK8s(pod.spec || {})
  }

  /**
   * 从 Deployment 加载数据到各个 store
   */
  function loadDeployment(deployment: V1Deployment) {
    // 加载元数据
    metadataStore.loadFromExisting({
      nameCn: deployment.metadata?.annotations?.['ikubeops.com/project-name'] || '',
      nameEn: deployment.metadata?.labels?.['app'] || '',
      version: deployment.metadata?.labels?.['version'] || '',
      desc: deployment.metadata?.annotations?.['description'] || '',
      labels: deployment.metadata?.labels || {},
      annotations: deployment.metadata?.annotations || {}
    })
    metadataStore.setNamespace(deployment.metadata?.namespace || 'default')
    metadataStore.setResourceType('deployment')

    const podSpec = deployment.spec?.template?.spec

    // 加载容器
    containersStore.loadFromK8s({
      initContainers: podSpec?.initContainers,
      containers: podSpec?.containers
    })

    // 加载存储卷
    volumesStore.loadFromK8s(podSpec?.volumes || [])

    // 加载调度配置
    schedulingStore.loadFromK8s(podSpec || {})

    // 加载高级配置
    advancedStore.loadFromK8s(podSpec || {})
  }

  /**
   * 从 StatefulSet 加载数据到各个 store
   */
  function loadStatefulSet(statefulSet: V1StatefulSet) {
    // 加载元数据
    metadataStore.loadFromExisting({
      nameCn: statefulSet.metadata?.annotations?.['ikubeops.com/project-name'] || '',
      nameEn: statefulSet.metadata?.labels?.['app'] || '',
      version: statefulSet.metadata?.labels?.['version'] || '',
      desc: statefulSet.metadata?.annotations?.['description'] || '',
      labels: statefulSet.metadata?.labels || {},
      annotations: statefulSet.metadata?.annotations || {}
    })
    metadataStore.setNamespace(statefulSet.metadata?.namespace || 'default')
    metadataStore.setResourceType('statefulset')

    const podSpec = statefulSet.spec?.template?.spec

    // 加载容器
    containersStore.loadFromK8s({
      initContainers: podSpec?.initContainers,
      containers: podSpec?.containers
    })

    // 加载存储卷
    volumesStore.loadFromK8s(podSpec?.volumes || [])

    // 加载调度配置
    schedulingStore.loadFromK8s(podSpec || {})

    // 加载高级配置
    advancedStore.loadFromK8s(podSpec || {})
  }

  /**
   * 验证所有配置
   */
  function validateAll() {
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
      ...volumesResult.warnings,
      ...schedulingResult.warnings,
      ...advancedResult.warnings
    ]

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  return {
    // 组装方法
    assemblePod,
    assembleDeployment,
    assembleStatefulSet,

    // 加载方法
    loadPod,
    loadDeployment,
    loadStatefulSet,

    // 验证方法
    validateAll
  }
}
