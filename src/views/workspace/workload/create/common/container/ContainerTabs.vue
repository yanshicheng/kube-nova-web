<template>
  <div class="container-tabs">
    <ElTabs v-model="activeTab" type="border-card">
      <ElTabPane label="基本信息" name="basic">
        <BasicConfigTab />
      </ElTabPane>

      <ElTabPane name="ports">
        <template #label>
          <span class="tab-label">
            端口配置
            <ElBadge v-if="portsCount > 0" :value="portsCount" type="primary" class="tab-badge" />
          </span>
        </template>
        <PortsConfigTab />
      </ElTabPane>

      <ElTabPane name="env">
        <template #label>
          <span class="tab-label">
            环境变量
            <ElBadge v-if="envCount > 0" :value="envCount" type="success" class="tab-badge" />
          </span>
        </template>
        <EnvConfigTab />
      </ElTabPane>

      <ElTabPane name="resources">
        <template #label>
          <span class="tab-label">
            资源配置
            <ElTag
              v-if="hasResources"
              size="small"
              type="success"
              effect="plain"
              style="margin-left: 4px"
              >已配置</ElTag
            >
          </span>
        </template>
        <ResourcesConfigTab />
      </ElTabPane>

      <ElTabPane name="volumes">
        <template #label>
          <span class="tab-label">
            存储卷
            <ElBadge
              v-if="volumeMountsCount > 0"
              :value="volumeMountsCount"
              type="warning"
              class="tab-badge"
            />
          </span>
        </template>
        <VolumeMountsConfigTab />
      </ElTabPane>

      <ElTabPane name="health">
        <template #label>
          <span class="tab-label">
            健康检查
            <ElTag
              v-if="hasHealthCheck"
              size="small"
              type="success"
              effect="plain"
              style="margin-left: 4px"
              >已配置</ElTag
            >
          </span>
        </template>
        <HealthCheckTab />
      </ElTabPane>

      <ElTabPane name="lifecycle">
        <template #label>
          <span class="tab-label">
            生命周期
            <ElTag
              v-if="hasLifecycle"
              size="small"
              type="success"
              effect="plain"
              style="margin-left: 4px"
              >已配置</ElTag
            >
          </span>
        </template>
        <LifecycleConfigTab />
      </ElTabPane>

      <ElTabPane name="security">
        <template #label>
          <span class="tab-label">
            安全上下文
            <ElTag
              v-if="hasSecurity"
              size="small"
              type="success"
              effect="plain"
              style="margin-left: 4px"
              >已配置</ElTag
            >
          </span>
        </template>
        <SecurityConfigTab />
      </ElTabPane>

      <ElTabPane name="advanced">
        <template #label>
          <span class="tab-label">
            高级配置
            <ElTag
              v-if="hasAdvanced"
              size="small"
              type="success"
              effect="plain"
              style="margin-left: 4px"
              >已配置</ElTag
            >
          </span>
        </template>
        <AdvancedConfig />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useContainersStore } from '@/store/workload'
  import BasicConfigTab from './tabs/BasicConfigTab.vue'
  import PortsConfigTab from './tabs/PortsConfigTab.vue'
  import EnvConfigTab from './tabs/EnvConfigTab.vue'
  import ResourcesConfigTab from './tabs/ResourcesConfigTab.vue'
  import VolumeMountsConfigTab from './tabs/VolumeMountsConfigTab.vue'
  import HealthCheckTab from './tabs/HealthCheckTab.vue'
  import LifecycleConfigTab from './tabs/LifecycleConfigTab.vue'
  import SecurityConfigTab from './tabs/SecurityConfigTab.vue'
  import AdvancedConfig from './tabs/AdvancedConfig.vue'

  const containersStore = useContainersStore()
  const activeTab = ref('basic')

  // 当前选中的容器
  const selectedContainer = computed(() => containersStore.selectedContainer)

  // 监听容器切换，重置到基本信息 Tab
  watch(
    () => containersStore.selectedContainerId,
    (newId, oldId) => {
      if (newId !== oldId) {
        activeTab.value = 'basic'
      }
    }
  )

  // 端口数量
  const portsCount = computed(() => {
    return selectedContainer.value?.ports?.length || 0
  })

  // 环境变量数量
  const envCount = computed(() => {
    return selectedContainer.value?.env?.length || 0
  })

  // 存储卷挂载数量
  const volumeMountsCount = computed(() => {
    return selectedContainer.value?.volumeMounts?.length || 0
  })

  // 是否配置了资源
  const hasResources = computed(() => {
    const resources = selectedContainer.value?.resources
    if (!resources) return false

    const hasRequests = resources.requests && Object.keys(resources.requests).length > 0
    const hasLimits = resources.limits && Object.keys(resources.limits).length > 0

    return hasRequests || hasLimits
  })

  // 是否配置了健康检查
  const hasHealthCheck = computed(() => {
    return !!(
      selectedContainer.value?.livenessProbe ||
      selectedContainer.value?.readinessProbe ||
      selectedContainer.value?.startupProbe
    )
  })

  // 是否配置了生命周期
  const hasLifecycle = computed(() => {
    const lifecycle = selectedContainer.value?.lifecycle
    return !!(lifecycle?.postStart || lifecycle?.preStop)
  })

  // 是否配置了安全上下文
  const hasSecurity = computed(() => {
    return !!selectedContainer.value?.securityContext
  })

  // 是否配置了高级选项
  const hasAdvanced = computed(() => {
    const container = selectedContainer.value
    if (!container) return false

    return !!(
      container.stdin ||
      container.stdinOnce ||
      container.tty ||
      container.restartPolicy ||
      (container.resizePolicy && container.resizePolicy.length > 0)
    )
  })
</script>

<style lang="scss" scoped>
  .container-tabs {
    ::v-deep(.el-tabs) {
      border-radius: 8px;
      overflow: hidden;

      .el-tabs__header {
        margin: 0;
        border-bottom: 1px solid #e4e7ed;
        background: #f5f7fa;
      }

      .el-tabs__nav {
        display: flex;
        flex-wrap: wrap;
      }

      .el-tabs__item {
        padding: 0 16px;
        height: 38px;
        line-height: 38px;
        font-size: 13px;

        .tab-label {
          display: flex;
          align-items: center;
          gap: 4px;

          .tab-badge {
            ::v-deep(.el-badge__content) {
              height: 16px;
              line-height: 16px;
              padding: 0 5px;
              font-size: 10px;
            }
          }
        }
      }

      .el-tabs__content {
        padding: 16px;
        max-height: 500px;
        overflow-y: auto;
      }
    }
  }
</style>
