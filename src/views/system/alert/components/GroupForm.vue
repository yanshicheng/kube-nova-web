<template>
  <ElDialog
    v-model="visible"
    :title="isEdit ? '编辑告警分组' : '添加告警分组'"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <ElFormItem label="分组代码" prop="groupCode">
        <ElInput
          v-model="form.groupCode"
          placeholder="请输入分组代码，如：node、pod、ceph"
          :disabled="isEdit"
          clearable
        />
      </ElFormItem>

      <ElFormItem label="分组名称" prop="groupName">
        <ElInput v-model="form.groupName" placeholder="请输入分组名称" clearable />
      </ElFormItem>

      <ElFormItem label="告警间隔" prop="interval">
        <ElSelect v-model="form.interval" placeholder="请选择告警间隔" style="width: 100%">
          <ElOption label="30秒" value="30s" />
          <ElOption label="1分钟" value="1m" />
          <ElOption label="5分钟" value="5m" />
          <ElOption label="10分钟" value="10m" />
          <ElOption label="15分钟" value="15m" />
          <ElOption label="30分钟" value="30m" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="是否启用" prop="isEnabled">
        <ElSwitch v-model="form.isEnabled" />
      </ElFormItem>

      <ElFormItem label="分组描述" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入分组描述"
          maxlength="500"
          show-word-limit
        />
      </ElFormItem>

      <ElFormItem label="排序序号" prop="sortOrder">
        <ElInputNumber
          v-model="form.sortOrder"
          :min="0"
          :max="9999"
          placeholder="请输入排序序号"
          style="width: 100%"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? '更新' : '添加' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import {
    addAlertRuleGroupApi,
    updateAlertRuleGroupApi,
    type AddAlertRuleGroupRequest,
    type UpdateAlertRuleGroupRequest,
    type AlertRuleGroup
  } from '@/api/manager/alert'

  interface Props {
    modelValue: boolean
    formData?: Partial<AlertRuleGroup>
    isEdit?: boolean
    fileId?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    formData: () => ({}),
    isEdit: false
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    success: []
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const form = reactive<Partial<AlertRuleGroup>>({
    groupCode: '',
    groupName: '',
    interval: '1m',
    isEnabled: true,
    description: '',
    sortOrder: 0
  })

  const rules: FormRules = {
    groupCode: [
      { required: true, message: '请输入分组代码', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
      {
        pattern: /^[a-z][a-z0-9_-]*$/,
        message: '只能包含小写字母、数字、下划线和短横线，且必须以字母开头',
        trigger: 'blur'
      }
    ],
    groupName: [
      { required: true, message: '请输入分组名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    interval: [{ required: true, message: '请选择告警间隔', trigger: 'change' }]
  }

  const resetForm = () => {
    Object.assign(form, {
      groupCode: '',
      groupName: '',
      interval: '1m',
      isEnabled: true,
      description: '',
      sortOrder: 0
    })
    formRef.value?.clearValidate()
  }

  watch(
    () => props.formData,
    (val) => {
      if (val && Object.keys(val).length > 0) {
        Object.assign(form, val)
      } else {
        resetForm()
      }
    },
    { immediate: true, deep: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      loading.value = true

      if (props.isEdit && form.id) {
        await updateAlertRuleGroupApi(form as UpdateAlertRuleGroupRequest)
        ElMessage.success('更新成功')
      } else {
        if (!props.fileId) {
          ElMessage.error('缺少文件ID')
          return
        }
        await addAlertRuleGroupApi({
          ...form,
          fileId: props.fileId
        } as AddAlertRuleGroupRequest)
        ElMessage.success('添加成功')
      }

      visible.value = false
      emit('success')
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleClosed = () => {
    resetForm()
  }
</script>
