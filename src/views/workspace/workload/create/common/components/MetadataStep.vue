<template>
  <div class="metadata-step">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="85px" class="step-form">
      <!-- 命名空间显示 -->
      <ElRow :gutter="24">
        <ElCol :span="22">
          <ElFormItem>
            <template #label>
              <span class="label-text">
                命名空间
                <ElTooltip content="当前Pod所属的命名空间，不可修改" placement="top">
                  <Info :size="13" class="hint-icon" />
                </ElTooltip>
              </span>
            </template>
            <ElInput :value="namespace" disabled>
              <template #prefix>
                <Folder :size="14" />
              </template>
            </ElInput>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 第一行 -->
      <ElRow :gutter="24">
        <ElCol :span="11">
          <ElFormItem prop="nameCn" required>
            <template #label>
              <span class="label-text">
                中文名
                <ElTooltip content="服务的中文显示名称，用于界面展示" placement="top">
                  <Info :size="13" class="hint-icon" />
                </ElTooltip>
              </span>
            </template>
            <ElInput
              v-model="formData.nameCn"
              placeholder="请输入服务中文名"
              clearable
              :disabled="!isFieldEditableLocal('nameCn')"
              @input="handleInputChange"
              @blur="handleFieldBlur('nameCn')"
            />
          </ElFormItem>
        </ElCol>

        <ElCol :span="11">
          <ElFormItem prop="nameEn" required>
            <template #label>
              <span class="label-text">
                英文名
                <ElTooltip
                  content="必须以英文字母开头，只能包含小写字母、数字和中横线，不能以中横线结尾"
                  placement="top"
                >
                  <Info :size="13" class="hint-icon" />
                </ElTooltip>
              </span>
            </template>
            <ElInput
              v-model="formData.nameEn"
              placeholder="请输入服务英文名"
              :disabled="!isFieldEditableLocal('nameEn')"
              @input="handleEnglishNameInput"
              @blur="handleFieldBlur('nameEn')"
              clearable
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 第二行 -->
      <ElRow :gutter="24">
        <ElCol :span="11">
          <ElFormItem prop="version" required>
            <template #label>
              <span class="label-text">
                版本
                <ElTooltip
                  content="版本必须以英文字母开头，只能包含英文字母、数字和中横线"
                  placement="top"
                >
                  <Info :size="13" class="hint-icon" />
                </ElTooltip>
              </span>
            </template>
            <ElInput
              v-model="formData.version"
              placeholder="请输入版本号（如: v1-0-0）"
              clearable
              :disabled="!isFieldEditableLocal('version')"
              @input="handleVersionInput"
              @blur="handleFieldBlur('version')"
            />
          </ElFormItem>
        </ElCol>

        <ElCol :span="11">
          <ElFormItem prop="resourceName" required>
            <template #label>
              <span class="label-text">
                资源名称
                <ElTooltip
                  content="Kubernetes 资源的 metadata.name，默认为：英文名-版本"
                  placement="top"
                >
                  <Info :size="13" class="hint-icon" />
                </ElTooltip>
              </span>
            </template>
            <ElInput
              v-model="formData.resourceName"
              placeholder="自动生成：英文名-版本"
              :disabled="!isFieldEditableLocal('resourceName')"
              @input="handleResourceNameInput"
              @blur="handleFieldBlur('resourceName')"
              clearable
            >
              <template #append>
                <ElButton
                  v-if="isResourceNameCustomized"
                  @click="resetResourceName"
                  :icon="RefreshCw"
                  size="small"
                  title="重置为自动生成"
                >
                  重置
                </ElButton>
              </template>
            </ElInput>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 资源名称警告提示 -->
      <ElRow v-if="isResourceNameCustomized" :gutter="24">
        <ElCol :span="22">
          <ElAlert type="warning" :closable="false" show-icon class="resource-name-warning">
            <template #title>
              <span class="warning-text">
                ⚠️ 不推荐自定义资源名称，建议使用默认的"英文名-版本"格式以避免资源名冲突
              </span>
            </template>
          </ElAlert>
        </ElCol>
      </ElRow>

      <!-- 描述 -->
      <ElRow :gutter="24">
        <ElCol :span="22">
          <ElFormItem>
            <template #label>
              <span class="label-text">
                描述
                <ElTooltip content="Pod的描述信息，用于说明其用途" placement="top">
                  <Info :size="13" class="hint-icon" />
                </ElTooltip>
              </span>
            </template>
            <ElInput
              v-model="formData.desc"
              type="textarea"
              :rows="2"
              placeholder="请输入Pod描述（选填）"
              :disabled="!isFieldEditableLocal('desc')"
              @input="handleInputChange"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 标签部分 -->
      <ElDivider content-position="left">
        <span class="divider-title">
          标签配置
          <ElTooltip content="标签用于标识和选择Pod，格式为键值对" placement="top">
            <Info :size="12" class="divider-hint" />
          </ElTooltip>
        </span>
      </ElDivider>

      <div class="config-section">
        <ElButton type="primary" size="small" @click="addLabel" class="add-btn">
          <Plus :size="14" />
          添加标签
        </ElButton>

        <div class="items-list">
          <div v-for="(label, index) in labels" :key="index" class="item-row">
            <ElInput
              v-model="label.key"
              placeholder="标签键"
              class="item-key"
              @input="handleInputChange"
            />
            <span class="equals">=</span>
            <ElInput
              v-model="label.value"
              placeholder="标签值"
              class="item-value"
              @input="handleInputChange"
            />
            <ElButton type="danger" circle size="small" @click="removeLabel(index)">
              <Trash2 :size="14" />
            </ElButton>
          </div>
          <ElEmpty v-if="labels.length === 0" description="暂无标签" :image-size="60" />
        </div>
      </div>

      <!-- 注解部分 -->
      <ElDivider content-position="left">
        <span class="divider-title">
          注解配置
          <ElTooltip content="注解用于存储Pod的非标识性元数据" placement="top">
            <Info :size="12" class="divider-hint" />
          </ElTooltip>
        </span>
      </ElDivider>

      <div class="config-section">
        <ElButton type="primary" size="small" @click="addAnnotation" class="add-btn">
          <Plus :size="14" />
          添加注解
        </ElButton>

        <div class="items-list">
          <div v-for="(annotation, index) in annotations" :key="index" class="item-row">
            <ElInput
              v-model="annotation.key"
              placeholder="注解键"
              class="item-key"
              @input="handleInputChange"
            />
            <span class="equals">=</span>
            <ElInput
              v-model="annotation.value"
              placeholder="注解值"
              class="item-value"
              @input="handleInputChange"
            />
            <ElButton type="danger" circle size="small" @click="removeAnnotation(index)">
              <Trash2 :size="14" />
            </ElButton>
          </div>
          <ElEmpty v-if="annotations.length === 0" description="暂无注解" :image-size="60" />
        </div>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch, onMounted } from 'vue'
  import { useMetadataStore } from '@/store/workload'
  import { isFieldEditable, type WorkloadMode } from '../utils/modeHandler'
  import { Info, Folder, Plus, Trash2, RefreshCw } from 'lucide-vue-next'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'

  // Props
  interface Props {
    mode: WorkloadMode
  }

  const props = defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    (e: 'validate', result: { valid: boolean; errors: string[] }): void
  }>()

  // Store
  const metadataStore = useMetadataStore()

  // Form ref
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    nameCn: '',
    nameEn: '',
    version: '',
    resourceName: '',
    desc: ''
  })

  // 标签和注解（使用数组形式）
  const labels = ref<Array<{ key: string; value: string }>>([])
  const annotations = ref<Array<{ key: string; value: string }>>([])

  // 从 store 同步到本地
  watch(
    () => metadataStore.metadata,
    (newVal) => {
      formData.nameCn = newVal.nameCn
      formData.nameEn = newVal.nameEn
      formData.version = newVal.version
      formData.resourceName = newVal.resourceName
      formData.desc = newVal.desc
    },
    { deep: true }
  )

  // 初始化时同步标签和注解
  function initFromStore() {
    const {
      nameCn,
      nameEn,
      version,
      resourceName,
      desc,
      labels: storeLabels,
      annotations: storeAnnotations
    } = metadataStore.metadata

    formData.nameCn = nameCn
    formData.nameEn = nameEn
    formData.version = version
    formData.resourceName = resourceName
    formData.desc = desc

    // 同步标签
    labels.value = Object.entries(storeLabels).map(([key, value]) => ({ key, value }))

    // 同步注解
    annotations.value = Object.entries(storeAnnotations).map(([key, value]) => ({ key, value }))
  }

  // 命名空间
  const namespace = computed(() => metadataStore.namespace)

  // 检查 resourceName 是否为自定义
  const isResourceNameCustomized = computed(() => metadataStore.isResourceNameCustomized())

  // 表单验证规则
  const rules: FormRules = {
    nameCn: [
      { required: true, message: '请输入中文名', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    nameEn: [
      { required: true, message: '请输入英文名', trigger: 'blur' },
      {
        pattern: /^[a-z][a-z0-9-]*[a-z0-9]$/,
        message: '必须以小写字母开头，只能包含小写字母、数字和中横线，不能以中横线结尾',
        trigger: 'blur'
      },
      { min: 2, max: 63, message: '长度在 2 到 63 个字符', trigger: 'blur' }
    ],
    version: [
      { required: true, message: '请输入版本号', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9-]*$/,
        message: '必须以字母开头，只能包含字母、数字和中横线',
        trigger: 'blur'
      },
      { min: 1, max: 30, message: '长度在 1 到 30 个字符', trigger: 'blur' }
    ],
    resourceName: [
      { required: true, message: '请输入资源名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '资源名称格式不正确（只能包含小写字母、数字和连字符，必须以字母或数字开头和结尾）',
        trigger: 'blur'
      },
      { max: 253, message: '资源名称长度不能超过 253 个字符', trigger: 'blur' }
    ]
  }

  // 检查字段是否可编辑
  function isFieldEditableLocal(
    field: 'nameCn' | 'nameEn' | 'version' | 'resourceName' | 'desc'
  ): boolean {
    return isFieldEditable(props.mode, field)
  }

  // 处理输入变化
  function handleInputChange() {
    syncToStore()
    emitValidation()
  }

  // 处理英文名输入（自动转小写）
  function handleEnglishNameInput(value: string) {
    formData.nameEn = value.toLowerCase()
    syncToStore()
    emitValidation()
  }

  // 处理版本号输入
  function handleVersionInput(value: string) {
    formData.version = value
    syncToStore()
    emitValidation()
  }

  // 处理资源名称输入
  function handleResourceNameInput(value: string) {
    formData.resourceName = value.toLowerCase()
    metadataStore.setResourceName(formData.resourceName)
    emitValidation()
  }

  // 重置资源名称为自动生成
  function resetResourceName() {
    metadataStore.resetResourceNameToAuto()
    formData.resourceName = metadataStore.metadata.resourceName
    ElMessage.success('已重置为自动生成模式')
    emitValidation()
  }

  // 处理字段失焦
  function handleFieldBlur(field: string) {
    formRef.value?.validateField(field)
  }

  // 同步到 store
  function syncToStore() {
    metadataStore.updateMetadata({
      nameCn: formData.nameCn,
      nameEn: formData.nameEn,
      version: formData.version,
      resourceName: formData.resourceName,
      desc: formData.desc
    })

    // 同步标签（包括空的，让用户能正常输入）
    const allLabels: Record<string, string> = {}
    labels.value.forEach((label) => {
      // 只要有 key 就保存，允许 value 为空（正在输入中）
      if (label.key) {
        allLabels[label.key] = label.value || ''
      }
    })
    metadataStore.setLabels(allLabels)

    // 同步注解（包括空的，让用户能正常输入）
    const allAnnotations: Record<string, string> = {}
    annotations.value.forEach((annotation) => {
      // 只要有 key 就保存，允许 value 为空（正在输入中）
      if (annotation.key) {
        allAnnotations[annotation.key] = annotation.value || ''
      }
    })
    metadataStore.setAnnotations(allAnnotations)
  }

  // 标签操作
  function addLabel() {
    labels.value.push({ key: '', value: '' })
  }

  function removeLabel(index: number) {
    labels.value.splice(index, 1)
    syncToStore()
    emitValidation()
  }

  // 注解操作
  function addAnnotation() {
    annotations.value.push({ key: '', value: '' })
  }

  function removeAnnotation(index: number) {
    annotations.value.splice(index, 1)
    syncToStore()
    emitValidation()
  }

  // 发送验证结果
  function emitValidation() {
    const validation = metadataStore.validate()
    emit('validate', {
      valid: validation.valid,
      errors: validation.errors
    })
  }

  // 表单验证
  async function validate(): Promise<boolean> {
    if (!formRef.value) {
      return false
    }

    try {
      await formRef.value.validate()
      const storeValidation = metadataStore.validate()

      if (!storeValidation.valid) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  // 重置表单
  function resetForm() {
    formRef.value?.resetFields()
    labels.value = []
    annotations.value = []
  }

  // 初始化
  onMounted(() => {
    initFromStore()
    emitValidation()
  })

  // 导出供父组件使用
  defineExpose({
    validate,
    resetForm,
    formRef
  })
</script>

<style lang="scss" scoped>
  .metadata-step {
    padding: 8px 0;

    .step-form {
      :deep(.el-form-item) {
        margin-bottom: 18px;
      }

      :deep(.el-form-item__label) {
        font-size: 13px;
        color: #606266;
        font-weight: normal;
      }

      .label-text {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;

        .hint-icon {
          color: #909399;
          cursor: help;
          transition: color 0.2s;

          &:hover {
            color: #409eff;
          }
        }
      }

      // 资源名称警告提示样式
      .resource-name-warning {
        margin-bottom: 18px;

        .warning-text {
          font-size: 13px;
          line-height: 1.5;
        }
      }

      .el-divider {
        margin: 24px 0 16px;

        .divider-title {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #303133;

          .divider-hint {
            color: #909399;
            cursor: help;

            &:hover {
              color: #409eff;
            }
          }
        }
      }

      .config-section {
        margin-bottom: 20px;

        .add-btn {
          margin-bottom: 12px;
        }

        .items-list {
          border-radius: 4px;
          padding: 12px;
          min-height: 80px;

          .item-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 4px;

            &:last-child {
              margin-bottom: 0;
            }

            .item-key {
              width: 200px;
            }

            .item-value {
              flex: 1;
              max-width: 300px;
            }

            .equals {
              color: #909399;
              font-weight: 500;
              padding: 0 4px;
            }
          }

          :deep(.el-empty) {
            padding: 16px 0;

            .el-empty__description {
              margin-top: 8px;
              font-size: 13px;
            }
          }
        }
      }
    }
  }
</style>
