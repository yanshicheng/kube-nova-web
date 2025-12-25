// 文件路径: src/store/workload/deployment.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { V1DeploymentStrategy } from '@kubernetes/client-node'

export const useDeploymentStore = defineStore('workload-deployment', () => {
  // 副本数
  const replicas = ref<number>(1)

  // 更新策略
  const strategy = ref<V1DeploymentStrategy>({
    type: 'RollingUpdate',
    rollingUpdate: {
      maxUnavailable: '25%',
      maxSurge: '25%'
    }
  })

  // 历史版本限制
  const revisionHistoryLimit = ref<number>(10)

  // 进度截止时间（秒）
  const progressDeadlineSeconds = ref<number>(600)

  // 最小就绪秒数
  const minReadySeconds = ref<number>(0)

  // 是否暂停部署
  const paused = ref<boolean>(false)

  // 设置副本数
  function setReplicas(count: number) {
    if (count >= 0) {
      replicas.value = count
    }
  }

  // 设置更新策略
  function setStrategy(newStrategy: V1DeploymentStrategy) {
    strategy.value = { ...newStrategy }
  }

  // 设置历史版本限制
  function setRevisionHistoryLimit(limit: number) {
    if (limit >= 0) {
      revisionHistoryLimit.value = limit
    }
  }

  // 设置进度截止时间
  function setProgressDeadlineSeconds(seconds: number) {
    if (seconds > 0) {
      progressDeadlineSeconds.value = seconds
    }
  }

  // 设置最小就绪秒数
  function setMinReadySeconds(seconds: number) {
    if (seconds >= 0) {
      minReadySeconds.value = seconds
    }
  }

  // 设置暂停状态
  function setPaused(isPaused: boolean) {
    paused.value = isPaused
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
      warnings.push('副本数为 0，Deployment 将不会创建任何 Pod')
    }

    // 验证更新策略
    if (strategy.value.type === 'RollingUpdate') {
      const rollingUpdate = strategy.value.rollingUpdate
      if (!rollingUpdate) {
        errors.push('滚动更新策略缺少配置')
      } else {
        // 验证 maxUnavailable
        if (rollingUpdate.maxUnavailable === undefined || rollingUpdate.maxUnavailable === null) {
          warnings.push('建议配置 maxUnavailable')
        }
        // 验证 maxSurge
        if (rollingUpdate.maxSurge === undefined || rollingUpdate.maxSurge === null) {
          warnings.push('建议配置 maxSurge')
        }
      }
    }

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
      replicas: replicas.value,
      strategy: { ...strategy.value }
    }

    // 可选字段
    if (revisionHistoryLimit.value !== 10) {
      spec.revisionHistoryLimit = revisionHistoryLimit.value
    }

    if (progressDeadlineSeconds.value !== 600) {
      spec.progressDeadlineSeconds = progressDeadlineSeconds.value
    }

    if (minReadySeconds.value > 0) {
      spec.minReadySeconds = minReadySeconds.value
    }

    if (paused.value) {
      spec.paused = true
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

    if (spec.strategy) {
      strategy.value = JSON.parse(JSON.stringify(spec.strategy))
    } else {
      strategy.value = {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxUnavailable: '25%',
          maxSurge: '25%'
        }
      }
    }

    revisionHistoryLimit.value =
      spec.revisionHistoryLimit !== undefined ? spec.revisionHistoryLimit : 10
    progressDeadlineSeconds.value =
      spec.progressDeadlineSeconds !== undefined ? spec.progressDeadlineSeconds : 600
    minReadySeconds.value = spec.minReadySeconds || 0
    paused.value = spec.paused || false

    console.log('✅ Deployment store 已从 K8s 格式加载')
  }

  // 重置
  function reset() {
    replicas.value = 1
    strategy.value = {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxUnavailable: '25%',
        maxSurge: '25%'
      }
    }
    revisionHistoryLimit.value = 10
    progressDeadlineSeconds.value = 600
    minReadySeconds.value = 0
    paused.value = false
    console.log('Deployment store 已重置')
  }

  return {
    // State
    replicas,
    strategy,
    revisionHistoryLimit,
    progressDeadlineSeconds,
    minReadySeconds,
    paused,

    // Actions
    setReplicas,
    setStrategy,
    setRevisionHistoryLimit,
    setProgressDeadlineSeconds,
    setMinReadySeconds,
    setPaused,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})
