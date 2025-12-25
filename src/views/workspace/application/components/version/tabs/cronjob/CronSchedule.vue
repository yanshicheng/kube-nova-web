<template>
  <div class="cronjob-config-container">
    <div class="config-layout">
      <!-- 左侧 Tabs -->
      <div class="tabs-sidebar">
        <ElMenu :default-active="activeTab" @select="handleTabChange" class="config-menu">
          <ElMenuItem index="schedule">
            <Calendar :size="16" />
            <span>调度配置</span>
          </ElMenuItem>
          <ElMenuItem index="jobSpec">
            <Settings :size="16" />
            <span>Job 配置</span>
          </ElMenuItem>
        </ElMenu>
      </div>

      <!-- 右侧内容区 -->
      <div class="config-content">
        <!-- 调度配置 -->
        <div v-show="activeTab === 'schedule'" v-loading="loading" class="config-section">
          <ElForm :model="scheduleForm" label-width="140px" label-position="left">
            <div class="section-header">
              <Calendar :size="16" />
              <span>调度设置</span>
            </div>

            <ElFormItem label="Cron 表达式">
              <template #label>
                <span>Cron 表达式</span>
                <ElTooltip content="定时任务的执行规则，格式：分钟 小时 日 月 星期" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInput v-model="scheduleForm.schedule" placeholder="*/5 * * * *">
                <template #append>
                  <ElButton :icon="HelpCircle" @click="showCronHelp">帮助</ElButton>
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem label="时区">
              <template #label>
                <span>时区</span>
                <ElTooltip content="可选，默认使用亚洲/上海时区" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect
                v-model="scheduleForm.timezone"
                placeholder="默认 Asia/Shanghai"
                clearable
                filterable
              >
                <ElOption
                  v-for="tz in timezoneOptions"
                  :key="tz.value"
                  :label="tz.label"
                  :value="tz.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="并发策略">
              <template #label>
                <span>并发策略</span>
                <ElTooltip content="控制多个 Job 同时运行的行为" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElRadioGroup v-model="scheduleForm.concurrencyPolicy">
                <ElRadio value="Allow">
                  <span>Allow</span>
                  <ElTooltip content="允许并发运行多个 Job" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
                <ElRadio value="Forbid">
                  <span>Forbid</span>
                  <ElTooltip content="禁止并发，如果上一个 Job 未完成则跳过" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
                <ElRadio value="Replace">
                  <span>Replace</span>
                  <ElTooltip content="替换当前运行的 Job" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label="暂停调度">
              <template #label>
                <span>暂停调度</span>
                <ElTooltip content="暂停后将不会创建新的 Job" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSwitch
                v-model="scheduleForm.suspend"
                active-text="已暂停"
                inactive-text="运行中"
              />
            </ElFormItem>

            <div class="section-header">
              <History :size="16" />
              <span>历史保留</span>
            </div>

            <ElFormItem label="成功历史保留数">
              <template #label>
                <span>成功历史保留数</span>
                <ElTooltip content="保留最近成功的 Job 数量，0 表示不保留" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber v-model="scheduleForm.successfulJobsHistoryLimit" :min="0" :max="10" />
            </ElFormItem>

            <ElFormItem label="失败历史保留数">
              <template #label>
                <span>失败历史保留数</span>
                <ElTooltip content="保留最近失败的 Job 数量，0 表示不保留" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber v-model="scheduleForm.failedJobsHistoryLimit" :min="0" :max="10" />
            </ElFormItem>

            <ElFormItem label="启动截止时间(秒)">
              <template #label>
                <span>启动截止时间(秒)</span>
                <ElTooltip
                  content="Job 必须在此时间内启动，否则视为错过，0 或为空表示无限制"
                  placement="top"
                >
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="scheduleForm.startingDeadlineSeconds"
                :min="0"
                :max="3600"
                placeholder="可选"
                clearable
              />
            </ElFormItem>

            <ElFormItem>
              <div class="form-actions">
                <ElButton type="primary" :loading="saving" @click="handleSaveSchedule">
                  <Check :size="16" />
                  保存配置
                </ElButton>
                <ElButton @click="handleResetSchedule">
                  <RotateCcw :size="16" />
                  重置
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </div>

        <!-- Job 配置 -->
        <div v-show="activeTab === 'jobSpec'" v-loading="loading" class="config-section">
          <ElForm :model="jobSpecForm" label-width="140px" label-position="left">
            <div class="section-header">
              <Settings :size="16" />
              <span>基础配置</span>
            </div>

            <ElFormItem label="并行度">
              <template #label>
                <span>并行度</span>
                <ElTooltip content="同时运行的 Pod 数量，0 表示暂停" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="jobSpecForm.parallelism"
                :min="0"
                :max="100"
                placeholder="默认 1"
              />
            </ElFormItem>

            <ElFormItem label="完成数">
              <template #label>
                <span>完成数</span>
                <ElTooltip content="Job 需要成功完成的 Pod 总数" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="jobSpecForm.completions"
                :min="0"
                :max="1000"
                placeholder="默认 1"
              />
            </ElFormItem>

            <ElFormItem label="失败重试次数">
              <template #label>
                <span>失败重试次数</span>
                <ElTooltip content="Job 失败后的最大重试次数" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="jobSpecForm.backoffLimit"
                :min="0"
                :max="10"
                placeholder="默认 6"
              />
            </ElFormItem>

            <ElFormItem label="活跃截止时间(秒)">
              <template #label>
                <span>活跃截止时间(秒)</span>
                <ElTooltip
                  content="Job 运行的最长时间，超时后自动终止，0 或为空表示无限制"
                  placement="top"
                >
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="jobSpecForm.activeDeadlineSeconds"
                :min="0"
                :max="86400"
                placeholder="可选"
                clearable
              />
            </ElFormItem>

            <ElFormItem label="完成后保留(秒)">
              <template #label>
                <span>完成后保留(秒)</span>
                <ElTooltip
                  content="Job 完成后自动清理的时间，0 表示立即清理，为空表示不自动清理"
                  placement="top"
                >
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="jobSpecForm.ttlSecondsAfterFinished"
                :min="0"
                :max="604800"
                placeholder="可选"
                clearable
              />
            </ElFormItem>

            <div class="section-header">
              <Layers :size="16" />
              <span>高级配置</span>
            </div>

            <ElFormItem label="完成模式">
              <template #label>
                <span>完成模式</span>
                <ElTooltip content="控制 Job 的完成方式" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElRadioGroup v-model="jobSpecForm.completionMode">
                <ElRadio value="NonIndexed">
                  <span>NonIndexed</span>
                  <ElTooltip content="标准模式，Pod 顺序执行" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
                <ElRadio value="Indexed">
                  <span>Indexed</span>
                  <ElTooltip content="索引模式，每个 Pod 有唯一索引" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label="Job 暂停">
              <template #label>
                <span>Job 暂停</span>
                <ElTooltip content="暂停创建的 Job 实例" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSwitch v-model="jobSpecForm.suspend" active-text="已暂停" inactive-text="运行中" />
            </ElFormItem>

            <ElFormItem label="Pod 替换策略">
              <template #label>
                <span>Pod 替换策略</span>
                <ElTooltip content="控制何时创建替换 Pod" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElRadioGroup v-model="jobSpecForm.podReplacementPolicy">
                <ElRadio value="TerminatingOrFailed">
                  <span>TerminatingOrFailed</span>
                  <ElTooltip content="正在终止或已失败时创建替换 Pod" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
                <ElRadio value="Failed">
                  <span>Failed</span>
                  <ElTooltip content="仅失败时创建替换 Pod" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label="每索引失败限制" v-if="jobSpecForm.completionMode === 'Indexed'">
              <template #label>
                <span>每索引失败限制</span>
                <ElTooltip content="Indexed 模式下，每个索引的最大失败次数" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="jobSpecForm.backoffLimitPerIndex"
                :min="0"
                :max="10"
                placeholder="可选"
                clearable
              />
            </ElFormItem>

            <ElFormItem label="最大失败索引数" v-if="jobSpecForm.completionMode === 'Indexed'">
              <template #label>
                <span>最大失败索引数</span>
                <ElTooltip content="Indexed 模式下，允许失败的最大索引数量" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInputNumber
                v-model="jobSpecForm.maxFailedIndexes"
                :min="0"
                :max="100"
                placeholder="可选"
                clearable
              />
            </ElFormItem>

            <ElFormItem>
              <div class="form-actions">
                <ElButton type="primary" :loading="saving" @click="handleSaveJobSpec">
                  <Check :size="16" />
                  保存配置
                </ElButton>
                <ElButton @click="handleResetJobSpec">
                  <RotateCcw :size="16" />
                  重置
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </div>
      </div>
    </div>

    <!-- Cron 表达式帮助对话框 -->
    <ElDialog v-model="cronHelpDialogVisible" title="Cron 表达式帮助" width="600px">
      <div class="cron-help-content">
        <ElAlert title="Cron 表达式格式" type="info" :closable="false" style="margin-bottom: 16px">
          <code>分钟 小时 日 月 星期</code>
        </ElAlert>

        <ElTable :data="cronExamples" stripe>
          <ElTableColumn prop="expression" label="表达式" width="150">
            <template #default="{ row }">
              <code>{{ row.expression }}</code>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" label="说明" />
        </ElTable>

        <ElAlert title="特殊字符说明" type="warning" :closable="false" style="margin-top: 16px">
          <ul class="char-list">
            <li><code>*</code> - 任意值</li>
            <li><code>,</code> - 列举多个值 (如: 1,3,5)</li>
            <li><code>-</code> - 范围 (如: 1-5)</li>
            <li><code>/</code> - 步长 (如: */5 表示每5个单位)</li>
          </ul>
        </ElAlert>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    RefreshCw,
    Check,
    RotateCcw,
    Calendar,
    Settings,
    History,
    Layers,
    HelpCircle
  } from 'lucide-vue-next'
  import {
    getCronJobScheduleApi,
    updateCronJobScheduleApi,
    getJobSpecApi,
    updateJobSpecApi,
    type CronJobScheduleConfig,
    type JobSpecConfig,
    type UpdateCronJobScheduleRequest,
    type UpdateJobSpecRequest,
    type OnecProjectVersion
  } from '@/api'

  interface Props {
    version: OnecProjectVersion
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  // 时区选项
  const timezoneOptions = [
    { label: 'UTC', value: 'UTC' },
    { label: '亚洲/上海 (Asia/Shanghai)', value: 'Asia/Shanghai' },
    { label: '亚洲/东京 (Asia/Tokyo)', value: 'Asia/Tokyo' },
    { label: '亚洲/首尔 (Asia/Seoul)', value: 'Asia/Seoul' },
    { label: '亚洲/香港 (Asia/Hong_Kong)', value: 'Asia/Hong_Kong' },
    { label: '亚洲/新加坡 (Asia/Singapore)', value: 'Asia/Singapore' },
    { label: '亚洲/台北 (Asia/Taipei)', value: 'Asia/Taipei' },
    { label: '亚洲/加尔各答 (Asia/Kolkata)', value: 'Asia/Kolkata' },
    { label: '亚洲/迪拜 (Asia/Dubai)', value: 'Asia/Dubai' },
    { label: '欧洲/伦敦 (Europe/London)', value: 'Europe/London' },
    { label: '欧洲/巴黎 (Europe/Paris)', value: 'Europe/Paris' },
    { label: '欧洲/柏林 (Europe/Berlin)', value: 'Europe/Berlin' },
    { label: '欧洲/莫斯科 (Europe/Moscow)', value: 'Europe/Moscow' },
    { label: '美洲/纽约 (America/New_York)', value: 'America/New_York' },
    { label: '美洲/洛杉矶 (America/Los_Angeles)', value: 'America/Los_Angeles' },
    { label: '美洲/芝加哥 (America/Chicago)', value: 'America/Chicago' },
    { label: '美洲/丹佛 (America/Denver)', value: 'America/Denver' },
    { label: '美洲/圣保罗 (America/Sao_Paulo)', value: 'America/Sao_Paulo' },
    { label: '澳洲/悉尼 (Australia/Sydney)', value: 'Australia/Sydney' },
    { label: '澳洲/墨尔本 (Australia/Melbourne)', value: 'Australia/Melbourne' },
    { label: '太平洋/奥克兰 (Pacific/Auckland)', value: 'Pacific/Auckland' }
  ]

  // 状态
  const loading = ref(false)
  const saving = ref(false)
  const activeTab = ref('schedule')
  const cronHelpDialogVisible = ref(false)

  // 调度配置表单
  const scheduleForm = reactive<CronJobScheduleConfig>({
    schedule: '*/5 * * * *',
    timezone: 'Asia/Shanghai',
    concurrencyPolicy: 'Allow',
    suspend: false,
    startingDeadlineSeconds: 0,
    successfulJobsHistoryLimit: 3,
    failedJobsHistoryLimit: 1
  })

  const originalScheduleForm = reactive({ ...scheduleForm })

  // Job Spec 配置表单
  const jobSpecForm = reactive<JobSpecConfig>({
    parallelism: 1,
    completions: 1,
    backoffLimit: 6,
    activeDeadlineSeconds: 0,
    ttlSecondsAfterFinished: 0,
    completionMode: 'NonIndexed',
    suspend: false,
    podReplacementPolicy: 'TerminatingOrFailed',
    backoffLimitPerIndex: 0,
    maxFailedIndexes: 0
  })

  const originalJobSpecForm = reactive({ ...jobSpecForm })

  // Cron 示例
  const cronExamples = [
    { expression: '*/5 * * * *', description: '每 5 分钟执行一次' },
    { expression: '0 * * * *', description: '每小时执行一次' },
    { expression: '0 0 * * *', description: '每天凌晨 0 点执行' },
    { expression: '0 2 * * *', description: '每天凌晨 2 点执行' },
    { expression: '0 0 * * 0', description: '每周日凌晨 0 点执行' },
    { expression: '0 0 1 * *', description: '每月 1 号凌晨 0 点执行' },
    { expression: '30 9 * * 1-5', description: '工作日上午 9:30 执行' },
    { expression: '0 */2 * * *', description: '每 2 小时执行一次' }
  ]

  // 加载调度配置
  const loadScheduleConfig = async () => {
    if (!props.version?.id) return

    try {
      const data = await getCronJobScheduleApi(props.version.id)
      Object.assign(scheduleForm, data)
      Object.assign(originalScheduleForm, data)
    } catch (error) {
      console.error('[CronJobConfig] 加载调度配置失败', error)
    }
  }

  // 加载 Job Spec 配置
  const loadJobSpecConfig = async () => {
    if (!props.version?.id) return

    try {
      const data = await getJobSpecApi(props.version.id)
      Object.assign(jobSpecForm, {
        ...data,
        activeDeadlineSeconds: data.activeDeadlineSeconds || undefined,
        ttlSecondsAfterFinished: data.ttlSecondsAfterFinished || undefined,
        backoffLimitPerIndex: data.backoffLimitPerIndex || undefined,
        maxFailedIndexes: data.maxFailedIndexes || undefined
      })
      Object.assign(originalJobSpecForm, jobSpecForm)
    } catch (error) {
      console.error('[CronJobConfig] 加载 Job Spec 配置失败', error)
    }
  }

  // 加载所有配置
  const loadAllConfig = async () => {
    loading.value = true
    try {
      await Promise.all([loadScheduleConfig(), loadJobSpecConfig()])
    } finally {
      loading.value = false
    }
  }

  // 保存调度配置
  const handleSaveSchedule = async () => {
    if (!props.version?.id) return

    try {
      saving.value = true
      const updateData: UpdateCronJobScheduleRequest = {
        schedule: scheduleForm.schedule || undefined,
        timezone: scheduleForm.timezone || undefined,
        concurrencyPolicy: scheduleForm.concurrencyPolicy || undefined,
        startingDeadlineSeconds:
          scheduleForm.startingDeadlineSeconds > 0
            ? scheduleForm.startingDeadlineSeconds
            : undefined,
        successfulJobsHistoryLimit: scheduleForm.successfulJobsHistoryLimit,
        failedJobsHistoryLimit: scheduleForm.failedJobsHistoryLimit
      }

      await updateCronJobScheduleApi(props.version.id, updateData)
      ElMessage.success('调度配置保存成功')
      Object.assign(originalScheduleForm, scheduleForm)

      await loadScheduleConfig()
    } catch (error) {
      console.error('[CronJobConfig] 保存调度配置失败', error)
    } finally {
      saving.value = false
    }
  }

  // 保存 Job Spec 配置
  const handleSaveJobSpec = async () => {
    if (!props.version?.id) return

    try {
      saving.value = true
      const updateData: UpdateJobSpecRequest = {
        parallelism: jobSpecForm.parallelism || 0,
        completions: jobSpecForm.completions || 0,
        backoffLimit: jobSpecForm.backoffLimit || 0,
        activeDeadlineSeconds: jobSpecForm.activeDeadlineSeconds || 0,
        ttlSecondsAfterFinished: jobSpecForm.ttlSecondsAfterFinished || 0,
        completionMode: jobSpecForm.completionMode || undefined,
        suspend: jobSpecForm.suspend || undefined,
        podReplacementPolicy: jobSpecForm.podReplacementPolicy || undefined,
        backoffLimitPerIndex: jobSpecForm.backoffLimitPerIndex || 0,
        maxFailedIndexes: jobSpecForm.maxFailedIndexes || 0
      }

      await updateJobSpecApi(props.version.id, updateData)
      ElMessage.success('Job 配置保存成功')
      Object.assign(originalJobSpecForm, jobSpecForm)

      await loadJobSpecConfig()
    } catch (error) {
      console.error('[CronJobConfig] 保存 Job Spec 配置失败', error)
    } finally {
      saving.value = false
    }
  }

  // 重置调度配置
  const handleResetSchedule = () => {
    Object.assign(scheduleForm, originalScheduleForm)
    ElMessage.info('已重置为上次保存的配置')
  }

  // 重置 Job Spec 配置
  const handleResetJobSpec = () => {
    Object.assign(jobSpecForm, originalJobSpecForm)
    ElMessage.info('已重置为上次保存的配置')
  }

  // Tab 切换
  const handleTabChange = (index: string) => {
    activeTab.value = index
  }

  // 显示 Cron 帮助
  const showCronHelp = () => {
    cronHelpDialogVisible.value = true
  }

  // 监听刷新触发器
  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        loadAllConfig()
      }
    }
  )

  // 组件挂载时加载配置
  onMounted(() => {
    loadAllConfig()
  })
</script>

<style scoped lang="scss">
  .cronjob-config-container {
    height: 100%;

    .config-layout {
      display: flex;
      height: 100%;
      background: #fff;
      border-radius: 8px;

      .tabs-sidebar {
        width: 160px;
        border-right: 1px solid var(--el-border-color);
        padding: 20px 16px 20px 20px;
        flex-shrink: 0;

        .config-menu {
          border: none;

          :deep(.el-menu-item) {
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 6px;
            margin-bottom: 4px;
            height: 40px;

            &.is-active {
              background-color: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
            }
          }
        }
      }

      .config-content {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;

        .config-section {
          max-width: 700px; // 减小最大宽度，让内容更紧凑
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 16px 0 12px 0; // 减小间距
          padding-bottom: 8px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:first-child {
            margin-top: 0;
          }
        }

        // 直接控制输入框宽度
        :deep(.el-input),
        :deep(.el-select),
        :deep(.el-input-number) {
          max-width: 300px;
        }

        // Radio 组横向排列
        :deep(.el-radio-group) {
          display: flex;
          flex-direction: row;
          gap: 16px;
          flex-wrap: wrap;

          .el-radio {
            margin-right: 0;
            display: flex;
            align-items: center;
          }
        }

        // Label 后面的帮助图标
        .label-help-icon {
          margin-left: 6px;
          color: var(--el-text-color-secondary);
          cursor: help;
          vertical-align: middle;
        }

        // Radio 选项内的帮助图标
        .inline-help-icon {
          margin-left: 4px;
          color: var(--el-text-color-secondary);
          cursor: help;
          vertical-align: middle;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          padding-top: 8px;

          :deep(.el-button) {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
        }

        :deep(.el-form-item) {
          margin-bottom: 18px; // 进一步减小间距

          .el-form-item__label {
            font-weight: 500;
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .cron-help-content {
      code {
        padding: 2px 6px;
        background-color: var(--el-fill-color-light);
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        color: var(--el-color-primary);
      }

      .char-list {
        list-style: none;
        padding: 8px 0 0 0;
        margin: 0;

        li {
          padding: 6px 0;
          line-height: 1.6;

          code {
            margin-right: 8px;
            font-weight: 600;
          }
        }
      }
    }
  }
</style>
