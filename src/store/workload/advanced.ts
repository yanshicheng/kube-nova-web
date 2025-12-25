// store/workload/advanced.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  V1PodSecurityContext,
  V1PodDNSConfig,
  V1HostAlias,
  V1PodReadinessGate,
  V1LocalObjectReference
} from '@kubernetes/client-node'

export const useAdvancedStore = defineStore('workload-advanced', () => {
  // 安全上下文
  const securityContext = ref<V1PodSecurityContext>({})

  // 网络配置
  const networkConfig = ref({
    hostNetwork: false,
    hostPID: false,
    hostIPC: false,
    shareProcessNamespace: false,
    hostname: '',
    subdomain: '',
    setHostnameAsFQDN: false
  })

  // DNS配置
  const dnsPolicy = ref<string>('ClusterFirst')
  const dnsConfig = ref<V1PodDNSConfig | undefined>(undefined)

  // 主机别名
  const hostAliases = ref<V1HostAlias[]>([])

  // 服务账户
  const serviceAccountName = ref<string | undefined>(undefined)
  const automountServiceAccountToken = ref<boolean | undefined>(undefined)
  const imagePullSecrets = ref<V1LocalObjectReference[]>([])

  // 生命周期
  const restartPolicy = ref<string>('Always')
  const terminationGracePeriodSeconds = ref<number | undefined>(30)
  const activeDeadlineSeconds = ref<number | undefined>(undefined)

  // 优先级
  const priorityClassName = ref<string | undefined>(undefined)
  const priority = ref<number | undefined>(undefined)
  const preemptionPolicy = ref<string | undefined>(undefined)

  // 就绪门控
  const readinessGates = ref<V1PodReadinessGate[]>([])

  // 资源开销
  const overhead = ref<Record<string, string>>({})

  // 其他配置
  const enableServiceLinks = ref<boolean | undefined>(true)
  const runtimeClassName = ref<string | undefined>(undefined)
  const schedulerName = ref<string>('default-scheduler')
  const osName = ref<string | undefined>(undefined)

  // 更新安全上下文
  function updateSecurityContext(context: Partial<V1PodSecurityContext>) {
    securityContext.value = { ...securityContext.value, ...context }
  }

  // 设置完整的安全上下文
  function setSecurityContext(context: V1PodSecurityContext | undefined) {
    securityContext.value = context || {}
  }

  // 更新网络配置
  function updateNetworkConfig(config: Partial<typeof networkConfig.value>) {
    networkConfig.value = { ...networkConfig.value, ...config }
  }

  // 设置DNS策略
  function setDNSPolicy(policy: string) {
    dnsPolicy.value = policy || 'ClusterFirst'
  }

  // 更新DNS配置
  function updateDNSConfig(config: V1PodDNSConfig | undefined) {
    dnsConfig.value = config
  }

  // 设置主机别名列表
  function setHostAliases(aliases: V1HostAlias[]) {
    hostAliases.value = aliases || []
  }

  // 添加主机别名
  function addHostAlias(alias: V1HostAlias) {
    hostAliases.value.push(alias)
  }

  // 移除主机别名
  function removeHostAlias(index: number) {
    if (index >= 0 && index < hostAliases.value.length) {
      hostAliases.value.splice(index, 1)
    }
  }

  // 设置服务账户
  function setServiceAccount(name: string | undefined, automount: boolean | undefined) {
    serviceAccountName.value = name
    automountServiceAccountToken.value = automount
  }

  // 更新镜像拉取密钥
  function updateImagePullSecrets(secrets: V1LocalObjectReference[]) {
    imagePullSecrets.value = secrets || []
  }

  // 设置重启策略
  function setRestartPolicy(policy: string) {
    restartPolicy.value = policy || 'Always'
  }

  // 设置终止宽限期
  function setTerminationGracePeriodSeconds(seconds: number | undefined) {
    terminationGracePeriodSeconds.value = seconds
  }

  // 设置活动截止时间
  function setActiveDeadlineSeconds(seconds: number | undefined) {
    activeDeadlineSeconds.value = seconds
  }

  // 设置优先级类名
  function setPriorityClassName(className: string | undefined) {
    priorityClassName.value = className
  }

  // 设置优先级
  function setPriority(priorityValue: number | undefined) {
    priority.value = priorityValue
  }

  // 设置抢占策略
  function setPreemptionPolicy(policy: string | undefined) {
    preemptionPolicy.value = policy
  }

  // 设置就绪门控列表
  function setReadinessGates(gates: V1PodReadinessGate[]) {
    readinessGates.value = gates || []
  }

  // 添加就绪门控
  function addReadinessGate(gate: V1PodReadinessGate) {
    readinessGates.value.push(gate)
  }

  // 移除就绪门控
  function removeReadinessGate(index: number) {
    if (index >= 0 && index < readinessGates.value.length) {
      readinessGates.value.splice(index, 1)
    }
  }

  // 设置资源开销
  function setOverhead(overheadValue: Record<string, string>) {
    overhead.value = overheadValue || {}
  }

  // 设置服务链接
  function setEnableServiceLinks(enable: boolean | undefined) {
    enableServiceLinks.value = enable
  }

  // 设置运行时类名
  function setRuntimeClassName(className: string | undefined) {
    runtimeClassName.value = className
  }

  // 设置调度器名称
  function setSchedulerName(name: string) {
    schedulerName.value = name || 'default-scheduler'
  }

  // 设置操作系统名称
  function setOSName(name: string | undefined) {
    osName.value = name
  }

  // 验证高级配置
  function validate() {
    const errors: string[] = []
    const warnings: string[] = []

    if (networkConfig.value.hostNetwork) {
      warnings.push('使用主机网络存在安全风险')
    }

    if (networkConfig.value.hostPID) {
      warnings.push('使用主机PID命名空间存在安全风险')
    }

    if (networkConfig.value.hostIPC) {
      warnings.push('使用主机IPC命名空间存在安全风险')
    }

    if (
      terminationGracePeriodSeconds.value !== undefined &&
      terminationGracePeriodSeconds.value < 0
    ) {
      errors.push('终止宽限期不能为负数')
    }

    if (activeDeadlineSeconds.value !== undefined && activeDeadlineSeconds.value < 0) {
      errors.push('活动截止时间不能为负数')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 转换为 K8s 格式
  function toK8sFormat() {
    const spec: any = {}

    // 安全上下文 - 只在有配置时添加
    if (securityContext.value && Object.keys(securityContext.value).length > 0) {
      const hasValidContent = Object.values(securityContext.value).some(
        (v) => v !== undefined && v !== null && v !== ''
      )
      if (hasValidContent) {
        spec.securityContext = JSON.parse(JSON.stringify(securityContext.value))
      }
    }

    // 网络配置
    if (networkConfig.value.hostNetwork === true) {
      spec.hostNetwork = true
    }
    if (networkConfig.value.hostPID === true) {
      spec.hostPID = true
    }
    if (networkConfig.value.hostIPC === true) {
      spec.hostIPC = true
    }
    if (networkConfig.value.shareProcessNamespace === true) {
      spec.shareProcessNamespace = true
    }
    if (networkConfig.value.hostname && networkConfig.value.hostname.trim()) {
      spec.hostname = networkConfig.value.hostname.trim()
    }
    if (networkConfig.value.subdomain && networkConfig.value.subdomain.trim()) {
      spec.subdomain = networkConfig.value.subdomain.trim()
    }
    if (networkConfig.value.setHostnameAsFQDN === true) {
      spec.setHostnameAsFQDN = true
    }

    // DNS配置
    if (dnsPolicy.value && dnsPolicy.value !== 'ClusterFirst') {
      spec.dnsPolicy = dnsPolicy.value
    }
    if (dnsConfig.value) {
      spec.dnsConfig = JSON.parse(JSON.stringify(dnsConfig.value))
    }

    // 主机别名
    if (hostAliases.value && hostAliases.value.length > 0) {
      spec.hostAliases = JSON.parse(JSON.stringify(hostAliases.value))
    }

    // 服务账户
    if (serviceAccountName.value && serviceAccountName.value.trim()) {
      spec.serviceAccountName = serviceAccountName.value.trim()
    }
    if (automountServiceAccountToken.value !== undefined) {
      spec.automountServiceAccountToken = automountServiceAccountToken.value
    }
    if (imagePullSecrets.value && imagePullSecrets.value.length > 0) {
      spec.imagePullSecrets = JSON.parse(JSON.stringify(imagePullSecrets.value))
    }

    // 生命周期
    if (restartPolicy.value && restartPolicy.value !== 'Always') {
      spec.restartPolicy = restartPolicy.value
    }
    if (
      terminationGracePeriodSeconds.value !== undefined &&
      terminationGracePeriodSeconds.value !== 30
    ) {
      spec.terminationGracePeriodSeconds = terminationGracePeriodSeconds.value
    }
    if (activeDeadlineSeconds.value !== undefined) {
      spec.activeDeadlineSeconds = activeDeadlineSeconds.value
    }

    // 优先级
    if (priorityClassName.value && priorityClassName.value.trim()) {
      spec.priorityClassName = priorityClassName.value.trim()
    }
    if (priority.value !== undefined) {
      spec.priority = priority.value
    }
    if (preemptionPolicy.value && preemptionPolicy.value.trim()) {
      spec.preemptionPolicy = preemptionPolicy.value.trim()
    }

    // 就绪门控
    if (readinessGates.value && readinessGates.value.length > 0) {
      spec.readinessGates = JSON.parse(JSON.stringify(readinessGates.value))
    }

    // 资源开销
    if (overhead.value && Object.keys(overhead.value).length > 0) {
      spec.overhead = JSON.parse(JSON.stringify(overhead.value))
    }

    // 其他配置
    if (enableServiceLinks.value !== undefined && enableServiceLinks.value !== true) {
      spec.enableServiceLinks = enableServiceLinks.value
    }
    if (runtimeClassName.value && runtimeClassName.value.trim()) {
      spec.runtimeClassName = runtimeClassName.value.trim()
    }
    if (schedulerName.value && schedulerName.value !== 'default-scheduler') {
      spec.schedulerName = schedulerName.value
    }
    if (osName.value && osName.value.trim()) {
      spec.os = { name: osName.value.trim() }
    }

    return spec
  }

  // 从 K8s 格式加载
  function loadFromK8s(spec: any) {
    if (!spec) {
      reset()
      return
    }

    // 安全上下文 - 深拷贝
    if (spec.securityContext) {
      securityContext.value = JSON.parse(JSON.stringify(spec.securityContext))
    } else {
      securityContext.value = {}
    }

    // 网络配置 - 确保所有字段都被正确加载
    networkConfig.value = {
      hostNetwork: spec.hostNetwork === true,
      hostPID: spec.hostPID === true,
      hostIPC: spec.hostIPC === true,
      shareProcessNamespace: spec.shareProcessNamespace === true,
      hostname: spec.hostname || '',
      subdomain: spec.subdomain || '',
      setHostnameAsFQDN: spec.setHostnameAsFQDN === true
    }

    // DNS配置 - 深拷贝
    dnsPolicy.value = spec.dnsPolicy || 'ClusterFirst'
    if (spec.dnsConfig) {
      dnsConfig.value = JSON.parse(JSON.stringify(spec.dnsConfig))
    } else {
      dnsConfig.value = undefined
    }

    // 主机别名 - 深拷贝
    if (spec.hostAliases && Array.isArray(spec.hostAliases)) {
      hostAliases.value = JSON.parse(JSON.stringify(spec.hostAliases))
    } else {
      hostAliases.value = []
    }

    // 服务账户
    serviceAccountName.value = spec.serviceAccountName || undefined
    automountServiceAccountToken.value = spec.automountServiceAccountToken

    // 镜像拉取密钥 - 深拷贝
    if (spec.imagePullSecrets && Array.isArray(spec.imagePullSecrets)) {
      imagePullSecrets.value = JSON.parse(JSON.stringify(spec.imagePullSecrets))
    } else {
      imagePullSecrets.value = []
    }

    // 生命周期
    restartPolicy.value = spec.restartPolicy || 'Always'
    terminationGracePeriodSeconds.value =
      spec.terminationGracePeriodSeconds !== undefined ? spec.terminationGracePeriodSeconds : 30
    activeDeadlineSeconds.value = spec.activeDeadlineSeconds

    // 优先级
    priorityClassName.value = spec.priorityClassName || undefined
    priority.value = spec.priority
    preemptionPolicy.value = spec.preemptionPolicy || undefined

    // 就绪门控 - 深拷贝
    if (spec.readinessGates && Array.isArray(spec.readinessGates)) {
      readinessGates.value = JSON.parse(JSON.stringify(spec.readinessGates))
    } else {
      readinessGates.value = []
    }

    // 资源开销 - 深拷贝
    if (spec.overhead) {
      overhead.value = JSON.parse(JSON.stringify(spec.overhead))
    } else {
      overhead.value = {}
    }

    // 其他配置
    enableServiceLinks.value =
      spec.enableServiceLinks !== undefined ? spec.enableServiceLinks : true
    runtimeClassName.value = spec.runtimeClassName || undefined
    schedulerName.value = spec.schedulerName || 'default-scheduler'
    osName.value = spec.os?.name || undefined

    console.log('✅ Advanced store 已从 K8s 格式加载完成')
  }

  // 重置状态
  function reset() {
    securityContext.value = {}
    networkConfig.value = {
      hostNetwork: false,
      hostPID: false,
      hostIPC: false,
      shareProcessNamespace: false,
      hostname: '',
      subdomain: '',
      setHostnameAsFQDN: false
    }
    dnsPolicy.value = 'ClusterFirst'
    dnsConfig.value = undefined
    hostAliases.value = []
    serviceAccountName.value = undefined
    automountServiceAccountToken.value = undefined
    imagePullSecrets.value = []
    restartPolicy.value = 'Always'
    terminationGracePeriodSeconds.value = 30
    activeDeadlineSeconds.value = undefined
    priorityClassName.value = undefined
    priority.value = undefined
    preemptionPolicy.value = undefined
    readinessGates.value = []
    overhead.value = {}
    enableServiceLinks.value = true
    runtimeClassName.value = undefined
    schedulerName.value = 'default-scheduler'
    osName.value = undefined

    console.log('Advanced store 已重置')
  }

  return {
    // State
    securityContext,
    networkConfig,
    dnsPolicy,
    dnsConfig,
    hostAliases,
    serviceAccountName,
    automountServiceAccountToken,
    imagePullSecrets,
    restartPolicy,
    terminationGracePeriodSeconds,
    activeDeadlineSeconds,
    priorityClassName,
    priority,
    preemptionPolicy,
    readinessGates,
    overhead,
    enableServiceLinks,
    runtimeClassName,
    schedulerName,
    osName,

    // Actions
    updateSecurityContext,
    setSecurityContext,
    updateNetworkConfig,
    setDNSPolicy,
    updateDNSConfig,
    setHostAliases,
    addHostAlias,
    removeHostAlias,
    setServiceAccount,
    updateImagePullSecrets,
    setRestartPolicy,
    setTerminationGracePeriodSeconds,
    setActiveDeadlineSeconds,
    setPriorityClassName,
    setPriority,
    setPreemptionPolicy,
    setReadinessGates,
    addReadinessGate,
    removeReadinessGate,
    setOverhead,
    setEnableServiceLinks,
    setRuntimeClassName,
    setSchedulerName,
    setOSName,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})
