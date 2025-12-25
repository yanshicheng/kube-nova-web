<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <!-- 编辑模式切换 -->
    <div class="mode-switcher">
      <ElRadioGroup v-model="editMode" size="small" @change="handleModeChange">
        <ElRadioButton value="form">
          <template #default>
            <FormInputIcon :size="14" />
            <span>表单模式</span>
          </template>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <template #default>
            <FileCodeIcon :size="14" />
            <span>YAML 模式</span>
          </template>
        </ElRadioButton>
      </ElRadioGroup>

      <div class="mode-tips" v-if="convertError">
        <ElAlert :title="convertError" type="error" :closable="false" show-icon />
      </div>
    </div>

    <!-- 表单模式 -->
    <div v-show="editMode === 'form'" class="form-container">
      <slot name="form" :form-data="formData" :disabled="loading" />
    </div>

    <!-- YAML 模式 -->
    <div v-show="editMode === 'yaml'" class="yaml-container">
      <YamlEditorPro
        v-model="yamlContent"
        :readonly="loading"
        :filename="`${resourceName}.yaml`"
        :show-toolbar="true"
        :show-status-bar="true"
        :height="yamlEditorHeight"
        @valid-change="handleYamlValidChange"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading">取消</ElButton>
        <ElButton
          type="primary"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!isYamlValid && editMode === 'yaml'"
        >
          {{ loading ? '提交中...' : submitText }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { FormInput as FormInputIcon, FileCode as FileCodeIcon } from 'lucide-vue-next'
  import YamlEditorPro from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    modelValue: boolean
    dialogType: 'create' | 'edit'
    resourceName: string
    initialYaml?: string
    dialogWidth?: string
    yamlEditorHeight?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', yaml: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    dialogWidth: '800px',
    yamlEditorHeight: '500px',
    initialYaml: ''
  })

  const emit = defineEmits<Emits>()

  // 状态
  const editMode = ref<'form' | 'yaml'>('form')
  const yamlContent = ref('')
  const formData = ref<any>({})
  const loading = ref(false)
  const isYamlValid = ref(true)
  const convertError = ref<string | null>(null)

  // 计算属性
  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const dialogTitle = computed(() => {
    return props.dialogType === 'create'
      ? `创建 ${props.resourceName}`
      : `编辑 ${props.resourceName}`
  })

  const submitText = computed(() => {
    return props.dialogType === 'create' ? '创建' : '保存'
  })

  // 监听初始 YAML
  watch(() => props.initialYaml, (val) => {
    if (val) {
      yamlContent.value = val
      editMode.value = 'yaml'
    }
  }, { immediate: true })

  // 监听弹窗打开
  watch(() => props.modelValue, (val) => {
    if (val) {
      // 重置状态
      convertError.value = null
      if (!props.initialYaml) {
        editMode.value = 'form'
        yamlContent.value = ''
      }
    }
  })

  // 处理模式切换
  const handleModeChange = async (mode: 'form' | 'yaml') => {
    convertError.value = null

    if (mode === 'yaml') {
      // 表单 -> YAML：触发转换
      // 这里需要父组件提供转换方法
      // 暂时直接切换
    } else {
      // YAML -> 表单：触发解析
      // 这里需要父组件提供解析方法
      // 暂时直接切换
    }
  }

  // 处理 YAML 验证状态变化
  const handleYamlValidChange = (valid: boolean) => {
    isYamlValid.value = valid
  }

  // 关闭弹窗
  const handleClose = () => {
    if (loading.value) return
    visible.value = false
  }

  // 提交
  const handleSubmit = async () => {
    if (editMode.value === 'yaml' && !isYamlValid.value) {
      ElMessage.warning('YAML 格式错误，请修正后再提交')
      return
    }

    // 确认提交
    if (props.dialogType === 'edit') {
      try {
        await ElMessageBox.confirm(
          `确定要保存对 ${props.resourceName} 的修改吗？`,
          '确认修改',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }
    }

    loading.value = true

    try {
      // 发送 YAML 内容
      emit('submit', yamlContent.value)
    } finally {
      loading.value = false
    }
  }

  // 暴露方法给父组件
  defineExpose({
    setYamlContent: (yaml: string) => {
      yamlContent.value = yaml
    },
    getYamlContent: () => yamlContent.value,
    setFormData: (data: any) => {
      formData.value = data
    },
    getFormData: () => formData.value,
    setLoading: (val: boolean) => {
      loading.value = val
    },
    setConvertError: (error: string | null) => {
      convertError.value = error
    },
    switchToYaml: () => {
      editMode.value = 'yaml'
    },
    switchToForm: () => {
      editMode.value = 'form'
    }
  })
</script>

<style lang="scss" scoped>
  .mode-switcher {
    margin-bottom: 16px;

    :deep(.el-radio-group) {
      .el-radio-button__inner {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .mode-tips {
      margin-top: 12px;
    }
  }

  .form-container {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;
  }

  .yaml-container {
    border-radius: 8px;
    overflow: hidden;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>