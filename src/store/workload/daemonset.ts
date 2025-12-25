// 文件路径: src/store/workload/daemonset.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { V1DaemonSetUpdateStrategy } from '@kubernetes/client-node'

export const useDaemonSetStore = defineStore('workload-daemonset', () => {
  // 更新策略
  const updateStrategy = ref<V1DaemonSetUpdateStrategy>({
    type: 'RollingUpdate',
    rollingUpdate: {
      maxUnavailable: 1
    }
  })

  // 历史版本限制
  const revisionHistoryLimit = ref<number>(10)

  // 最小就绪秒数
  const minReadySeconds = ref<number>(0)

  // 设置更新策略
  function setUpdateStrategy(strategy: V1DaemonSetUpdateStrategy) {
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

  // 验证
  function validate() {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证更新策略
    if (updateStrategy.value.type === 'RollingUpdate') {
      const rollingUpdate = updateStrategy.value.rollingUpdate
      if (rollingUpdate) {
        if (
          rollingUpdate.maxUnavailable !== undefined &&
          typeof rollingUpdate.maxUnavailable === 'number' &&
          rollingUpdate.maxUnavailable < 0
        ) {
          errors.push('最大不可用数不能为负数')
        }
        if (rollingUpdate.maxUnavailable === 0) {
          warnings.push('最大不可用数为 0 可能导致更新无法进行')
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
    const spec: any = {}

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

    return spec
  }

  // 从 K8s 格式加载
  function loadFromK8s(spec: any) {
    if (!spec) {
      reset()
      return
    }

    if (spec.updateStrategy) {
      updateStrategy.value = JSON.parse(JSON.stringify(spec.updateStrategy))
    } else {
      updateStrategy.value = {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxUnavailable: 1
        }
      }
    }

    revisionHistoryLimit.value =
      spec.revisionHistoryLimit !== undefined ? spec.revisionHistoryLimit : 10
    minReadySeconds.value = spec.minReadySeconds || 0

    console.log('✅ DaemonSet store 已从 K8s 格式加载')
  }

  // 重置
  function reset() {
    updateStrategy.value = {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxUnavailable: 1
      }
    }
    revisionHistoryLimit.value = 10
    minReadySeconds.value = 0
    console.log('DaemonSet store 已重置')
  }

  return {
    // State
    updateStrategy,
    revisionHistoryLimit,
    minReadySeconds,

    // Actions
    setUpdateStrategy,
    setRevisionHistoryLimit,
    setMinReadySeconds,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})