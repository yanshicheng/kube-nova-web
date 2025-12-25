<template>
  <ElDialog
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="handleCancel"
    width="600px"
    align-center
    class="project-dialog"
    @closed="handleClosed"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="项目名称" prop="name">
        <ElInput
          v-model="form.name"
          placeholder="请输入项目名称"
          :disabled="submitLoading"
          maxlength="100"
          show-word-limit
        />
      </ElFormItem>

      <ElFormItem label="项目描述" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          placeholder="请输入项目描述"
          :disabled="submitLoading"
          :rows="4"
          maxlength="500"
          show-word-limit
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleCancel" :disabled="submitLoading">取 消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ submitLoading ? (isEdit ? '更新中...' : '创建中...') : '确 定' }}
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'

  interface ProjectFormData {
    id?: number
    name: string
    uuid?: string
    description: string
    isSystem?: number
  }

  interface Props {
    visible: boolean
    editData?: any
    submitLoading?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void

    (e: 'submit', data: ProjectFormData): void
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    submitLoading: false
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const isEdit = ref(false)

  const form = reactive<ProjectFormData>({
    name: '',
    description: ''
  })

  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
    ],
    description: [{ max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }]
  })

  const dialogTitle = computed(() => {
    return isEdit.value ? '编辑项目' : '新建项目'
  })

  const resetForm = () => {
    formRef.value?.resetFields()
    Object.assign(form, {
      id: undefined,
      name: '',
      description: ''
    })
  }

  const loadFormData = () => {
    if (!props.editData) return

    isEdit.value = true
    const row = props.editData

    form.id = row.id
    form.name = row.name || ''
    form.description = row.description || ''
    // 编辑时保留uuid但不显示
    form.uuid = row.uuid || ''
    form.isSystem = row.isSystem || 0
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    if (props.submitLoading) {
      return
    }

    await formRef.value.validate((valid) => {
      if (valid) {
        const submitData: ProjectFormData = {
          ...form
        }

        // 新建时不传uuid
        if (!isEdit.value) {
          delete submitData.uuid
        }
        // 设置 isSystem
        submitData.isSystem =  0
        emit('submit', submitData)
      }
    })
  }

  const handleCancel = () => {
    if (props.submitLoading) {
      return
    }
    emit('update:visible', false)
  }

  const handleClosed = () => {
    if (!props.submitLoading) {
      resetForm()
      isEdit.value = false
    }
  }

  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        nextTick(() => {
          if (props.editData && props.editData.id) {
            loadFormData()
          } else {
            isEdit.value = false
          }
        })
      }
    }
  )
</script>

<style scoped lang="scss">
  .project-dialog {
    :deep(.el-dialog__header) {
      padding: 20px 20px 0;
    }

    :deep(.el-dialog__body) {
      padding: 20px;
    }

    :deep(.el-dialog__footer) {
      padding: 0 20px 20px;
      text-align: right;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
</style>
