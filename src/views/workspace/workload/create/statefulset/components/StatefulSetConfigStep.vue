<template>
  <div class="statefulset-config-step">
    <ElForm label-width="180px" label-position="right">
      <!-- 基本配置 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <Copy :size="18" />
            <span>基本配置</span>
            <ElTooltip content="StatefulSet 的基本配置" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="Service 名称" required>
          <ElInput
            v-model="statefulSetStore.serviceName"
            :placeholder="suggestedServiceName || '将自动生成：英文名-版本'"
            clearable
            @change="handleServiceNameChange"
            style="width: 300px"
          />
          <ElTooltip
            content="关联的 Headless Service 名称，默认为：英文名-版本"
            placement="top"
          >
            <Info :size="16" class="info-icon inline-icon" />
          </ElTooltip>
          <div v-if="suggestedServiceName && suggestedServiceName !== statefulSetStore.serviceName" class="field-hint">
            💡 建议使用: <code>{{ suggestedServiceName }}</code>
          </div>
          <div v-else class="field-hint">
            默认自动生成，也可手动修改
          </div>
        </ElFormItem>

        <ElFormItem label="副本数" required>
          <ElInputNumber
            v-model="statefulSetStore.replicas"
            :min="0"
            :max="100"
            :step="1"
            placeholder="请输入副本数"
            style="width: 200px"
            @change="emitValidation"
          />
          <ElTooltip content="Pod 实例的数量，设置为 0 可暂停服务" placement="top">
            <Info :size="16" class="info-icon inline-icon" />
          </ElTooltip>
        </ElFormItem>

        <ElAlert
          v-if="statefulSetStore.replicas === 0"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <template #title>⚠️ 副本数为 0</template>
          副本数为 0 时，StatefulSet 将不会创建任何 Pod 实例
        </ElAlert>

        <ElAlert
          v-else-if="statefulSetStore.replicas === 1"
          type="info"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <template #title>💡 单副本部署</template>
          StatefulSet 通常用于需要稳定网络标识的有状态应用，建议根据实际需求设置副本数
        </ElAlert>

        <ElAlert v-else type="success" :closable="false" show-icon style="margin-top: 16px">
          <template #title>✅ 多副本部署</template>
          当前配置 {{ statefulSetStore.replicas }} 个副本，每个 Pod 都有唯一的网络标识
        </ElAlert>
      </ElCard>

      <!-- Pod 管理策略 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <Settings :size="18" />
            <span>Pod 管理策略</span>
            <ElTooltip content="控制 Pod 的创建和删除顺序" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="管理策略" required>
          <ElSelect
            v-model="statefulSetStore.podManagementPolicy"
            @change="emitValidation"
            style="width: 100%"
          >
            <ElOption label="OrderedReady - 顺序启动（推荐）" value="OrderedReady">
              <div class="option-with-hint">
                <span>OrderedReady - 顺序启动</span>
                <span class="option-hint"
                >按序号顺序创建和删除 Pod，前一个 Pod 就绪后才创建下一个</span
                >
              </div>
            </ElOption>
            <ElOption label="Parallel - 并行启动" value="Parallel">
              <div class="option-with-hint">
                <span>Parallel - 并行启动</span>
                <span class="option-hint">并行创建和删除所有 Pod，不保证顺序</span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title>管理策略说明</template>
          <div style="font-size: 13px; line-height: 1.6">
            <p style="margin: 8px 0">
              • <strong>OrderedReady</strong>：按 Pod 序号顺序创建（0, 1, 2...），删除时逆序（...2,
              1, 0）
            </p>
            <p style="margin: 8px 0">
              • <strong>Parallel</strong>：所有 Pod 同时创建和删除，适合不依赖启动顺序的应用
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
            <ElTooltip content="定义如何更新 StatefulSet Pod" placement="top">
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
                <span class="option-hint">按逆序号顺序更新 Pod</span>
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

          <ElFormItem label="分区 (Partition)">
            <ElInputNumber
              v-model="partition"
              :min="0"
              :max="statefulSetStore.replicas"
              @change="updatePartition"
              style="width: 200px"
            />
            <ElTooltip
              content="序号 >= 此值的 Pod 将更新，小于此值的 Pod 保持旧版本"
              placement="top"
            >
              <Info :size="16" class="info-icon inline-icon" />
            </ElTooltip>
          </ElFormItem>

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
                :max="statefulSetStore.replicas"
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
                • StatefulSet 按 <strong>逆序号</strong> 更新（从最大序号开始）
              </p>
              <p style="margin: 8px 0">
                • <strong>分区值</strong>：设置为 N 时，序号 >= N 的 Pod 会更新，< N 的保持旧版本
              </p>
              <p style="margin: 8px 0">
                • <strong>最大不可用数</strong>：控制同时更新的 Pod 数量，减小可提高稳定性
              </p>
              <p style="margin: 8px 0">
                • 分区值为 0 时，所有 Pod 都会更新；设置为副本数时，所有 Pod 都不更新
              </p>
            </div>
          </ElAlert>
        </template>

        <!-- OnDelete 策略说明 -->
        <template v-else>
          <ElAlert type="warning" :closable="false" show-icon style="margin-top: 16px">
            <template #title>OnDelete 策略说明</template>
            <div style="font-size: 13px; line-height: 1.6">
              <p style="margin: 8px 0">使用 OnDelete 策略时：</p>
              <p style="margin: 8px 0">• StatefulSet 不会自动更新 Pod</p>
              <p style="margin: 8px 0">
                • 只有手动删除 Pod 后，控制器才会用新模板重建该 Pod
              </p>
              <p style="margin: 8px 0">• 适合需要精细控制更新过程的场景</p>
            </div>
          </ElAlert>
        </template>
      </ElCard>

      <!-- PVC 保留策略 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <Database :size="18" />
            <span>PVC 保留策略</span>
            <ElTooltip content="控制 PVC 的生命周期" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="删除时保留策略">
          <ElSelect
            v-model="statefulSetStore.persistentVolumeClaimRetentionPolicy.whenDeleted"
            @change="emitValidation"
            style="width: 100%"
          >
            <ElOption label="Retain - 保留（推荐）" value="Retain" />
            <ElOption label="Delete - 删除" value="Delete" />
          </ElSelect>
          <div class="field-hint">StatefulSet 删除时，PVC 的处理方式</div>
        </ElFormItem>

        <ElFormItem label="缩容时保留策略">
          <ElSelect
            v-model="statefulSetStore.persistentVolumeClaimRetentionPolicy.whenScaled"
            @change="emitValidation"
            style="width: 100%"
          >
            <ElOption label="Retain - 保留（推荐）" value="Retain" />
            <ElOption label="Delete - 删除" value="Delete" />
          </ElSelect>
          <div class="field-hint">副本数减少时，多余 PVC 的处理方式</div>
        </ElFormItem>

        <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title>PVC 保留策略说明</template>
          <div style="font-size: 13px; line-height: 1.6">
            <p style="margin: 8px 0">
              • <strong>Retain</strong>：保留 PVC 和数据，需要手动清理（推荐，防止数据丢失）
            </p>
            <p style="margin: 8px 0">
              • <strong>Delete</strong>：自动删除 PVC，数据将永久丢失（谨慎使用）
            </p>
          </div>
        </ElAlert>
      </ElCard>

      <!-- 其他配置 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <History :size="18" />
            <span>其他配置</span>
          </div>
        </template>

        <ElFormItem label="保留历史版本数">
          <ElInputNumber
            v-model="statefulSetStore.revisionHistoryLimit"
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
            v-model="statefulSetStore.minReadySeconds"
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
import { ref, watch, onMounted, computed } from 'vue'
import { Copy, RefreshCw, History, Info, Settings, Database } from 'lucide-vue-next'
import { useStatefulSetStore } from '@/store/workload/statefulset'
import { useMetadataStore } from '@/store/workload'

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
const statefulSetStore = useStatefulSetStore()
const metadataStore = useMetadataStore()

// 建议的 Service 名称（用于提示）
const suggestedServiceName = computed(() => {
  const { nameEn, version } = metadataStore.metadata
  if (nameEn && version) {
    return `${nameEn}-${version}`
  }
  return ''
})

// 本地状态
const localUpdateStrategy = ref({ ...statefulSetStore.updateStrategy })

// 分区值
const partition = ref(0)

// 最大不可用配置
const maxUnavailableType = ref<'number' | 'percentage'>('number')
const maxUnavailableNumber = ref(1)
const maxUnavailablePercentage = ref(10)

// 初始化更新策略配置
function initUpdateStrategyConfig() {
  if (localUpdateStrategy.value.rollingUpdate) {
    partition.value = localUpdateStrategy.value.rollingUpdate.partition || 0

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
      partition: 0,
      maxUnavailable: 1
    }
    initUpdateStrategyConfig()
  } else {
    delete localUpdateStrategy.value.rollingUpdate
  }
  statefulSetStore.setUpdateStrategy(localUpdateStrategy.value)
  emitValidation()
}

// 处理 Service 名称变化
function handleServiceNameChange(value: string) {
  // 调用 store 的 setServiceName 会自动标记为手动设置
  statefulSetStore.setServiceName(value)
  emitValidation()
}

// 更新分区值
function updatePartition() {
  if (!localUpdateStrategy.value.rollingUpdate) return

  localUpdateStrategy.value.rollingUpdate.partition = partition.value
  statefulSetStore.setUpdateStrategy(localUpdateStrategy.value)
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

  statefulSetStore.setUpdateStrategy(localUpdateStrategy.value)
  emitValidation()
}

// 发送验证结果
function emitValidation() {
  const validation = statefulSetStore.validate()
  emit('validate', validation)
}

// 验证
function validate() {
  const validation = statefulSetStore.validate()
  emitValidation()
  return validation.valid
}

// 监听 store 变化
watch(
  () => statefulSetStore.updateStrategy,
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
.statefulset-config-step {
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