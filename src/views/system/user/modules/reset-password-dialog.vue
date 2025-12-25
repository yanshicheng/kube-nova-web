<template>
  <ElDialog
    v-model="visible"
    title="修改密码"
    width="450px"
    align-center
    @close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem label="用户名">
        <ElInput :value="userData?.username" disabled />
      </ElFormItem>
      <ElFormItem label="旧密码" prop="oldPassword">
        <ElInput
          v-model="formData.oldPassword"
          type="password"
          placeholder="请输入旧密码"
          show-password
          :disabled="loading"
        />
      </ElFormItem>
      <ElFormItem label="新密码" prop="newPassword">
        <ElInput
          v-model="formData.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
          :disabled="loading"
        />
      </ElFormItem>
      <ElFormItem label="确认密码" prop="confirmPassword">
        <ElInput
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          :disabled="loading"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" :disabled="loading">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">
          {{ loading ? '修改中...' : '确认修改' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    updateUserPasswordApi,
    type UserSysUser,
    type UserUpdatePasswordRequest
  } from '@/api/portal/user'

  interface Props {
    modelValue: boolean
    userData?: UserSysUser
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void

    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    userData: undefined
  })

  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单实例
  const formRef = ref<FormInstance>()
  const loading = ref(false) // 内部管理loading状态

  // 表单数据
  const formData = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 自定义验证规则
  const validateConfirmPassword = (rule: any, value: any, callback: any) => {
    if (value === '') {
      callback(new Error('请再次输入密码'))
    } else if (value !== formData.newPassword) {
      callback(new Error('两次输入密码不一致!'))
    } else {
      callback()
    }
  }

  // 表单验证规则
  const rules: FormRules = {
    oldPassword: [
      { required: true, message: '请输入旧密码', trigger: 'blur' },
      { min: 6, max: 60, message: '密码长度在 6 到 60 个字符', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 60, message: '密码长度在 6 到 60 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入密码', trigger: 'blur' },
      { min: 6, max: 60, message: '密码长度在 6 到 60 个字符', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' }
    ]
  }

  // 监听对话框状态变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        // 重置表单
        Object.assign(formData, {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        // 清除验证
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  )

  // 关闭对话框
  const handleClose = () => {
    if (loading.value) {
      return
    }
    visible.value = false
    formRef.value?.resetFields()
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value || !props.userData?.username) return

    try {
      await formRef.value.validate()

      loading.value = true // 开始loading

      const data: UserUpdatePasswordRequest = {
        username: props.userData.username,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      }

      await updateUserPasswordApi(data)
      ElMessage.success('密码修改成功')
      emit('success')
      visible.value = false
    } catch (error: any) {
      if (error === false) {
        // 表单验证失败
      } else {
        console.error('修改密码失败:', error)
      }
    } finally {
      loading.value = false // 结束loading
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
