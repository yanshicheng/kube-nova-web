<template>
  <div class="job-config-step">
    <!-- 配置摘要横幅 -->
    <div class="summary-banner">
      <div class="summary-item">
        <PlayCircle :size="16" />
        <span class="label">完成</span>
        <code class="value">{{ jobStore.completions }}次</code>
      </div>
      <div class="summary-item">
        <Layers :size="16" />
        <span class="label">并行</span>
        <ElTag type="primary" size="small">{{ jobStore.parallelism }}个</ElTag>
      </div>
      <div class="summary-item">
        <RefreshCw :size="16" />
        <span class="label">重试</span>
        <span class="value">{{ jobStore.backoffLimit }}次</span>
      </div>
      <div class="summary-item">
        <Box :size="16" />
        <span class="label">模式</span>
        <ElTag :type="jobStore.completionMode === 'Indexed' ? 'warning' : 'info'" size="small">
          {{ jobStore.completionMode === 'NonIndexed' ? '非索引' : '索引' }}
        </ElTag>
      </div>
    </div>

    <ElForm label-width="140px" label-position="right" size="default">
      <ElRow :gutter="20">
        <!-- 左列 -->
        <ElCol :xs="24" :lg="12">
          <!-- 基本配置 -->
          <ElCard class="compact-card" shadow="never">
            <template #header>
              <span class="card-title">
                <Settings :size="18" />
                基本配置
              </span>
            </template>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="完成次数" label-width="90px" required>
                  <ElInputNumber
                    v-model="jobStore.completions"
                    :min="1"
                    :max="10000"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="并行度" label-width="90px" required>
                  <ElInputNumber
                    v-model="jobStore.parallelism"
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
                    v-model="jobStore.backoffLimit"
                    :min="0"
                    :max="100"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="完成模式" label-width="90px">
                  <ElSelect v-model="jobStore.completionMode" @change="handleModeChange">
                    <ElOption label="NonIndexed" value="NonIndexed" />
                    <ElOption label="Indexed" value="Indexed" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
            </ElRow>

            <div class="inline-hint">
              <Info :size="14" />
              完成次数: Job 需要成功完成的 Pod 数量
            </div>
            <div class="inline-hint">
              <Info :size="14" />
              并行度: 可以同时运行的 Pod 数量
            </div>

            <ElAlert
              v-if="jobStore.parallelism > jobStore.completions"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 8px"
            >
              并行度大于完成次数，实际并行数会受完成次数限制
            </ElAlert>

            <ElAlert
              v-if="jobStore.backoffLimit === 0"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 8px"
            >
              重试次数为 0，Pod 失败后将不会重试
            </ElAlert>
          </ElCard>

          <!-- 完成模式配置 -->
          <ElCard v-if="jobStore.completionMode === 'Indexed'" class="compact-card" shadow="never">
            <template #header>
              <span class="card-title">
                <List :size="18" />
                Indexed 模式配置
              </span>
            </template>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="退避/索引" label-width="90px">
                  <ElInputNumber
                    v-model="jobStore.backoffLimitPerIndex"
                    :min="0"
                    :max="100"
                    placeholder="全局"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="最大失败" label-width="90px">
                  <ElInputNumber
                    v-model="jobStore.maxFailedIndexes"
                    :min="1"
                    :max="1000"
                    placeholder="不限"
                    controls-position="right"
                    @change="emitValidation"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <div class="inline-hint">
              <Info :size="14" />
              退避限制/索引：每个索引的独立退避限制（Kubernetes 1.28+）
            </div>
            <div class="inline-hint">
              <Info :size="14" />
              最大失败索引数：允许的最大失败索引数，超过后 Job 标记为失败
            </div>
          </ElCard>
        </ElCol>

        <!-- 右列 -->
        <ElCol :xs="24" :lg="12">
          <!-- 时间和策略配置 -->
          <ElCard class="compact-card" shadow="never">
            <template #header>
              <span class="card-title">
                <FileText :size="18" />
                时间和策略配置
              </span>
            </template>

            <ElDivider style="margin: 12px 0">
              <span style="font-size: 12px; color: #909399">时间配置</span>
            </ElDivider>

            <ElRow :gutter="12">
              <ElCol :span="12">
                <ElFormItem label="运行时限" label-width="90px">
                  <ElInputNumber
                    v-model="jobStore.activeDeadlineSeconds"
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
                    v-model="jobStore.ttlSecondsAfterFinished"
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

            <div class="inline-hint">
              <Info :size="14" />
              运行时限：Job 从启动到完成的最大时间，超时后将被终止
            </div>
            <div class="inline-hint">
              <Info :size="14" />
              完成后 TTL：Job 完成或失败后的保留时间，到期后自动清理
            </div>

            <ElDivider style="margin: 12px 0">
              <span style="font-size: 12px; color: #909399">Pod 策略</span>
            </ElDivider>

            <ElFormItem label="Pod 失败策略" label-width="120px">
              <ElSelect
                v-model="jobStore.podFailurePolicy"
                clearable
                placeholder="默认策略"
                @change="emitValidation"
              >
                <ElOption label="Count - 计数所有失败" value="Count" />
                <ElOption label="FailJob - 立即失败" value="FailJob" />
                <ElOption label="Ignore - 忽略失败" value="Ignore" />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="Pod 替换策略" label-width="120px">
              <ElSelect
                v-model="jobStore.podReplacementPolicy"
                clearable
                placeholder="默认策略"
                @change="emitValidation"
              >
                <ElOption label="终止或失败时" value="TerminatingOrFailed" />
                <ElOption label="仅失败时" value="Failed" />
              </ElSelect>
            </ElFormItem>

            <ElAlert
              v-if="jobStore.ttlSecondsAfterFinished === 0"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 8px"
            >
              TTL 为 0，Job 完成或失败后将立即被删除
            </ElAlert>
          </ElCard>
        </ElCol>
      </ElRow>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import {
    Settings,
    Info,
    FileText,
    List,
    PlayCircle,
    Layers,
    RefreshCw,
    Box
  } from 'lucide-vue-next'
  import { useJobStore } from '@/store/workload/job'

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
  const jobStore = useJobStore()

  // 处理模式变化
  function handleModeChange() {
    emitValidation()
  }

  // 发送验证结果
  function emitValidation() {
    const validation = jobStore.validate()

    emit('validate', validation)
  }

  // 验证
  function validate() {
    const validation = jobStore.validate()
    emitValidation()
    return validation.valid
  }

  // 初始化
  onMounted(() => {
    // 设置默认值
    if (!jobStore.completions || jobStore.completions < 1) {
      jobStore.setCompletions(1)
    }

    if (!jobStore.parallelism || jobStore.parallelism < 1) {
      jobStore.setParallelism(1)
    }

    if (jobStore.backoffLimit === undefined) {
      jobStore.setBackoffLimit(6)
    }

    if (!jobStore.completionMode) {
      jobStore.setCompletionMode('NonIndexed')
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
  .job-config-step {
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
