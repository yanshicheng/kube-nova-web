<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="mode === 'create' ? '创建项目' : '编辑项目'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <ElFormItem label="项目名称" prop="projectName">
        <ElInput
          v-model="formData.projectName"
          placeholder="请输入项目名称（小写字母、数字、-）"
          :disabled="mode === 'edit'"
        />
        <div class="form-tip"
          >项目名称创建后不可修改，只能包含小写字母、数字、中划线、下划线和点</div
        >
      </ElFormItem>

      <ElFormItem label="访问级别" prop="isPublic">
        <ElRadioGroup v-model="formData.isPublic">
          <ElRadio :value="true" style="width: 100%; margin-bottom: 12px">
            <div class="access-option">
              <Globe :size="16" />
              <div class="option-content">
                <div class="option-title">公开项目</div>
                <div class="option-desc">所有人都可以访问此项目中的镜像</div>
              </div>
            </div>
          </ElRadio>
          <ElRadio :value="false" style="width: 100%">
            <div class="access-option">
              <Lock :size="16" />
              <div class="option-content">
                <div class="option-title">私有项目</div>
                <div class="option-desc">只有授权用户可以访问此项目中的镜像</div>
              </div>
            </div>
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem label="存储配额" prop="storageLimit">
        <div class="storage-limit-input">
          <ElInputNumber
            v-model="formData.storageLimit"
            :min="-1"
            :max="100000"
            placeholder="-1 表示不限制"
            style="width: 200px"
          />
          <ElSelect v-model="formData.storageUnit" style="width: 100px">
            <ElOption label="B" value="B" />
            <ElOption label="KB" value="KB" />
            <ElOption label="MB" value="MB" />
            <ElOption label="GB" value="GB" />
            <ElOption label="TB" value="TB" />
          </ElSelect>
        </div>
        <div class="form-tip">设置项目存储空间限制，-1 表示不限制</div>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit" :loading="submitting">
        {{ mode === 'create' ? '创建' : '保存' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { Globe, Lock } from 'lucide-vue-next'
  import {
    createProjectApi,
    updateRegistryProjectApi,
    type CreateProjectRequest,
    type UpdateProjectRequest
  } from '@/api'

  interface Props {
    modelValue: boolean
    mode: 'create' | 'edit'
    registryUuid: string
    project?: any
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const formData = reactive<CreateProjectRequest>({
    registryUuid: props.registryUuid,
    projectName: '',
    isPublic: false,
    storageLimit: -1,
    storageUnit: 'GB'
  })

  const formRules: FormRules = {
    projectName: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
        message: '只能包含小写字母、数字、中划线、下划线和点',
        trigger: 'blur'
      },
      { min: 2, max: 255, message: '项目名称长度在 2 到 255 个字符', trigger: 'blur' }
    ]
  }

  // 监听对话框打开
  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        if (props.mode === 'edit' && props.project) {
          formData.projectName = props.project.name
          formData.isPublic = props.project.isPublic
          formData.storageLimit = -1
          formData.storageUnit = 'GB'
        } else {
          formData.projectName = ''
          formData.isPublic = false
          formData.storageLimit = -1
          formData.storageUnit = 'GB'
        }
        formRef.value?.clearValidate()
      }
    }
  )

  const handleClose = () => {
    formRef.value?.resetFields()
  }

  const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return

    submitting.value = true
    try {
      if (props.mode === 'create') {
        await createProjectApi({
          registryUuid: props.registryUuid,
          projectName: formData.projectName,
          isPublic: formData.isPublic,
          storageLimit: formData.storageLimit,
          storageUnit: formData.storageUnit
        })
        ElMessage.success('创建成功')
      } else {
        await updateRegistryProjectApi(props.project!.name, {
          registryUuid: props.registryUuid,
          isPublic: formData.isPublic,
          storageLimit: formData.storageLimit,
          storageUnit: formData.storageUnit
        } as UpdateProjectRequest)
        ElMessage.success('保存成功')
      }
      emit('success')
      emit('update:modelValue', false)
    } catch (error: any) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .form-tip {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .storage-limit-input {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .access-option {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;

    svg {
      margin-top: 2px;
      flex-shrink: 0;
    }

    .option-content {
      flex: 1;
    }

    .option-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }

    .option-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.4;
    }
  }

  :deep(.el-radio) {
    align-items: flex-start !important;
    height: auto !important;
    line-height: normal !important;

    .el-radio__input {
      margin-top: 3px;
    }

    .el-radio__label {
      padding-left: 8px;
      line-height: 1;
      white-space: normal;
    }
  }
</style>
