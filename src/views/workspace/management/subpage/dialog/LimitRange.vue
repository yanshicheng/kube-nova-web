<template>
  <div class="step-panel">
    <!-- 快速模板选择 -->
    <div class="template-selector" v-if="mode === 'create'">
      <div class="selector-header">
        <ElIcon><Lightning /></ElIcon>
        <span>快速配置模板</span>
      </div>
      <ElRadioGroup v-model="selectedTemplate" @change="applyTemplate" class="template-radio-group">
        <ElRadioButton value="small">
          <ElIcon><Memo /></ElIcon>
          小型应用
        </ElRadioButton>
        <ElRadioButton value="medium">
          <ElIcon><Notebook /></ElIcon>
          中型应用
        </ElRadioButton>
        <ElRadioButton value="large">
          <ElIcon><DataBoard /></ElIcon>
          大型应用
        </ElRadioButton>
        <ElRadioButton value="custom">
          <ElIcon><Edit /></ElIcon>
          自定义
        </ElRadioButton>
      </ElRadioGroup>
      <div class="template-description">
        {{ getTemplateDescription(selectedTemplate) }}
      </div>
    </div>

    <ElForm ref="formRef" :model="formData" label-width="200px">
      <!-- Pod 级别限制 -->
      <div class="form-section">
        <div class="section-header">
          <ElIcon><Box /></ElIcon>
          <span>Pod 级别限制</span>
        </div>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="Pod 最大 CPU">
              <ResourceInput
                v-model="formData.podMaxCpu"
                type="cpu"
                :min="0.1"
                :max="100"
                @update:model-value="handleChange"
              />
              <div class="form-tip">单个 Pod 可使用的最大 CPU</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="Pod 最大内存">
              <ResourceInput
                v-model="formData.podMaxMemory"
                type="memory"
                :min="0.1"
                :max="1000"
                @update:model-value="handleChange"
              />
              <div class="form-tip">单个 Pod 可使用的最大内存</div>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="Pod 最大临时存储">
              <ResourceInput
                v-model="formData.podMaxEphemeralStorage"
                type="memory"
                :min="0.1"
                :max="1000"
                @update:model-value="handleChange"
              />
              <div class="form-tip">单个 Pod 可使用的最大临时存储</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="Pod 最小 CPU">
              <ResourceInput
                v-model="formData.podMinCpu"
                type="cpu"
                :min="0.001"
                :max="10"
                :step="0.001"
                @update:model-value="handleChange"
              />
              <div class="form-tip">Pod 必须请求的最小 CPU</div>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="Pod 最小内存">
              <ResourceInput
                v-model="formData.podMinMemory"
                type="memory"
                :min="0.001"
                :max="100"
                :step="0.001"
                @update:model-value="handleChange"
              />
              <div class="form-tip">Pod 必须请求的最小内存</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="Pod 最小临时存储">
              <ResourceInput
                v-model="formData.podMinEphemeralStorage"
                type="memory"
                :min="0.001"
                :max="100"
                :step="0.001"
                @update:model-value="handleChange"
              />
              <div class="form-tip">Pod 必须请求的最小临时存储</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>

      <!-- Container 级别限制 -->
      <div class="form-section">
        <div class="section-header">
          <ElIcon><Grid /></ElIcon>
          <span>容器级别限制</span>
        </div>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="容器最大 CPU">
              <ResourceInput
                v-model="formData.containerMaxCpu"
                type="cpu"
                :min="0.1"
                :max="100"
                @update:model-value="handleChange"
              />
              <div class="form-tip">单个容器可使用的最大 CPU</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="容器最大内存">
              <ResourceInput
                v-model="formData.containerMaxMemory"
                type="memory"
                :min="0.1"
                :max="1000"
                @update:model-value="handleChange"
              />
              <div class="form-tip">单个容器可使用的最大内存</div>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="容器最大临时存储">
              <ResourceInput
                v-model="formData.containerMaxEphemeralStorage"
                type="memory"
                :min="0.1"
                :max="1000"
                @update:model-value="handleChange"
              />
              <div class="form-tip">单个容器可使用的最大临时存储</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="容器最小 CPU">
              <ResourceInput
                v-model="formData.containerMinCpu"
                type="cpu"
                :min="0.001"
                :max="10"
                :step="0.001"
                @update:model-value="handleChange"
              />
              <div class="form-tip">容器必须请求的最小 CPU</div>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="容器最小内存">
              <ResourceInput
                v-model="formData.containerMinMemory"
                type="memory"
                :min="0.001"
                :max="100"
                :step="0.001"
                @update:model-value="handleChange"
              />
              <div class="form-tip">容器必须请求的最小内存</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="容器最小临时存储">
              <ResourceInput
                v-model="formData.containerMinEphemeralStorage"
                type="memory"
                :min="0.001"
                :max="100"
                :step="0.001"
                @update:model-value="handleChange"
              />
              <div class="form-tip">容器必须请求的最小临时存储</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>

      <!-- Container 默认值设置 -->
      <div class="form-section">
        <div class="section-header">
          <ElIcon><SetUp /></ElIcon>
          <span>容器默认资源</span>
        </div>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="默认 CPU 限制">
              <ResourceInput
                v-model="formData.containerDefaultCpu"
                type="cpu"
                :min="0.01"
                :max="10"
                @update:model-value="handleChange"
              />
              <div class="form-tip">未指定时的默认 CPU limit</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="默认内存限制">
              <ResourceInput
                v-model="formData.containerDefaultMemory"
                type="memory"
                :min="0.01"
                :max="100"
                @update:model-value="handleChange"
              />
              <div class="form-tip">未指定时的默认内存 limit</div>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="默认临时存储限制">
              <ResourceInput
                v-model="formData.containerDefaultEphemeralStorage"
                type="memory"
                :min="0.01"
                :max="100"
                @update:model-value="handleChange"
              />
              <div class="form-tip">未指定时的默认临时存储 limit</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="默认 CPU 请求">
              <ResourceInput
                v-model="formData.containerDefaultRequestCpu"
                type="cpu"
                :min="0.01"
                :max="10"
                @update:model-value="handleChange"
              />
              <div class="form-tip">未指定时的默认 CPU request</div>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="默认内存请求">
              <ResourceInput
                v-model="formData.containerDefaultRequestMemory"
                type="memory"
                :min="0.01"
                :max="100"
                @update:model-value="handleChange"
              />
              <div class="form-tip">未指定时的默认内存 request</div>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="默认临时存储请求">
              <ResourceInput
                v-model="formData.containerDefaultRequestEphemeralStorage"
                type="memory"
                :min="0.01"
                :max="100"
                @update:model-value="handleChange"
              />
              <div class="form-tip">未指定时的默认临时存储 request</div>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Lightning,
    Memo,
    Notebook,
    DataBoard,
    Edit,
    Box,
    Grid,
    SetUp
  } from '@element-plus/icons-vue'
  import ResourceInput from './components/ResourceInput.vue'

  interface Props {
    formData: Record<string, any>
    mode: 'create' | 'edit'
  }

  interface Emits {
    (e: 'update', data: Record<string, any>): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref()
  const selectedTemplate = ref('medium')

  // LimitRange 模板配置
  const templates = {
    small: {
      name: '小型应用',
      description: '适合开发测试环境，资源限制较低，适合小规模应用和测试场景',
      config: {
        podMaxCpu: '20',
        podMaxMemory: '60Gi',
        podMaxEphemeralStorage: '100Gi',
        podMinCpu: '10m',
        podMinMemory: '64Mi',
        podMinEphemeralStorage: '50Mi',
        containerMaxCpu: '10',
        containerMaxMemory: '35Gi',
        containerMaxEphemeralStorage: '100Gi',
        containerMinCpu: '10m',
        containerMinMemory: '32Mi',
        containerMinEphemeralStorage: '10Mi',
        containerDefaultCpu: '500m',
        containerDefaultMemory: '512Mi',
        containerDefaultEphemeralStorage: '500Mi',
        containerDefaultRequestCpu: '250m',
        containerDefaultRequestMemory: '256Mi',
        containerDefaultRequestEphemeralStorage: '250Mi'
      }
    },
    medium: {
      name: '中型应用',
      description: '适合一般生产环境，平衡性能与资源，满足大部分业务需求',
      config: {
        podMaxCpu: '30',
        podMaxMemory: '64Gi',
        podMaxEphemeralStorage: '200Gi',
        podMinCpu: '10m',
        podMinMemory: '128Mi',
        podMinEphemeralStorage: '100Mi',
        containerMaxCpu: '20',
        containerMaxMemory: '50Gi',
        containerMaxEphemeralStorage: '100Gi',
        containerMinCpu: '10m',
        containerMinMemory: '64Mi',
        containerMinEphemeralStorage: '50Mi',
        containerDefaultCpu: '1',
        containerDefaultMemory: '1Gi',
        containerDefaultEphemeralStorage: '1Gi',
        containerDefaultRequestCpu: '500m',
        containerDefaultRequestMemory: '512Mi',
        containerDefaultRequestEphemeralStorage: '1Gi'
      }
    },
    large: {
      name: '大型应用',
      description: '适合高负载生产环境，资源充足，适合大规模应用和高并发场景',
      config: {
        podMaxCpu: '30',
        podMaxMemory: '100Gi',
        podMaxEphemeralStorage: '500Gi',
        podMinCpu: '100m',
        podMinMemory: '256Mi',
        podMinEphemeralStorage: '500Mi',
        containerMaxCpu: '30',
        containerMaxMemory: '50Gi',
        containerMaxEphemeralStorage: '200Gi',
        containerMinCpu: '100m',
        containerMinMemory: '128Mi',
        containerMinEphemeralStorage: '100Mi',
        containerDefaultCpu: '1',
        containerDefaultMemory: '1Gi',
        containerDefaultEphemeralStorage: '10Gi',
        containerDefaultRequestCpu: '1',
        containerDefaultRequestMemory: '1Gi',
        containerDefaultRequestEphemeralStorage: '10Gi'
      }
    },
    custom: {
      name: '自定义',
      description: '根据实际需求自定义所有参数，灵活配置资源限制',
      config: {}
    }
  }

  // 获取模板描述
  const getTemplateDescription = (template: string) => {
    return templates[template]?.description || ''
  }

  // 应用模板
  const applyTemplate = (template: string) => {
    if (template !== 'custom' && templates[template]) {
      Object.assign(props.formData, templates[template].config)
      emit('update', props.formData)
      ElMessage.success(`已应用${templates[template].name}模板`)
    }
  }

  // 处理变更
  const handleChange = () => {
    emit('update', props.formData)
  }

  // 验证方法
  const validate = async () => {
    return true
  }

  // 初始化时应用默认模板
  onMounted(() => {
    if (
      props.mode === 'create' &&
      (!props.formData.podMaxCpu || props.formData.podMaxCpu === '0')
    ) {
      applyTemplate('medium')
    }
  })

  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .step-panel {
    .template-selector {
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;

      .selector-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          color: #e6a23c;
          font-size: 20px;
        }
      }

      .template-radio-group {
        width: 100%;

        :deep(.el-radio-button__inner) {
          padding: 12px 20px;
          border-radius: 8px;
          margin-right: 12px;

          .el-icon {
            margin-right: 4px;
          }
        }

        :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
        }
      }

      .template-description {
        margin-top: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 6px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
      }
    }

    .form-section {
      margin-bottom: 24px;
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #ebeef5;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f0f2f5;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          font-size: 20px;
          color: var(--el-color-primary);
        }
      }

      .form-tip {
        margin-top: 6px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;
      }
    }
  }
</style>
