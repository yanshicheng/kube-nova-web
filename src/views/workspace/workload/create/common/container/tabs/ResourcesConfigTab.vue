<template>
  <div class="resources-config">
    <!-- 功能说明 -->
    <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px">
          <Activity :size="16" />
          资源配置说明
        </div>
      </template>
      <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; line-height: 22px">
        <li><strong>Requests</strong>：容器启动所需的最小资源，用于调度决策</li>
        <li><strong>Limits</strong>：容器可使用的最大资源，防止资源滥用</li>
        <li><strong>建议</strong>：Limits 设置为 Requests 的 1.5-2 倍</li>
        <li
          ><strong>单位说明</strong>：CPU 支持核(core)和毫核(m)，内存支持 Ki/Mi/Gi/Ti（二进制）</li
        >
      </ul>
    </ElAlert>

    <!-- CPU 资源 -->
    <div class="resource-section">
      <div class="section-header">
        <h4>
          <Cpu :size="18" />
          CPU 资源
        </h4>
      </div>

      <ElForm label-width="140px">
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="CPU Requests">
              <ResourceInput
                v-model="cpuRequestsValue"
                type="cpu"
                :min="0"
                @update:model-value="updateCpuRequests"
              />
              <div class="field-hint">最小 CPU 需求（1 核 = 1000m）</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="CPU Limits">
              <ResourceInput
                v-model="cpuLimitsValue"
                type="cpu"
                :min="0"
                @update:model-value="updateCpuLimits"
              />
              <div class="field-hint">最大 CPU 限制</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>

    <ElDivider />

    <!-- 内存资源 -->
    <div class="resource-section">
      <div class="section-header">
        <h4>
          <MemoryStick :size="18" />
          内存资源
        </h4>
      </div>

      <ElForm label-width="140px">
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="内存 Requests">
              <ResourceInput
                v-model="memoryRequestsValue"
                type="memory"
                :min="0"
                @update:model-value="updateMemoryRequests"
              />
              <div class="field-hint">最小内存需求（1024 Mi = 1 Gi）</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="内存 Limits">
              <ResourceInput
                v-model="memoryLimitsValue"
                type="memory"
                :min="0"
                @update:model-value="updateMemoryLimits"
              />
              <div class="field-hint">最大内存限制</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>

    <ElDivider />

    <!-- 临时存储 -->
    <div class="resource-section">
      <div class="section-header">
        <h4>
          <HardDrive :size="18" />
          临时存储（可选）
        </h4>
        <ElSwitch v-model="enableEphemeralStorage" @change="updateResources" />
      </div>

      <ElForm v-if="enableEphemeralStorage" label-width="140px">
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="存储 Requests">
              <ResourceInput
                v-model="ephemeralStorageRequestsValue"
                type="memory"
                :min="0"
                @update:model-value="updateEphemeralStorageRequests"
              />
              <div class="field-hint">最小临时存储空间</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="存储 Limits">
              <ResourceInput
                v-model="ephemeralStorageLimitsValue"
                type="memory"
                :min="0"
                @update:model-value="updateEphemeralStorageLimits"
              />
              <div class="field-hint">最大临时存储空间</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>

    <ElDivider />

    <!-- GPU 资源 -->
    <div class="resource-section">
      <div class="section-header">
        <h4>
          <Zap :size="18" />
          GPU 资源（可选）
        </h4>
        <ElSwitch v-model="enableGpu" @change="updateResources" />
      </div>

      <ElForm v-if="enableGpu" label-width="140px">
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="GPU 类型">
              <ElSelect v-model="gpuType" @change="updateResources" style="width: 100%">
                <ElOption label="NVIDIA GPU" value="nvidia.com/gpu" />
                <ElOption label="AMD GPU" value="amd.com/gpu" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="GPU 数量">
              <div class="number-input-with-unit">
                <ElInputNumber
                  v-model="gpuCount"
                  :min="1"
                  :max="16"
                  :step="1"
                  :precision="0"
                  controls-position="right"
                  class="number-input"
                  @change="updateResources"
                />
                <span class="unit-label">个</span>
              </div>
              <div class="field-hint">请求的 GPU 数量</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>

    <!-- 快速配置模板 -->
    <ElDivider />
    <div class="quick-templates">
      <div class="templates-header">
        <Sparkles :size="16" />
        <span>快速配置模板</span>
      </div>
      <div class="templates-grid">
        <div
          v-for="template in resourceTemplates"
          :key="template.name"
          class="template-card"
          @click="applyTemplate(template)"
        >
          <div class="template-icon">
            <component :is="template.icon" :size="20" />
          </div>
          <div class="template-info">
            <div class="template-name">{{ template.name }}</div>
            <div class="template-desc">{{ template.description }}</div>
            <div class="template-values">
              CPU: {{ template.resources.cpuRequests }} / {{ template.resources.cpuLimits }}<br />
              内存: {{ template.resources.memoryRequests }} / {{ template.resources.memoryLimits }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useContainersStore } from '@/store/workload'
  import {
    Activity,
    Cpu,
    MemoryStick,
    Zap,
    HardDrive,
    Sparkles,
    Gauge,
    Rocket,
    Shield
  } from 'lucide-vue-next'
  import ResourceInput from '@/views/workspace/management/subpage/dialog/components/ResourceInput.vue'

  const containersStore = useContainersStore()

  // 获取当前容器
  const container = computed(() => containersStore.selectedContainer)

  // CPU 资源（字符串格式，带单位：如 "0.5", "500m"）
  const cpuRequestsValue = ref<string>('')
  const cpuLimitsValue = ref<string>('')

  // 内存资源（字符串格式，带二进制单位：如 "128Mi", "1Gi"）
  const memoryRequestsValue = ref<string>('')
  const memoryLimitsValue = ref<string>('')

  // 临时存储（字符串格式，带二进制单位）
  const enableEphemeralStorage = ref(false)
  const ephemeralStorageRequestsValue = ref<string>('')
  const ephemeralStorageLimitsValue = ref<string>('')

  // GPU
  const enableGpu = ref(false)
  const gpuType = ref('nvidia.com/gpu')
  const gpuCount = ref(1)

  // 从容器初始化资源配置
  watch(
    () => container.value,
    (newContainer) => {
      if (newContainer && newContainer.resources) {
        // CPU - 直接使用原始值（可能是 "0.5", "500m" 等）
        cpuRequestsValue.value = (newContainer.resources.requests?.cpu as string) || ''
        cpuLimitsValue.value = (newContainer.resources.limits?.cpu as string) || ''

        // 内存 - 直接使用原始值（二进制单位：如 "128Mi", "1Gi"）
        // 注意：如果 YAML 中有十进制单位（如 "10M"），在 loadFromK8s 时已经被转换为二进制单位（如 "9.537Mi"）
        memoryRequestsValue.value = (newContainer.resources.requests?.memory as string) || ''
        memoryLimitsValue.value = (newContainer.resources.limits?.memory as string) || ''

        // GPU
        const gpuLimit =
          newContainer.resources.limits?.['nvidia.com/gpu'] ||
          newContainer.resources.limits?.['amd.com/gpu']
        if (gpuLimit) {
          enableGpu.value = true
          gpuCount.value = parseInt(gpuLimit as string) || 1
          gpuType.value = newContainer.resources.limits?.['nvidia.com/gpu']
            ? 'nvidia.com/gpu'
            : 'amd.com/gpu'
        }

        // 临时存储
        const ephReq = newContainer.resources.requests?.['ephemeral-storage'] as string
        const ephLim = newContainer.resources.limits?.['ephemeral-storage'] as string

        if (ephReq || ephLim) {
          enableEphemeralStorage.value = true
          ephemeralStorageRequestsValue.value = ephReq || ''
          ephemeralStorageLimitsValue.value = ephLim || ''
        }
      }
    },
    { immediate: true }
  )

  // 更新 CPU Requests
  function updateCpuRequests() {
    updateResources()
  }

  // 更新 CPU Limits
  function updateCpuLimits() {
    updateResources()
  }

  // 更新内存 Requests
  function updateMemoryRequests() {
    updateResources()
  }

  // 更新内存 Limits
  function updateMemoryLimits() {
    updateResources()
  }

  // 更新临时存储 Requests
  function updateEphemeralStorageRequests() {
    updateResources()
  }

  // 更新临时存储 Limits
  function updateEphemeralStorageLimits() {
    updateResources()
  }

  // 更新容器资源
  function updateResources() {
    if (!container.value) return

    const resources: any = {
      requests: {},
      limits: {}
    }

    // CPU - 直接保存带单位的字符串
    if (cpuRequestsValue.value && cpuRequestsValue.value !== '0') {
      resources.requests.cpu = cpuRequestsValue.value
    }
    if (cpuLimitsValue.value && cpuLimitsValue.value !== '0') {
      resources.limits.cpu = cpuLimitsValue.value
    }

    // 内存 - 直接保存带二进制单位的字符串（Ki、Mi、Gi、Ti）
    if (memoryRequestsValue.value && memoryRequestsValue.value !== '0') {
      resources.requests.memory = memoryRequestsValue.value
    }
    if (memoryLimitsValue.value && memoryLimitsValue.value !== '0') {
      resources.limits.memory = memoryLimitsValue.value
    }

    // GPU
    if (enableGpu.value) {
      resources.limits[gpuType.value] = gpuCount.value.toString()
    }

    // 临时存储
    if (enableEphemeralStorage.value) {
      if (ephemeralStorageRequestsValue.value && ephemeralStorageRequestsValue.value !== '0') {
        resources.requests['ephemeral-storage'] = ephemeralStorageRequestsValue.value
      }
      if (ephemeralStorageLimitsValue.value && ephemeralStorageLimitsValue.value !== '0') {
        resources.limits['ephemeral-storage'] = ephemeralStorageLimitsValue.value
      }
    }

    containersStore.updateContainer(container.value.id, { resources })
  }

  // 资源模板（使用二进制单位格式）
  const resourceTemplates = [
    {
      name: '最小配置',
      description: '轻量级应用',
      icon: Gauge,
      resources: {
        cpuRequests: '50m',
        cpuLimits: '100m',
        memoryRequests: '64Mi',
        memoryLimits: '128Mi'
      },
      values: {
        cpuRequests: '50m',
        cpuLimits: '100m',
        memoryRequests: '64Mi',
        memoryLimits: '128Mi'
      }
    },
    {
      name: '标准配置',
      description: '常规应用',
      icon: Shield,
      resources: {
        cpuRequests: '100m',
        cpuLimits: '500m',
        memoryRequests: '128Mi',
        memoryLimits: '512Mi'
      },
      values: {
        cpuRequests: '100m',
        cpuLimits: '500m',
        memoryRequests: '128Mi',
        memoryLimits: '512Mi'
      }
    },
    {
      name: '高性能配置',
      description: '计算密集型',
      icon: Rocket,
      resources: {
        cpuRequests: '0.5',
        cpuLimits: '2',
        memoryRequests: '512Mi',
        memoryLimits: '2Gi'
      },
      values: {
        cpuRequests: '0.5',
        cpuLimits: '2',
        memoryRequests: '512Mi',
        memoryLimits: '2Gi'
      }
    }
  ]

  // 应用模板
  function applyTemplate(template: any) {
    cpuRequestsValue.value = template.values.cpuRequests
    cpuLimitsValue.value = template.values.cpuLimits
    memoryRequestsValue.value = template.values.memoryRequests
    memoryLimitsValue.value = template.values.memoryLimits
    updateResources()
  }
</script>

<style lang="scss" scoped>
  .resources-config {
    .resource-section {
      margin-bottom: 24px;

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }

      .number-input-with-unit {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;

        .number-input {
          flex: 1;
          width: 100%;

          ::v-deep(.el-input-number) {
            width: 100%;
          }

          ::v-deep(.el-input__wrapper) {
            width: 100%;
          }
        }

        .unit-label {
          min-width: 40px;
          padding: 0 12px;
          height: 32px;
          line-height: 32px;
          text-align: center;
          background: #f5f7fa;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #606266;
        }
      }

      .field-hint {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }

    .quick-templates {
      .templates-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .templates-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;

        .template-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #f5f7fa;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #e6f4ff;
            border-color: #409eff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
          }

          .template-icon {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #409eff;
            flex-shrink: 0;
          }

          .template-info {
            flex: 1;

            .template-name {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 4px;
              color: #303133;
            }

            .template-desc {
              font-size: 12px;
              color: #909399;
              margin-bottom: 8px;
            }

            .template-values {
              font-size: 11px;
              color: #606266;
              line-height: 1.6;
              font-family: 'Monaco', 'Consolas', monospace;
            }
          }
        }
      }
    }
  }
</style>
