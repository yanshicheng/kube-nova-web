// 文件路径: src/store/workload/cronjob.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCronJobStore = defineStore('workload-cronjob', () => {
  // 调度表达式（必需）
  const schedule = ref<string>('0 0 * * *')

  // 时区
  const timeZone = ref<string | undefined>('Asia/Shanghai')

  // 并发策略
  const concurrencyPolicy = ref<'Allow' | 'Forbid' | 'Replace'>('Allow')

  // 是否暂停
  const suspend = ref<boolean>(false)

  // 启动截止时间（秒）
  const startingDeadlineSeconds = ref<number | undefined>(undefined)

  // 成功任务历史限制
  const successfulJobsHistoryLimit = ref<number>(3)

  // 失败任务历史限制
  const failedJobsHistoryLimit = ref<number>(1)

  // Job 模板配置 - 包含所有字段
  const jobTemplate = ref({
    // 基本配置
    completions: 1,
    parallelism: 1,
    backoffLimit: 6,

    // 时间配置
    activeDeadlineSeconds: undefined as number | undefined,
    ttlSecondsAfterFinished: undefined as number | undefined,

    // 完成模式
    completionMode: 'NonIndexed' as 'NonIndexed' | 'Indexed',

    // Indexed 模式配置
    backoffLimitPerIndex: undefined as number | undefined,
    maxFailedIndexes: undefined as number | undefined,

    // Pod 策略
    podFailurePolicy: undefined as string | undefined,
    podReplacementPolicy: undefined as string | undefined
  })

  // 设置调度表达式
  function setSchedule(expr: string) {
    schedule.value = expr
  }

  // 设置时区
  function setTimeZone(tz: string | undefined) {
    timeZone.value = tz
  }

  // 设置并发策略
  function setConcurrencyPolicy(policy: typeof concurrencyPolicy.value) {
    concurrencyPolicy.value = policy
  }

  // 设置暂停状态
  function setSuspend(isSuspended: boolean) {
    suspend.value = isSuspended
  }

  // 设置启动截止时间
  function setStartingDeadlineSeconds(seconds: number | undefined) {
    startingDeadlineSeconds.value = seconds
  }

  // 设置成功任务历史限制
  function setSuccessfulJobsHistoryLimit(limit: number) {
    if (limit >= 0) {
      successfulJobsHistoryLimit.value = limit
    }
  }

  // 设置失败任务历史限制
  function setFailedJobsHistoryLimit(limit: number) {
    if (limit >= 0) {
      failedJobsHistoryLimit.value = limit
    }
  }

  // 更新 Job 模板配置
  function updateJobTemplate(config: Partial<typeof jobTemplate.value>) {
    jobTemplate.value = { ...jobTemplate.value, ...config }
  }

  // 验证 Cron 表达式格式
  // 验证 Cron 表达式格式
  function validateCronExpression(expr: string): boolean {
    if (!expr || !expr.trim()) {
      return false
    }

    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) {
      return false
    }

    // 检查每个字段
    for (const part of parts) {
      // 允许的字符：* 数字 , - /
      if (!/^[\*0-9,\-/]+$/.test(part)) {
        return false
      }

      // 基本格式检查
      if (part.length === 0) {
        return false
      }
    }

    return true
  }

  // 验证函数
  function validate() {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证调度表达式
    if (!schedule.value || !schedule.value.trim()) {
      errors.push('Cron 表达式不能为空')
    } else if (!validateCronExpression(schedule.value)) {
      errors.push(`Cron 表达式格式不正确: ${schedule.value}`)
    }

    // 验证并发策略
    if (!concurrencyPolicy.value) {
      errors.push('并发策略不能为空')
    }

    // 验证启动截止时间
    if (startingDeadlineSeconds.value !== undefined && startingDeadlineSeconds.value < 0) {
      errors.push('启动截止时间不能为负数')
    }

    // 验证历史限制
    if (successfulJobsHistoryLimit.value < 0) {
      errors.push('成功任务历史限制不能为负数')
    }

    if (failedJobsHistoryLimit.value < 0) {
      errors.push('失败任务历史限制不能为负数')
    }

    // 验证 Job 模板配置
    if (!jobTemplate.value.completions || jobTemplate.value.completions < 1) {
      errors.push('完成次数必须大于 0')
    }

    if (!jobTemplate.value.parallelism || jobTemplate.value.parallelism < 1) {
      errors.push('并行度必须大于 0')
    }

    if (jobTemplate.value.backoffLimit < 0) {
      errors.push('重试次数不能为负数')
    }

    if (
      jobTemplate.value.activeDeadlineSeconds !== undefined &&
      jobTemplate.value.activeDeadlineSeconds < 1
    ) {
      errors.push('运行时限必须大于 0')
    }

    if (
      jobTemplate.value.ttlSecondsAfterFinished !== undefined &&
      jobTemplate.value.ttlSecondsAfterFinished < 0
    ) {
      errors.push('完成后 TTL 不能为负数')
    }

    // Indexed 模式验证
    if (jobTemplate.value.completionMode === 'Indexed') {
      if (
        jobTemplate.value.backoffLimitPerIndex !== undefined &&
        jobTemplate.value.backoffLimitPerIndex < 0
      ) {
        errors.push('退避限制（每个索引）不能为负数')
      }

      if (
        jobTemplate.value.maxFailedIndexes !== undefined &&
        jobTemplate.value.maxFailedIndexes < 1
      ) {
        errors.push('最大失败索引数必须大于 0')
      }
    }

    // 警告信息
    if (suspend.value) {
      warnings.push('CronJob 已暂停，不会创建新的 Job')
    }

    if (successfulJobsHistoryLimit.value === 0 && failedJobsHistoryLimit.value === 0) {
      warnings.push('成功和失败任务历史限制都为 0，将不保留任何历史记录')
    }

    if (concurrencyPolicy.value === 'Allow') {
      warnings.push('并发策略为 Allow，可能导致多个 Job 同时运行')
    }

    console.log('🔍 CronJob 验证结果:', {
      schedule: schedule.value,
      concurrencyPolicy: concurrencyPolicy.value,
      jobTemplate: jobTemplate.value,
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
    const spec: any = {
      schedule: schedule.value,
      concurrencyPolicy: concurrencyPolicy.value,
      jobTemplate: {
        spec: {
          template: {
            spec: {
              restartPolicy: 'OnFailure'
            }
          }
        }
      }
    }

    // 时区（如果支持）
    if (timeZone.value && timeZone.value.trim()) {
      spec.timeZone = timeZone.value.trim()
    }

    // 可选字段
    if (suspend.value) {
      spec.suspend = true
    }

    if (startingDeadlineSeconds.value !== undefined) {
      spec.startingDeadlineSeconds = startingDeadlineSeconds.value
    }

    if (successfulJobsHistoryLimit.value !== 3) {
      spec.successfulJobsHistoryLimit = successfulJobsHistoryLimit.value
    }

    if (failedJobsHistoryLimit.value !== 1) {
      spec.failedJobsHistoryLimit = failedJobsHistoryLimit.value
    }

    // Job 模板配置
    const jobSpec = spec.jobTemplate.spec

    if (jobTemplate.value.completions !== 1) {
      jobSpec.completions = jobTemplate.value.completions
    }

    if (jobTemplate.value.parallelism !== 1) {
      jobSpec.parallelism = jobTemplate.value.parallelism
    }

    if (jobTemplate.value.backoffLimit !== 6) {
      jobSpec.backoffLimit = jobTemplate.value.backoffLimit
    }

    if (jobTemplate.value.activeDeadlineSeconds !== undefined) {
      jobSpec.activeDeadlineSeconds = jobTemplate.value.activeDeadlineSeconds
    }

    if (jobTemplate.value.ttlSecondsAfterFinished !== undefined) {
      jobSpec.ttlSecondsAfterFinished = jobTemplate.value.ttlSecondsAfterFinished
    }

    if (jobTemplate.value.completionMode !== 'NonIndexed') {
      jobSpec.completionMode = jobTemplate.value.completionMode
    }

    // Indexed 模式配置
    if (jobTemplate.value.completionMode === 'Indexed') {
      if (jobTemplate.value.backoffLimitPerIndex !== undefined) {
        jobSpec.backoffLimitPerIndex = jobTemplate.value.backoffLimitPerIndex
      }

      if (jobTemplate.value.maxFailedIndexes !== undefined) {
        jobSpec.maxFailedIndexes = jobTemplate.value.maxFailedIndexes
      }
    }

    // Pod 策略
    if (jobTemplate.value.podFailurePolicy && jobTemplate.value.podFailurePolicy.trim()) {
      jobSpec.podFailurePolicy = {
        rules: [
          {
            action: jobTemplate.value.podFailurePolicy,
            onExitCodes: {
              operator: 'In',
              values: [1]
            }
          }
        ]
      }
    }

    if (jobTemplate.value.podReplacementPolicy && jobTemplate.value.podReplacementPolicy.trim()) {
      jobSpec.podReplacementPolicy = jobTemplate.value.podReplacementPolicy
    }

    return spec
  }

  // 从 K8s 格式加载
  function loadFromK8s(spec: any) {
    if (!spec) {
      reset()
      return
    }

    schedule.value = spec.schedule || '0 0 * * *'
    timeZone.value = spec.timeZone || 'Asia/Shanghai'
    concurrencyPolicy.value = spec.concurrencyPolicy || 'Allow'
    suspend.value = spec.suspend || false
    startingDeadlineSeconds.value = spec.startingDeadlineSeconds
    successfulJobsHistoryLimit.value =
      spec.successfulJobsHistoryLimit !== undefined ? spec.successfulJobsHistoryLimit : 3
    failedJobsHistoryLimit.value =
      spec.failedJobsHistoryLimit !== undefined ? spec.failedJobsHistoryLimit : 1

    // 加载 Job 模板配置
    const jobSpec = spec.jobTemplate?.spec
    if (jobSpec) {
      jobTemplate.value = {
        completions: jobSpec.completions !== undefined ? jobSpec.completions : 1,
        parallelism: jobSpec.parallelism !== undefined ? jobSpec.parallelism : 1,
        backoffLimit: jobSpec.backoffLimit !== undefined ? jobSpec.backoffLimit : 6,
        activeDeadlineSeconds: jobSpec.activeDeadlineSeconds,
        ttlSecondsAfterFinished: jobSpec.ttlSecondsAfterFinished,
        completionMode: jobSpec.completionMode || 'NonIndexed',
        backoffLimitPerIndex: jobSpec.backoffLimitPerIndex,
        maxFailedIndexes: jobSpec.maxFailedIndexes,
        podFailurePolicy: jobSpec.podFailurePolicy?.rules?.[0]?.action,
        podReplacementPolicy: jobSpec.podReplacementPolicy
      }
    }

    console.log('✅ CronJob store 已从 K8s 格式加载')
  }

  // 重置
  function reset() {
    schedule.value = '0 0 * * *'
    timeZone.value = 'Asia/Shanghai'
    concurrencyPolicy.value = 'Allow'
    suspend.value = false
    startingDeadlineSeconds.value = undefined
    successfulJobsHistoryLimit.value = 3
    failedJobsHistoryLimit.value = 1
    jobTemplate.value = {
      completions: 1,
      parallelism: 1,
      backoffLimit: 6,
      activeDeadlineSeconds: undefined,
      ttlSecondsAfterFinished: undefined,
      completionMode: 'NonIndexed',
      backoffLimitPerIndex: undefined,
      maxFailedIndexes: undefined,
      podFailurePolicy: undefined,
      podReplacementPolicy: undefined
    }
    console.log('CronJob store 已重置')
  }

  return {
    // State
    schedule,
    timeZone,
    concurrencyPolicy,
    suspend,
    startingDeadlineSeconds,
    successfulJobsHistoryLimit,
    failedJobsHistoryLimit,
    jobTemplate,

    // Actions
    setSchedule,
    setTimeZone,
    setConcurrencyPolicy,
    setSuspend,
    setStartingDeadlineSeconds,
    setSuccessfulJobsHistoryLimit,
    setFailedJobsHistoryLimit,
    updateJobTemplate,
    validateCronExpression,
    validate,
    toK8sFormat,
    loadFromK8s,
    reset
  }
})
