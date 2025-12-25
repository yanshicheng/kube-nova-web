<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Canary 状态"
    width="800px"
    top="5vh"
    class="status-dialog"
  >
    <div v-if="canaryStatus" v-loading="loading" class="status-content">
      <!-- 基本状态 -->
      <div class="status-header">
        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="当前阶段">
            <ElTag :type="getPhaseTypeTag(canaryStatus.phase)" size="large">
              {{ canaryStatus.phase }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="金丝雀权重">
            <span class="weight-text">{{ canaryStatus.canaryWeight }}%</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="失败次数">
            <span :class="{ 'error-text': canaryStatus.failedChecks > 0 }">
              {{ canaryStatus.failedChecks }}
            </span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="迭代次数" :span="3">
            {{ canaryStatus.iterations }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 状态时间线 -->
      <div class="timeline-section">
        <h4 class="section-title">
          <Activity :size="16" />
          状态变更历史
        </h4>

        <ElTimeline v-if="canaryStatus.conditions && canaryStatus.conditions.length > 0">
          <ElTimelineItem
            v-for="(condition, index) in canaryStatus.conditions"
            :key="index"
            :timestamp="formatTime(condition.lastTransitionTime)"
            :type="getConditionType(condition.status)"
            :icon="getConditionIcon(condition.status)"
            :size="index === 0 ? 'large' : 'normal'"
          >
            <ElCard :body-style="{ padding: '12px' }">
              <div class="condition-content">
                <div class="condition-header">
                  <div class="condition-type">
                    <strong>{{ condition.type }}</strong>
                    <ElTag
                      :type="getConditionTagType(condition.status)"
                      size="small"
                      style="margin-left: 8px"
                    >
                      {{ condition.status }}
                    </ElTag>
                  </div>
                  <div class="condition-time">
                    {{ formatFullTime(condition.lastUpdateTime) }}
                  </div>
                </div>

                <div class="condition-reason" v-if="condition.reason">
                  <span class="label">原因：</span>
                  <ElTag type="info" size="small">{{ condition.reason }}</ElTag>
                </div>

                <div class="condition-message" v-if="condition.message">
                  <span class="label">详情：</span>
                  <span class="message-text">{{ condition.message }}</span>
                </div>
              </div>
            </ElCard>
          </ElTimelineItem>
        </ElTimeline>

        <ElEmpty v-else description="暂无状态记录" />
      </div>

      <!-- 跟踪的配置 -->
      <div
        v-if="canaryStatus.trackedConfigs && Object.keys(canaryStatus.trackedConfigs).length > 0"
        class="tracked-configs-section"
      >
        <h4 class="section-title">
          <Settings :size="16" />
          跟踪的配置
        </h4>
        <div class="configs-list">
          <div v-for="(value, key) in canaryStatus.trackedConfigs" :key="key" class="config-item">
            <span class="config-key">{{ key }}</span>
            <span class="config-separator">:</span>
            <span class="config-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- 最后应用的规格 -->
      <div v-if="canaryStatus.lastAppliedSpec" class="last-spec-section">
        <h4 class="section-title">
          <FileCode :size="16" />
          最后应用的规格
        </h4>
        <div class="spec-content">
          <pre>{{ canaryStatus.lastAppliedSpec }}</pre>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <ElEmpty description="暂无数据" />
    </div>

    <template #footer>
      <ElButton @click="emit('update:modelValue', false)" size="default">关闭</ElButton>
      <ElButton type="primary" @click="handleRefresh" :loading="loading" size="default">
        <RefreshCw :size="14" style="margin-right: 4px" />
        刷新
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Activity,
    Settings,
    FileCode,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock
  } from 'lucide-vue-next'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import 'dayjs/locale/zh-cn'
  import { getCanaryStatusApi, type CanaryStatusResponse, type ProjectWorkspace } from '@/api'

  dayjs.extend(relativeTime)
  dayjs.locale('zh-cn')

  interface Props {
    modelValue: boolean
    canaryName: string
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue'])

  const loading = ref(false)
  const canaryStatus = ref<CanaryStatusResponse | null>(null)

  const getPhaseTypeTag = (phase: string) => {
    const tagMap: Record<string, string> = {
      Initializing: 'info',
      Waiting: 'info',
      Progressing: 'warning',
      Promoting: 'primary',
      Finalising: 'primary',
      Succeeded: 'success',
      Failed: 'danger'
    }
    return tagMap[phase] || 'info'
  }

  const getConditionType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    if (status === 'True') return 'success'
    if (status === 'False') return 'danger'
    return 'info'
  }

  const getConditionTagType = (status: string) => {
    if (status === 'True') return 'success'
    if (status === 'False') return 'danger'
    return 'info'
  }

  const getConditionIcon = (status: string) => {
    if (status === 'True') return CheckCircle
    if (status === 'False') return XCircle
    return Clock
  }

  const formatTime = (timeStr: string): string => {
    return dayjs(timeStr).fromNow()
  }

  const formatFullTime = (timeStr: string): string => {
    return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss')
  }

  const loadCanaryStatus = async () => {
    if (!props.workspace || !props.canaryName) return

    loading.value = true
    try {
      canaryStatus.value = await getCanaryStatusApi({
        workloadId: props.workspace.id,
        name: props.canaryName
      })
    } catch (error) {
      console.error('加载 Canary 状态失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleRefresh = () => {
    loadCanaryStatus()
  }

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        loadCanaryStatus()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .status-dialog {
    .status-content {
      padding: 20px;

      .status-header {
        margin-bottom: 24px;

        .weight-text {
          font-size: 18px;
          font-weight: 600;
          color: #67c23a;
        }

        .error-text {
          font-size: 18px;
          font-weight: 600;
          color: #f56c6c;
        }
      }

      .timeline-section {
        margin-bottom: 24px;

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #409eff;
        }

        .condition-content {
          .condition-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .condition-type {
              display: flex;
              align-items: center;
              font-size: 14px;
              color: #303133;
            }

            .condition-time {
              font-size: 12px;
              color: #909399;
            }
          }

          .condition-reason,
          .condition-message {
            margin-top: 8px;
            font-size: 13px;
            display: flex;
            align-items: flex-start;
            gap: 8px;

            .label {
              color: #606266;
              font-weight: 500;
              flex-shrink: 0;
            }

            .message-text {
              flex: 1;
              color: #606266;
              line-height: 1.6;
            }
          }
        }
      }

      .tracked-configs-section {
        margin-bottom: 24px;

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #409eff;
        }

        .configs-list {
          padding: 16px;
          background: #f5f7fa;
          border-radius: 6px;

          .config-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px dashed #e4e7ed;

            &:last-child {
              border-bottom: none;
            }

            .config-key {
              flex: 0 0 200px;
              font-weight: 500;
              color: #303133;
              font-family: monospace;
            }

            .config-separator {
              margin: 0 12px;
              color: #909399;
            }

            .config-value {
              flex: 1;
              color: #606266;
              font-family: monospace;
              word-break: break-all;
            }
          }
        }
      }

      .last-spec-section {
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #409eff;
        }

        .spec-content {
          padding: 16px;
          background: #f5f7fa;
          border-radius: 6px;
          max-height: 400px;
          overflow-y: auto;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-thumb {
            background: #dcdfe6;
            border-radius: 3px;
          }

          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.6;
            color: #303133;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }
      }
    }

    .empty-state {
      padding: 60px 0;
    }
  }
</style>
