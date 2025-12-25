// 文件路径: src/store/workload/job.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useJobStore = defineStore('workload-job', () => {
  // 完成次数（必需）
  const completions = ref<number>(1)

  // 并行度
  const parallelism = ref<number>(1)

  // 重试次数
  const backoffLimit = ref<number>(6)

  // 活动截止时间（秒）
  const activeDeadlineSeconds = ref<number | undefined>(undefined)

  // 完成后 TTL（秒）
  const ttlSecondsAfterFinished = ref<number | undefined>(undefined)

  // 完成模式
  const completionMode = ref<'NonIndexed' | 'Indexed'>('NonIndexed')

  // 退避限制（每个索引）- 仅 Indexed 模式
  const backoffLimitPerIndex = ref<number | undefined>(undefined)

  // 最大失败索引数 - 仅 Indexed 模式
  const maxFailedIndexes = ref<number | undefined>(undefined)

  // Pod 失败策略
  const podFailurePolicy = ref<string | undefined>(undefined)

  // Pod 替换策略
  const podReplacementPolicy = ref<string | undefined>(undefined)

  // 设置完成次数
  function setCompletions(count: number) {
    if (count >= 1) {
      completions.value = count
    }
  }

  // 设置并行度
  function setParallelism(count: number) {
    if (count >= 1) {
      parallelism.value = count
    }
  }

  // 设置重试次数
  function setBackoffLimit(limit: number) {
    if (limit >= 0) {
      backoffLimit.value = limit
    }
  }

  // 设置活动截止时间
  function setActiveDeadlineSeconds(seconds: number | undefined) {
    activeDeadlineSeconds.value = seconds
  }

  // 设置完成后 TTL
  function setTtlSecondsAfterFinished(seconds: number | undefined) {
    ttlSecondsAfterFinished.value = seconds
  }

  // 设置完成模式
  function setCompletionMode(mode: typeof completionMode.value) {
    completionMode.value = mode
    // 切换到 NonIndexed 模式时，清除 Indexed 专属配置
    if (mode === 'NonIndexed') {
      backoffLimitPerIndex.value = undefined
      maxFailedIndexes.value = undefined
    }
  }

  // 设置退避限制（每个索引）
  function setBackoffLimitPerIndex(limit: number | undefined) {
    backoffLimitPerIndex.value = limit
  }

  // 设置最大失败索引数
  function setMaxFailedIndexes(count: number | undefined) {
    maxFailedIndexes.value = count
  }

  // 设置 Pod 失败策略
  function setPodFailurePolicy(policy: string | undefined) {
    podFailurePolicy.value = policy
  }

  // 设置 Pod 替换策略
  function setPodReplacementPolicy(policy: string | undefined) {
    podReplacementPolicy.value = policy
  }

  // 验证
  function validate() {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证完成次数
    if (completions.value === undefined || completions.value < 1) {
      errors.push('完成次数必须大于 0')
    }

    // 验证并行度
    if (parallelism.value === undefined || parallelism.value < 1) {
      errors.push('并行度必须大于 0')
    }

    // 验证重试次数
    if (backoffLimit.value < 0) {
      errors.push('重试次数不能为负数')
    }

    // 验证活动截止时间
    if (activeDeadlineSeconds.value !== undefined) {
      if (activeDeadlineSeconds.value < 1) {
        errors.push('运行时限必须大于 0')
      }
    }

    // 验证完成后 TTL
    if (ttlSecondsAfterFinished.value !== undefined && ttlSecondsAfterFinished.value < 0) {
      errors.push('完成后 TTL 不能为负数')
    }

    // 验证 Indexed 模式特定配置
    if (completionMode.value === 'Indexed') {
      if (backoffLimitPerIndex.value !== undefined && backoffLimitPerIndex.value < 0) {
        errors.push('退避限制（每个索引）不能为负数')
      }

      if (maxFailedIndexes.value !== undefined) {
        if (maxFailedIndexes.value < 1) {
          errors.push('最大失败索引数必须大于 0')
        }
        if (maxFailedIndexes.value > completions.value) {
          errors.push('最大失败索引数不能超过完成次数')
        }
      }
    }

    // 警告信息
    if (parallelism.value > completions.value) {
      warnings.push('并行度大于完成次数，实际并行数会受完成次数限制')
    }

    if (backoffLimit.value === 0) {
      warnings.push('重试次数为 0，Pod 失败后将不会重试')
    }

    if (backoffLimit.value > 10) {
      warnings.push('重试次数过多可能导致失败任务占用过多资源')
    }

    if (ttlSecondsAfterFinished.value === 0) {
      warnings.push('完成后 TTL 为 0，Job 完成或失败后将立即被删除')
    }

    if (activeDeadlineSeconds.value === undefined) {
      warnings.push('未设置运行时限，任务可能无限期运行')
    }

    console.log('🔍 Job 验证结果:', {
      completions: completions.value,
      parallelism: parallelism.value,
      backoffLimit: backoffLimit.value,
      completionMode: completionMode.value,
      valid: errors.length === 0,
      errors,
      warnings
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

    // 必需字段
    if (completions.value !== 1) {
      spec.completions = completions.value
    }

    if (parallelism.value !== 1) {
      spec.parallelism = parallelism.value
    }

    // 可选字段
    if (backoffLimit.value !== 6) {
      spec.backoffLimit = backoffLimit.value
    }

    if (activeDeadlineSeconds.value !== undefined) {
      spec.activeDeadlineSeconds = activeDeadlineSeconds.value
    }

    if (ttlSecondsAfterFinished.value !== undefined) {
      spec.ttlSecondsAfterFinished = ttlSecondsAfterFinished.value
    }

    if (completionMode.value !== 'NonIndexed') {
      spec.completionMode = completionMode.value
    }

    // Indexed 模式特定配置
    if (completionMode.value === 'Indexed') {
      if (backoffLimitPerIndex.value !== undefined) {
        spec.backoffLimitPerIndex = backoffLimitPerIndex.value
      }
      if (maxFailedIndexes.value !== undefined) {
        spec.maxFailedIndexes = maxFailedIndexes.value
      }
    }

    // Pod 策略
    if (podFailurePolicy.value && podFailurePolicy.value.trim()) {
      spec.podFailurePolicy = {
        rules: [
          {
            action: podFailurePolicy.value,
            onExitCodes: {
              operator: 'In',
              values: [1]
            }
          }
        ]
      }
    }

    if (podReplacementPolicy.value && podReplacementPolicy.value.trim()) {
      spec.podReplacementPolicy = podReplacementPolicy.value
    }

    return spec
  }

  // 从 K8s 格式加载
  function loadFromK8s(spec: any) {
    if (!spec) {
      reset()
      return
    }

    completions.value = spec.completions !== undefined ? spec.completions : 1
    parallelism.value = spec.parallelism !== undefined ? spec.parallelism : 1
    backoffLimit.value = spec.backoffLimit !== undefined ? spec.backoffLimit : 6
    activeDeadlineSeconds.value = spec.activeDeadlineSeconds
    ttlSecondsAfterFinished.value = spec.ttlSecondsAfterFinished
    completionMode.value = spec.completionMode || 'NonIndexed'
    backoffLimitPerIndex.value = spec.backoffLimitPerIndex
    maxFailedIndexes.value = spec.maxFailedIndexes

    // 加载 Pod 策略
    if (spec.podFailurePolicy?.rules?.[0]?.action) {
      podFailurePolicy.value = spec.podFailurePolicy.rules[0].action
    } else {
      podFailurePolicy.value = undefined
    }

    podReplacementPolicy.value = spec.podReplacementPolicy

    console.log('✅ Job store 已从 K8s 格式加载')
  }

  // 重置
  function reset() {
    completions.value = 1
    parallelism.value = 1
    backoffLimit.value = 6
    activeDeadlineSeconds.value = undefined
    ttlSecondsAfterFinished.value = undefined
    completionMode.value = 'NonIndexed'
    backoffLimitPerIndex.value = undefined
    maxFailedIndexes.value = undefined
    podFailurePolicy.value = undefined
    podReplacementPolicy.value = undefined
    console.log('Job store 已重置')
  }

  return {
    // State
    completions,
    parallelism,
    backoffLimit,
    activeDeadlineSeconds,
    ttlSecondsAfterFinished,
    completionMode,
    backoffLimitPerIndex,
    maxFailedIndexes,
    podFailurePolicy,
    podReplacementPolicy,

    // Actions
    setCompletions,
    setParallelism,
    setBackoffLimit,
    setActiveDeadlineSeconds,
    setTtlSecondsAfterFinished,
    setCompletionMode,
    setBackoffLimitPerIndex,
    setMaxFailedIndexes,
    setPodFailurePolicy,
    setPodReplacementPolicy,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})