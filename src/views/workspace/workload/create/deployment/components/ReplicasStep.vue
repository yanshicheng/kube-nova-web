<template>
  <div class="replicas-step">
    <ElForm label-width="180px" label-position="right">
      <!-- 副本数量 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <Copy :size="18" />
            <span>副本数量</span>
            <ElTooltip content="定义 Pod 副本的数量，影响服务的可用性和负载能力" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="副本数" required>
          <ElInputNumber
            v-model="deploymentStore.replicas"
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
          v-if="deploymentStore.replicas === 0"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <template #title>⚠️ 副本数为 0</template>
          副本数为 0 时，Deployment 将不会创建任何 Pod 实例，服务将完全停止
        </ElAlert>

        <ElAlert
          v-else-if="deploymentStore.replicas === 1"
          type="info"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <template #title>💡 单副本部署</template>
          单副本部署可能存在单点故障风险，建议至少部署 2 个副本以提高服务可用性
        </ElAlert>

        <ElAlert v-else type="success" :closable="false" show-icon style="margin-top: 16px">
          <template #title>✅ 多副本部署</template>
          当前配置 {{ deploymentStore.replicas }} 个副本，可以提供高可用性和负载均衡能力
        </ElAlert>
      </ElCard>

      <!-- 更新策略 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <RefreshCw :size="18" />
            <span>更新策略 (Strategy)</span>
            <ElTooltip content="定义如何更新 Pod 实例" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="更新策略类型" required>
          <ElSelect
            v-model="localStrategy.type"
            placeholder="请选择更新策略"
            @change="handleStrategyTypeChange"
            style="width: 100%"
          >
            <ElOption label="滚动更新 (RollingUpdate)" value="RollingUpdate">
              <div class="option-with-hint">
                <span>滚动更新 (RollingUpdate)</span>
                <span class="option-hint">逐步替换旧版本 Pod，保证服务不中断（推荐）</span>
              </div>
            </ElOption>
            <ElOption label="重建 (Recreate)" value="Recreate">
              <div class="option-with-hint">
                <span>重建 (Recreate)</span>
                <span class="option-hint">先删除所有旧 Pod，再创建新 Pod（服务会短暂中断）</span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <!-- 滚动更新配置 -->
        <template v-if="localStrategy.type === 'RollingUpdate'">
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
                :min="0"
                :max="deploymentStore.replicas"
                @change="updateMaxUnavailable"
                style="width: 150px; margin-left: 16px"
              />
              <div v-else style="display: flex; align-items: center; gap: 8px; margin-left: 16px">
                <ElInputNumber
                  v-model="maxUnavailablePercentage"
                  :min="0"
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

          <ElFormItem label="最大超出数">
            <div class="strategy-config">
              <ElRadioGroup v-model="maxSurgeType" @change="updateMaxSurge">
                <ElRadio value="number">数量</ElRadio>
                <ElRadio value="percentage">百分比</ElRadio>
              </ElRadioGroup>

              <ElInputNumber
                v-if="maxSurgeType === 'number'"
                v-model="maxSurgeNumber"
                :min="0"
                :max="20"
                @change="updateMaxSurge"
                style="width: 150px; margin-left: 16px"
              />
              <div v-else style="display: flex; align-items: center; gap: 8px; margin-left: 16px">
                <ElInputNumber
                  v-model="maxSurgePercentage"
                  :min="0"
                  :max="100"
                  @change="updateMaxSurge"
                  style="width: 150px"
                />
                <span>%</span>
              </div>

              <ElTooltip content="更新过程中允许创建的最大额外 Pod 数量或百分比" placement="top">
                <Info :size="16" class="info-icon inline-icon" />
              </ElTooltip>
            </div>
          </ElFormItem>

          <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
            <template #title>滚动更新说明</template>
            <div style="font-size: 13px; line-height: 1.6">
              <p style="margin: 8px 0">
                • <strong>最大不可用数</strong>：更新时允许暂时不可用的 Pod
                数量，值越小更新越平稳但速度越慢
              </p>
              <p style="margin: 8px 0">
                • <strong>最大超出数</strong>：更新时可以超出期望副本数的 Pod
                数量，值越大更新越快但资源消耗越多
              </p>
              <p style="margin: 8px 0">
                • <strong>推荐配置</strong>：两者都设置为 25%，平衡更新速度和资源使用
              </p>
              <p style="margin: 8px 0">
                • <strong>保守配置</strong>：最大不可用数设为 0，最大超出数设为
                1，确保始终有足够副本运行
              </p>
            </div>
          </ElAlert>
        </template>

        <!-- 重建策略说明 -->
        <template v-else>
          <ElAlert type="warning" :closable="false" show-icon style="margin-top: 16px">
            <template #title>重建策略说明</template>
            <div style="font-size: 13px; line-height: 1.6">
              <p style="margin: 8px 0">使用重建策略时：</p>
              <p style="margin: 8px 0">• 会先终止所有现有 Pod</p>
              <p style="margin: 8px 0">• 然后创建新版本的 Pod</p>
              <p style="margin: 8px 0">• <strong>⚠️ 更新过程中服务会短暂不可用</strong></p>
              <p style="margin: 8px 0">• 适合无法同时运行多版本的应用（如数据库迁移场景）</p>
            </div>
          </ElAlert>
        </template>
      </ElCard>

      <!-- 历史版本限制 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <History :size="18" />
            <span>历史版本管理</span>
            <ElTooltip content="控制保留的 ReplicaSet 历史版本数量" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="保留历史版本数">
          <ElInputNumber
            v-model="deploymentStore.revisionHistoryLimit"
            :min="0"
            :max="20"
            placeholder="10"
            style="width: 200px"
            @change="emitValidation"
          />
          <ElTooltip
            content="保留的 ReplicaSet 数量，用于回滚。设置为 0 将禁用回滚功能"
            placement="top"
          >
            <Info :size="16" class="info-icon inline-icon" />
          </ElTooltip>
        </ElFormItem>

        <ElAlert
          v-if="deploymentStore.revisionHistoryLimit === 0"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        >
          <template #title>⚠️ 回滚功能已禁用</template>
          设置为 0 将无法回滚到之前的版本，不推荐用于生产环境
        </ElAlert>

        <ElAlert v-else type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title>历史版本说明</template>
          <div style="font-size: 13px; line-height: 1.6">
            <p style="margin: 4px 0">• 每次更新都会创建新的 ReplicaSet 并保留旧的</p>
            <p style="margin: 4px 0">
              • 保留 {{ deploymentStore.revisionHistoryLimit }} 个历史版本，可以快速回滚
            </p>
            <p style="margin: 4px 0">• 历史版本会占用一定的 etcd 存储空间</p>
          </div>
        </ElAlert>
      </ElCard>

      <!-- 进度截止时间 -->
      <ElCard class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <Clock :size="18" />
            <span>进度控制</span>
            <ElTooltip content="控制 Deployment 更新的超时时间" placement="top">
              <Info :size="16" class="info-icon" />
            </ElTooltip>
          </div>
        </template>

        <ElFormItem label="进度截止时间 (秒)">
          <ElInputNumber
            v-model="deploymentStore.progressDeadlineSeconds"
            :min="1"
            :max="3600"
            placeholder="600"
            style="width: 200px"
            @change="emitValidation"
          />
          <ElTooltip
            content="Deployment 被认为失败之前的最长等待时间，超时后会标记为失败"
            placement="top"
          >
            <Info :size="16" class="info-icon inline-icon" />
          </ElTooltip>
        </ElFormItem>

        <ElFormItem label="最小就绪秒数">
          <ElInputNumber
            v-model="deploymentStore.minReadySeconds"
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

        <ElAlert type="info" :closable="false" show-icon style="margin-top: 16px">
          • 进度截止时间: {{ deploymentStore.progressDeadlineSeconds }} 秒（{{
            Math.floor(deploymentStore.progressDeadlineSeconds / 60)
          }}
          分钟）<br />
          • 最小就绪时间: {{ deploymentStore.minReadySeconds }} 秒<br />
          超时后 Deployment 将被标记为失败，可以帮助及时发现部署问题
        </ElAlert>
      </ElCard>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { Copy, RefreshCw, History, Clock, Info } from 'lucide-vue-next'
  import { useDeploymentStore } from '@/store/workload/deployment'

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
  const deploymentStore = useDeploymentStore()

  // 本地状态
  const localStrategy = ref({ ...deploymentStore.strategy })

  // 最大不可用配置
  const maxUnavailableType = ref<'number' | 'percentage'>('percentage')
  const maxUnavailableNumber = ref(0)
  const maxUnavailablePercentage = ref(25)

  // 最大超出配置
  const maxSurgeType = ref<'number' | 'percentage'>('percentage')
  const maxSurgeNumber = ref(1)
  const maxSurgePercentage = ref(25)

  // 初始化滚动更新配置
  function initRollingUpdateConfig() {
    if (localStrategy.value.rollingUpdate) {
      const maxUnavailable = localStrategy.value.rollingUpdate.maxUnavailable
      if (typeof maxUnavailable === 'string' && maxUnavailable.endsWith('%')) {
        maxUnavailableType.value = 'percentage'
        maxUnavailablePercentage.value = parseInt(maxUnavailable)
      } else {
        maxUnavailableType.value = 'number'
        maxUnavailableNumber.value =
          typeof maxUnavailable === 'number' ? maxUnavailable : parseInt(maxUnavailable as string)
      }

      const maxSurge = localStrategy.value.rollingUpdate.maxSurge
      if (typeof maxSurge === 'string' && maxSurge.endsWith('%')) {
        maxSurgeType.value = 'percentage'
        maxSurgePercentage.value = parseInt(maxSurge)
      } else {
        maxSurgeType.value = 'number'
        maxSurgeNumber.value =
          typeof maxSurge === 'number' ? maxSurge : parseInt(maxSurge as string)
      }
    }
  }

  // 处理策略类型变化
  function handleStrategyTypeChange(value: string) {
    if (value === 'RollingUpdate') {
      localStrategy.value.rollingUpdate = {
        maxUnavailable: '25%',
        maxSurge: '25%'
      }
      initRollingUpdateConfig()
    } else {
      delete localStrategy.value.rollingUpdate
    }
    deploymentStore.setStrategy(localStrategy.value)
    emitValidation()
  }

  // 更新最大不可用数
  function updateMaxUnavailable() {
    if (!localStrategy.value.rollingUpdate) return

    if (maxUnavailableType.value === 'percentage') {
      localStrategy.value.rollingUpdate.maxUnavailable = `${maxUnavailablePercentage.value}%`
    } else {
      localStrategy.value.rollingUpdate.maxUnavailable = maxUnavailableNumber.value
    }

    deploymentStore.setStrategy(localStrategy.value)
    emitValidation()
  }

  // 更新最大超出数
  function updateMaxSurge() {
    if (!localStrategy.value.rollingUpdate) return

    if (maxSurgeType.value === 'percentage') {
      localStrategy.value.rollingUpdate.maxSurge = `${maxSurgePercentage.value}%`
    } else {
      localStrategy.value.rollingUpdate.maxSurge = maxSurgeNumber.value
    }

    deploymentStore.setStrategy(localStrategy.value)
    emitValidation()
  }

  // 发送验证结果
  function emitValidation() {
    const validation = deploymentStore.validate()
    emit('validate', validation)
  }

  // 验证
  function validate() {
    const validation = deploymentStore.validate()
    emitValidation()
    return validation.valid
  }

  // 监听 store 变化
  watch(
    () => deploymentStore.strategy,
    (newVal) => {
      localStrategy.value = { ...newVal }
      initRollingUpdateConfig()
    },
    { deep: true }
  )

  // 初始化
  onMounted(() => {
    initRollingUpdateConfig()
    emitValidation()
  })

  // 导出
  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .replicas-step {
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
  }
</style>
