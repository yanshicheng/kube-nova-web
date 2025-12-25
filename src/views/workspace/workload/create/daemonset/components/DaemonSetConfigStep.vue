<template>
  <div class="daemonset-config-step">
    <ElForm label-width="180px" label-position="right">
      <!-- 基本说明 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <Info :size="18" />
            <span>DaemonSet 说明</span>
          </div>
        </template>

        <ElAlert type="info" :closable="false" show-icon>
          <template #title>🔄 DaemonSet 部署模式</template>
          <div style="font-size: 13px; line-height: 1.6">
            <p style="margin: 8px 0">
              DaemonSet 确保所有（或部分）节点上运行一个 Pod 副本。常用于部署：
            </p>
            <ul style="margin: 8px 0; padding-left: 20px">
              <li>集群存储守护进程（如 glusterd、ceph）</li>
              <li>日志收集守护进程（如 fluentd、logstash）</li>
              <li>节点监控守护进程（如 Prometheus Node Exporter、collectd）</li>
              <li>网络插件（如 Calico、Flannel）</li>
            </ul>
            <p style="margin: 8px 0">
              <strong>特点：</strong>当新节点加入集群时，会自动为其添加 Pod；节点移除时，Pod 也会被回收。
            </p>
          </div>
        </ElAlert>
      </ElCard>

      <!-- 更新策略 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <RefreshCw :size="18" />
            <span>更新策略</span>
            <ElTooltip content="定义如何更新 DaemonSet Pod" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="更新策略类型" required>
          <ElSelect
            v-model="localUpdateStrategy.type"
            @change="handleUpdateStrategyTypeChange"
            style="width: 100%"
          >
            <ElOption label="RollingUpdate - 滚动更新（推荐）" value="RollingUpdate">
              <div class="option-with-hint">
                <span>RollingUpdate - 滚动更新</span>
                <span class="option-hint">逐个节点更新 Pod</span>
              </div>
            </ElOption>
            <ElOption label="OnDelete - 手动删除触发更新" value="OnDelete">
              <div class="option-with-hint">
                <span>OnDelete - 手动删除</span>
                <span class="option-hint">只有手动删除 Pod 时才会使用新版本重建</span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <!-- 滚动更新配置 -->
        <template v-if="localUpdateStrategy.type === 'RollingUpdate'">
          <ElDivider content-position="left">滚动更新参数</ElDivider>

          <ElFormItem label="最大不可用数">
            <div class="strategy-config">
              <ElRadioGroup v-model="maxUnavailableType" @change="updateMaxUnavailable">
                <ElRadio value="number">数量</ElRadio>
                <ElRadio value="percentage">百分比</ElRadio>
              </ElRadioGroup>

              <ElInputNumber
                v-if="maxUnavailableType === 'number'"
                v-model="maxUnavailableNumber"
                :min="1"
                @change="updateMaxUnavailable"
                style="width: 150px; margin-left: 16px"
              />
              <div v-else style="display: flex; align-items: center; gap: 8px; margin-left: 16px">
                <ElInputNumber
                  v-model="maxUnavailablePercentage"
                  :min="1"
                  :max="100"
                  @change="updateMaxUnavailable"
                  style="width: 150px"
                />
                <span>%</span>
              </div>

              <ElTooltip content="更新过程中允许的最大不可用 Pod 数量或百分比" placement="top">
                <Info :size="16" class="info-icon inline-icon" />
              </ElTooltip>
            </div>
          </ElFormItem>

          <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
            <template #title>滚动更新说明</template>
            <div style="font-size: 13px; line-height: 1.6">
              <p style="margin: 8px 0">
                • DaemonSet 会按节点逐个更新，确保每个节点上始终有一个可用的 Pod
              </p>
              <p style="margin: 8px 0">
                • <strong>最大不可用数</strong>：控制同时更新的节点数量，减小可提高稳定性
              </p>
              <p style="margin: 8px 0">• 设置为 1 时，每次只更新一个节点上的 Pod</p>
            </div>
          </ElAlert>
        </template>

        <!-- OnDelete 策略说明 -->
        <template v-else>
          <ElAlert type="warning" :closable="false" show-icon style="margin-top: 16px">
            <template #title>OnDelete 策略说明</template>
            <div style="font-size: 13px; line-height: 1.6">
              <p style="margin: 8px 0">使用 OnDelete 策略时：</p>
              <p style="margin: 8px 0">• DaemonSet 不会自动更新 Pod</p>
              <p style="margin: 8px 0">
                • 只有手动删除 Pod 后，控制器才会用新模板重建该节点上的 Pod
              </p>
              <p style="margin: 8px 0">• 适合需要精细控制更新过程的场景</p>
            </div>
          </ElAlert>
        </template>
      </ElCard>

      <!-- 其他配置 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <Settings :size="18" />
            <span>其他配置</span>
          </div>
        </template>

        <ElFormItem label="保留历史版本数">
          <ElInputNumber
            v-model="daemonSetStore.revisionHistoryLimit"
            :min="0"
            :max="20"
            placeholder="10"
            style="width: 200px"
            @change="emitValidation"
          />
          <ElTooltip
            content="保留的 ControllerRevision 数量，用于回滚。设置为 0 将禁用回滚功能"
            placement="top"
          >
            <Info :size="16" class="info-icon inline-icon" />
          </ElTooltip>
        </ElFormItem>

        <ElFormItem label="最小就绪秒数">
          <ElInputNumber
            v-model="daemonSetStore.minReadySeconds"
            :min="0"
            :max="600"
            placeholder="0"
            style="width: 200px"
            @change="emitValidation"
          />
          <ElTooltip
            content="新建的 Pod 在没有任何容器崩溃的情况下，视为可用状态的最小秒数"
            placement="top"
          >
            <Info :size="16" class="info-icon inline-icon" />
          </ElTooltip>
        </ElFormItem>
      </ElCard>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RefreshCw, Info, Settings } from 'lucide-vue-next'
import { useDaemonSetStore } from '@/store/workload/daemonset'

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
const daemonSetStore = useDaemonSetStore()

// 本地状态
const localUpdateStrategy = ref({ ...daemonSetStore.updateStrategy })

// 最大不可用配置
const maxUnavailableType = ref<'number' | 'percentage'>('number')
const maxUnavailableNumber = ref(1)
const maxUnavailablePercentage = ref(10)

// 初始化更新策略配置
function initUpdateStrategyConfig() {
  if (localUpdateStrategy.value.rollingUpdate) {
    const maxUnavailable = localUpdateStrategy.value.rollingUpdate.maxUnavailable
    if (maxUnavailable !== undefined) {
      if (typeof maxUnavailable === 'string' && maxUnavailable.endsWith('%')) {
        maxUnavailableType.value = 'percentage'
        maxUnavailablePercentage.value = parseInt(maxUnavailable)
      } else {
        maxUnavailableType.value = 'number'
        maxUnavailableNumber.value =
          typeof maxUnavailable === 'number' ? maxUnavailable : parseInt(maxUnavailable as string)
      }
    }
  }
}

// 处理更新策略类型变化
function handleUpdateStrategyTypeChange(value: string) {
  if (value === 'RollingUpdate') {
    localUpdateStrategy.value.rollingUpdate = {
      maxUnavailable: 1
    }
    initUpdateStrategyConfig()
  } else {
    delete localUpdateStrategy.value.rollingUpdate
  }
  daemonSetStore.setUpdateStrategy(localUpdateStrategy.value)
  emitValidation()
}

// 更新最大不可用数
function updateMaxUnavailable() {
  if (!localUpdateStrategy.value.rollingUpdate) return

  if (maxUnavailableType.value === 'percentage') {
    localUpdateStrategy.value.rollingUpdate.maxUnavailable = `${maxUnavailablePercentage.value}%`
  } else {
    localUpdateStrategy.value.rollingUpdate.maxUnavailable = maxUnavailableNumber.value
  }

  daemonSetStore.setUpdateStrategy(localUpdateStrategy.value)
  emitValidation()
}

// 发送验证结果
function emitValidation() {
  const validation = daemonSetStore.validate()
  emit('validate', validation)
}

// 验证
function validate() {
  const validation = daemonSetStore.validate()
  emitValidation()
  return validation.valid
}

// 监听 store 变化
watch(
  () => daemonSetStore.updateStrategy,
  (newVal) => {
    localUpdateStrategy.value = { ...newVal }
    initUpdateStrategyConfig()
  },
  { deep: true }
)

// 初始化
onMounted(() => {
  initUpdateStrategyConfig()
  emitValidation()
})

// 导出
defineExpose({
  validate
})
</script>

<style lang="scss" scoped>
.daemonset-config-step {
  padding: 24px;
  background: #fff;
  border-radius: 8px;

  .config-card {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }
  }

  .strategy-config {
    display: flex;
    align-items: center;
  }

  .option-with-hint {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .option-hint {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .info-icon {
    color: #9ca3af;
    cursor: help;

    &.inline-icon {
      margin-left: 8px;
    }
  }

  .field-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>