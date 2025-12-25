<template>
  <div class="cronjob-config-step">
    <!-- 配置摘要横幅 -->
    <div class="summary-banner">
      <div class="summary-item">
        <Clock :size="16" />
        <span class="label">调度</span>
        <code class="value">{{ cronJobStore.schedule }}</code>
        <span v-if="cronDescription" class="desc">{{ cronDescription }}</span>
      </div>
      <div class="summary-item">
        <Layers :size="16" />
        <span class="label">并发</span>
        <ElTag :type="getConcurrencyTagType()" size="small">
          {{ getConcurrencyText() }}
        </ElTag>
      </div>
      <div class="summary-item">
        <PlayCircle :size="16" />
        <span class="label">Job</span>
        <span class="value"
          >{{ cronJobStore.jobTemplate.completions }}次 /
          {{ cronJobStore.jobTemplate.parallelism }}并行</span
        >
      </div>
      <div class="summary-item" v-if="cronJobStore.suspend">
        <PauseCircle :size="16" />
        <ElTag type="warning" size="small">已暂停</ElTag>
      </div>
    </div>

    <ElForm label-width="140px" label-position="right" size="default">
      <ElRow :gutter="20">
        <!-- 左列 -->
        <ElCol :xs="24" :lg="12">
          <!-- 调度配置 -->
          <ElCard class="compact-card" shadow="never">
            <template #header>
              <span class="card-title">
                <Calendar :size="18" />
                调度配置
              </span>
            </template>

            <ElFormItem label="Cron 表达式" required>
              <ElInput
                v-model="cronExpression"
                placeholder="例如: */5 * * * * (每5分钟执行)"
                clearable
              >
                <template #prepend>
                  <Clock :size="16" />
                </template>
              </ElInput>
              <div v-if="cronDescription" class="quick-hint success">
                <CheckCircle :size="14" />
                {{ cronDescription }}
              </div>
            </ElFormItem>

            <ElFormItem label="快捷配置">
              <ElSelect
                v-model="selectedQuickCron"
                placeholder="选择常用配置快速填入"
                clearable
                @change="handleQuickCronSelect"
              >
                <ElOptionGroup label="常用配置">
                  <ElOption
                    v-for="item in commonCronExpressions"
                    :key="item.value"
                    :label="item.desc"
                    :value="item.value"
                  >
                    <div class="cron-option">
                      <code>{{ item.value }}</code>
                      <span class="cron-desc">{{ item.desc }}</span>
                    </div>
                  </ElOption>
                </ElOptionGroup>
                <ElOptionGroup label="按分钟">
                  <ElOption
                    v-for="item in minuteCronExpressions"
                    :key="item.value"
                    :label="item.desc"
                    :value="item.value"
                  >
                    <div class="cron-option">
                      <code>{{ item.value }}</code>
                      <span class="cron-desc">{{ item.desc }}</span>
                    </div>
                  </ElOption>
                </ElOptionGroup>
                <ElOptionGroup label="按小时">
                  <ElOption
                    v-for="item in hourlyCronExpressions"
                    :key="item.value"
                    :label="item.desc"
                    :value="item.value"
                  >
                    <div class="cron-option">
                      <code>{{ item.value }}</code>
                      <span class="cron-desc">{{ item.desc }}</span>
                    </div>
                  </ElOption>
                </ElOptionGroup>
              </ElSelect>
              <div class="inline-hint">
                <Info :size="14" />
                选择快捷配置后自动填入上方输入框，也可直接输入自定义表达式
              </div>
            </ElFormItem>

            <ElFormItem label="时区">
              <ElSelect
                v-model="cronJobStore.timeZone"
                clearable
                placeholder="使用集群时区"
                @change="emitValidation"
              >
                <ElOption label="上海 (UTC+8)" value="Asia/Shanghai" />
                <ElOption label="香港 (UTC+8)" value="Asia/Hong_Kong" />
                <ElOption label="北京 (UTC+8)" value="Asia/Beijing" />
                <ElOption label="东京 (UTC+9)" value="Asia/Tokyo" />
                <ElOption label="首尔 (UTC+9)" value="Asia/Seoul" />
                <ElOption label="新加坡 (UTC+8)" value="Asia/Singapore" />
                <ElOption label="纽约 (UTC-5)" value="America/New_York" />
                <ElOption label="洛杉矶 (UTC-8)" value="America/Los_Angeles" />
                <ElOption label="伦敦 (UTC+0)" value="Europe/London" />
                <ElOption label="巴黎 (UTC+1)" value="Europe/Paris" />
                <ElOption label="UTC" value="UTC" />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="并发策略" required>
              <ElSelect v-model="cronJobStore.concurrencyPolicy" @change="emitValidation">
                <ElOption label="Allow - 允许并发" value="Allow">
                  <div class="option-detail">
                    <span>Allow - 允许并发</span>
                    <span class="sub">允许多个 Job 同时运行</span>
                  </div>
                </ElOption>
                <ElOption label="Forbid - 禁止并发" value="Forbid">
                  <div class="option-detail">
                    <span>Forbid - 禁止并发</span>
                    <span class="sub">如果前一个 Job 未完成，跳过新的 Job</span>
                  </div>
                </ElOption>
                <ElOption label="Replace - 替换运行" value="Replace">
                  <div class="option-detail">
                    <span>Replace - 替换运行</span>
                    <span class="sub">终止正在运行的 Job，启动新的 Job</span>
                  </div>
                </ElOption>
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="启动截止时间">
              <ElInputNumber
                v-model="cronJobStore.startingDeadlineSeconds"
                :min="0"
                :max="86400"
                :step="60"
                placeholder="不限制"
                controls-position="right"
                @change="emitValidation"
              >
                <template #suffix>秒</template>
              </ElInputNumber>
              <div class="inline-hint">错过调度时间后，多久内仍可启动</div>
            </ElFormItem>

            <ElFormItem label="暂停调度">
              <ElSwitch
                v-model="cronJobStore.suspend"
                active-text="已暂停"
                inactive-text="运行中"
                @change="emitValidation"
              />
            </ElFormItem>

            <ElAlert v-if="cronJobStore.suspend" type="warning" :closable="false" show-icon>
              <template #title>⚠️ 调度已暂停</template>
              暂停后不会创建新的 Job，已存在的 Job 不受影响
            </ElAlert>
          </ElCard>

          <!-- 历史记录限制 -->
          <ElCard class="compact-card" shadow="never">
            <template #header>
              <span class="card-title">
                <Archive :size="18" />
                历史记录限制
              </span>
            </template>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="成功任务" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.successfulJobsHistoryLimit"
                    :min="0"
                    :max="100"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="失败任务" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.failedJobsHistoryLimit"
                    :min="0"
                    :max="100"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <div class="inline-hint">
              <Info :size="14" />
              保留最近多少个 Job 的历史记录，0 表示不保留
            </div>
          </ElCard>
        </ElCol>

        <!-- 右列 -->
        <ElCol :xs="24" :lg="12">
          <!-- Job 模板配置 -->
          <ElCard class="compact-card" shadow="never">
            <template #header>
              <span class="card-title">
                <FileText :size="18" />
                Job 模板配置
              </span>
            </template>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="完成次数" label-width="90px" required>
                  <ElInputNumber
                    v-model="cronJobStore.jobTemplate.completions"
                    :min="1"
                    :max="10000"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="并行度" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.jobTemplate.parallelism"
                    :min="1"
                    :max="1000"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="重试次数" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.jobTemplate.backoffLimit"
                    :min="0"
                    :max="100"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="完成模式" label-width="90px">
                  <ElSelect
                    v-model="cronJobStore.jobTemplate.completionMode"
                    @change="emitValidation"
                  >
                    <ElOption label="NonIndexed" value="NonIndexed" />
                    <ElOption label="Indexed" value="Indexed" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElDivider style="margin: 12px 0">
              <span style="font-size: 12px; color: #909399">时间配置</span>
            </ElDivider>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="运行时限" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.jobTemplate.activeDeadlineSeconds"
                    :min="1"
                    :max="86400"
                    placeholder="不限制"
                    controls-position="right"
                    @change="emitValidation"
                  >
                    <template #suffix>秒</template>
                  </ElInputNumber>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="完成后TTL" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.jobTemplate.ttlSecondsAfterFinished"
                    :min="0"
                    :max="86400"
                    placeholder="不清理"
                    controls-position="right"
                    @change="emitValidation"
                  >
                    <template #suffix>秒</template>
                  </ElInputNumber>
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElDivider style="margin: 12px 0">
              <span style="font-size: 12px; color: #909399">Indexed 模式配置</span>
            </ElDivider>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="退避/索引" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.jobTemplate.backoffLimitPerIndex"
                    :min="0"
                    :max="100"
                    :disabled="cronJobStore.jobTemplate.completionMode !== 'Indexed'"
                    placeholder="全局"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="最大失败" label-width="90px">
                  <ElInputNumber
                    v-model="cronJobStore.jobTemplate.maxFailedIndexes"
                    :min="1"
                    :max="1000"
                    :disabled="cronJobStore.jobTemplate.completionMode !== 'Indexed'"
                    placeholder="不限"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElDivider style="margin: 12px 0">
              <span style="font-size: 12px; color: #909399">Pod 策略</span>
            </ElDivider>

            <ElFormItem label="Pod 失败策略" label-width="120px">
              <ElSelect
                v-model="cronJobStore.jobTemplate.podFailurePolicy"
                clearable
                placeholder="默认策略"
                @change="emitValidation"
              >
                <ElOption label="Count - 计数所有失败" value="Count" />
                <ElOption label="Ignore - 忽略失败" value="IgnorePodFailure" />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="Pod 替换策略" label-width="120px">
              <ElSelect
                v-model="cronJobStore.jobTemplate.podReplacementPolicy"
                clearable
                placeholder="默认策略"
                @change="emitValidation"
              >
                <ElOption label="终止或失败时" value="TerminatingOrFailed" />
                <ElOption label="仅失败时" value="Failed" />
              </ElSelect>
            </ElFormItem>
          </ElCard>
        </ElCol>
      </ElRow>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import {
    Calendar,
    Info,
    Layers,
    Clock,
    FileText,
    Archive,
    CheckCircle,
    PlayCircle,
    PauseCircle
  } from 'lucide-vue-next'
  import { useCronJobStore } from '@/store/workload/cronjob'

  // Props
  interface Props {
    mode?: string
  }

  defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    validate: [result: { valid: boolean; errors: string[]; warnings?: string[] }]
  }>()

  // Store
  const cronJobStore = useCronJobStore()

  // 使用 computed 来确保双向绑定正常工作
  const cronExpression = computed({
    get: () => cronJobStore.schedule,
    set: (value: string) => {
      cronJobStore.setSchedule(value)
      // 检查是否是预设表达式
      const foundPreset = allCronExpressions.find((item) => item.value === value)
      if (foundPreset) {
        selectedQuickCron.value = foundPreset.value
      } else {
        selectedQuickCron.value = ''
      }
      emitValidation()
    }
  })

  // 快捷配置选中值
  const selectedQuickCron = ref<string>('')

  // Cron 表达式选项
  const commonCronExpressions = [
    { value: '0 0 * * *', desc: '每天零点 (00:00)' },
    { value: '0 9 * * *', desc: '每天上午9点 (09:00)' },
    { value: '0 12 * * *', desc: '每天中午12点 (12:00)' },
    { value: '0 18 * * *', desc: '每天下午6点 (18:00)' },
    { value: '0 0 * * 1', desc: '每周一零点' },
    { value: '0 0 1 * *', desc: '每月1号零点' }
  ]

  const minuteCronExpressions = [
    { value: '*/1 * * * *', desc: '每1分钟' },
    { value: '*/5 * * * *', desc: '每5分钟' },
    { value: '*/10 * * * *', desc: '每10分钟' },
    { value: '*/15 * * * *', desc: '每15分钟' },
    { value: '*/30 * * * *', desc: '每30分钟' }
  ]

  const hourlyCronExpressions = [
    { value: '0 * * * *', desc: '每小时' },
    { value: '0 */2 * * *', desc: '每2小时' },
    { value: '0 */4 * * *', desc: '每4小时' },
    { value: '0 */6 * * *', desc: '每6小时' },
    { value: '0 */12 * * *', desc: '每12小时' }
  ]

  const allCronExpressions = [
    ...commonCronExpressions,
    ...minuteCronExpressions,
    ...hourlyCronExpressions
  ]

  // Cron 描述
  const cronDescription = ref<string>('')

  // 处理快捷配置选择
  function handleQuickCronSelect(value: string) {
    if (value) {
      cronJobStore.setSchedule(value)
      selectedQuickCron.value = value
      emitValidation()
    } else {
      selectedQuickCron.value = ''
    }
  }

  // 解析 Cron 表达式
  function parseCronExpression(expr: string): string {
    if (!expr || !expr.trim()) return ''

    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) return '格式错误：需要 5 位表达式 (分 时 日 月 周)'

    try {
      const [minute, hour, day, month, weekday] = parts

      // 按分钟
      if (minute.startsWith('*/')) {
        const interval = minute.substring(2)
        return `每 ${interval} 分钟执行`
      }

      // 按小时
      if (minute === '0' && hour.startsWith('*/')) {
        const interval = hour.substring(2)
        return `每 ${interval} 小时执行`
      }

      if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        return '每分钟执行'
      }

      if (minute === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        return '每小时执行'
      }

      if (hour !== '*' && !hour.includes('*') && day === '*' && month === '*' && weekday === '*') {
        const minuteStr = minute === '0' ? '00' : minute.padStart(2, '0')
        return `每天 ${hour}:${minuteStr} 执行`
      }

      if (weekday !== '*' && day === '*' && month === '*') {
        const days = ['日', '一', '二', '三', '四', '五', '六']
        const dayText = weekday
          .split(',')
          .map((d) => '周' + days[parseInt(d)])
          .join(', ')
        return `${dayText} ${hour}:${minute.padStart(2, '0')} 执行`
      }

      if (day !== '*' && month === '*' && weekday === '*') {
        return `每月 ${day} 号 ${hour}:${minute.padStart(2, '0')} 执行`
      }

      return '自定义调度'
    } catch {
      return '格式错误'
    }
  }

  // 监听 schedule 变化
  watch(
    () => cronJobStore.schedule,
    (newSchedule) => {
      cronDescription.value = parseCronExpression(newSchedule)
    },
    { immediate: true }
  )

  // 获取并发策略标签类型
  function getConcurrencyTagType() {
    switch (cronJobStore.concurrencyPolicy) {
      case 'Allow':
        return 'success'
      case 'Forbid':
        return 'warning'
      case 'Replace':
        return 'danger'
      default:
        return 'info'
    }
  }

  // 获取并发策略文本
  function getConcurrencyText() {
    switch (cronJobStore.concurrencyPolicy) {
      case 'Allow':
        return '允许并发'
      case 'Forbid':
        return '禁止并发'
      case 'Replace':
        return '替换运行'
      default:
        return cronJobStore.concurrencyPolicy
    }
  }

  // 发送验证结果
  function emitValidation() {
    const validation = cronJobStore.validate()

    emit('validate', validation)
  }

  // 验证
  function validate() {
    const validation = cronJobStore.validate()
    emitValidation()
    return validation.valid
  }

  // 初始化
  onMounted(() => {
    // 设置默认值
    if (!cronJobStore.timeZone) {
      cronJobStore.setTimeZone('Asia/Shanghai')
    }

    if (!cronJobStore.concurrencyPolicy) {
      cronJobStore.setConcurrencyPolicy('Allow')
    }

    // 确保 Job 模板有默认值
    const updates: any = {}
    if (!cronJobStore.jobTemplate.completions || cronJobStore.jobTemplate.completions < 1) {
      updates.completions = 1
    }
    if (!cronJobStore.jobTemplate.parallelism || cronJobStore.jobTemplate.parallelism < 1) {
      updates.parallelism = 1
    }
    if (cronJobStore.jobTemplate.backoffLimit === undefined) {
      updates.backoffLimit = 6
    }
    if (!cronJobStore.jobTemplate.completionMode) {
      updates.completionMode = 'NonIndexed'
    }

    if (Object.keys(updates).length > 0) {
      cronJobStore.updateJobTemplate(updates)
    }

    // 检查当前表达式是否在预设列表中
    const currentExpr = cronJobStore.schedule
    const foundPreset = allCronExpressions.find((item) => item.value === currentExpr)
    if (foundPreset) {
      selectedQuickCron.value = foundPreset.value
    }

    // 立即触发验证
    emitValidation()
  })

  // 导出
  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .cronjob-config-step {
    .summary-banner {
      display: flex;
      gap: 16px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;

      .summary-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: white;
        font-size: 13px;

        .label {
          opacity: 0.9;
        }

        .value,
        code {
          font-weight: 600;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .desc {
          opacity: 0.85;
          font-size: 12px;
        }
      }
    }

    .compact-card {
      margin-bottom: 16px;
      border: 1px solid #e4e7ed;

      &:last-child {
        margin-bottom: 0;
      }

      ::v-deep(.el-card__header) {
        padding: 12px 16px;
        background: #fafbfc;
        border-bottom: 1px solid #e4e7ed;
      }

      ::v-deep(.el-card__body) {
        padding: 16px;
      }

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        color: #303133;
      }
    }

    ::v-deep(.el-form-item) {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    ::v-deep(.el-form-item__label) {
      font-size: 13px;
      color: #606266;
    }

    .cron-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 8px;

      code {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 12px;
        color: #1890ff;
        background: #f0f9ff;
        padding: 2px 8px;
        border-radius: 3px;
        flex-shrink: 0;
        min-width: 80px;
      }

      .cron-desc {
        font-size: 12px;
        color: #909399;
        margin-left: auto;
      }
    }

    .option-detail {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .sub {
        font-size: 12px;
        color: #909399;
      }
    }

    .quick-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;
      margin-top: 4px;

      &.success {
        color: #67c23a;
      }
    }

    .inline-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    @media (max-width: 1024px) {
      .summary-banner {
        flex-direction: column;
        gap: 8px;
      }

      ::v-deep(.el-col) {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
</style>
