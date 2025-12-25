<template>
  <div class="advanced-config">
    <div class="section-header">
      <Settings :size="18" />
      <h4>高级配置</h4>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title>配置调度器、优先级和运行时类等高级选项</template>
    </ElAlert>

    <div class="config-form">
      <!-- 调度器名称 -->
      <div class="form-section">
        <div class="section-title">
          <Server :size="16" />
          <span>调度器名称</span>
        </div>
        <ElInput
          v-model="schedulerNameValue"
          :readonly="!editing"
          placeholder="default-scheduler"
          clearable
        >
          <template #prepend>
            <Database :size="14" />
          </template>
        </ElInput>
        <div class="field-tip">
          指定使用的调度器。默认: default-scheduler
        </div>
      </div>

      <!-- 优先级配置 -->
      <div class="form-section">
        <div class="section-title">
          <Star :size="16" />
          <span>优先级配置</span>
        </div>

        <div class="field-group">
          <label>优先级类名</label>
          <ElInput
            v-model="priorityClassValue"
            :readonly="!editing"
            placeholder="high-priority"
            clearable
          >
            <template #prepend>
              <Award :size="14" />
            </template>
          </ElInput>
          <div class="field-tip">
            引用预定义的 PriorityClass。高优先级 Pod 优先调度，资源不足时优先保留 Pod 会被驱逐
          </div>
        </div>

        <div class="field-group">
          <label>优先级数值</label>
          <ElInputNumber
            v-model="priorityValue"
            :disabled="!editing"
            :min="0"
            :max="1000000000"
            :step="1"
            controls-position="right"
            style="width: 100%"
          />
          <div class="field-tip">
            直接设置优先级数值 (0-1000000000)。数值越大优先级越高
          </div>
        </div>
      </div>

      <!-- 运行时类 -->
      <div class="form-section">
        <div class="section-title">
          <Cpu :size="16" />
          <span>运行时类</span>
        </div>
        <ElInput
          v-model="runtimeClassValue"
          :readonly="!editing"
          placeholder="kata-containers"
          clearable
        >
          <template #prepend>
            <Box :size="14" />
          </template>
        </ElInput>
        <div class="field-tip">
          指定 Pod 使用的容器运行时。如: kata-containers、gvisor 等
        </div>
      </div>

      <!-- 常用调度器 -->
      <div class="form-section">
        <div class="section-title">
          <Lightbulb :size="16" />
          <span>常用调度器</span>
        </div>
        <div class="quick-options">
          <ElTag
            v-for="scheduler in commonSchedulers"
            :key="scheduler"
            :type="schedulerNameValue === scheduler ? 'primary' : 'info'"
            :effect="schedulerNameValue === scheduler ? 'dark' : 'plain'"
            class="scheduler-tag"
            @click="editing && (schedulerNameValue = scheduler)"
          >
            {{ scheduler }}
          </ElTag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Settings,
  Server,
  Star,
  Cpu,
  Database,
  Award,
  Box,
  Lightbulb
} from 'lucide-vue-next'

interface Props {
  editing: boolean
}

const props = defineProps<Props>()

const schedulerNameValue = defineModel<string>('schedulerName', { default: '' })
const priorityClassValue = defineModel<string>('priorityClass', { default: '' })
const priorityValue = defineModel<number>('priority', { default: 0 })
const runtimeClassValue = defineModel<string>('runtimeClass', { default: '' })

const commonSchedulers = ['default-scheduler', 'volcano', 'kube-batch']
</script>

<style lang="scss" scoped>
.advanced-config {
  padding: 20px; // 🔥 添加内边距

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  :deep(.el-alert) {
    margin-bottom: 24px;
  }

  .config-form {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .form-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: #606266;
      }

      .field-group {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #606266;
        }
      }

      .field-tip {
        margin-top: 6px;
        font-size: 12px;
        color: #909399;
        line-height: 1.5;
      }

      .quick-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .scheduler-tag {
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
  }
}
</style>