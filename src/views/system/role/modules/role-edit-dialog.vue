<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
    width="30%"
    align-center
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElFormItem label="角色名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入角色名称" :disabled="loading" />
      </ElFormItem>
      <ElFormItem label="角色编码" prop="code">
        <ElInput
          v-model="form.code"
          placeholder="请输入角色编码"
          :disabled="dialogType === 'edit' || loading"
        />
      </ElFormItem>
      <ElFormItem label="备注说明" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注说明"
          :disabled="loading"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCancel" :disabled="loading">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">
          {{ loading ? (dialogType === 'add' ? '创建中...' : '更新中...') : '提交' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    addRoleApi,
    updateRoleApi,
    type RoleSysRole,
    type RoleAddRequest,
    type RoleUpdateRequest
  } from '@/api/portal/role'

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    roleData?: RoleSysRole
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formRef = ref<FormInstance>()
  const loading = ref(false) // 组件内部管理loading状态

  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    code: [
      { required: true, message: '请输入角色编码', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_]+$/,
        message: '角色编码只能包含字母、数字和下划线',
        trigger: 'blur'
      }
    ]
  })

  const form = reactive({
    id: 0,
    name: '',
    code: '',
    remark: ''
  })

  // 监听弹窗打开，初始化表单数据
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        initForm()
      }
    },
    { immediate: true }
  )

  // 监听角色数据变化
  watch(
    () => props.roleData,
    (newData) => {
      if (newData && props.modelValue) {
        initForm()
      }
    },
    { deep: true }
  )

  const initForm = () => {
    if (props.dialogType === 'edit' && props.roleData) {
      Object.assign(form, {
        id: props.roleData.id,
        name: props.roleData.name,
        code: props.roleData.code,
        remark: props.roleData.remark || ''
      })
    } else {
      Object.assign(form, {
        id: 0,
        name: '',
        code: '',
        remark: ''
      })
    }
  }

  // 处理取消按钮
  const handleCancel = () => {
    if (loading.value) {
      return
    }
    visible.value = false
  }

  // 处理对话框关闭事件（点击X或ESC）
  const handleClose = () => {
    // 如果正在加载中，不允许关闭
    if (loading.value) {
      return
    }
    // 重置表单
    formRef.value?.resetFields()
    loading.value = false
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      // 编辑时进行二次确认
      if (props.dialogType === 'edit') {
        await ElMessageBox.confirm(`确定要保存对角色"${form.name}"的修改吗？`, '确认修改', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      }

      loading.value = true // 开始loading

      if (props.dialogType === 'add') {
        const addData: RoleAddRequest = {
          name: form.name,
          code: form.code,
          remark: form.remark
        }
        await addRoleApi(addData)
        ElMessage.success('新增成功')
      } else {
        const updateData: RoleUpdateRequest = {
          id: form.id,
          name: form.name,
          code: form.code,
          remark: form.remark
        }
        await updateRoleApi(updateData)
        ElMessage.success('修改成功')
      }

      // 先触发成功事件
      emit('success')
      // 然后关闭对话框（不再调用handleClose，直接设置visible）
      visible.value = false
      // 重置loading状态
      loading.value = false
    } catch (error: any) {
      if (error === 'cancel') {
        // 用户取消了确认
        return
      }
      console.error('提交失败:', error)
      loading.value = false // 失败时也要重置loading
    }
  }
</script>

<style lang="scss" scoped>
  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
