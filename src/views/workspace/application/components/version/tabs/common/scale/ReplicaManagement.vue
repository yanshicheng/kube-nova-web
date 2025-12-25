<template>
  <div class="replica-management-container">
    <!-- 加载状态 -->
    <div v-if="loading && currentReplicas === null" v-loading="loading" class="loading-wrapper">
      <div style="height: 400px"></div>
    </div>

    <!-- 主内容区 - 左右布局 -->
    <div v-else class="content-layout">
      <!-- 左侧：表单配置 -->
      <div class="form-section">
        <ElForm :model="scaleForm" label-width="120px" label-position="left">
          <!-- 当前状态 -->
          <div class="section-header">
            <Layers :size="16" />
            <span>当前状态</span>
          </div>

          <ElFormItem label="当前副本数">
            <div class="current-replicas-display">
              <span class="replica-number">{{ currentReplicas ?? '-' }}</span>
              <ElTag type="info" size="small">{{ getResourceTypeDesc(resourceType) }}</ElTag>
            </div>
          </ElFormItem>

          <!-- 扩缩容配置 -->
          <div class="section-header">
            <Settings :size="16" />
            <span>扩缩容配置</span>
          </div>

          <ElFormItem label="目标副本数">
            <template #label>
              <span>目标副本数</span>
              <ElTooltip
                content="设置期望的副本数量，范围：0-100。系统会自动调整 Pod 数量至目标值。"
                placement="top"
              >
                <HelpCircle :size="14" class="label-help-icon" />
              </ElTooltip>
            </template>
            <div class="replica-input-wrapper">
              <ElInputNumber
                v-model="scaleForm.targetReplicas"
                :min="0"
                :max="100"
                :step="1"
                :controls="true"
                size="large"
                :disabled="scaling"
              />
              <div class="replica-actions">
                <ElButton
                  :icon="Minus"
                  circle
                  size="small"
                  :disabled="scaleForm.targetReplicas <= 0 || scaling"
                  @click="scaleForm.targetReplicas--"
                />
                <ElButton
                  :icon="Plus"
                  circle
                  size="small"
                  :disabled="scaleForm.targetReplicas >= 100 || scaling"
                  @click="scaleForm.targetReplicas++"
                />
              </div>
            </div>
          </ElFormItem>

          <ElFormItem label="变化趋势">
            <template #label>
              <span>变化趋势</span>
              <ElTooltip content="显示副本数从当前到目标的变化情况" placement="top">
                <HelpCircle :size="14" class="label-help-icon" />
              </ElTooltip>
            </template>
            <div class="scale-trend">
              <div class="trend-item">
                <span class="trend-label">当前</span>
                <span class="trend-value current">{{ currentReplicas }}</span>
              </div>
              <div class="trend-arrow">
                <component :is="getTrendIcon()" :size="20" :class="getTrendClass()" />
              </div>
              <div class="trend-item">
                <span class="trend-label">目标</span>
                <span class="trend-value target">{{ scaleForm.targetReplicas }}</span>
              </div>
              <div class="trend-change" :class="getTrendClass()">
                <span>{{ getChangeText() }}</span>
              </div>
            </div>
          </ElFormItem>

          <!-- 操作提示 -->
          <ElAlert v-if="hasChanged" type="warning" :closable="false" show-icon class="scale-alert">
            <template #title>
              <div class="alert-content">
                <span>
                  副本数将从 <strong>{{ currentReplicas }}</strong> 调整为
                  <strong>{{ scaleForm.targetReplicas }}</strong>
                </span>
                <span v-if="scaleForm.targetReplicas > currentReplicas" class="alert-tip">
                  （扩容 {{ scaleForm.targetReplicas - currentReplicas }} 个副本）
                </span>
                <span v-else-if="scaleForm.targetReplicas < currentReplicas" class="alert-tip">
                  （缩容 {{ currentReplicas - scaleForm.targetReplicas }} 个副本）
                </span>
              </div>
            </template>
          </ElAlert>

          <ElFormItem>
            <div class="form-actions">
              <ElButton
                type="primary"
                size="large"
                :loading="scaling"
                :disabled="!hasChanged"
                @click="handleScale"
              >
                <Check :size="16" v-if="!scaling" />
                {{ scaling ? '应用中...' : '应用更改' }}
              </ElButton>
              <ElButton size="large" :disabled="!hasChanged || scaling" @click="handleReset">
                <RotateCcw :size="16" />
                重置
              </ElButton>
            </div>
          </ElFormItem>
        </ElForm>
      </div>

      <!-- 右侧：说明文档 -->
      <div class="info-section">
        <div class="info-card">
          <div class="info-title">
            <BookOpen :size="16" />
            <span>扩缩容说明</span>
          </div>
          <div class="info-content">
            <div class="info-item">
              <div class="info-item-header">
                <CheckCircle :size="14" class="icon-success" />
                <strong>扩容（增加副本）</strong>
              </div>
              <p>系统会创建新的 Pod，逐步增加到目标数量。新 Pod 会自动加入负载均衡。</p>
            </div>

            <div class="info-item">
              <div class="info-item-header">
                <CheckCircle :size="14" class="icon-success" />
                <strong>缩容（减少副本）</strong>
              </div>
              <p>
                系统会优雅地终止多余的 Pod，直到达到目标数量。Pod 会先从负载均衡中移除，然后执行
                PreStop 钩子，最后终止。
              </p>
            </div>

            <div class="info-item warning">
              <div class="info-item-header">
                <AlertTriangle :size="14" class="icon-warning" />
                <strong>重要提示</strong>
              </div>
              <ul>
                <li>缩容会导致部分 Pod 被终止，请确保服务有足够的副本保证可用性</li>
                <li>建议在低峰期执行大规模扩缩容操作</li>
                <li>如果配置了 HPA，手动设置的副本数可能会被自动扩缩容覆盖</li>
              </ul>
            </div>

            <div class="info-item">
              <div class="info-item-header">
                <Info :size="14" class="icon-info" />
                <strong>最佳实践</strong>
              </div>
              <ul>
                <li>生产环境建议至少保持 2 个副本以保证高可用</li>
                <li>根据实际负载和资源情况合理设置副本数</li>
                <li>可以配合 HPA 实现自动扩缩容</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted, onActivated } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Layers,
    Settings,
    Plus,
    Minus,
    Check,
    RotateCcw,
    ArrowUp,
    ArrowDown,
    Minus as MinusIcon,
    BookOpen,
    CheckCircle,
    AlertTriangle,
    HelpCircle,
    Info
  } from 'lucide-vue-next'
  import { getResourceReplicasApi, scaleResourceApi, type OnecProjectVersion } from '@/api'

  defineOptions({ name: 'ReplicaManagement' })

  interface Props {
    version: OnecProjectVersion
    resourceType: string
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    success: []
  }>()

  // 状态管理
  const loading = ref(false)
  const scaling = ref(false)
  const currentReplicas = ref<number | null>(null)

  const scaleForm = reactive({
    targetReplicas: 0
  })

  // 是否有变化
  const hasChanged = computed(() => {
    return currentReplicas.value !== null && scaleForm.targetReplicas !== currentReplicas.value
  })

  // 获取资源类型描述
  const getResourceTypeDesc = (type: string) => {
    const descMap: Record<string, string> = {
      deployment: 'Deployment',
      statefulset: 'StatefulSet',
      replicaset: 'ReplicaSet',
      daemonset: 'DaemonSet'
    }
    return descMap[type] || '资源类型'
  }

  // 获取趋势图标
  const getTrendIcon = () => {
    if (scaleForm.targetReplicas > currentReplicas.value!) {
      return ArrowUp
    } else if (scaleForm.targetReplicas < currentReplicas.value!) {
      return ArrowDown
    }
    return MinusIcon
  }

  // 获取趋势样式类
  const getTrendClass = () => {
    if (scaleForm.targetReplicas > currentReplicas.value!) {
      return 'trend-up'
    } else if (scaleForm.targetReplicas < currentReplicas.value!) {
      return 'trend-down'
    }
    return 'trend-same'
  }

  // 获取变化文本
  const getChangeText = () => {
    const diff = scaleForm.targetReplicas - (currentReplicas.value || 0)
    if (diff > 0) {
      return `扩容 +${diff}`
    } else if (diff < 0) {
      return `缩容 ${diff}`
    }
    return '无变化'
  }

  // 加载副本数
  const loadReplicas = async () => {
    if (!props.version?.id) {
      console.warn('[副本管理] 版本ID不存在，跳过加载')
      return
    }

    loading.value = true
    try {
      const replicas = await getResourceReplicasApi(props.version.id)
      currentReplicas.value = replicas
      scaleForm.targetReplicas = replicas
    } catch (error) {
      console.error('[副本管理] 加载失败:', error)
      currentReplicas.value = null
    } finally {
      loading.value = false
    }
  }

  // 应用扩缩容
  const handleScale = async () => {
    if (!hasChanged.value) {
      return
    }

    if (!props.version?.id) {
      return
    }

    try {
      const actionText =
        scaleForm.targetReplicas > currentReplicas.value!
          ? `扩容到 ${scaleForm.targetReplicas} 个副本`
          : `缩容到 ${scaleForm.targetReplicas} 个副本`

      await ElMessageBox.confirm(`确定要${actionText}吗？`, '确认操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      scaling.value = true
      await scaleResourceApi(props.version.id, {
        replicas: scaleForm.targetReplicas
      })

      ElMessage.success('扩缩容成功')
      currentReplicas.value = scaleForm.targetReplicas
      emit('success')

      // 延迟刷新，等待 K8s 更新状态
      setTimeout(() => {
        loadReplicas()
      }, 2000)
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[副本管理] 失败:', error)
      }
    } finally {
      scaling.value = false
    }
  }

  // 重置
  const handleReset = () => {
    scaleForm.targetReplicas = currentReplicas.value || 0
    ElMessage.info('已重置为当前副本数')
  }

  // 监听刷新触发器
  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        loadReplicas()
      }
    }
  )

  // 组件挂载时加载
  onMounted(() => {
    loadReplicas()
  })

  // Tab切换激活时重新加载
  onActivated(() => {
    loadReplicas()
  })

  // 暴露方法供父组件调用
  defineExpose({
    hasUnsavedChanges: () => hasChanged.value,
    refresh: loadReplicas
  })
</script>

<style scoped lang="scss">
  .replica-management-container {
    height: 100%;
    background: #fff;

    .loading-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    // 左右布局
    .content-layout {
      display: flex;
      height: 100%;
      gap: 24px;

      // 左侧表单区域
      .form-section {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;
        min-width: 0;

        // Section 标题
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 16px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:first-child {
            margin-top: 0;
          }
        }

        // 表单样式
        :deep(.el-form) {
          .el-form-item {
            margin-bottom: 18px;

            .el-form-item__label {
              font-weight: 500;
              display: flex;
              align-items: center;
            }
          }
        }

        // Label 帮助图标
        .label-help-icon {
          margin-left: 6px;
          color: var(--el-text-color-secondary);
          cursor: help;
          vertical-align: middle;

          &:hover {
            color: var(--el-color-primary);
          }
        }

        // 当前副本数显示
        .current-replicas-display {
          display: flex;
          align-items: center;
          gap: 12px;

          .replica-number {
            font-size: 32px;
            font-weight: 700;
            color: var(--el-color-primary);
            line-height: 1;
          }
        }

        // 目标副本数输入
        .replica-input-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;

          :deep(.el-input-number) {
            width: 200px;

            .el-input-number__decrease,
            .el-input-number__increase {
              width: 40px;
            }

            .el-input__inner {
              text-align: center;
              font-size: 18px;
              font-weight: 600;
            }
          }

          .replica-actions {
            display: flex;
            gap: 8px;
          }
        }

        // 变化趋势
        .scale-trend {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: var(--el-fill-color-light);
          border-radius: 8px;
          border: 2px solid var(--el-border-color);

          .trend-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;

            .trend-label {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }

            .trend-value {
              font-size: 32px;
              font-weight: 700;
              color: var(--el-text-color-primary);

              &.current {
                color: var(--el-text-color-regular);
              }

              &.target {
                color: var(--el-color-primary);
              }
            }
          }

          .trend-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: white;
            border: 2px solid var(--el-border-color);

            &.trend-up {
              color: var(--el-color-success);
              border-color: var(--el-color-success);
              background: var(--el-color-success-light-9);
            }

            &.trend-down {
              color: var(--el-color-warning);
              border-color: var(--el-color-warning);
              background: var(--el-color-warning-light-9);
            }

            &.trend-same {
              color: var(--el-text-color-secondary);
            }
          }

          .trend-change {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            background: var(--el-fill-color);
            color: var(--el-text-color-regular);

            &.trend-up {
              background: var(--el-color-success-light-9);
              color: var(--el-color-success);
            }

            &.trend-down {
              background: var(--el-color-warning-light-9);
              color: var(--el-color-warning);
            }
          }
        }

        // 警告提示
        .scale-alert {
          margin: 16px 0;
          border-radius: 8px;

          .alert-content {
            display: flex;
            align-items: center;
            gap: 8px;

            .alert-tip {
              color: var(--el-color-warning);
              font-weight: 500;
            }
          }
        }

        // 操作按钮
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
      }

      // 右侧信息区域
      .info-section {
        width: 360px;
        padding: 20px 24px 20px 0;
        flex-shrink: 0;
        overflow-y: auto;

        .info-card {
          background: var(--el-fill-color-lighter);
          border-radius: 8px;
          border: 1px solid var(--el-border-color);
          padding: 20px;

          .info-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--el-border-color-lighter);
          }

          .info-content {
            display: flex;
            flex-direction: column;
            gap: 16px;

            .info-item {
              padding: 12px;
              background: white;
              border-radius: 6px;
              border: 1px solid var(--el-border-color-lighter);

              &.warning {
                background: var(--el-color-warning-light-9);
                border-color: var(--el-color-warning-light-5);
              }

              .info-item-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;

                .icon-success {
                  color: var(--el-color-success);
                }

                .icon-warning {
                  color: var(--el-color-warning);
                }

                .icon-info {
                  color: var(--el-color-primary);
                }

                strong {
                  font-size: 13px;
                  color: var(--el-text-color-primary);
                }
              }

              p {
                margin: 0;
                font-size: 12px;
                line-height: 1.6;
                color: var(--el-text-color-regular);
              }

              ul {
                margin: 0;
                padding-left: 20px;
                font-size: 12px;
                line-height: 1.6;
                color: var(--el-text-color-regular);

                li {
                  margin: 4px 0;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
