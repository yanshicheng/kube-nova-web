<template>
  <ElCard class="workload-steps-card" shadow="hover">
    <div class="header-content">
      <div class="header-left">
        <ElButton :icon="ArrowLeft" @click="handleBack" class="back-button" />
        <h2>{{ getModeText(mode) }} {{ resourceType }}</h2>
        <ElTag type="info">{{ namespace }}</ElTag>
      </div>

      <div class="header-actions">
        <div class="mode-toggle-group">
          <button
            class="mode-toggle-btn"
            :class="{ active: localEditMode === 'form' }"
            @click="localEditMode = 'form'"
          >
            <FileText :size="14" />
            <span>向导</span>
          </button>
          <button
            class="mode-toggle-btn"
            :class="{ active: localEditMode === 'yaml' }"
            @click="localEditMode = 'yaml'"
          >
            <Code :size="14" />
            <span>YAML</span>
          </button>
        </div>
        <ElButton
          type="success"
          @click="handleSubmit"
          :loading="creating"
          :disabled="!canSubmit"
          size="default"
          class="submit-button"
        >
          <CheckCircle :size="16" style="margin-right: 6px" />
          {{ mode === 'createApp' ? '创建' : '更新' }}
        </ElButton>
      </div>
    </div>

    <!-- 步骤进度条 - 只在向导模式下显示 -->
    <div v-if="editMode === 'form'" class="steps-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <div class="steps-container">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="step-item"
          :class="{
            active: currentStep === index,
            completed: currentStep > index && step.validated && !step.hasError,
            error: step.hasError && step.touched,
            disabled: !canJumpToStep(index)
          }"
          @click="handleStepClick(index)"
        >
          <div class="step-icon">
            <CheckCircle
              v-if="currentStep > index && step.validated && !step.hasError"
              :size="20"
            />
            <XCircle v-else-if="step.hasError && step.touched" :size="20" color="#F56C6C" />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-info">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc">{{ step.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </ElCard>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ArrowLeft } from '@element-plus/icons-vue'
  import { FileText, Code, CheckCircle, XCircle } from 'lucide-vue-next'
  import { ElMessage } from 'element-plus'
  import { getModeText } from '../utils/modeHandler'

  interface StepConfig {
    id: string
    title: string
    description: string
    component: any
    hasError: boolean
    validated: boolean
    touched: boolean
    required: boolean
  }

  interface Props {
    steps: StepConfig[]
    currentStep: number
    mode: string
    namespace: string
    resourceType: string
    editMode: 'form' | 'yaml'
    isValid: boolean
    creating: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    currentStep: 0,
    editMode: 'form',
    isValid: false,
    creating: false
  })

  const emit = defineEmits<{
    (e: 'back'): void
    (e: 'submit'): void
    (e: 'step-click', index: number): void
    (e: 'update:editMode', value: 'form' | 'yaml'): void
  }>()

  // 本地编辑模式，支持双向绑定
  const localEditMode = computed({
    get: () => props.editMode,
    set: (value) => emit('update:editMode', value)
  })

  // 进度百分比
  const progressPercentage = computed(() => {
    const validatedSteps = props.steps.filter((step) => step.validated && !step.hasError).length
    return (validatedSteps / props.steps.length) * 100
  })

  // 是否可以提交（在最后一步且所有必填步骤都完成）
  const canSubmit = computed(() => {
    return props.currentStep === props.steps.length - 1 && props.isValid
  })

  // 判断是否可以跳转到某个步骤
  const canJumpToStep = (targetIndex: number): boolean => {
    // 当前步骤和之前的步骤都可以跳转
    if (targetIndex <= props.currentStep) {
      return true
    }

    // 跳转到后面的步骤，需要检查中间所有必填步骤是否完成
    const requiredStepsBetween = props.steps.slice(0, targetIndex).filter((step) => step.required)

    return requiredStepsBetween.every((step) => step.validated && !step.hasError)
  }

  // 处理步骤点击
  const handleStepClick = (index: number) => {
    if (!canJumpToStep(index)) {
      const requiredStepsBetween = props.steps.slice(0, index).filter((step) => step.required)
      const incompleteRequired = requiredStepsBetween.find(
        (step) => !step.validated || step.hasError
      )

      if (incompleteRequired) {
        ElMessage.error({
          message: `请先完成必填步骤：${incompleteRequired.title}`,
          duration: 3000,
          showClose: true
        })

        // 如果是容器步骤，额外提示查看错误详情
        if (incompleteRequired.id === 'containers') {
          setTimeout(() => {
            ElMessage.info({
              message: '请检查容器配置页面底部的错误提示',
              duration: 4000,
              showClose: true
            })
          }, 500)
        }
        return
      }
    }

    emit('step-click', index)
  }

  // 处理提交按钮点击
  const handleSubmit = () => {
    // 如果不在最后一步，提示用户
    if (props.currentStep !== props.steps.length - 1) {
      ElMessage.error({
        message: '请先完成所有配置步骤，然后在「确认配置」页面提交',
        duration: 3000,
        showClose: true
      })
      return
    }

    // 检查是否所有必填步骤都完成
    if (!props.isValid) {
      const incompleteSteps = props.steps
        .filter((step) => step.required && (!step.validated || step.hasError))
        .map((step) => step.title)

      if (incompleteSteps.length > 0) {
        ElMessage.error({
          message: `请完成以下必填配置：${incompleteSteps.join('、')}`,
          duration: 4000,
          showClose: true
        })
      } else {
        ElMessage.error({
          message: '配置验证失败，请检查所有必填项',
          duration: 3000,
          showClose: true
        })
      }
      return
    }

    // 触发提交事件
    emit('submit')
  }

  // 处理返回按钮点击
  const handleBack = () => {
    emit('back')
  }
</script>

<style lang="scss" scoped>
  .workload-steps-card {
    margin-bottom: 10px;

    ::v-deep(.el-card__body) {
      padding: 12px 16px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .back-button {
          width: 32px;
          height: 32px;
          padding: 0;
          border-radius: 8px;
          transition: all 0.3s;

          &:hover {
            background: #f5f5f5;
            transform: translateX(-2px);
          }
        }

        h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .el-tag {
          font-size: 12px;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;

        .mode-toggle-group {
          display: flex;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 3px;

          .mode-toggle-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 14px;
            border: none;
            background: transparent;
            color: #666;
            cursor: pointer;
            font-size: 13px;
            border-radius: 6px;
            transition: all 0.3s;
            white-space: nowrap;

            &:hover {
              color: #409eff;
            }

            &.active {
              background: white;
              color: #333;
              font-weight: 500;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            span {
              line-height: 1;
            }
          }
        }

        .submit-button {
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s;

          &:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
    }

    .steps-progress {
      position: relative;

      .progress-bar {
        display: none;
      }

      .steps-container {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0;
        margin-bottom: 0;

        .step-item {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          background: #fafafa;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;

          &:hover:not(.disabled) {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          &.disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          &.completed {
            background: #f6ffed;
          }

          &.active {
            background: #e6f0ff;
          }

          &.error {
            background: #fff2f0;
          }

          .step-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            border: 2px solid #d9d9d9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 12px;
            color: #999;
            flex-shrink: 0;
            transition: all 0.3s;
          }

          &.completed .step-icon {
            background: #52c41a;
            border-color: #52c41a;
            color: white;
          }

          &.active .step-icon {
            background: #409eff;
            border-color: #409eff;
            color: white;
          }

          &.error .step-icon {
            background: #ff4d4f;
            border-color: #ff4d4f;
            color: white;
          }

          .step-info {
            flex: 1;
            min-width: 0;

            .step-title {
              font-size: 12px;
              font-weight: 500;
              color: #999;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              transition: all 0.3s;
            }

            .step-desc {
              display: none;
            }
          }

          &.active .step-info .step-title {
            color: #409eff;
            font-weight: 600;
          }

          &.completed .step-info .step-title {
            color: #52c41a;
          }

          &.error .step-info .step-title {
            color: #ff4d4f;
          }
        }
      }
    }
  }
</style>
