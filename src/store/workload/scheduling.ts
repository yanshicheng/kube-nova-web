// store/workload/scheduling.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  V1Affinity,
  V1Toleration,
  V1TopologySpreadConstraint,
  V1NodeAffinity,
  V1PodAffinity,
  V1PodAntiAffinity,
  V1NodeSelector,
  V1PreferredSchedulingTerm,
  V1NodeSelectorTerm,
  V1WeightedPodAffinityTerm,
  V1PodAffinityTerm
} from '@kubernetes/client-node'

export const useSchedulingStore = defineStore('workload-scheduling', () => {
  // 节点调度模式
  const nodeSchedulingMode = ref<'auto' | 'nodeName' | 'nodeSelector'>('auto')

  // 指定节点名称
  const nodeName = ref<string>()

  // 节点选择器
  const nodeSelector = ref<Record<string, string>>({})

  // 亲和性配置
  const affinity = ref<V1Affinity>()

  // 污点容忍
  const tolerations = ref<V1Toleration[]>([])

  // 拓扑约束
  const topologySpreadConstraints = ref<V1TopologySpreadConstraint[]>([])

  // 设置节点调度模式
  function setNodeSchedulingMode(mode: typeof nodeSchedulingMode.value) {
    nodeSchedulingMode.value = mode

    // 切换模式时清理相关配置
    if (mode !== 'nodeName') {
      nodeName.value = undefined
    }
    if (mode !== 'nodeSelector') {
      nodeSelector.value = {}
    }
  }

  // 设置节点名称
  function setNodeName(name: string) {
    nodeSchedulingMode.value = 'nodeName'
    nodeName.value = name
  }

  // 更新节点选择器
  function updateNodeSelector(selector: Record<string, string>) {
    nodeSchedulingMode.value = 'nodeSelector'
    // 过滤掉空键值对
    const filtered: Record<string, string> = {}
    Object.entries(selector).forEach(([key, value]) => {
      if (key && key.trim() && value && value.trim()) {
        filtered[key.trim()] = value.trim()
      }
    })
    nodeSelector.value = filtered
  }

  // 设置完整的亲和性
  function setAffinity(newAffinity: V1Affinity | undefined) {
    affinity.value = newAffinity
  }

  // 设置节点亲和性
  function setNodeAffinity(nodeAffinity: V1NodeAffinity | undefined) {
    if (!affinity.value) {
      affinity.value = {}
    }
    affinity.value.nodeAffinity = nodeAffinity
  }

  // 设置 Pod 亲和性
  function setPodAffinity(podAffinity: V1PodAffinity | undefined) {
    if (!affinity.value) {
      affinity.value = {}
    }
    affinity.value.podAffinity = podAffinity
  }

  // 设置 Pod 反亲和性
  function setPodAntiAffinity(podAntiAffinity: V1PodAntiAffinity | undefined) {
    if (!affinity.value) {
      affinity.value = {}
    }
    affinity.value.podAntiAffinity = podAntiAffinity
  }

  // 添加污点容忍
  function addToleration(toleration: V1Toleration) {
    tolerations.value.push(toleration)
  }

  // 移除污点容忍
  function removeToleration(index: number) {
    if (index >= 0 && index < tolerations.value.length) {
      tolerations.value.splice(index, 1)
    }
  }

  // 更新污点容忍
  function updateToleration(index: number, toleration: V1Toleration) {
    if (index >= 0 && index < tolerations.value.length) {
      tolerations.value[index] = toleration
    }
  }

  // 设置污点容忍列表
  function setTolerations(newTolerations: V1Toleration[]) {
    tolerations.value = newTolerations || []
  }

  // 添加拓扑约束
  function addTopologySpreadConstraint(constraint: V1TopologySpreadConstraint) {
    topologySpreadConstraints.value.push(constraint)
  }

  // 移除拓扑约束
  function removeTopologySpreadConstraint(index: number) {
    if (index >= 0 && index < topologySpreadConstraints.value.length) {
      topologySpreadConstraints.value.splice(index, 1)
    }
  }

  // 设置拓扑约束列表
  function setTopologySpreadConstraints(constraints: V1TopologySpreadConstraint[]) {
    topologySpreadConstraints.value = constraints || []
  }

  // 添加默认反亲和（服务内反亲和）
  function addDefaultAntiAffinity(appName: string) {
    if (!affinity.value) {
      affinity.value = {}
    }

    affinity.value.podAntiAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [
        {
          weight: 50,
          podAffinityTerm: {
            labelSelector: {
              matchLabels: {
                app: appName
              }
            },
            topologyKey: 'kubernetes.io/hostname'
          }
        }
      ]
    }
  }

  // 检查是否有亲和性配置
  function hasAffinityConfig() {
    return !!(
      affinity.value?.podAffinity ||
      affinity.value?.podAntiAffinity ||
      affinity.value?.nodeAffinity
    )
  }

  // 验证节点选择器格式（符合 k8s 规范）
  function validateNodeSelector(selector: Record<string, string>): string[] {
    const errors: string[] = []

    Object.entries(selector).forEach(([key, value]) => {
      // 验证键
      if (!key || !key.trim()) {
        errors.push('nodeSelector 的键不能为空')
      } else {
        // k8s label key 格式：可选前缀 + 名称
        // 前缀格式：DNS子域名/
        // 名称格式：[a-z0-9A-Z]开头和结尾，中间可以有 -_.
        const keyRegex =
          /^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*\/)?[a-zA-Z0-9]([-a-zA-Z0-9_.]*[a-zA-Z0-9])?$/
        if (!keyRegex.test(key)) {
          errors.push(`nodeSelector 键 "${key}" 格式不符合 Kubernetes 规范`)
        }
      }

      // 验证值
      if (!value || !value.trim()) {
        errors.push('nodeSelector 的值不能为空')
      } else {
        // k8s label value 格式：可以为空，或者符合名称格式
        const valueRegex = /^([a-zA-Z0-9][-a-zA-Z0-9_.]*[a-zA-Z0-9])?$/
        if (!valueRegex.test(value)) {
          errors.push(`nodeSelector 值 "${value}" 格式不符合 Kubernetes 规范`)
        }
      }
    })

    return errors
  }

  // 验证调度配置
  function validate() {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证节点调度
    if (nodeSchedulingMode.value === 'nodeName') {
      if (!nodeName.value || !nodeName.value.trim()) {
        errors.push('请选择或输入目标节点名称')
      }
    }

    if (nodeSchedulingMode.value === 'nodeSelector') {
      const selectorEntries = Object.entries(nodeSelector.value)

      if (selectorEntries.length === 0) {
        errors.push('节点选择器不能为空，请至少添加一个标签选择器')
      } else {
        // 验证每个键值对
        const selectorErrors = validateNodeSelector(nodeSelector.value)
        errors.push(...selectorErrors)
      }
    }

    // 验证污点容忍
    tolerations.value.forEach((toleration, index) => {
      if (!toleration.operator || toleration.operator === 'Equal') {
        if (!toleration.key) {
          errors.push(`污点容忍 ${index + 1}: 缺少 key`)
        }
        if (toleration.value === undefined || toleration.value === null) {
          warnings.push(`污点容忍 ${index + 1}: Equal 操作符建议指定 value`)
        }
      }
      if (toleration.operator === 'Exists' && toleration.value) {
        warnings.push(`污点容忍 ${index + 1}: Exists 操作符不应指定 value`)
      }
    })

    // 验证拓扑约束
    topologySpreadConstraints.value.forEach((constraint, index) => {
      if (!constraint.maxSkew) {
        errors.push(`拓扑约束 ${index + 1}: 缺少 maxSkew`)
      }
      if (!constraint.topologyKey) {
        errors.push(`拓扑约束 ${index + 1}: 缺少 topologyKey`)
      }
      if (!constraint.whenUnsatisfiable) {
        errors.push(`拓扑约束 ${index + 1}: 缺少 whenUnsatisfiable`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 转换为 K8s 格式
  function toK8sFormat() {
    const spec: any = {}

    // 节点调度
    if (nodeSchedulingMode.value === 'nodeName' && nodeName.value && nodeName.value.trim()) {
      spec.nodeName = nodeName.value.trim()
    } else if (nodeSchedulingMode.value === 'nodeSelector') {
      // 过滤并清理 nodeSelector
      const filtered: Record<string, string> = {}
      Object.entries(nodeSelector.value).forEach(([key, value]) => {
        if (key && key.trim() && value && value.trim()) {
          filtered[key.trim()] = value.trim()
        }
      })

      if (Object.keys(filtered).length > 0) {
        spec.nodeSelector = filtered
      }
    }

    // 亲和性 - 只有在有实际配置时才添加
    if (affinity.value) {
      const cleanedAffinity: V1Affinity = {}

      if (affinity.value.nodeAffinity) {
        cleanedAffinity.nodeAffinity = affinity.value.nodeAffinity
      }

      if (affinity.value.podAffinity) {
        cleanedAffinity.podAffinity = affinity.value.podAffinity
      }

      if (affinity.value.podAntiAffinity) {
        cleanedAffinity.podAntiAffinity = affinity.value.podAntiAffinity
      }

      // 只有在有实际内容时才添加
      if (Object.keys(cleanedAffinity).length > 0) {
        spec.affinity = cleanedAffinity
      }
    }

    // 污点容忍
    if (tolerations.value && tolerations.value.length > 0) {
      spec.tolerations = tolerations.value
    }

    // 拓扑约束
    if (topologySpreadConstraints.value && topologySpreadConstraints.value.length > 0) {
      spec.topologySpreadConstraints = topologySpreadConstraints.value
    }

    return spec
  }

  // 从 K8s 格式加载
  function loadFromK8s(spec: any) {
    if (!spec) {
      reset()
      return
    }

    // 检测节点调度模式
    if (spec.nodeName) {
      nodeSchedulingMode.value = 'nodeName'
      nodeName.value = spec.nodeName
      nodeSelector.value = {}
    } else if (spec.nodeSelector && Object.keys(spec.nodeSelector).length > 0) {
      nodeSchedulingMode.value = 'nodeSelector'
      nodeName.value = undefined
      // 深拷贝并清理
      const cleaned: Record<string, string> = {}
      Object.entries(spec.nodeSelector).forEach(([key, value]) => {
        if (key && value) {
          cleaned[String(key)] = String(value)
        }
      })
      nodeSelector.value = cleaned
    } else {
      nodeSchedulingMode.value = 'auto'
      nodeName.value = undefined
      nodeSelector.value = {}
    }

    // 加载亲和性 - 深拷贝
    if (spec.affinity) {
      affinity.value = JSON.parse(JSON.stringify(spec.affinity))
    } else {
      affinity.value = undefined
    }

    // 加载污点容忍 - 深拷贝
    if (spec.tolerations && Array.isArray(spec.tolerations)) {
      tolerations.value = JSON.parse(JSON.stringify(spec.tolerations))
    } else {
      tolerations.value = []
    }

    // 加载拓扑约束 - 深拷贝
    if (spec.topologySpreadConstraints && Array.isArray(spec.topologySpreadConstraints)) {
      topologySpreadConstraints.value = JSON.parse(JSON.stringify(spec.topologySpreadConstraints))
    } else {
      topologySpreadConstraints.value = []
    }
  }

  // 重置状态
  function reset() {
    nodeSchedulingMode.value = 'auto'
    nodeName.value = undefined
    nodeSelector.value = {}
    affinity.value = undefined
    tolerations.value = []
    topologySpreadConstraints.value = []
  }

  return {
    // State
    nodeSchedulingMode,
    nodeName,
    nodeSelector,
    affinity,
    tolerations,
    topologySpreadConstraints,

    // Actions
    setNodeSchedulingMode,
    setNodeName,
    updateNodeSelector,
    setAffinity,
    setNodeAffinity,
    setPodAffinity,
    setPodAntiAffinity,
    addToleration,
    removeToleration,
    updateToleration,
    setTolerations,
    addTopologySpreadConstraint,
    removeTopologySpreadConstraint,
    setTopologySpreadConstraints,
    addDefaultAntiAffinity,
    hasAffinityConfig,
    validateNodeSelector,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})
